import { View, Linking } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { aircraftDrawing } from "../../../../../lib/aircraft-drawings.mjs";
import drawings from "../../generated/drawings.json";
import { useApp } from "../../lib/store";
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
  const { t, words, completed, setFilters } = useApp();
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
  const xml = (drawings as Record<string, string>)[entry.name];
  const family = (
    aircraftProfiles.families as Record<
      string,
      { description: string; identification?: string[]; source?: string }
    >
  )[entry.family || ""];
  return (
    <Page>
      <Stack.Screen options={{ title: entry.shortName || entry.name }} />
      <Section
        title={entry.name}
        caption={`${entry.manufacturer} · ${entry.family}`}
      />
      <Txt muted>{t(entry.category)}</Txt>
      {xml && drawing?.status === "reference" ? (
        <Card>
          <SvgXml xml={xml} width="100%" height={190} />
          <View style={styles.wrap}>
            <Stat value={`${drawing.length} m`} label={t("机长")} />
            <Stat value={`${drawing.span} m`} label={t("翼展")} />
            <Stat value={`${drawing.height} m`} label={t("机高")} />
          </View>
          <Txt muted style={{ fontSize: 12 }}>
            {t(drawing.note)}
          </Txt>
          <Button
            secondary
            title={t("图纸与尺寸来源")}
            icon="open-outline"
            onPress={() => void Linking.openURL(drawing.source.url)}
          />
        </Card>
      ) : (
        <Card>
          <Silhouette entry={entry} />
          <Txt muted>{t("此型号的官方技术图尚待核验，预览保留比例示意。")}</Txt>
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
      {groups.length ? (
        groups.map((group) => <EntryCard key={group.id} entry={group} />)
      ) : (
        <Txt muted>
          {words("A future encounter belongs here.", "下一次相遇，留给它。")}
        </Txt>
      )}
      <Button
        secondary
        title={words("Browse all photographs", "查看全部照片")}
        onPress={() => {
          setFilters("photos", { ...initialFilters, model: entry.name });
          router.push("/(tabs)/photos");
        }}
      />
    </Page>
  );
}
