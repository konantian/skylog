import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { Empty, PhotoImage, Section, Txt, Button } from "../../components/ui";
import { PhotoCard } from "../../screens/collection";
import { shootingDate, useShootingDays } from "../../lib/shooting-days";
import { openPhoto, usePhotoListReturn } from "../../lib/photo-navigation";
import { airlineName, aircraftName } from "../../lib/flight-labels";
import { useApp } from "../../lib/store";

export default function ShootingDay() {
  const { day: date } = useLocalSearchParams<{ day: string }>();
  const { colors, locale, words } = useApp();
  const day = useShootingDays().find((d) => d.date === date);
  const [expanded, setExpanded] = useState(false);
  const { list, origin, onScrollToIndexFailed } = usePhotoListReturn(
    day?.photos || [],
  );
  if (!day)
    return (
      <Empty
        title={words("No photos for this day", "这一天没有符合条件的照片")}
        body={words(
          "Return to the shooting days list.",
          "可以返回拍摄日列表查看其他日期。",
        )}
      />
    );
  const browse = (id: string) =>
    openPhoto(
      id,
      day.photos.map((p) => p.id),
      origin,
    );
  return (
    <>
      <Stack.Screen options={{ title: shootingDate(day.date, locale) }} />
      <FlatList
        ref={list}
        onScrollToIndexFailed={onScrollToIndexFailed}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        data={day.photos}
        keyExtractor={(p) => p.id}
        initialNumToRender={4}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <Section
              caption={day.airports.join(" · ")}
              title={words("Photo of the day", "当日代表作")}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                words("Open featured photo", "查看当日代表作") +
                " " +
                day.cover.id
              }
              onPress={() => browse(day.cover.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <PhotoImage key={day.cover.id} photo={day.cover} height={210} />
            </Pressable>
            {(day.newAirlines.length > 0 || day.newModels.length > 0) && (
              <>
                <Button
                  secondary
                  icon={expanded ? "chevron-up" : "chevron-down"}
                  title={words(
                    `First sightings · ${day.newAirlines.length} airlines · ${day.newModels.length} models`,
                    `首次拍到 · ${day.newAirlines.length} 家航司 · ${day.newModels.length} 款机型`,
                  )}
                  onPress={() => setExpanded((value) => !value)}
                />
                {expanded && (
                  <View style={{ gap: 8 }}>
                    {day.newAirlines.length > 0 && (
                      <Txt>
                        {words("Airlines", "航司")} ·{" "}
                        {day.newAirlines
                          .map((n) => airlineName(n, locale))
                          .join(locale === "zh" ? "、" : ", ")}
                      </Txt>
                    )}
                    {day.newModels.length > 0 && (
                      <Txt>
                        {words("Aircraft", "机型")} ·{" "}
                        {day.newModels
                          .map((n) => aircraftName(n, locale))
                          .join(locale === "zh" ? "、" : ", ")}
                      </Txt>
                    )}
                  </View>
                )}
              </>
            )}
            <Section
              title={words("Capture timeline", "拍摄时间线")}
              caption={`${day.photos.length} ${words("photos · local time", "张照片 · 拍摄地时间")}`}
            />
          </View>
        }
        renderItem={({ item }) => (
          <PhotoCard
            photo={item}
            time={item.capturedAt?.match(/T(\d{2}:\d{2})/)?.[1]}
            onOpen={() => browse(item.id)}
          />
        )}
      />
    </>
  );
}
