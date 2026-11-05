import { useMemo, useState, useRef } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Stack, router } from "expo-router";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useApp } from "../lib/store";
import { airports, initialFilters, type Filters } from "../lib/catalog";
import { passportStats } from "../lib/passport.mjs";
import { airlineName, airportName, aircraftName } from "../lib/flight-labels";
import {
  Page,
  Txt,
  Card,
  Stat,
  Section,
  Button,
  IconButton,
  styles,
} from "../components/ui";
import { PassportBreakdown } from "../components/passport-breakdown";
import { RouteMap } from "../components/route-map";
import { CountryFlags } from "../components/country-flags";
import countries from "../../../../data/country-flags.json";
export default function Passport() {
  const { colors, words, t, locale, flights, setFilters } = useApp();
  const [year, setYear] = useState("all");
  const [rank, setRank] = useState("airlines");
  const shot = useRef<ViewShotRef>(null);
  const stats = useMemo(
    () => passportStats(flights, airports, year),
    [flights, year],
  );
  const years = [
    ...new Set(
      flights
        .filter((f) => f.status === "completed")
        .map((f) => f.date.slice(0, 4)),
    ),
  ]
    .sort()
    .reverse();
  const rankings: Record<string, { name: string; count: number }[]> = {
    airlines: stats.airlines,
    models: stats.models,
    routes: stats.routes.map((r) => ({
      name: r.airports.join(" ↔ "),
      count: r.count,
    })),
    airframes: stats.airframes,
    airports: stats.airportRanking,
    distance: stats.airlineDistance,
    seats: stats.seats,
    cabins: stats.cabins,
  };
  const explore = (key?: keyof Filters, value?: string) => {
    setFilters("flights", {
      ...initialFilters,
      flightYear: year,
      ...(key ? { [key]: value } : {}),
    });
    router.push("/(tabs)/flights");
  };
  const share = async () => {
    try {
      const uri = await shot.current?.capture?.();
      if (uri && (await Sharing.isAvailableAsync()))
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          UTI: "public.png",
        });
    } catch (e) {
      Alert.alert(words("Unable to share", "无法分享"), String(e));
    }
  };
  return (
    <Page>
      <Stack.Screen
        options={{
          title: words("Passport", "飞行护照"),
          headerRight: () => (
            <IconButton
              name="share-outline"
              label={words("Share passport", "分享飞行护照")}
              onPress={() => void share()}
            />
          ),
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {["all", ...years].map((value) => (
          <Button
            key={value}
            title={value === "all" ? words("All time", "全部年份") : value}
            secondary={value !== year}
            onPress={() => setYear(value)}
          />
        ))}
      </ScrollView>
      <ViewShot
        ref={shot}
        options={{ format: "png", quality: 1 }}
        style={{ backgroundColor: colors.bg, borderRadius: 20 }}
      >
        <Card style={{ gap: 24 }}>
          <View>
            <Txt accent style={styles.eyebrow}>
              {words(
                "SKYLOG · PERSONAL FLIGHT PASSPORT",
                "SKYLOG · 个人飞行护照",
              )}
            </Txt>
            <Txt style={[styles.title, { marginTop: 8 }]}>
              {words("Yuan Wang", "王源")}
            </Txt>
            <Txt muted>
              {year === "all"
                ? words("A lifetime of looking up.", "把一生的旅途，留在云端。")
                : year}
            </Txt>
          </View>
          <View style={styles.wrap}>
            <Stat
              value={stats.total}
              label={words("Flights flown", "已乘坐航段")}
            />
            <Stat
              value={Math.round(stats.totalKm).toLocaleString()}
              label={words("Kilometres · estimated", "公里 · 估算")}
            />
            <Stat
              value={stats.countries.length}
              label={words("Countries / regions", "到访国家／地区")}
            />
            <Stat
              value={stats.airports}
              label={words("Airports", "到访机场")}
            />
          </View>
          <RouteMap key={year} flights={stats.flights} />
          <Txt muted style={{ fontSize: 12 }}>
            SKYLOG
          </Txt>
        </Card>
      </ViewShot>
      <Section
        title={words("Your year in the sky", "你的云端足迹")}
        caption={year === "all" ? words("LIFETIME STATS", "生涯统计") : year}
      />
      <Card>
        <View style={styles.wrap}>
          {stats.durationKnown > 0 && (
            <Stat
              value={
                stats.durationKnown
                  ? `${Math.floor(stats.durationMinutes / 60)}h ${stats.durationMinutes % 60}m`
                  : "—"
              }
              label={words("Recorded flight time", "记录的飞行时长")}
            />
          )}
          {stats.delayKnown > 0 && (
            <>
              <Stat
                value={stats.delayKnown ? `${stats.delayMinutes} min` : "—"}
                label={words("Total arrival delay", "累计到达延误")}
              />
              <Stat
                value={stats.onTime === null ? "—" : `${stats.onTime}%`}
                label={words("Arrived within 15 min", "到达延误少于15分钟")}
              />
            </>
          )}
          <Stat
            value={stats.flightDays}
            label={words("Days you flew", "飞行天数")}
          />
          <Stat value={stats.airlines.length} label={t("坐过航司")} />
          <Stat value={stats.models.length} label={t("明确机型")} />
        </View>
        {(stats.durationKnown > 0 || stats.delayKnown > 0) && (
          <Txt muted style={{ fontSize: 12 }}>
            {words(
              `${stats.durationKnown}/${stats.total} flights have duration; ${stats.delayKnown}/${stats.total} have delay data. Unknown values are not counted as zero.`,
              `${stats.durationKnown}/${stats.total} 段有时长，${stats.delayKnown}/${stats.total} 段有延误数据。缺失值不按零计算。`,
            )}
          </Txt>
        )}
        {!stats.durationKnown && (
          <Txt muted>
            {words(
              "Flight time is not available yet. Actual departure and arrival times are needed to calculate it.",
              "暂无飞行时长数据，补充实际起飞和降落时间后即可统计。",
            )}
          </Txt>
        )}
        <Txt muted style={{ fontSize: 12 }}>
          {words(
            `Distances cover ${stats.measured}/${stats.total} flights and use airport great-circle estimates.`,
            `距离覆盖 ${stats.measured}/${stats.total} 段，按机场间大圆距离估算。`,
          )}
        </Txt>
      </Card>
      <PassportBreakdown flights={stats.flights} />
      <Card>
        <Section title={words("Delay report", "延误报告")} />
        {stats.delayKnown > 0 ? (
          <>
            <View style={styles.wrap}>
              <Stat
                value={
                  stats.delayPercent === null ? "—" : `${stats.delayPercent}%`
                }
                label={words("Arrived later than scheduled", "晚于计划到达")}
              />
              <Stat
                value={
                  stats.averageDelay === null
                    ? "—"
                    : `${stats.averageDelay} min`
                }
                label={words("Average of delayed flights", "延误航班平均晚到")}
              />
            </View>
            <Txt muted>
              {words(
                `${stats.delayCount} late arrivals among ${stats.delayKnown} known records. A delay means more than 0 minutes.`,
                `${stats.delayKnown} 段有数据，其中 ${stats.delayCount} 段晚到。这里以晚于计划 0 分钟为界。`,
              )}
            </Txt>
          </>
        ) : (
          <>
            <Txt muted>
              {words(
                "These records do not include scheduled and actual arrival times, so delay and on-time statistics are not available yet.",
                "这些记录尚未包含计划与实际到达时间，暂时无法计算延误和准点率。",
              )}
            </Txt>
            <Button
              secondary
              icon="download-outline"
              title={words(
                "Import complete flight records",
                "导入完整乘机记录",
              )}
              onPress={() => router.push("/settings")}
            />
            <Txt muted style={{ fontSize: 12 }}>
              {words(
                "Import a Flighty CSV with these times from Settings to fill missing details without duplicating flights.",
                "可在设置中导入包含这些时间的 Flighty CSV，补全已有航班，不会重复添加。",
              )}
            </Txt>
          </>
        )}
        {stats.delayAirlines.map((item) => (
          <View
            key={item.name}
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <Txt style={{ flex: 1 }}>{airlineName(item.name, locale)}</Txt>
            <Txt accent>{item.count} min</Txt>
          </View>
        ))}
      </Card>
      <Section title={words("Most flown", "旅途里的常客")} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {[
          ["airlines", t("航司")],
          ["models", t("机型")],
          ["routes", words("Routes", "航线")],
          ["airframes", words("Airframes", "飞机注册号")],
          ["airports", words("Airports", "机场")],
          ["distance", words("Airline distance", "航司里程")],
          ["seats", words("Seats", "座位位置")],
          ["cabins", words("Cabins", "舱位")],
        ].map(([key, title]) => (
          <Button
            key={key}
            title={title}
            secondary={rank !== key}
            onPress={() => setRank(key)}
          />
        ))}
      </ScrollView>
      <Card>
        {rankings[rank].length ? (
          rankings[rank].slice(0, 10).map((item, i) => (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              onPress={() =>
                explore(
                  rank === "airlines" || rank === "distance"
                    ? "airline"
                    : rank === "airports"
                      ? "flightAirport"
                      : rank === "models"
                        ? "model"
                        : rank === "routes"
                          ? "route"
                          : "query",
                  rank === "routes"
                    ? item.name.replace(" ↔ ", "~")
                    : item.name,
                )
              }
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                minHeight: 48,
                gap: 12,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Txt muted style={{ width: 25 }}>
                {String(i + 1).padStart(2, "0")}
              </Txt>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt>
                  {rank === "airlines" || rank === "distance"
                    ? airlineName(item.name, locale)
                    : rank === "airports"
                      ? airportName(item.name, locale)
                      : rank === "models"
                        ? aircraftName(item.name, locale)
                        : item.name}
                </Txt>
                {rank === "airports" && (
                  <Txt muted style={{ fontSize: 12 }}>
                    {item.name}
                  </Txt>
                )}
              </View>
              <Txt accent style={{ flexShrink: 0, textAlign: "right" }}>
                {item.count.toLocaleString()}
                {rank === "distance" ? " km" : ""}
              </Txt>
            </Pressable>
          ))
        ) : (
          <Txt muted>
            {words(
              "No recorded data yet. Add it when editing a flight.",
              "还没有记录，可以在编辑航班时补充。",
            )}
          </Txt>
        )}
      </Card>
      {rank === "airports" && (
        <Txt muted style={{ fontSize: 12 }}>
          {words(
            "Counts every departure and arrival, including connections.",
            "逐次统计起降，包含转机。",
          )}
        </Txt>
      )}
      <Section title={words("Personal records", "个人纪录")} />
      {[
        stats.longest && {
          title: words("Longest route", "最远航线"),
          flight: stats.longest.flight,
          value: `${Math.round(stats.longest.km).toLocaleString()} km`,
        },
        stats.shortest && {
          title: words("Shortest route", "最短航线"),
          flight: stats.shortest.flight,
          value: `${Math.round(stats.shortest.km)} km`,
        },
        stats.worstDelay && {
          title: words("Longest arrival delay", "最长到达延误"),
          flight: stats.worstDelay,
          value: `${Math.max(0, stats.worstDelay.delayMinutes)} min`,
        },
        stats.oldest && {
          title: words("Oldest recorded airframe", "坐过最年长的飞机"),
          flight: stats.oldest.flight,
          value: `~${stats.oldest.age} ${words("years at flight", "岁（乘坐时）")}`,
        },
        stats.newest && {
          title: words("Newest recorded airframe", "坐过最年轻的飞机"),
          flight: stats.newest.flight,
          value: `~${stats.newest.age} ${words("years at flight", "岁（乘坐时）")}`,
        },
      ]
        .filter(Boolean)
        .map((record: any) => (
          <Button
            key={record.title}
            secondary
            title={`${record.title} · ${record.flight.origin}–${record.flight.destination} · ${record.value}`}
            onPress={() =>
              router.push({
                pathname: "/flight/[id]",
                params: { id: record.flight.id },
              })
            }
          />
        ))}
      <Section title={words("Passport stamps", "飞行足迹")} />
      <Card>
        <Txt muted>
          {words(
            "Countries / regions with an arrival or departure, including connections.",
            "按到达或出发机场所在国家／地区统计，包含转机。",
          )}
        </Txt>
        <View style={styles.wrap}>
          {stats.countries.map((country) => {
            const name = Object.entries(countries).find(
              ([, codes]) =>
                codes.length === 1 && codes.includes(country.toLowerCase()),
            )?.[0];
            return (
              <View
                key={country}
                accessible
                accessibilityLabel={name ? t(name) : country}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  padding: 12,
                  gap: 8,
                  alignItems: "center",
                  width: 94,
                }}
              >
                <CountryFlags country={country} size={48} />
                <Txt muted style={{ fontSize: 12, textAlign: "center" }}>
                  {name ? t(name) : country}
                </Txt>
              </View>
            );
          })}
        </View>
      </Card>
      <Card>
        {stats.visited.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            onPress={() => explore("flightAirport", code)}
            style={{ minHeight: 48, justifyContent: "center" }}
          >
            <Txt>
              {code} · {airportName(code, locale)}
            </Txt>
          </Pressable>
        ))}
      </Card>
      <Button
        title={words("See flights for this year", "查看这一年的航班")}
        onPress={() => explore()}
      />
    </Page>
  );
}
