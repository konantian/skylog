import { useState } from "react";
import { Alert, Platform, View } from "react-native";
import { Stack, router } from "expo-router";
import * as Calendar from "expo-calendar";
import DateTimePicker from "@react-native-community/datetimepicker";
import { airports, airportTimezones } from "../../lib/catalog";
import { calendarFlight } from "../../lib/calendar-import.mjs";
import { useApp } from "../../lib/store";
import { Page, Section, Txt, Button, Card, Empty } from "../../components/ui";
export default function CalendarImport() {
  const { words, flights } = useApp();
  const [year, setYear] = useState(new Date());
  const [showDate, setShowDate] = useState(false),
    [busy, setBusy] = useState(false);
  const [calendars, setCalendars] = useState<Calendar.ExpoCalendar[]>([]);
  const [items, setItems] = useState<
    NonNullable<ReturnType<typeof calendarFlight>>[]
  >([]);
  const [searched, setSearched] = useState(false);
  const read = async (calendar: Calendar.ExpoCalendar) => {
    setBusy(true);
    try {
      const events = await calendar.listEvents(
        new Date(year.getFullYear(), 0, 1),
        new Date(year.getFullYear() + 1, 0, 1),
      );
      const parsed = events
        .map((e) => calendarFlight(e, airports, airportTimezones))
        .filter(
          (f): f is NonNullable<ReturnType<typeof calendarFlight>> => !!f,
        );
      setItems(
        [
          ...new Map(
            parsed.map((f) => [
              `${f.date}:${f.flight}:${f.origin}:${f.destination}`,
              f,
            ]),
          ).values(),
        ].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setSearched(true);
      setCalendars([]);
    } catch (e) {
      Alert.alert(words("Unable to read calendar", "无法读取日历"), String(e));
    } finally {
      setBusy(false);
    }
  };
  const choose = async () => {
    setBusy(true);
    try {
      const permission = await Calendar.requestCalendarPermissions();
      if (!permission.granted)
        throw new Error(
          words(
            "Allow calendar access in Settings.",
            "请在系统设置中允许日历访问。",
          ),
        );
      if (Platform.OS === "ios") {
        const calendar = await Calendar.presentPicker();
        if (calendar) await read(calendar);
      } else
        setCalendars(await Calendar.getCalendars(Calendar.EntityTypes.EVENT));
    } catch (e) {
      Alert.alert(words("Calendar unavailable", "日历不可用"), String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Stack.Screen
        options={{ title: words("Import from Calendar", "从日历导入") }}
      />
      <Section
        title={words(
          "Your itinerary, already on your phone",
          "把日历里的航程带进来",
        )}
      />
      <Txt muted>
        {words(
          "Choose one calendar. Events need an explicit flight number and route, such as AC125 YYZ → YVR. Review each result before saving. Nothing is uploaded or changed in Calendar.",
          "选择一个日历。事件需包含明确的航班号和航线，例如 AC125 YYZ → YVR。逐条检查后保存，不上传内容，也不修改系统日历。",
        )}
      </Txt>
      <Button
        secondary
        title={`${year.getFullYear()} · ${words("Choose year", "选择年份")}`}
        onPress={() => setShowDate(!showDate)}
      />
      {showDate && (
        <DateTimePicker
          mode="date"
          value={year}
          onChange={(_, date) => {
            if (date) setYear(date);
            if (Platform.OS !== "ios") setShowDate(false);
          }}
        />
      )}
      <Button
        disabled={busy}
        title={
          busy
            ? words("Reading…", "读取中……")
            : words("Choose calendar", "选择日历")
        }
        onPress={() => void choose()}
      />
      {calendars.map((c) => (
        <Button
          key={c.id}
          title={c.title}
          secondary
          disabled={busy}
          onPress={() => void read(c)}
        />
      ))}
      {searched && !items.length && (
        <Empty
          title={words(
            "No clear flight events found",
            "没有识别到明确的航班事件",
          )}
          body={words(
            "Use Flighty CSV import or add a flight manually.",
            "可以导入 Flighty CSV，或手动添加航班。例：AC125 YYZ → YVR。",
          )}
        />
      )}
      {items.map((f) => {
        const duplicate = flights.some(
          (n) =>
            n.date === f.date &&
            n.flight === f.flight &&
            n.origin === f.origin &&
            n.destination === f.destination,
        );
        return (
          <Card key={`${f.date}:${f.flight}:${f.origin}:${f.destination}`}>
            <Txt>
              {f.flight} · {f.origin} → {f.destination}
            </Txt>
            <Txt muted>
              {f.date} {f.departureTime} → {f.arrivalDate} {f.arrivalTime}
            </Txt>
            <View>
              <Button
                secondary
                disabled={duplicate}
                title={
                  duplicate
                    ? words("Already saved", "已保存")
                    : words("Review & add", "检查后添加")
                }
                onPress={() =>
                  router.push({
                    pathname: "/flight/edit",
                    params: { calendarDraft: JSON.stringify(f) },
                  })
                }
              />
            </View>
          </Card>
        );
      })}
    </Page>
  );
}
