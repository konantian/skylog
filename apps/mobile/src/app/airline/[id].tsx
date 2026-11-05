import { View, Linking } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useApp } from "../../lib/store";
import {
  airlines,
  photos,
  covers,
  airlineCollection,
  airlineProfiles,
  initialFilters,
} from "../../lib/catalog";
import {
  Page,
  Txt,
  Card,
  Section,
  PhotoImage,
  Stat,
  Button,
  styles,
} from "../../components/ui";
import { PhotoCard } from "../../screens/collection";
export default function AirlineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, words, completed, setFilters } = useApp();
  const entry = airlines.find((a) => a.id === id);
  if (!entry)
    return (
      <Page>
        <Txt>{words("Airline not found", "未找到航司")}</Txt>
      </Page>
    );
  const facts = (
    airlineProfiles.airlines as Record<
      string,
      {
        alliance: string;
        designators: { icao: string; callsign: string }[];
        sources: string[];
        note?: string;
      }
    >
  )[entry.name];
  const collection = airlineCollection(
    entry,
    photos,
    completed,
    covers.preferredPhotos,
  );
  return (
    <Page>
      <Stack.Screen options={{ title: entry.name }} />
      {collection.cover && <PhotoImage photo={collection.cover} height={230} />}
      <Section
        title={entry.name}
        caption={`${entry.code || "—"} · ${t(entry.country)}`}
      />
      <Card>
        <View style={styles.wrap}>
          <Stat value={collection.photoCount} label={t("拍摄照片")} />
          <Stat value={collection.modelCount} label={t("拍过机型")} />
          <Stat value={collection.registrationCount} label={t("已确认飞机")} />
          <Stat value={collection.flights.length} label={t("乘坐航段")} />
        </View>
      </Card>
      <Card>
        <Txt accent>{t(facts.alliance)}</Txt>
        <Txt>
          {entry.code || "—"} ·{" "}
          {facts.designators.map((d) => d.icao).join(" / ") || t("尚未核实")}
        </Txt>
        <Txt muted>
          {facts.designators.map((d) => d.callsign).join(" / ") ||
            t("尚未核实")}
        </Txt>
        {facts.note && <Txt muted>{t(facts.note)}</Txt>}
        {collection.firstSeen && (
          <Txt muted>
            {t("第一次拍到")} · {collection.firstSeen} ·{" "}
            {collection.firstAirports.join(" / ")}
          </Txt>
        )}
      </Card>
      <Section title={t("我的乘机记录")} />
      <Button
        secondary
        title={`${collection.flights.length} ${words("flights · view history", "段 · 查看记录")}`}
        icon="ticket-outline"
        onPress={() => {
          setFilters("flights", { ...initialFilters, airline: entry.name });
          router.push("/(tabs)/flights");
        }}
      />
      {collection.both.length > 0 && (
        <Card>
          <Txt accent>
            {t("{0} 架飞机，坐过也拍过", [collection.both.length])}
          </Txt>
          {collection.both.map((match) => (
            <Button
              key={match.registration}
              secondary
              title={match.registration}
              icon="camera-outline"
              onPress={() =>
                router.push({
                  pathname: "/photo/[id]",
                  params: { id: match.photoIds[0], airline: entry.name },
                })
              }
            />
          ))}
        </Card>
      )}
      <Section title={t("我的机型与涂装收藏")} />
      {collection.groups.map((group) => (
        <View key={`${group.model}:${group.livery}`} style={{ gap: 8 }}>
          <Txt style={{ fontWeight: "600" }}>
            {group.model} · {t(group.livery)}
          </Txt>
          <PhotoCard photo={group.cover} />
          <Button
            secondary
            title={t("查看 {0} · {1}，{2} 张照片", [
              group.model,
              t(group.livery),
              group.photoIds.length,
            ])}
            onPress={() =>
              router.push({
                pathname: "/photo/[id]",
                params: {
                  id: group.cover.id,
                  airline: entry.name,
                  model: group.model,
                  livery: group.livery,
                },
              })
            }
          />
        </View>
      ))}
      <Txt muted>
        {t("资料来源")} · {airlineProfiles.checkedAt}
      </Txt>
      {facts.sources.map((key) => {
        const source = (
          airlineProfiles.sources as Record<
            string,
            { url: string; title: string }
          >
        )[key];
        return (
          <Button
            key={key}
            secondary
            title={source.title}
            icon="open-outline"
            onPress={() => void Linking.openURL(source.url)}
          />
        );
      })}
    </Page>
  );
}
