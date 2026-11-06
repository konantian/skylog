import { router, Stack } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { Empty, Icon, PhotoImage, Txt } from "../../components/ui";
import { shootingDate, useShootingDays } from "../../lib/shooting-days";
import { useApp } from "../../lib/store";

export default function ShootingDays() {
  const days = useShootingDays();
  const { colors, locale, words } = useApp();
  return (
    <>
      <Stack.Screen options={{ title: words("Shooting days", "拍摄日") }} />
      <FlatList
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 18, gap: 12 }}
        data={days}
        keyExtractor={(day) => day.date}
        ListEmptyComponent={
          <Empty
            title={words("No matching days", "没有匹配的拍摄日")}
            body={words(
              "Try another photo search or filter.",
              "可以返回照片页调整关键词或筛选条件。",
            )}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/shoots/[day]",
                params: { day: item.date },
              })
            }
            style={({ pressed }) => ({
              padding: 10,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.card,
              opacity: pressed ? 0.7 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            <View style={{ width: 98 }}>
              <PhotoImage
                key={item.cover.id}
                photo={item.cover}
                height={72}
                size="thumb"
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Txt style={{ fontWeight: "700" }}>
                {shootingDate(item.date, locale)}
              </Txt>
              <Txt muted>
                {item.airports.join(" · ")} · {item.photos.length}{" "}
                {words("photos", "张照片")}
              </Txt>
            </View>
            <Icon name="chevron-forward" size={18} />
          </Pressable>
        )}
      />
    </>
  );
}
