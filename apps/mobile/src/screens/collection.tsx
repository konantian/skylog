import { photoHighlights } from "../../../../lib/photo-highlights.mjs";
import { useMemo, useDeferredValue } from "react";
import {
  View,
  TextInput,
  Keyboard,
  Platform,
  FlatList,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { openPhoto, usePhotoListReturn } from "../lib/photo-navigation";
import { CountryFlags } from "../components/country-flags";
import {
  airlineName,
  aircraftName,
  aircraftSearchQuery,
} from "../lib/flight-labels";
import { router } from "expo-router";
import { useApp } from "../lib/store";
import {
  aircraft,
  airlines,
  photos,
  photoById,
  filterCatalog,
  filterPhotos,
  groupModelVariants,
  initialFilters,
  type Mode,
  type Entry,
  type Photo,
} from "../lib/catalog";
import {
  Txt,
  Button,
  Icon,
  IconButton,
  Card,
  PhotoImage,
  Silhouette,
  Empty,
  styles,
} from "../components/ui";
export function EntryCard({ entry }: { entry: Entry }) {
  const { t, words, colors, locale } = useApp();
  const name =
    entry.kind === "airline" || entry.kind === "variant"
      ? airlineName(entry.name, locale)
      : aircraftName(entry.name, locale);
  const photo = photoById.get(entry.cover || "");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${entry.unlocked ? t("已解锁") : t("待解锁")}`}
      onPress={() =>
        entry.kind === "variant"
          ? openPhoto(entry.cover!, entry.photoIds)
          : router.push({
              pathname:
                entry.kind === "airline" ? "/airline/[id]" : "/aircraft/[id]",
              params: { id: entry.id },
            })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <Card style={{ padding: 10, gap: 12 }}>
        {photo ? (
          <PhotoImage photo={photo} size="thumb" height={190} />
        ) : entry.kind === "airline" ? (
          <View
            style={{
              minHeight: 190,
              padding: 20,
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              backgroundColor: colors.raised,
              borderRadius: 14,
            }}
          >
            <CountryFlags country={entry.country} size={64} />
            <Txt
              style={{
                fontSize: 22,
                lineHeight: 30,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {name}
            </Txt>
            <Txt muted>{entry.code || "—"}</Txt>
          </View>
        ) : (
          <Silhouette entry={entry} height={190} />
        )}
        <View style={{ paddingHorizontal: 6, paddingBottom: 8, gap: 5 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {entry.kind === "airline" && entry.unlocked && (
              <CountryFlags country={entry.country} />
            )}
            <Txt accent style={[styles.eyebrow, { flexShrink: 1 }]}>
              {entry.kind === "airline"
                ? t(entry.country)
                : entry.kind === "variant"
                  ? aircraftName(entry.displayModel || "", locale)
                  : aircraftName(entry.manufacturer || "", locale)}
            </Txt>
          </View>
          {(entry.kind !== "airline" || entry.unlocked) && (
            <Txt style={{ fontSize: 23, lineHeight: 29, fontWeight: "700" }}>
              {name}
            </Txt>
          )}
          {entry.kind === "variant" && <Txt muted>{t(entry.livery)}</Txt>}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Txt muted>
              {entry.unlocked
                ? `${entry.photoIds.length} ${words("photos", "张照片")}`
                : t("待解锁")}
            </Txt>
            <Txt muted>{entry.airports.join(" · ")}</Txt>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
export function PhotoCard({
  photo,
  onOpen,
  time,
}: {
  photo: Photo;
  onOpen: () => void;
  time?: string;
}) {
  const { saved, words, locale } = useApp();
  const names = photo.airlines.map((name) => airlineName(name, locale));
  const models = photo.models.map((name) => aircraftName(name, locale));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${names.join(", ")} ${models.join(", ")} ${photo.id}`}
      onPress={onOpen}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <Card style={{ padding: 10 }}>
        <PhotoImage photo={photo} size="thumb" height={190} />
        <View style={{ paddingHorizontal: 6, gap: 3, paddingBottom: 6 }}>
          <Txt style={{ fontSize: 18, fontWeight: "600" }}>
            {names.join(" / ") || words("Private aircraft", "公务机")}
          </Txt>
          <Txt muted>{models.join(" / ")}</Txt>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Txt muted style={{ fontSize: 12 }}>
              {photo.airport} · {photo.date}
              {time ? ` · ${time}` : ""}
            </Txt>
            {saved.includes(photo.id) && <Icon name="bookmark" size={16} />}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
export function CollectionScreen({
  mode,
  onlySaved = false,
}: {
  mode: Exclude<Mode, "flights">;
  onlySaved?: boolean;
}) {
  const app = useApp();
  const { colors, t, words, filters, setFilters, saved } = app;
  const f = filters[mode];
  const query = useDeferredValue(f.query);
  const { width, height } = useWindowDimensions();
  const columns = Math.min(width, height) >= 700 ? 2 : 1;
  const items = useMemo(() => {
    const next = { ...f, query: aircraftSearchQuery(query) };
    if (mode === "photos") {
      const matched = filterPhotos(
        onlySaved ? photos.filter((p) => saved.includes(p.id)) : photos,
        next,
        aircraft,
        airlines,
      ) as Photo[];
      return !onlySaved && !query.trim()
        ? (photoHighlights(matched, f.sort) as Photo[])
        : matched;
    }
    const result = filterCatalog(
      mode === "aircraft" ? aircraft : airlines,
      photos,
      next,
      mode,
      aircraft,
      airlines,
    ) as Entry[];
    if (mode === "aircraft" && f.model !== "all") {
      const model = result.find((e) => e.name === f.model);
      if (model?.unlocked)
        return groupModelVariants(
          model,
          filterPhotos(photos, next, aircraft, airlines),
          airlines,
        ) as Entry[];
    }
    return result;
  }, [f, query, mode, onlySaved, saved]);
  const { list, origin, onScrollToIndexFailed } = usePhotoListReturn<
    Entry | Photo
  >(items, columns);
  const active = Object.entries(f).filter(
    ([k, v]) =>
      k !== "query" &&
      k !== "status" &&
      v !== initialFilters[k as keyof typeof initialFilters],
  ).length;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList<Entry | Photo>
        ref={list}
        onScrollToIndexFailed={onScrollToIndexFailed}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 20, gap: 14 }}>
            <View
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 16,
                  paddingLeft: 14,
                },
              ]}
            >
              <Icon name="search-outline" size={20} />
              <TextInput
                accessibilityLabel={t("搜索机型、航司、航班、注册号或照片编号")}
                placeholder={words("Search your sky", "搜索你的天空")}
                placeholderTextColor={colors.muted}
                value={f.query}
                onChangeText={(value) =>
                  setFilters(mode, { ...f, query: value })
                }
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{
                  flex: 1,
                  minHeight: 50,
                  color: colors.text,
                  fontSize: 16,
                }}
              />
              {f.query.length > 0 && (
                <IconButton
                  name="close-circle-outline"
                  label={words("Clear search", "清空搜索")}
                  onPress={() => setFilters(mode, { ...f, query: "" })}
                />
              )}
              <IconButton
                name="options-outline"
                label={words("Filters", "筛选")}
                active={active > 0}
                onPress={() =>
                  router.push({ pathname: "/filters", params: { mode } })
                }
              />
            </View>
            {mode === "photos" && !onlySaved && (
              <Button
                secondary
                icon="calendar-outline"
                title={words("Browse by shooting day", "按拍摄日回看")}
                onPress={() => router.push("/shoots")}
              />
            )}
            {mode !== "photos" && (
              <View style={styles.row}>
                {[
                  ["all", "全部"],
                  ["unlocked", "已解锁"],
                  ["locked", "待解锁"],
                ].map(([value, label]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: f.status === value }}
                    onPress={() => setFilters(mode, { ...f, status: value })}
                    style={({ pressed }) => ({
                      minHeight: 44,
                      padding: 12,
                      paddingHorizontal: 18,
                      borderRadius: 24,
                      backgroundColor:
                        f.status === value ? colors.raised : "transparent",
                      opacity: pressed ? 0.65 : 1,
                    })}
                  >
                    <Txt accent={f.status === value} muted={f.status !== value}>
                      {t(label)}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Txt muted style={{ fontSize: 12 }}>
                {items.length}{" "}
                {mode === "photos" && !onlySaved && !query.trim()
                  ? words("highlights", "张精选照片")
                  : mode === "photos"
                    ? words("photographs", "张照片")
                    : words("entries", "个条目")}
                {active > 0 ? ` · ${active} ${words("filters", "项筛选")}` : ""}
              </Txt>
              {(active > 0 || f.query || f.status !== "all") && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFilters(mode, { ...initialFilters })}
                  hitSlop={10}
                >
                  <Txt accent>{words("Reset", "重置")}</Txt>
                </Pressable>
              )}
            </View>
          </View>
        }
        key={`${mode}:${columns}`}
        data={items as (Entry | Photo)[]}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        initialNumToRender={6}
        windowSize={7}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          gap: 16,
        }}
        columnWrapperStyle={columns > 1 ? { gap: 16 } : undefined}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: columns > 1 ? "50%" : undefined }}>
            {mode === "photos" ? (
              <PhotoCard
                photo={item as Photo}
                onOpen={() =>
                  openPhoto(
                    item.id,
                    items.map((p) => p.id),
                    origin,
                  )
                }
              />
            ) : (
              <EntryCard entry={item as Entry} />
            )}
          </View>
        )}
        ListEmptyComponent={
          <Empty
            title={words("No matches yet", "还没有匹配的记录")}
            body={words(
              "Try another search or reset your filters.",
              "换一个关键词或重置筛选试试。",
            )}
          />
        }
      />
    </View>
  );
}
