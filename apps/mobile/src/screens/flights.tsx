import { flightAirlineLogo } from "../../../../lib/flight-airline-logo";
import { Image } from "expo-image";
import { useMemo, useDeferredValue } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useApp } from "../lib/store";
import { compareFlightDates } from "../lib/flight-time.mjs";
import {
  airlineName,
  airportName,
  aircraftName,
  aircraftSearchQuery,
} from "../lib/flight-labels";
import {
  aircraft,
  airlines,
  airportTimezones,
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
export function FlightCard({
  flight: f,
  showAircraft = false,
}: {
  flight: LocalFlight;
  showAircraft?: boolean;
}) {
  const { locale, words, isDark } = useApp();
  const logo = flightAirlineLogo(f.airline);
  const city = (code: string) => airportName(code, locale);
  const card = (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {logo && (
          <Image
            source={logo.image}
            tintColor={isDark && logo.reverseOnDark ? "#f2f7fa" : undefined}
            contentFit="contain"
            accessible={false}
            style={{
              width: 28,
              height: 28,
            }}
          />
        )}
        <Txt numberOfLines={1} style={{ flexShrink: 1, fontWeight: "600" }}>
          {airlineName(f.airline, locale)}
        </Txt>
        <Txt
          accent
          numberOfLines={1}
          style={[styles.eyebrow, { flexShrink: 0 }]}
        >
          {f.flight}
        </Txt>
        <Txt
          muted
          numberOfLines={1}
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            fontSize: 12,
            fontVariant: ["tabular-nums"],
          }}
        >
          {f.date}
        </Txt>
      </View>
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Txt style={[styles.title, { flex: 1 }]}>{f.origin}</Txt>
          <Icon name="airplane-outline" />
          <Txt style={[styles.title, { flex: 1, textAlign: "right" }]}>{f.destination}</Txt>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
          <Txt muted style={{ flex: 1, fontSize: 12 }}>
            {city(f.origin)}
            {f.departureTime ? ` · ${f.departureTime}` : ""}
          </Txt>
          <Txt muted style={{ flex: 1, fontSize: 12, textAlign: "right" }}>
            {city(f.destination)}
          </Txt>
        </View>
      </View>
      {showAircraft && (
        <Txt muted style={{ fontSize: 12 }}>
          {aircraftName(f.model || f.modelLabel, locale)}{" "}
          {f.registration ? `· ${f.registration}` : ""}
        </Txt>
      )}
    </Card>
  );
  if (showAircraft) return card;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${airlineName(f.airline, locale)} ${f.flight} ${f.date} ${city(f.origin)} ${words("to", "至")} ${city(f.destination)}`}
      onPress={() =>
        router.push({ pathname: "/flight/[id]", params: { id: f.id } })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {card}
    </Pressable>
  );
}
export function FlightsScreen() {
  const { colors, words, locale, flights, filters, setFilters } = useApp();
  const f = filters.flights;
  const query = useDeferredValue(f.query);
  const hasFilters = Object.entries(f).some(
    ([key, value]) =>
      value !== initialFilters[key as keyof typeof initialFilters],
  );
  const items = useMemo(() => {
    const scoped = filterFlights(
      flights.filter((f) => f.status !== "cancelled"),
      { ...f, query: "" },
      aircraft,
      airlines,
    ) as LocalFlight[];
    const matches = new Set(
      (
        filterFlights(
          scoped,
          { ...f, query: aircraftSearchQuery(query) },
          aircraft,
          airlines,
        ) as LocalFlight[]
      ).map((f) => f.id),
    );
    const normalized = query.trim().toLowerCase();
    const selected = scoped.filter(
      (f) =>
        matches.has(f.id) ||
        [
          f.seatPosition,
          f.cabin,
          f.trip,
          f.notes,
          airportName(f.origin, locale),
          airportName(f.destination, locale),
        ].some((v) => v?.toLowerCase().includes(normalized)),
    );
    if (f.sort === "name") return selected;
    return selected.sort((a, b) => {
      const nextA = a.status === "planned",
        nextB = b.status === "planned";
      if (nextA !== nextB) return nextA ? -1 : 1;
      const order = compareFlightDates(a, b, airportTimezones);
      return nextA ? order : -order;
    });
  }, [flights, f, query, locale]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingBottom: 32,
        }}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Button
              secondary
              title={words("Passport & yearly stats", "飞行护照与年度统计")}
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
                style={{
                  fontSize: 16,
                  color: colors.text,
                  flex: 1,
                  minHeight: 50,
                }}
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
              <IconButton
                name="options-outline"
                label={words("Flight filters", "航班筛选")}
                onPress={() =>
                  router.push({
                    pathname: "/filters",
                    params: { mode: "flights" },
                  })
                }
              />
            </View>
            {hasFilters && (
              <Button
                secondary
                title={words("Clear filters", "清除筛选")}
                onPress={() => setFilters("flights", { ...initialFilters })}
              />
            )}
            <Txt muted style={{ fontSize: 12 }}>
              {items.length} {words("matching flights", "段符合筛选的旅程")}
            </Txt>
          </View>
        }
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
