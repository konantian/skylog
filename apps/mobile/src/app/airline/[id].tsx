import { View } from "react-native";
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
import { openPhoto } from "../../lib/photo-navigation";
import { PhotoCard } from "../../screens/collection";
import { CountryFlags } from "../../components/country-flags";
import { airlineName, aircraftName } from "../../lib/flight-labels";
export default function AirlineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, words, locale, completed, setFilters } = useApp();
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
      <Stack.Screen options={{ title: airlineName(entry.name, locale) }} />
      {collection.cover && <PhotoImage photo={collection.cover} height={230} />}
      <Section
        title={airlineName(entry.name, locale)}
        caption={entry.code || "—"}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CountryFlags country={entry.country} size={32} />
        <Txt muted style={{ flexShrink: 1 }}>
          {t(entry.country)}
        </Txt>
      </View>
      <Card>
        <View style={styles.wrap}>
          <Stat value={collection.photoCount} label={t("拍摄照片")} />
          <Stat value={collection.modelCount} label={t("拍过机型")} />
          <Stat
            value={collection.registrationCount}
            label={words("Airframes", "飞机注册号")}
          />
          <Stat value={collection.flights.length} label={t("乘坐航段")} />
        </View>
      </Card>
      <Card>
        <Txt accent>{t(facts.alliance)}</Txt>
        <Txt>
          {entry.code || "—"} ·{" "}
          {facts.designators.map((d) => d.icao).join(" / ") || "—"}
        </Txt>
        <Txt muted>
          {facts.designators.map((d) => d.callsign).join(" / ") || "—"}
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
              onPress={() => openPhoto(match.photoIds[0], match.photoIds)}
            />
          ))}
        </Card>
      )}
      <Section title={t("我的机型与涂装收藏")} />
      {collection.groups.map((group) => (
        <View key={`${group.model}:${group.livery}`} style={{ gap: 8 }}>
          <Txt style={{ fontWeight: "600" }}>
            {aircraftName(group.model, locale)} · {t(group.livery)}
          </Txt>
          <PhotoCard
            photo={group.cover}
            onOpen={() => openPhoto(group.cover.id, group.photoIds)}
          />
          <Button
            secondary
            title={t("查看 {0} · {1}，{2} 张照片", [
              aircraftName(group.model, locale),
              t(group.livery),
              group.photoIds.length,
            ])}
            onPress={() => openPhoto(group.cover.id, group.photoIds)}
          />
        </View>
      ))}
    </Page>
  );
}
