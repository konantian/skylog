import { useMemo, useDeferredValue } from "react";
import { View, FlatList, TextInput, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../lib/store";
import {
  aircraft,
  airlines,
  airports,
  filterFlights,
  initialFilters,
  type LocalFlight,
} from "../lib/catalog";
import {
  Txt,
  Card,
  Button,
  IconButton,
  Icon,
  Empty,
  styles,
} from "../components/ui";
export function FlightCard({ flight: f }: { flight: LocalFlight }) {
  const { words, t } = useApp();
  const city = (code: string) =>
    (airports as Record<string, { city: string }>)[code]?.city || "";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${f.date} ${f.flight} ${f.origin} to ${f.destination}`}
      onPress={() =>
        router.push({ pathname: "/flight/[id]", params: { id: f.id } })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Txt accent style={styles.eyebrow}>
            {f.flight}
          </Txt>
          <Txt muted style={{ fontSize: 12 }}>
            {f.date}
          </Txt>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt style={styles.title}>{f.origin}</Txt>
            <Txt muted style={{ fontSize: 12 }}>
              {city(f.origin)}
            </Txt>
          </View>
          <Icon name="airplane-outline" />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Txt style={styles.title}>{f.destination}</Txt>
            <Txt muted style={{ fontSize: 12, textAlign: "right" }}>
              {city(f.destination)}
            </Txt>
          </View>
        </View>
        <Txt>{f.airline}</Txt>
        <Txt muted style={{ fontSize: 12 }}>
          {f.model || f.modelLabel}{" "}
          {f.registration ? `· ${f.registration}` : ""}
        </Txt>
        <Txt accent style={{ fontSize: 12 }}>
          {f.status === "completed"
            ? words("Flown", "已乘坐")
            : f.status === "planned"
              ? words("Planned", "待出发")
              : words("Cancelled", "已取消")}
          {f.model ? ` · ${t("机型")}` : ""}
        </Txt>
      </Card>
    </Pressable>
  );
}
export function FlightsScreen() {
  const { colors, words, flights, filters, setFilters } = useApp();
  const params = useLocalSearchParams<{ status?: string }>();
  const status = ["completed", "planned", "cancelled"].includes(
    params.status || "",
  )
    ? params.status!
    : "completed";
  const setStatus = (status: string) => router.setParams({ status });
  const f = filters.flights;
  const query = useDeferredValue(f.query);
  const items = useMemo(() => {
    const scoped = filterFlights(
      flights.filter((f) => f.status === status),
      { ...f, query: "" },
      aircraft,
      airlines,
    ) as LocalFlight[];
    const matches = new Set(
      (
        filterFlights(
          scoped,
          { ...f, query },
          aircraft,
          airlines,
        ) as LocalFlight[]
      ).map((f) => f.id),
    );
    const normalized = query.trim().toLowerCase();
    const selected = scoped.filter(
      (f) =>
        matches.has(f.id) ||
        [f.seatPosition, f.cabin, f.trip, f.notes].some((v) =>
          v?.toLowerCase().includes(normalized),
        ),
    );
    return status === "planned"
      ? [...selected].sort((a, b) => a.date.localeCompare(b.date))
      : selected;
  }, [flights, status, f, query]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, gap: 16 }}>
        <Button
          secondary
          title={words("Passport & yearly stats", "Passport 与年度统计")}
          icon="globe-outline"
          onPress={() => router.push("/passport")}
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Txt accent style={styles.eyebrow}>
              MY FLIGHT LOG
            </Txt>
            <Txt muted>
              {words(
                "On this device · available offline",
                "保存在本机 · 离线可用",
              )}
            </Txt>
          </View>
          <IconButton
            name="add-circle-outline"
            label={words("Add flight", "添加航班")}
            onPress={() => router.push("/flight/edit")}
          />
        </View>
        <View
          style={[
            styles.row,
            {
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 14,
              paddingLeft: 14,
            },
          ]}
        >
          <Icon name="search-outline" size={20} />
          <TextInput
            accessibilityLabel={words("Search flights", "搜索航班")}
            value={f.query}
            onChangeText={(query) => setFilters("flights", { ...f, query })}
            placeholder={words(
              "Airline, route or flight number",
              "航司、航线、航班号或旅程",
            )}
            placeholderTextColor={colors.muted}
            style={{ fontSize: 16, color: colors.text, flex: 1, minHeight: 50 }}
            autoCorrect={false}
          />
          <IconButton
            name="options-outline"
            label={words("Flight filters", "航班筛选")}
            onPress={() =>
              router.push({ pathname: "/filters", params: { mode: "flights" } })
            }
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            ["completed", words("Flown", "已乘坐")],
            ["planned", words("Upcoming", "待出发")],
            ["cancelled", words("Cancelled", "已取消")],
          ].map(([value, title]) => (
            <Button
              key={value}
              title={`${title} ${flights.filter((f) => f.status === value).length}`}
              secondary={status !== value}
              onPress={() => setStatus(value)}
              style={{ paddingHorizontal: 12 }}
            />
          ))}
        </View>
        <Button
          secondary
          title={words("Clear filters", "清除筛选")}
          onPress={() => setFilters("flights", { ...initialFilters })}
        />
        <Txt muted style={{ fontSize: 12 }}>
          {items.length} {words("matching flights", "段符合筛选的旅程")}
        </Txt>
      </View>
      <FlatList
        data={items}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{
          padding: 20,
          paddingTop: 0,
          gap: 16,
          paddingBottom: 32,
        }}
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <FlightCard flight={item} />}
        ListEmptyComponent={
          <Empty
            title={words(
              "Your next story starts here",
              "下一段旅途，从这里开始",
            )}
            body={words(
              "Add a flight or change your filters.",
              "添加一段航班，或者调整筛选。",
            )}
          />
        }
      />
    </View>
  );
}
