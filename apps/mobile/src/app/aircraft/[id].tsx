import { View } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { aircraftDrawing } from "../../../../../lib/aircraft-drawings.mjs";
import drawings from "../../generated/drawings";
import { useApp } from "../../lib/store";
import { aircraftName } from "../../lib/flight-labels";
import {
  aircraft,
  photos,
  airlines,
  groupModelVariants,
  aircraftProfiles,
  initialFilters,
} from "../../lib/catalog";
import {
  Page,
  DetailList,
  Txt,
  Card,
  Section,
  Silhouette,
  Stat,
  Button,
  styles,
} from "../../components/ui";
import { EntryCard } from "../../screens/collection";
export default function AircraftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, words, locale, completed, setFilters } = useApp();
  const entry = aircraft.find((a) => a.id === id);
  if (!entry)
    return (
      <Page>
        <Txt>{words("Aircraft not found", "未找到机型")}</Txt>
      </Page>
    );
  const modelPhotos = photos.filter((p) => entry.photoIds.includes(p.id));
  const groups = groupModelVariants(entry, modelPhotos, airlines);
  const drawing = aircraftDrawing(entry.name);
  const diagram = drawings[entry.name];
  const family = (
    aircraftProfiles.families as Record<
      string,
      { description: string; identification?: string[]; source?: string }
    >
  )[entry.family || ""];
  return (
    <DetailList
      data={groups}
      keyExtractor={(group) => group.id}
      renderItem={({ item }) => <EntryCard entry={item} />}
      ListEmptyComponent={
        <Txt muted>{words("A future encounter belongs here.", "下一次相遇，留给它。")}</Txt>
      }
      ListFooterComponent={
        <Button
          secondary
          title={words("Browse all photographs", "查看全部照片")}
          onPress={() => {
            setFilters("photos", { ...initialFilters, model: entry.name });
            router.push("/(tabs)/photos");
          }}
        />
      }
    >
      <Stack.Screen
        options={{ title: entry.shortName || aircraftName(entry.name, locale) }}
      />
      <Section
        title={aircraftName(entry.name, locale)}
        caption={`${aircraftName(entry.manufacturer || "", locale)} · ${entry.family}`}
      />
      <Txt muted>{t(entry.category)}</Txt>
      {diagram && drawing?.status === "reference" ? (
        <Card>
          <Image
            source={diagram}
            contentFit="contain"
            style={{ width: "100%", height: 190 }}
            accessible
            accessibilityLabel={aircraftName(entry.name, locale)}
          />
          <View style={styles.wrap}>
            <Stat value={`${drawing.length} m`} label={t("机长")} />
            <Stat value={`${drawing.span} m`} label={t("翼展")} />
            <Stat value={`${drawing.height} m`} label={t("机高")} />
          </View>
        </Card>
      ) : (
        <Card>
          <Silhouette entry={entry} />
          <Txt muted>
            {words("Aircraft profile illustration", "机型比例示意图")}
          </Txt>
        </Card>
      )}
      {family?.description && <Txt>{t(family.description)}</Txt>}
      <Card>
        <View style={styles.wrap}>
          <Stat value={entry.photoIds.length} label={t("拍摄照片")} />
          <Stat
            value={completed.filter((f) => f.model === entry.name).length}
            label={t("乘坐航段")}
          />
        </View>
        <Txt muted>
          {entry.firstSeen
            ? `${t("第一次拍到")} · ${entry.firstSeen}`
            : t("待解锁")}
        </Txt>
      </Card>
      <Section title={words("Airlines & liveries", "航司与涂装")} />
    </DetailList>
  );
}
