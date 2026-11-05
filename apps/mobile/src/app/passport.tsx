import { useMemo, useState, useRef } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { Stack, router } from "expo-router";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useApp } from "../lib/store";
import { airports, initialFilters, type Filters } from "../lib/catalog";
import { passportStats } from "../lib/passport.mjs";
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
export default function Passport() {
  const { colors, words, t, flights, setFilters } = useApp();
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
    router.push({
      pathname: "/(tabs)/flights",
      params: { status: "completed" },
    });
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
          title: "Passport",
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
              SKYLOG · PERSONAL FLIGHT PASSPORT
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
          <RouteMap flights={stats.flights} />
          <Txt muted style={{ fontSize: 12 }}>
            SKYLOG · konantian.github.io/skylog
          </Txt>
        </Card>
      </ViewShot>
      <Section
        title={words("Your year in the sky", "你的云端足迹")}
        caption={year === "all" ? "LIFETIME STATS" : year}
      />
      <Card>
        <View style={styles.wrap}>
          <Stat
            value={
              stats.durationKnown
                ? `${Math.floor(stats.durationMinutes / 60)}h ${stats.durationMinutes % 60}m`
                : "—"
            }
            label={words("Recorded flight time", "记录的飞行时长")}
          />
          <Stat
            value={stats.delayKnown ? `${stats.delayMinutes} min` : "—"}
            label={words("Total arrival delay", "累计到达延误")}
          />
          <Stat
            value={stats.onTime === null ? "—" : `${stats.onTime}%`}
            label={words("Arrived within 15 min", "到达延误少于15分钟")}
          />
          <Stat
            value={stats.flightDays}
            label={words("Days you flew", "飞行天数")}
          />
          <Stat value={stats.airlines.length} label={t("坐过航司")} />
          <Stat value={stats.models.length} label={t("明确机型")} />
        </View>
        <Txt muted style={{ fontSize: 12 }}>
          {words(
            `${stats.durationKnown}/${stats.total} flights have duration; ${stats.delayKnown}/${stats.total} have delay data. Unknown values are not counted as zero.`,
            `${stats.durationKnown}/${stats.total} 段有时长，${stats.delayKnown}/${stats.total} 段有延误数据。缺失值不按零计算。`,
          )}
        </Txt>
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
        <View style={styles.wrap}>
          <Stat
            value={stats.delayPercent === null ? "—" : `${stats.delayPercent}%`}
            label={words("Arrived later than scheduled", "晚于计划到达")}
          />
          <Stat
            value={
              stats.averageDelay === null ? "—" : `${stats.averageDelay} min`
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
        {stats.delayAirlines.map((item) => (
          <View
            key={item.name}
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "space-between",
            }}
          >
            <Txt style={{ flex: 1 }}>{item.name}</Txt>
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
                  rank === "routes" ? item.name.replace(" ↔ ", "~") : item.name,
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
              <Txt style={{ flex: 1 }}>{item.name}</Txt>
              <Txt accent>
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
          {stats.countries.map((country) => (
            <View
              key={country}
              style={{
                borderWidth: 1,
                borderColor: colors.accent,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Txt accent style={{ fontWeight: "700", fontSize: 20 }}>
                {country}
              </Txt>
            </View>
          ))}
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
              {code} ·{" "}
              {(airports as Record<string, { city: string }>)[code]?.city ||
                words(
                  "Airport not in offline database",
                  "离线资料中暂无此机场",
                )}
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
