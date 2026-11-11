import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Stack } from "expo-router";
import { collectionAchievements } from "../../../../lib/play.mjs";
import { aircraft, airlines, photos, photoById } from "../lib/catalog";
import { useApp } from "../lib/store";
import { openPhoto } from "../lib/photo-navigation";
import { Button, Card, Icon, Page, PhotoImage, Txt, styles } from "../components/ui";

type Award = ReturnType<typeof collectionAchievements>[number];
const matches = (award: Award, status: string) => status === "all" ||
  (status === "progress" ? award.unlocked && award.nextTarget !== null : award.unlocked === (status === "unlocked"));

export default function Achievements() {
  const { colors, completed, locale, t } = useApp();
  const awards = useMemo(() => collectionAchievements(aircraft, airlines, photos, completed, locale), [completed, locale]);
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>("century");
  const visible = awards.filter(award => matches(award, status));
  return <>
    <Stack.Screen options={{ title: t("航空收藏成就") }} />
    <Page>
      <View style={{ gap: 8 }}>
        <Txt accent style={styles.eyebrow}>COLLECTION ACHIEVEMENTS</Txt>
        <Txt accessibilityRole="header" style={styles.section}>
          {t("{0} / {1} 枚成就已解锁", [awards.filter(a => a.unlocked).length, awards.length])}
        </Txt>
        <Txt muted>{t("每一枚，都有你自己的照片作证。")}</Txt>
        <Txt muted>{t("已解锁成就会保留，继续积累可达成进阶目标。")}</Txt>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityLabel={t("成就状态筛选")}>
        {[["all", t("全部")], ["unlocked", t("已解锁")], ["progress", t("可进阶")], ["locked", t("待解锁")]].map(([value, label]) =>
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: status === value }}
            onPress={() => setStatus(value)}
            style={({ pressed }) => ({ minHeight: 48, justifyContent: "center", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: status === value ? colors.accent : colors.line, backgroundColor: colors.raised, opacity: pressed ? 0.7 : 1 })}>
            <Txt accent={status === value}>{label} · {awards.filter(a => matches(a, value)).length}</Txt>
          </Pressable>)}
      </View>
      {visible.map(award => {
        const expanded = selected === award.key;
        const next = award.nextLabel ? t("下一目标：{0}", [award.nextLabel]) : t("全部阶段已达成");
        return <Card key={award.key}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
            accessibilityLabel={`${t(award.title)} · ${award.currentLabel} · ${award.unlocked ? t("已解锁") : t("待解锁")} · ${next}`}
            onPress={() => setSelected(expanded ? null : award.key)}
            style={({ pressed }) => ({ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.7 : 1 })}>
            <Icon name={award.unlocked ? "ribbon-outline" : "lock-closed-outline"} size={28} />
            <View style={{ flex: 1, gap: 4 }}>
              <Txt style={{ fontWeight: "700", fontSize: 18, lineHeight: 26 }}>{t(award.title)}</Txt>
              <Txt muted>{award.unlocked ? t("已解锁") : t("待解锁")}</Txt>
              <Txt>{t("累计：{0}", [award.currentLabel])}</Txt>
            </View>
            <Icon name={expanded ? "chevron-up" : "chevron-down"} size={20} />
          </Pressable>
          <View accessibilityRole="progressbar" accessibilityLabel={t(award.title)}
            accessibilityValue={{ min: 0, max: award.progressTarget, now: Math.min(award.current, award.progressTarget), text: `${award.currentLabel} · ${next}` }}
            style={{ height: 5, borderRadius: 3, backgroundColor: colors.line, overflow: "hidden" }}>
            <View style={{ height: "100%", backgroundColor: colors.accent, width: `${Math.min(100, award.current / award.progressTarget * 100)}%` }} />
          </View>
          <Txt accent>{next}</Txt>
          {expanded && <>
            <Txt muted>{t(award.description)}</Txt>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {award.stages.map((stage: { target: number; label: string; unlocked: boolean }) => <View key={stage.target}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: stage.unlocked ? colors.accent : colors.line }}>
                <Icon name={stage.unlocked ? "checkmark-circle-outline" : "lock-closed-outline"} size={18} />
                <View><Txt accent={stage.unlocked}>{stage.label}</Txt><Txt muted>{stage.unlocked ? t("已达成") : t("待达成")}</Txt></View>
              </View>)}
            </View>
            {award.missing.length > 0 && <Txt muted>{t("还差：")}{award.missing.map((s: string) => t(s)).join(locale === "zh" ? "、" : ", ")}</Txt>}
            {award.photoIds.length > 0 ? <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {award.photoIds.slice(0, 4).map((id: string) => {
                  const photo = photoById.get(id)!;
                  return <Pressable key={id} accessibilityRole="button"
                    accessibilityLabel={t("查看成就照片 {0}，{1}", [id, photo.models.map(m => t(m)).join(" / ")])}
                    onPress={() => openPhoto(id, award.photoIds)} style={({ pressed }) => ({ width: "48%", opacity: pressed ? 0.7 : 1 })}>
                    <PhotoImage photo={photo} size="thumb" height={110} />
                  </Pressable>;
                })}
              </View>
              <Button secondary title={t("查看关联照片（{0} 张）", [award.photoIds.length])} icon="images-outline" onPress={() => openPhoto(award.photoIds[0], award.photoIds)} />
            </> : <Txt muted>{t("还没有符合条件的照片，留给下一次相遇。")}</Txt>}
          </>}
        </Card>;
      })}
      {visible.length === 0 && <Txt muted>{t("当前筛选下没有成就。")}</Txt>}
      <Txt muted>{t("成就根据当前图鉴自动计算；涉及同一架飞机的成就只采用已确认注册号。补拍目标不代表当前 YYZ／YVR 有定期航班。")}</Txt>
      <Txt muted>{t("拍过，也坐过：按本机已完成的乘机记录计算。")}</Txt>
    </Page>
  </>;
}
