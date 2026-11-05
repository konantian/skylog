import { useEffect, useState } from "react";
import { router } from "expo-router";
import { queryFlight } from "../lib/aviationstack";
import { aviationstackFlight } from "../lib/flight-provider.mjs";
import { Alert, Linking, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { useApp } from "../lib/store";
import { airportTimezones, type LocalFlight } from "../lib/catalog";
import airportIcao from "../generated/airport-icao.json";
import { flightTimes } from "../lib/flight-time.mjs";
import {
  aircraftPosition,
  cachedProvider,
  metarObservation,
} from "../lib/live-data.mjs";
import { Card, Section, Txt, Button } from "./ui";
import { RouteMap } from "./route-map";
type Position = NonNullable<ReturnType<typeof aircraftPosition>>;
type Weather = NonNullable<ReturnType<typeof metarObservation>>;

export function FlightLiveData({ flight: f }: { flight: LocalFlight }) {
  const db = useSQLiteContext();
  const { words, save } = useApp();
  const [status, setStatus] = useState<{
    data: ReturnType<typeof aviationstackFlight>;
    fetchedAt: number;
    dataFetchedAt?: number | null;
    error: string | null;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [position, setPosition] = useState<Position | null>(null),
    [weather, setWeather] = useState<Weather[]>([]);
  const departure = flightTimes(f, airportTimezones).departure;
  const eligible =
    f.status === "planned" &&
    departure != null &&
    Math.abs(departure - now) <= 24 * 3600000;
  if (!eligible) return null;
  const refresh = async () => {
    setBusy(true);
    setMessage("");
    try {
      const errors: string[] = [];
      const observations: Weather[] = [];
      for (const code of [f.origin, f.destination]) {
        const station = (airportIcao as Record<string, string>)[code];
        if (!station) continue;
        const result = await cachedProvider(
          db,
          `metar:${station}`,
          `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(station)}&format=json`,
          20 * 60000,
          (data: unknown) => metarObservation(data, station),
        );
        if (result.data) observations.push(result.data);
        if (result.error) errors.push(station);
      }
      setWeather(observations);
      if (f.registration && /^[A-Z0-9-]{3,12}$/i.test(f.registration)) {
        const result = await cachedProvider(
          db,
          `adsb:${f.registration}`,
          `https://opendata.adsb.fi/api/v2/registration/${encodeURIComponent(f.registration)}`,
          30000,
          (data: unknown) => aircraftPosition(data, f.registration),
        );
        setPosition(result.data);
        if (result.error) errors.push("adsb.fi");
      }
      if (errors.length)
        setMessage(
          words(
            "Some providers are unavailable. Any saved observations retain their original time.",
            "部分数据源暂不可用，保留的观测数据会显示原始时间。",
          ),
        );
      else
        setMessage(
          words(
            "Refreshed. No observation means no current coverage, not cancellation or landing.",
            "已刷新。没有观测数据不代表航班取消或已经落地。",
          ),
        );
    } catch (e) {
      Alert.alert(words("Unable to refresh", "刷新失败"), String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <Section
        title={words("Aircraft & airport observations", "飞机与机场观测")}
      />
      <Txt muted>
        {words(
          "Only queried near your upcoming flight. Aircraft position is matched by the registration you recorded; its current flight is not verified.",
          "仅在即将乘坐的航班附近查询。位置按你记录的注册号匹配，尚未核验它是否正执行这段航班。",
        )}
      </Txt>
      <Button
        secondary
        title={words("Flight data settings", "航班数据设置")}
        onPress={() => router.push("/services")}
      />
      <Button
        disabled={busy}
        title={words(
          "Check status & gates · Aviationstack",
          "核对状态与登机口 · Aviationstack",
        )}
        onPress={() =>
          void (async () => {
            setBusy(true);
            try {
              setStatus(await queryFlight(db, f));
            } catch (e) {
              Alert.alert(words("Unable to query", "无法查询"), String(e));
            } finally {
              setBusy(false);
            }
          })()
        }
      />
      {status && (
        <View style={{ gap: 8 }}>
          <Txt muted>
            {words("Checked", "查询时间")}{" "}
            {new Date(
              status.dataFetchedAt || status.fetchedAt,
            ).toLocaleString()}
          </Txt>
          {!!status.error && (
            <Txt accessibilityRole="alert">
              {words(
                "Provider unavailable. Cached details may be outdated.",
                "数据源暂不可用，缓存信息可能已过期。",
              )}
            </Txt>
          )}
          {status.data ? (
            <>
              <Txt>
                {words("Provider status", "数据源状态")}:{" "}
                {status.data.status || "—"}
              </Txt>
              <Txt>
                {words("Departure gate", "出发登机口")}{" "}
                {status.data.departureTerminal || "—"} /{" "}
                {status.data.departureGate || "—"}
              </Txt>
              <Txt>
                {words("Arrival gate / baggage", "到达登机口／行李")}{" "}
                {status.data.arrivalGate || "—"} / {status.data.baggage || "—"}
              </Txt>
              <Txt>
                {words("Estimated departure", "预计出发")}{" "}
                {status.data.estimatedDeparture?.replace("T", " ") || "—"}
              </Txt>
              <Txt>
                {words("Estimated arrival", "预计到达")}{" "}
                {status.data.estimatedArrival?.replace("T", " ") || "—"}
              </Txt>
              <Txt muted>
                {words(
                  "Times as reported in airport local time. Confirm with your airline.",
                  "时间按数据源提供的机场当地时间显示，请与航司核对。",
                )}
              </Txt>
              <Button
                secondary
                disabled={busy || !!status.error}
                title={words(
                  "Use these gate & aircraft details",
                  "采用这些登机口与飞机信息",
                )}
                onPress={() =>
                  void (async () => {
                    const data = status.data;
                    if (!data) return;
                    setBusy(true);
                    try {
                      const details = Object.fromEntries(
                        [
                          "departureTerminal",
                          "departureGate",
                          "arrivalTerminal",
                          "arrivalGate",
                          "baggage",
                          "registration",
                        ]
                          .filter((k) => data[k as keyof typeof data])
                          .map((k) => [k, data[k as keyof typeof data]]),
                      );
                      await save({ ...f, ...details });
                    } catch (e) {
                      Alert.alert(words("Save failed", "保存失败"), String(e));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              />
            </>
          ) : (
            <Txt muted>
              {words(
                "No unique matching flight was returned. The saved itinerary is unchanged.",
                "未返回唯一匹配的航班，已保存航程保持原样。",
              )}
            </Txt>
          )}
        </View>
      )}
      <Button
        disabled={busy}
        title={
          busy
            ? words("Refreshing…", "刷新中……")
            : words("Refresh observations", "刷新观测数据")
        }
        icon="refresh-outline"
        onPress={() => void refresh()}
      />
      {!!message && <Txt muted>{message}</Txt>}
      {!f.registration && (
        <Txt muted>
          {words(
            "Add a confirmed aircraft registration to see its position.",
            "填写已确认的飞机注册号后可查询位置。",
          )}
        </Txt>
      )}
      {position && (
        <>
          {now - position.observedAt > 120000 && (
            <Txt accessibilityRole="alert">
              {words("Last known position · outdated", "最后已知位置 · 已过期")}
            </Txt>
          )}
          <Txt>
            {position.registration} · {position.callsign || "—"}
          </Txt>
          <Txt>
            {words("Observed", "观测时间")}{" "}
            {new Date(position.observedAt).toLocaleTimeString()} ·{" "}
            {position.onGround
              ? words("On ground", "地面")
              : `${position.altitude ?? "—"} ft · ${position.speed ?? "—"} kt`}
          </Txt>
          <RouteMap flights={[f]} position={position} />
        </>
      )}
      {weather.map((w) => (
        <View key={w.station} style={{ gap: 6 }}>
          <Txt>
            {w.station} · {w.temperature ?? "—"}°C · {w.category || "—"}
          </Txt>
          <Txt muted>
            {now - w.observedAt > 90 * 60000
              ? words("Outdated · ", "已过期 · ")
              : ""}
            {new Date(w.observedAt).toLocaleString()} ·{" "}
            {words(
              "Current observation, not a forecast",
              "当前观测，非未来预报",
            )}
          </Txt>
          <Txt muted selectable style={{ fontSize: 12 }}>
            {w.text}
          </Txt>
        </View>
      ))}
      <Button
        secondary
        title="adsb.fi"
        onPress={() =>
          void Linking.openURL("https://adsb.fi").catch((e) =>
            Alert.alert(String(e)),
          )
        }
      />
      <Button
        secondary
        title="Aviation Weather Center"
        onPress={() =>
          void Linking.openURL("https://aviationweather.gov").catch((e) =>
            Alert.alert(String(e)),
          )
        }
      />
    </Card>
  );
}
