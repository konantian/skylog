import { useEffect, useState } from "react";
import { Alert, Platform, Share, View, Linking } from "react-native";
import { router } from "expo-router";
import { airportTimezones, airports, type LocalFlight } from "../lib/catalog";
import { useApp } from "../lib/store";
import {
  flightTimes,
  connectionFor,
  itineraryText,
} from "../lib/flight-time.mjs";
import {
  addFlightToCalendar,
  allowReminders,
  startFlightActivity,
  syncReminders,
} from "../lib/flight-integrations";
import { Txt, Card, Button, Section, styles } from "./ui";

export function FlightTools({ flight: f }: { flight: LocalFlight }) {
  const {
    words,
    locale,
    save,
    flights,
    activeFlight,
    prefs,
    integrationError,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const times = flightTimes(f, airportTimezones);
  const connection = connectionFor(f, flights, airportTimezones) as {
    flight: LocalFlight;
    minutes: number;
  } | null;
  const minutes =
    times.departure == null ? null : Math.ceil((times.departure - now) / 60000);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      Alert.alert(words("Couldn't complete", "未能完成"), String(e));
    } finally {
      setBusy(false);
    }
  };
  const airportData = airports as Record<
    string,
    { name: string; latitude: number; longitude: number }
  >;
  return (
    <>
      {f.status === "planned" && (
        <Card>
          <Section
            title={words("Ready for takeoff", "准备出发")}
            caption={words("YOUR UPCOMING FLIGHT", "你的下一段旅途")}
          />
          <Txt style={styles.section}>
            {minutes != null && minutes > 0
              ? words(
                  `${Math.floor(minutes / 60)}h ${minutes % 60}m until scheduled departure`,
                  `距离计划出发 ${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`,
                )
              : words(
                  "Check your airline for the latest status",
                  "请核对航司最新状态",
                )}
          </Txt>
          <Txt muted>
            {words(
              "Based on your saved itinerary. Gate changes, delays and cancellations are not pushed by a live provider yet.",
              "根据已保存的航程计算，目前尚无实时航司数据推送登机口、延误或取消变化。",
            )}
          </Txt>
          <Button
            disabled={busy}
            secondary
            title={
              f.reminders
                ? words("Turn off departure reminders", "关闭出发提醒")
                : words(
                    "Remind me · 24h & 3h before",
                    "提醒我 · 提前 24 小时和 3 小时",
                  )
            }
            icon="notifications-outline"
            onPress={() =>
              void run(async () => {
                if (!f.reminders) {
                  if (times.departure == null || times.departure <= Date.now())
                    throw new Error(
                      words(
                        "Add a future departure date and local time first.",
                        "请先填写未来的出发日期和当地时间。",
                      ),
                    );
                  await allowReminders();
                }
                const updated = { ...f, reminders: !f.reminders };
                await save(updated);
                await syncReminders(
                  flights.map((n) => (n.id === f.id ? updated : n)),
                  locale,
                );
              })
            }
          />
          {Platform.OS === "ios" && (
            <Button
              disabled={busy}
              secondary
              title={
                activeFlight === f.id
                  ? words("Stop Live Activity", "关闭实时活动")
                  : words("Lock Screen & Dynamic Island", "锁屏与灵动岛")
              }
              icon="phone-portrait-outline"
              onPress={() =>
                void run(async () => {
                  if (activeFlight === f.id) await prefs("activeFlight", "");
                  else {
                    await startFlightActivity(f, locale);
                    await prefs("activeFlight", f.id);
                  }
                })
              }
            />
          )}
          <Txt muted style={{ fontSize: 12 }}>
            {words(
              "Live Activity can be opened 3 hours before departure. It shows saved flight details and a system countdown; open the app to refresh changes.",
              "出发前 3 小时可开启，展示已保存信息和系统倒计时；修改后打开 App 更新。",
            )}
          </Txt>
          {!!integrationError && (
            <Txt accessibilityRole="alert">
              {words(
                "Reminder or widget update failed. Try again with the app open.",
                "提醒或小组件更新未成功，请保持 App 打开后重试。",
              )}
            </Txt>
          )}
        </Card>
      )}
      {connection && (
        <Card>
          <Section title={words("Next connection", "下一段衔接")} />
          <Txt>
            {f.destination} · {connection.flight.flight} →{" "}
            {connection.flight.destination}
          </Txt>
          <Txt style={styles.section}>
            {Math.floor(connection.minutes / 60)}h {connection.minutes % 60}m
          </Txt>
          <Txt muted>
            {words(
              "Time between saved arrival and next departure. This is not a minimum connection-time or immigration assessment.",
              "按已保存的到达和下一段出发时间计算；不代表已核验机场最短转机时间、入境或行李手续。",
            )}
          </Txt>
          <Button
            secondary
            title={words("Open next flight", "查看下一段航班")}
            onPress={() =>
              router.push({
                pathname: "/flight/[id]",
                params: { id: connection.flight.id },
              })
            }
          />
        </Card>
      )}
      <Card>
        <Section title={words("Flight timeline", "航班时间线")} />
        {[
          [
            words("Scheduled gate departure", "计划离开登机口"),
            f.gateDepartureScheduled,
          ],
          [
            words("Actual gate departure", "实际离开登机口"),
            f.gateDepartureActual,
          ],
          [words("Takeoff", "实际起飞"), f.takeoffActual],
          [words("Landing", "实际降落"), f.landingActual],
          [
            words("Scheduled gate arrival", "计划到达登机口"),
            f.gateArrivalScheduled,
          ],
          [words("Actual gate arrival", "实际到达登机口"), f.gateArrivalActual],
        ].map(([label, value]) => (
          <View key={label} style={{ gap: 4 }}>
            <Txt muted>{label}</Txt>
            <Txt>
              {value?.replace("T", " ") || words("Not recorded", "尚未记录")}
            </Txt>
          </View>
        ))}
        <Txt muted style={{ fontSize: 12 }}>
          {words("Local time at each airport", "各机场当地时间")} ·{" "}
          {times.departureZone || "—"} / {times.arrivalZone || "—"}
        </Txt>
      </Card>
      <View style={{ gap: 12 }}>
        <Button
          secondary
          disabled={busy}
          title={words("Add to Calendar", "添加到日历")}
          icon="calendar-outline"
          onPress={() => void run(() => addFlightToCalendar(f, locale))}
        />
        <Button
          secondary
          title={words("Share itinerary", "分享航程")}
          icon="share-outline"
          onPress={() =>
            void run(() =>
              Share.share({
                message: itineraryText(f, airportTimezones, locale),
              }),
            )
          }
        />
        <Button
          secondary
          title={words("Add return flight", "添加返程航班")}
          icon="return-down-back-outline"
          onPress={() =>
            router.push({
              pathname: "/flight/edit",
              params: { template: f.id, returnTrip: "1" },
            })
          }
        />
        <Button
          secondary
          title={words("Fly this route again", "再次乘坐这条航线")}
          icon="copy-outline"
          onPress={() =>
            router.push({
              pathname: "/flight/edit",
              params: { template: f.id },
            })
          }
        />
        {[f.origin, f.destination].map(
          (code) =>
            airportData[code] && (
              <Button
                key={code}
                secondary
                title={`${code} · ${words("Open airport map", "查看机场地图")}`}
                icon="map-outline"
                onPress={() => {
                  const a = airportData[code];
                  void Linking.openURL(
                    Platform.OS === "ios"
                      ? `https://maps.apple.com/?ll=${a.latitude},${a.longitude}&q=${encodeURIComponent(a.name)}`
                      : `https://www.google.com/maps/search/?api=1&query=${a.latitude},${a.longitude}`,
                  ).catch((e) => Alert.alert(String(e)));
                }}
              />
            ),
        )}
      </View>
    </>
  );
}
