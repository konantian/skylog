import { useState, useRef } from "react";
import { View, FlatList, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { FlightCard } from "../../screens/flights";
import { todayLocal } from "../../lib/database.mjs";
import { useApp } from "../../lib/store";
import {
  heroes,
  photos,
  aircraft,
  airlines,
  type Photo,
} from "../../lib/catalog";
import {
  Page,
  Txt,
  Section,
  Card,
  PhotoImage,
  Stat,
  Button,
  IconButton,
  styles,
} from "../../components/ui";
export default function Home() {
  const { words, t, completed, saved, flights } = useApp();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 40, 860);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Photo>>(null);
  const upcoming = [...flights]
    .filter((f) => f.status === "planned" && f.date >= todayLocal())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);
  const select = (i: number) => {
    setIndex(i);
    list.current?.scrollToIndex({ index: i, animated: true });
  };
  return (
    <Page>
      <View style={{ gap: 8 }}>
        <Txt accent style={styles.eyebrow}>
          {words("YUAN WANG · AVIATION ATLAS", "王源 · 航空图鉴")}
        </Txt>
        <Txt accessibilityRole="header" style={styles.title}>
          {words("Keep looking up.", "每一次抬头，\n都是新的发现。")}
        </Txt>
        <Txt muted>
          {words(
            "A personal collection of aircraft, light and journeys.",
            "收藏飞机、光线，和每一段旅途。",
          )}
        </Txt>
      </View>
      <View>
        <FlatList
          ref={list}
          data={heroes}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          getItemLayout={(_, i) => ({
            length: cardWidth,
            offset: cardWidth * i,
            index: i,
          })}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / cardWidth))
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.airlines.join(", ")} ${item.models.join(", ")}`}
              onPress={() =>
                router.push({
                  pathname: "/photo/[id]",
                  params: { id: item.id },
                })
              }
              style={{ width: cardWidth }}
            >
              <PhotoImage photo={item} height={cardWidth * 0.64} />
              <View style={{ padding: 16, gap: 4 }}>
                <Txt accent style={styles.eyebrow}>
                  FROM MY VIEWFINDER
                </Txt>
                <Txt
                  style={{ fontSize: 24, lineHeight: 30, fontWeight: "700" }}
                >
                  {item.models.join(" / ")}
                </Txt>
                <Txt muted>
                  {item.airlines.join(" / ")} · {item.airport}
                </Txt>
              </View>
            </Pressable>
          )}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Txt muted>{String(index + 1).padStart(2, "0")} / 10</Txt>
          <View style={styles.row}>
            <IconButton
              name="chevron-back"
              label={words("Previous featured photo", "上一张精选")}
              onPress={() => select((index + 9) % 10)}
            />
            <IconButton
              name="chevron-forward"
              label={words("Next featured photo", "下一张精选")}
              onPress={() => select((index + 1) % 10)}
            />
          </View>
        </View>
      </View>
      <Card>
        <View style={styles.wrap}>
          <Stat
            value={`${aircraft.filter((a) => a.unlocked).length}/${aircraft.length}`}
            label={t("已解锁机型")}
          />
          <Stat
            value={`${airlines.filter((a) => a.unlocked).length}/${airlines.length}`}
            label={t("已解锁航司")}
          />
          <Stat value={photos.length} label={t("拍摄照片")} />
          <Stat value={completed.length} label={t("乘坐航段")} />
        </View>
      </Card>
      <Button
        secondary
        title={words("My flight passport", "我的飞行护照")}
        icon="globe-outline"
        onPress={() => router.push("/passport")}
      />
      <Section
        title={words("Your next departure", "下一段旅程")}
        caption="BOARDING SOON"
      />
      {upcoming.map((f) => (
        <FlightCard key={f.id} flight={f} />
      ))}
      <Button
        title={words("Add a flight", "添加乘机记录")}
        icon="add"
        onPress={() => router.push("/flight/edit")}
      />
      <Button
        title={`${words("Saved photographs", "收藏的照片")} · ${saved.length}`}
        icon="bookmark-outline"
        secondary
        onPress={() => router.push("/saved")}
      />
      <Txt muted style={{ fontSize: 12, lineHeight: 19 }}>
        {words(
          "Photography © Yuan Wang. Your flights, notes and saved photos stay on this device.",
          "摄影 © 王源。乘机记录、备注和照片收藏保存在这台设备上。",
        )}
      </Txt>
    </Page>
  );
}
