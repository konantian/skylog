import { useState } from "react";
import { Alert, View, Linking } from "react-native";
import { Stack, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { exportBackup, mergeBackup, validateBackup } from "../lib/database.mjs";
import { flightsCsv, importFlightCsv } from "../lib/flight-import.mjs";
import {
  airlines,
  airlineProfiles,
  aircraft,
  website,
  airportTimezones,
} from "../lib/catalog";
import { useApp } from "../lib/store";
import { Page, Txt, Section, Card, Button, styles } from "../components/ui";
export default function Settings() {
  const app = useApp();
  const { words, locale, theme, prefs, flights, colors } = app;
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);
  const exportData = async (format: "json" | "csv") => {
    setBusy(true);
    try {
      const file = new File(
        Paths.cache,
        `skylog-backup-${new Date().toISOString().slice(0, 10)}.${format}`,
      );
      file.write(
        format === "json"
          ? JSON.stringify(await exportBackup(db), null, 2)
          : flightsCsv(flights),
      );
      if (!(await Sharing.isAvailableAsync()))
        throw new Error("Sharing unavailable");
      await Sharing.shareAsync(file.uri, {
        mimeType: format === "json" ? "application/json" : "text/csv",
        dialogTitle: words("Save your local backup", "保存本地备份"),
      });
    } catch (e) {
      Alert.alert(words("Export failed", "导出失败"), String(e));
    } finally {
      setBusy(false);
    }
  };
  const importData = async () => {
    setBusy(true);
    try {
      const result = await File.pickFileAsync({
        mimeTypes: [
          "application/json",
          "text/csv",
          "text/comma-separated-values",
          "text/plain",
        ],
      });
      if (result.canceled) return;
      const file = new File(result.result.uri);
      if (file.size > 10_000_000) throw new Error("Maximum file size: 10 MB");
      const text = await file.text();
      const parsed = text.trimStart().startsWith("{")
        ? JSON.parse(text)
        : importFlightCsv(
            text,
            airlines,
            airlineProfiles.airlines,
            aircraft,
            undefined,
            airportTimezones,
          );
      const data = validateBackup(parsed);
      Alert.alert(
        words("Import local records?", "导入本地记录？"),
        words(
          parsed.source === "flighty-csv"
            ? `${data.flights.length} flights. Missing details will be filled; your existing notes and edits will be kept.`
            : `${data.flights.length} flights. Matching records will be updated. Other flights stay unchanged.`,
          parsed.source === "flighty-csv"
            ? `${data.flights.length} 段航班。补全缺失信息，保留已有备注和修改，不重复添加同一航段。`
            : `${data.flights.length} 段航班。匹配的记录会更新，其他航班保留。`,
        ),
        [
          { text: words("Cancel", "取消"), style: "cancel" },
          {
            text: words("Import", "导入"),
            onPress: () => {
              setBusy(true);
              void mergeBackup(db, parsed)
                .then(() => app.reload())
                .then(() => Alert.alert(words("Imported", "导入完成")))
                .catch((e) =>
                  Alert.alert(words("Import failed", "导入失败"), String(e)),
                )
                .finally(() => setBusy(false));
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert(words("Import failed", "导入失败"), String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="done"
          tintColor={colors.accent}
          onPress={() => router.back()}
        >
          {words("Done", "完成")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Section
        title={words("Make it yours.", "你的天空，你来记录。")}
        caption="SKYLOG · ON DEVICE"
      />
      <Card>
        <Txt>{words("Language", "语言")}</Txt>
        <View style={styles.row}>
          <Button
            title="中文"
            secondary={locale !== "zh"}
            onPress={() => void prefs("locale", "zh")}
          />
          <Button
            title="English"
            secondary={locale !== "en"}
            onPress={() => void prefs("locale", "en")}
          />
        </View>
        <Txt>{words("Appearance", "外观")}</Txt>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {[
            ["dark", words("Dark", "深色")],
            ["light", words("Light", "浅色")],
            ["system", words("System", "跟随系统")],
          ].map(([value, title]) => (
            <Button
              key={value}
              title={title}
              secondary={theme !== value}
              onPress={() => void prefs("theme", value)}
            />
          ))}
        </View>
      </Card>
      <Button
        title="Passport"
        icon="globe-outline"
        onPress={() => router.push("/passport")}
      />
      <Button
        secondary
        title={words("Flight data & API budget", "航班数据与 API 用量")}
        icon="cloud-outline"
        onPress={() => router.push("/services")}
      />
      <Section title={words("Your data stays with you", "数据留在你手中")} />
      <Txt muted>
        {words(
          "Flights, notes, bookmarks and preferences are stored in local SQLite. Nothing is uploaded to the website. Export a backup before removing the app or changing phones.",
          "航班、备注、收藏与偏好保存在本地 SQLite，不会上传到网站。卸载 App 或换手机前，请先导出备份。",
        )}
      </Txt>
      <Button
        disabled={busy}
        title={words("Export full backup · JSON", "导出完整备份 · JSON")}
        icon="download-outline"
        onPress={() => void exportData("json")}
      />
      <Button
        secondary
        disabled={busy}
        title={words("Export flights · CSV", "导出航班 · CSV")}
        onPress={() => void exportData("csv")}
      />
      <Button
        secondary
        disabled={busy}
        title={words(
          "Import Flighty CSV or SKYLOG backup",
          "导入 Flighty CSV 或 SKYLOG 备份",
        )}
        icon="document-outline"
        onPress={() => void importData()}
      />
      <Button
        secondary
        title={words("Import from Calendar", "从系统日历导入")}
        icon="calendar-outline"
        onPress={() => router.push("/flight/calendar")}
      />
      <Txt muted style={{ fontSize: 12 }}>
        {words(
          "Flighty imports include aircraft, registration, airport-local event times, seats and gates. Known time zones allow actual airborne duration and arrival delay to be calculated. Missing data stays unknown.",
          "Flighty 导入支持机型、注册号、起降时间、座位和登机口。时区明确时计算实际飞行时长与到达延误，缺失数据保留为空。",
        )}
      </Txt>
      <Button
        secondary
        title={words("Open SKYLOG website", "打开 SKYLOG 网站")}
        icon="open-outline"
        onPress={() => void Linking.openURL(website)}
      />
      <Txt muted>
        SKYLOG 1.0 · {words("Photography © Yuan Wang", "摄影 © 王源")}
      </Txt>
    </Page>
  );
}
