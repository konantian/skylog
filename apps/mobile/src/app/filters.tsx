import { useState } from "react";
import { View, TextInput, FlatList, Pressable, Keyboard } from "react-native";
import { KeyboardControls } from "../components/keyboard-controls";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useApp } from "../lib/store";
import {
  airlineName,
  aircraftName,
  aircraftSearchQuery,
} from "../lib/flight-labels";
import {
  aircraft,
  airlines,
  photos,
  initialFilters,
  type Filters,
  type Mode,
} from "../lib/catalog";
import { Page, Txt, Button, Icon, styles } from "../components/ui";
export default function FiltersScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = (
    ["aircraft", "airlines", "photos", "flights"].includes(params.mode)
      ? params.mode
      : "photos"
  ) as Mode;
  const { colors, t, words, locale, filters, setFilters, flights } = useApp();
  const [draft, setDraft] = useState<Filters>({ ...filters[mode] });
  const [field, setField] = useState<keyof Filters | null>(null);
  const [query, setQuery] = useState("");
  const uniq = (values: (string | undefined)[]) =>
    [...new Set(values.filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b),
    );
  const options: Partial<Record<keyof Filters, string[]>> = {
    manufacturer: uniq(aircraft.map((a) => a.manufacturer)),
    country: uniq(airlines.map((a) => a.country)),
    airline: uniq([
      ...airlines.map((a) => a.name),
      ...flights.map((f) => f.airline),
    ]),
    model: uniq([
      ...aircraft.map((a) => a.name),
      ...flights.map((f) => f.model || undefined),
    ]),
    airport: uniq(photos.map((p) => p.airport)),
    livery: uniq(photos.map((p) => p.livery)),
    flightYear: uniq(flights.map((f) => f.date.slice(0, 4))),
    sort:
      mode === "flights"
        ? ["latest", "name"]
        : ["curated", "latest", "name", "count"],
  };
  const labels: Partial<Record<keyof Filters, string>> = {
    manufacturer: "生产商",
    country: "航司国家／地区",
    airline: "航司",
    model: "机型",
    airport: "拍摄机场",
    livery: "涂装",
    flightYear: "年份",
    sort: "排序",
  };
  const keys = (
    mode === "flights"
      ? ["airline", "model", "flightYear", "sort"]
      : [
          "manufacturer",
          "country",
          "airline",
          "model",
          "airport",
          "livery",
          "sort",
        ]
  ) as (keyof Filters)[];
  const label = (value: string, key = field) =>
    value === "all"
      ? words("All", "全部")
      : value === "curated"
        ? mode === "flights"
          ? words("Next departures, then history", "近期出发优先")
          : words("Curated", "精选顺序")
        : value === "latest"
          ? mode === "flights"
            ? words("Flight date", "航班日期")
            : t("最近拍摄")
          : value === "name"
            ? t("名称排序")
            : value === "count"
              ? t("照片最多")
              : key === "airline"
                ? airlineName(value, locale)
                : key === "model" || key === "manufacturer"
                  ? aircraftName(value, locale)
                  : t(value);
  return (
    <>
      <Stack.Screen
        options={{
          title: field ? t(labels[field]) : words("Filters", "筛选"),
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          tintColor={colors.accent}
          onPress={() => (field ? setField(null) : router.back())}
        >
          {field ? words("Back", "返回") : words("Cancel", "取消")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      {field ? (
        <View
          style={{ flex: 1, backgroundColor: colors.bg, padding: 20, gap: 16 }}
        >
          <TextInput
            accessibilityLabel={words("Search options", "搜索选项")}
            value={query}
            onChangeText={setQuery}
            placeholder={words("Search", "搜索")}
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.line },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          <FlatList
            data={[
              ...(field === "sort" ? [] : ["all"]),
              ...(options[field] || []),
            ].filter((v) =>
              field === "model" || field === "manufacturer"
                ? aircraftSearchQuery(v).includes(aircraftSearchQuery(query))
                : [v, label(v)].some((value) =>
                    value.toLowerCase().includes(query.toLowerCase()),
                  ),
            )}
            keyExtractor={(v) => v}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: draft[field] === item }}
                onPress={() => {
                  Keyboard.dismiss();
                  setDraft({ ...draft, [field]: item });
                  setField(null);
                }}
                style={({ pressed }) => ({
                  minHeight: 52,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Txt style={{ flex: 1 }}>{label(item)}</Txt>
                {draft[field] === item && <Icon name="checkmark" />}
              </Pressable>
            )}
          />
          <KeyboardControls />
        </View>
      ) : (
        <Page>
          {keys.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => {
                setField(key);
                setQuery("");
              }}
              style={({ pressed }) => ({
                padding: 16,
                borderRadius: 14,
                backgroundColor: colors.card,
                gap: 6,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Txt muted style={{ fontSize: 12 }}>
                {t(labels[key])}
              </Txt>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <Txt style={{ flex: 1 }}>{label(draft[key], key)}</Txt>
                <Icon name="chevron-forward" size={18} />
              </View>
            </Pressable>
          ))}
          <Button
            title={words("Show results", "查看结果")}
            onPress={() => {
              setFilters(mode, draft);
              router.back();
            }}
          />
          <Button
            secondary
            title={words("Reset filters", "重置筛选")}
            onPress={() => setDraft({ ...initialFilters })}
          />
        </Page>
      )}
    </>
  );
}
