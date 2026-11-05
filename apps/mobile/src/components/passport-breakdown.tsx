import { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { flightBreakdown } from "../../../../lib/insights.mjs";
import { airports, type LocalFlight } from "../lib/catalog";
import { useApp } from "../lib/store";
import { Card, Section, Stat, Txt, Button, styles } from "./ui";
export function PassportBreakdown({ flights }: { flights: LocalFlight[] }) {
  const { colors, words } = useApp();
  const stats = useMemo(() => flightBreakdown(flights, airports), [flights]);
  const [period, setPeriod] = useState<"years" | "months" | "weekdays">(
    "months",
  );
  const bars = stats[period];
  const max = Math.max(1, ...bars.map((b) => b.count));
  const weekdays = words(
    "Sun,Mon,Tue,Wed,Thu,Fri,Sat",
    "日,一,二,三,四,五,六",
  ).split(",");
  return (
    <>
      <Card>
        <View style={styles.wrap}>
          <Stat
            value={stats.domestic}
            label={words("Domestic / regional", "境内航段")}
          />
          <Stat
            value={stats.international}
            label={words("Cross-border", "跨境航段")}
          />
          <Stat
            value={stats.longDistance}
            label={words("Routes over 4,000 km", "4,000 km 以上航段")}
          />
          <Stat
            value={`${stats.earthTrips.toFixed(1)}×`}
            label={words("Around Earth · estimated", "绕地球圈数 · 估算")}
          />
          <Stat
            value={
              stats.averageKm === null
                ? "—"
                : `${Math.round(stats.averageKm).toLocaleString()} km`
            }
            label={words("Average route · estimated", "平均航程 · 估算")}
          />
        </View>
        <Txt muted style={{ fontSize: 12 }}>
          {words(
            "Domestic / cross-border uses airport country or region codes. Distances are great-circle estimates.",
            "境内／跨境按机场国家或地区代码划分，航程使用大圆距离估算。",
          )}
          {stats.unclassified > 0
            ? words(
                ` ${stats.unclassified} unclassified.`,
                ` ${stats.unclassified} 段资料不足。`,
              )
            : ""}
        </Txt>
      </Card>
      <Card>
        <Section title={words("Your flying rhythm", "你的飞行节奏")} />
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {[
            ["years", words("Year", "按年")],
            ["months", words("Month", "按月")],
            ["weekdays", words("Weekday", "按星期")],
          ].map(([value, title]) => (
            <Button
              key={value}
              title={title}
              secondary={period !== value}
              onPress={() => setPeriod(value as typeof period)}
            />
          ))}
        </View>
        <ScrollView
          horizontal
          contentContainerStyle={{
            minWidth: "100%",
            gap: 10,
            alignItems: "flex-end",
            paddingTop: 16,
          }}
        >
          {bars.map((b) => (
            <View
              key={b.name}
              style={{ flex: 1, minWidth: 18, alignItems: "center", gap: 8 }}
            >
              <Txt muted style={{ fontSize: 10 }}>
                {b.count || ""}
              </Txt>
              <View style={{ height: 100, justifyContent: "flex-end" }}>
                <View
                  style={{
                    height: Math.max(2, (b.count / max) * 100),
                    width: 16,
                    backgroundColor: colors.accent,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Txt muted style={{ fontSize: 10 }}>
                {period === "weekdays"
                  ? weekdays[Number(b.name)]
                  : period === "years"
                    ? b.name.slice(-2)
                    : b.name}
              </Txt>
            </View>
          ))}
        </ScrollView>
      </Card>
    </>
  );
}
