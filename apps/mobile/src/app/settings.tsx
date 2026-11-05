import { useState } from "react";
import { Alert, View, Linking } from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { exportBackup, mergeBackup, validateBackup } from "../lib/database.mjs";
import { flightsCsv, importFlightCsv } from "../lib/flight-import.mjs";
import { airlines, airlineProfiles, aircraft, website } from "../lib/catalog";
import { useApp } from "../lib/store";
import { Page, Txt, Section, Card, Button, styles } from "../components/ui";
export default function Settings() {
  const app = useApp();
  const { words, locale, theme, prefs, flights } = app;
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
        : importFlightCsv(text, airlines, airlineProfiles.airlines, aircraft);
      const data = validateBackup(parsed);
      Alert.alert(
        words("Import local records?", "导入本地记录？"),
        words(
          `${data.flights.length} flights. Existing records with the same ID will be updated. Other flights stay unchanged.`,
          `${data.flights.length} 段航班。同 ID 的现有记录会更新，其他航班保留。`,
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
      <Txt muted style={{ fontSize: 12 }}>
        {words(
          "Import is local and transactional. Original Flighty flight/date/route/model fields are supported; unknown columns are ignored. No live updates are connected.",
          "导入仅在本机进行，失败会整体撤销。支持原始 Flighty 的航班、日期、航线与机型字段，未知列会忽略。目前未接入实时数据。",
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
