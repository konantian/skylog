import { useSQLiteContext } from "expo-sqlite";
import { lookupCurrentFlight } from "../../lib/aviationstack";
import { useState, useRef } from "react";
import {
  View,
  TextInput,
  Platform,
  Alert,
  Keyboard,
  Pressable,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Stack,
  router,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { randomUUID } from "expo-crypto";
import { useApp } from "../../lib/store";
import { aircraftName, aircraftSearchQuery } from "../../lib/flight-labels";
import {
  aircraft,
  airlines,
  airports,
  type LocalFlight,
  airportTimezones,
} from "../../lib/catalog";
import { todayLocal } from "../../lib/database.mjs";
import { Txt, Button, Section, styles } from "../../components/ui";
import {
  KeyboardAwareScrollView,
  KeyboardController,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { KeyboardControls } from "../../components/keyboard-controls";

type NumericKey = "durationMinutes" | "delayMinutes" | "aircraftYear";
type Draft = Omit<LocalFlight, NumericKey> &
  Partial<Record<NumericKey, string | number | null>>;
export default function EditFlight() {
  const { id, template, returnTrip, calendarDraft } = useLocalSearchParams<{
    id?: string;
    template?: string;
    returnTrip?: string;
    calendarDraft?: string;
  }>();
  const [imported] = useState(() => {
    try {
      const value = JSON.parse(calendarDraft || "null");
      if (!value || typeof value !== "object") return {};
      return Object.fromEntries(
        [
          "flight",
          "origin",
          "destination",
          "date",
          "departureTime",
          "arrivalDate",
          "arrivalTime",
          "status",
        ]
          .filter(
            (key) => typeof value[key] === "string" && value[key].length < 30,
          )
          .map((key) => [key, value[key]]),
      );
    } catch {
      return {};
    }
  });
  const { colors, words, locale, flights, save, isDark } = useApp();
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const [looking, setLooking] = useState(false);
  const existing = flights.find((f) => f.id === id);
  const source = flights.find((f) => f.id === template);
  const scroll = useRef<KeyboardAwareScrollViewRef>(null);
  const [arrivalCalendar, setArrivalCalendar] = useState(false);
  const [form, setForm] = useState<Draft>(() =>
    existing
      ? { ...existing, modelLabel: aircraftName(existing.modelLabel, locale) }
      : {
          id: randomUUID(),
          date: todayLocal(),
          airline: source?.airline || "",
          flight: returnTrip ? "" : source?.flight || "",
          origin: (returnTrip ? source?.destination : source?.origin) || "",
          destination:
            (returnTrip ? source?.origin : source?.destination) || "",
          model: null,
          modelLabel: "",
          registration: null,
          status: "planned",
          trip: source?.trip || "",
          notes: "",
          ...imported,
        },
  );
  const [original] = useState(() => JSON.stringify(form));
  const saved = useRef(false),
    savingRef = useRef(false);
  const [calendar, setCalendar] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [suggest, setSuggest] = useState<"airline" | "model" | null>(null),
    [details, setDetails] = useState(Boolean(existing));
  usePreventRemove(JSON.stringify(form) !== original, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action);
      return;
    }
    if (savingRef.current) return;
    Alert.alert(
      words("Discard changes?", "放弃这次修改？"),
      words("Your unsaved changes will be lost.", "尚未保存的修改会丢失。"),
      [
        { text: words("Keep editing", "继续编辑"), style: "cancel" },
        {
          text: words("Discard", "放弃"),
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });
  const change = (key: keyof Draft, value: string) => {
    setError("");
    setForm((old) => ({ ...old, [key]: value }));
  };
  const field = (
    key: keyof Draft,
    label: string,
    placeholder = "",
    numeric = false,
  ) => (
    <View style={{ gap: 8 }}>
      <Txt muted>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        value={String(form[key] ?? "")}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onChangeText={(value) => {
          change(key, value);
          if (key === "modelLabel") setForm((old) => ({ ...old, model: null }));
        }}
        onFocus={() => {
          setSuggest(
            key === "airline"
              ? "airline"
              : key === "modelLabel"
                ? "model"
                : null,
          );
          if (key === "notes")
            requestAnimationFrame(() =>
              scroll.current?.assureFocusedInputVisible(),
            );
        }}
        autoCapitalize={
          ["flight", "origin", "destination", "registration"].includes(key)
            ? "characters"
            : "sentences"
        }
        keyboardType={
          numeric
            ? key === "delayMinutes"
              ? "numbers-and-punctuation"
              : "number-pad"
            : "default"
        }
        autoCorrect={false}
        keyboardAppearance={isDark ? "dark" : "light"}
        returnKeyType={key === "notes" ? "default" : "next"}
        submitBehavior={key === "notes" ? "newline" : "submit"}
        onSubmitEditing={
          key === "notes"
            ? undefined
            : () => KeyboardController.setFocusTo("next")
        }
        maxLength={
          key === "notes"
            ? 4000
            : key === "origin" || key === "destination"
              ? 3
              : 100
        }
        multiline={key === "notes"}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.line,
            backgroundColor: colors.card,
            minHeight: key === "notes" ? 100 : 50,
            textAlignVertical: key === "notes" ? "top" : "auto",
          },
        ]}
      />
      {["origin", "destination"].includes(key) && (
        <Txt muted style={{ fontSize: 12 }}>
          {(airports as Record<string, { name: string; city: string }>)[
            String(form[key]).toUpperCase()
          ]?.city || words("Three-letter airport code", "三位机场代码")}
        </Txt>
      )}
      {((key === "airline" && suggest === "airline") ||
        (key === "modelLabel" && suggest === "model")) && (
        <View style={{ gap: 4 }}>
          {(key === "airline" ? airlines : aircraft)
            .filter(
              (item) =>
                String(form[key] || "").length > 0 &&
                (key === "modelLabel"
                  ? aircraftSearchQuery(item.name).includes(
                      aircraftSearchQuery(String(form[key])),
                    ) && aircraftName(item.name, locale) !== form[key]
                  : item.name
                      .toLowerCase()
                      .includes(String(form[key]).toLowerCase()) &&
                    item.name !== form[key]),
            )
            .slice(0, 4)
            .map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setForm((old) =>
                    key === "airline"
                      ? { ...old, airline: item.name }
                      : {
                          ...old,
                          model: item.name,
                          modelLabel: aircraftName(item.name, locale),
                        },
                  );
                  setSuggest(null);
                  KeyboardController.setFocusTo("next");
                }}
                style={({ pressed }) => ({
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: colors.raised,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Txt>
                  {key === "modelLabel"
                    ? aircraftName(item.name, locale)
                    : item.name}
                </Txt>
              </Pressable>
            ))}
        </View>
      )}
    </View>
  );
  const choices = (
    key: "seatPosition" | "cabin",
    values: [string, string][],
  ) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {values.map(([value, title]) => (
        <Button
          key={value}
          secondary={form[key] !== value}
          title={title}
          onPress={() => change(key, form[key] === value ? "" : value)}
        />
      ))}
    </View>
  );
  const submit = async () => {
    if (savingRef.current) return;
    Keyboard.dismiss();
    savingRef.current = true;
    setSaving(true);
    try {
      const match = aircraft.find(
        (a) =>
          aircraftSearchQuery(a.name) === aircraftSearchQuery(form.modelLabel),
      );
      const numbers = Object.fromEntries(
        (["durationMinutes", "delayMinutes", "aircraftYear"] as const).map(
          (k) => [
            k,
            form[k] == null || String(form[k]).trim() === ""
              ? null
              : Number(form[k]),
          ],
        ),
      );
      await save({
        ...form,
        ...numbers,
        model: match?.name || null,
        modelLabel:
          match?.name ||
          (existing &&
          form.modelLabel === aircraftName(existing.modelLabel, locale)
            ? existing.modelLabel
            : form.modelLabel || "—"),
      } as LocalFlight);
      saved.current = true;
      router.back();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      Alert.alert(words("Could not save", "未能保存"), message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  if (id && !existing)
    return (
      <View style={{ padding: 24 }}>
        <Txt>
          {words("This record no longer exists.", "这条记录已不存在。")}
        </Txt>
      </View>
    );
  return (
    <>
      <Stack.Screen
        options={{
          title: existing
            ? words("Edit flight", "编辑航班")
            : words("Add flight", "添加航班"),
          gestureEnabled: !saving,
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          disabled={saving}
          tintColor={colors.accent}
          onPress={() => router.back()}
        >
          {words("Cancel", "取消")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="prominent"
          disabled={saving}
          tintColor={colors.accent}
          onPress={() => void submit()}
        >
          {words("Save", "保存")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <KeyboardAwareScrollView
          ref={scroll}
          bottomOffset={72}
          extraKeyboardSpace={64}
          disableScrollOnKeyboardHide
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }}
        >
          <Txt muted>
            {words(
              "Saved only on this device. No account or internet needed.",
              "仅保存在这台设备，无需账号或网络。",
            )}
          </Txt>
          <View style={{ gap: 8 }}>
            <Txt muted>{words("Flight date", "航班日期")}</Txt>
            <Button
              secondary
              title={form.date}
              icon="calendar-outline"
              onPress={() => {
                Keyboard.dismiss();
                setCalendar((v) => !v);
              }}
            />
            {calendar && (
              <DateTimePicker
                value={new Date(`${form.date}T12:00:00`)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant={isDark ? "dark" : "light"}
                onChange={(event, date) => {
                  if (Platform.OS === "android") setCalendar(false);
                  if (event.type === "set" && date) {
                    const value = todayLocal(date);
                    setForm((old) => ({
                      ...old,
                      date: value,
                    }));
                  }
                }}
              />
            )}
          </View>
          {field(
            "airline",
            words("Airline · optional", "航司 · 选填"),
            "Air Canada",
          )}
          {field(
            "flight",
            words("Flight number · optional", "航班号 · 选填"),
            "AC123",
          )}
          {!existing && (
            <Button
              secondary
              disabled={looking || !form.flight}
              title={
                looking
                  ? words("Looking up…", "查询中……")
                  : words("Look up today's flight", "查询今天的航班")
              }
              onPress={() =>
                void (async () => {
                  Keyboard.dismiss();
                  setLooking(true);
                  try {
                    const result = await lookupCurrentFlight(
                      db,
                      form.date,
                      form.flight.toUpperCase().replace(/\s/g, ""),
                    );
                    const data = result.data;
                    if (!data || result.error)
                      throw new Error(
                        words(
                          "No unique current flight returned. Enter the route manually or check Flight data in Settings.",
                          "没有返回唯一匹配的当前航班。请手动填写航线，或在设置中查看服务状态。",
                        ),
                      );
                    if (data.status === "cancelled")
                      throw new Error(
                        words(
                          "The provider reports this flight as cancelled.",
                          "数据源显示该航班已取消，请核对航班号和日期。",
                        ),
                      );
                    setForm((old) => ({
                      ...old,
                      airline: data.airline,
                      flight: data.flight,
                      origin: data.origin,
                      destination: data.destination,
                      departureTime: data.scheduledDeparture.slice(11, 16),
                      arrivalTime: data.scheduledArrival.slice(11, 16),
                      arrivalDate: data.scheduledArrival.slice(0, 10),
                      departureGate: data.departureGate,
                      departureTerminal: data.departureTerminal,
                      arrivalGate: data.arrivalGate,
                      arrivalTerminal: data.arrivalTerminal,
                      registration: data.registration || null,
                      baggage: data.baggage,
                    }));
                  } catch (e) {
                    Alert.alert(words("Flight lookup", "航班查询"), String(e));
                  } finally {
                    setLooking(false);
                  }
                })()
              }
            />
          )}

          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flex: 1 }}>
              {field("origin", words("From · IATA", "出发 · IATA"), "YYZ")}
            </View>
            <View style={{ flex: 1 }}>
              {field("destination", words("To · IATA", "到达 · IATA"), "YVR")}
            </View>
          </View>
          {field(
            "modelLabel",
            words("Aircraft · optional", "机型 · 选填"),
            words("Select a model or leave blank", "选择具体机型或留空"),
          )}
          {field(
            "registration",
            words("Registration · optional", "注册号 · 选填"),
            "C-FXXX",
          )}
          <Button
            secondary
            title={
              details
                ? words("Hide travel details", "收起旅途详情")
                : words(
                    "Add seat, times & travel details",
                    "补充座位、时间与旅途详情",
                  )
            }
            icon={details ? "chevron-up" : "chevron-down"}
            onPress={() => setDetails((v) => !v)}
          />
          {details && (
            <>
              <Section title={words("Travel details", "旅途详情")} />
              <Txt muted>
                {words(
                  "Optional. Times are local to each airport; duration is entered separately. Passport follows the flight date and departure time automatically.",
                  "以下均选填。时间为机场当地时间，时长单独填写。Passport 根据航班日期和出发时间自动统计。",
                )}
              </Txt>
              {field(
                "trip",
                words("Trip name", "旅程名称"),
                words("Vancouver weekend", "温哥华周末"),
              )}
              {field(
                "bookingReference",
                words("Booking reference · private", "预订编号 · 仅本机"),
                "ABC123",
              )}
              {field("seat", words("Seat", "座位"), "12A")}
              <Txt muted>{words("Seat position", "座位位置")}</Txt>
              {choices("seatPosition", [
                ["window", words("Window", "靠窗")],
                ["middle", words("Middle", "中间")],
                ["aisle", words("Aisle", "靠走道")],
              ])}
              <Txt muted>{words("Cabin", "舱位")}</Txt>
              {choices("cabin", [
                ["economy", words("Economy", "经济舱")],
                ["premium", words("Premium economy", "超级经济舱")],
                ["business", words("Business", "商务舱")],
                ["first", words("First", "头等舱")],
              ])}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {field(
                    "departureTime",
                    words("Departure · local", "出发 · 当地时间"),
                    "14:30",
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {field(
                    "arrivalTime",
                    words("Arrival · local", "到达 · 当地时间"),
                    "16:45",
                  )}
                </View>
              </View>
              <Txt muted style={{ fontSize: 12 }}>
                {words("Airport time zones", "机场时区")}:{" "}
                {(airportTimezones as Record<string, string>)[form.origin] ||
                  "—"}{" "}
                →{" "}
                {(airportTimezones as Record<string, string>)[
                  form.destination
                ] || "—"}
              </Txt>
              <Txt muted>
                {words(
                  "Arrival date · at destination",
                  "到达日期 · 目的地当地",
                )}
              </Txt>
              <Button
                secondary
                title={
                  form.arrivalDate ||
                  words("Choose arrival date", "选择到达日期")
                }
                icon="calendar-outline"
                onPress={() => {
                  Keyboard.dismiss();
                  setArrivalCalendar((v) => !v);
                }}
              />
              {arrivalCalendar && (
                <DateTimePicker
                  value={new Date(`${form.arrivalDate || form.date}T12:00:00`)}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  themeVariant={isDark ? "dark" : "light"}
                  onChange={(event, date) => {
                    if (Platform.OS === "android") setArrivalCalendar(false);
                    if (event.type === "set" && date)
                      change("arrivalDate", todayLocal(date));
                  }}
                />
              )}
              {field(
                "durationMinutes",
                words("Actual duration · minutes", "实际飞行时长 · 分钟"),
                "240",
                true,
              )}
              {field(
                "delayMinutes",
                words(
                  "Arrival delay · minutes (negative = early)",
                  "到达延误 · 分钟（负数为提前）",
                ),
                "0",
                true,
              )}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {field(
                    "departureTerminal",
                    words("Departure terminal", "出发航站楼"),
                    "1",
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {field(
                    "departureGate",
                    words("Departure gate", "出发登机口"),
                    "D20",
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  {field(
                    "arrivalTerminal",
                    words("Arrival terminal", "到达航站楼"),
                    "M",
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {field(
                    "arrivalGate",
                    words("Arrival gate", "到达登机口"),
                    "C50",
                  )}
                </View>
              </View>
              {field("baggage", words("Baggage belt", "行李转盘"), "5")}
              {field(
                "aircraftYear",
                words("Aircraft build year", "飞机制造年份"),
                "2018",
                true,
              )}
            </>
          )}
          {field(
            "notes",
            words("Private notes · optional", "私人备注 · 选填"),
            words("A memory from this journey…", "记录这段旅途……"),
          )}
          {error && (
            <Txt accessibilityRole="alert" style={{ color: colors.danger }}>
              {error}
            </Txt>
          )}
          <Button
            disabled={saving}
            title={
              saving
                ? words("Saving…", "保存中……")
                : words("Save flight", "保存航班")
            }
            icon="checkmark"
            onPress={() => void submit()}
          />
        </KeyboardAwareScrollView>
        <KeyboardControls />
      </View>
    </>
  );
}
