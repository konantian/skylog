import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Calendar from "expo-calendar";
import {
  FlightActivity,
  NextFlightWidget,
  type FlightWidgetProps,
} from "../components/flight-widgets";
import { airportTimezones, type LocalFlight } from "./catalog";
import {
  flightTimes,
  flightStatus,
  compareFlightDates,
  reminderPlan,
  itineraryText,
} from "./flight-time.mjs";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function allowReminders() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("flights", {
      name: "Flight reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (
    !permission.granted &&
    permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL
  )
    throw new Error(
      "Enable notifications in Settings / 请在系统设置中允许通知",
    );
}

// Serialize reconciliation so rapid edits cannot leave obsolete notifications behind.
let reminderQueue: Promise<void> = Promise.resolve();
export function syncReminders(flights: LocalFlight[], locale: string) {
  const run = async () => {
    const current = await Notifications.getAllScheduledNotificationsAsync();
    const desired = reminderPlan(flights, airportTimezones) as {
      id: string;
      flight: LocalFlight;
      minutes: number;
      at: number;
    }[];
    const wanted = new Set(desired.map((r) => r.id));
    for (const n of current)
      if (n.identifier.startsWith("skylog:") && !wanted.has(n.identifier))
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    const permission = await Notifications.getPermissionsAsync();
    if (
      !permission.granted &&
      permission.ios?.status !==
        Notifications.IosAuthorizationStatus.PROVISIONAL
    )
      return;
    for (const r of desired) {
      const title =
        locale === "zh"
          ? `${r.flight.flight} · ${r.minutes === 1440 ? "明天出发" : "出发前 3 小时"}`
          : `${r.flight.flight} · ${r.minutes === 1440 ? "Tomorrow" : "In 3 hours"}`;
      const body = `${r.flight.origin} → ${r.flight.destination} · ${r.flight.departureTime} · ${locale === "zh" ? "计划时间，请核对航司通知" : "Scheduled time; check airline updates"}`;
      const fingerprint = `${r.at}|${locale}|${body}`;
      if (
        current.some(
          (n) =>
            n.identifier === r.id &&
            n.content.data?.fingerprint === fingerprint,
        )
      )
        continue;
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: {
          title,
          body,
          sound: "default",
          data: { flightId: r.flight.id, fingerprint },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(r.at),
          channelId: "flights",
        },
      });
    }
  };
  reminderQueue = reminderQueue.catch(() => {}).then(run);
  return reminderQueue;
}

export function widgetProps(
  f: LocalFlight | undefined,
  locale: string,
): FlightWidgetProps {
  return {
    id: f?.id || "",
    flight: f?.flight || "",
    origin: f?.origin || "",
    destination: f?.destination || "",
    date: f?.date || "",
    departureTime: f?.departureTime || "",
    arrivalTime: f?.arrivalTime || "",
    gate: f?.departureGate || "",
    // Widget timelines use property lists, which cannot encode null.
    departure: (f ? flightTimes(f, airportTimezones).departure : 0) || 0,
    generatedAt: Date.now(),
    zh: locale === "zh",
  };
}

export async function startFlightActivity(f: LocalFlight, locale: string) {
  if (Platform.OS !== "ios") throw new Error("Live Activities require iOS");
  const p = widgetProps(f, locale);
  if (
    flightStatus(f, airportTimezones) !== "planned" ||
    p.departure == null ||
    p.departure <= Date.now() ||
    p.departure - Date.now() > 3 * 3600000
  )
    throw new Error(
      "Available within 3 hours of scheduled departure; add a valid local time / 请填写当地出发时间，并在计划出发前 3 小时内开启",
    );
  for (const instance of FlightActivity.getInstances())
    await instance.end("immediate");
  const instance = FlightActivity.start(
    p,
    `skylog://flight/${encodeURIComponent(f.id)}`,
    new Date(p.departure),
  );
  if (!instance.getId())
    throw new Error(
      "Live Activities are unavailable. Check system settings. / 系统未能开启，请检查实时活动设置。",
    );
  return instance.getId();
}

export async function syncFlightWidgets(
  flights: LocalFlight[],
  locale: string,
  activeId?: string,
) {
  if (Platform.OS !== "ios") return;
  const upcoming = flights
    .filter((f) => flightStatus(f, airportTimezones) === "planned")
    .sort((a, b) => compareFlightDates(a, b, airportTimezones));
  NextFlightWidget.updateTimeline([
    { date: new Date(), props: widgetProps(upcoming[0], locale) },
    ...upcoming
      .filter((f) => flightTimes(f, airportTimezones).departure != null)
      .map((f) => ({
        date: new Date(flightTimes(f, airportTimezones).departure! + 60000),
        props: widgetProps(
          upcoming.find(
            (n) =>
              (flightTimes(n, airportTimezones).departure || 0) >
              (flightTimes(f, airportTimezones).departure || 0),
          ),
          locale,
        ),
      })),
  ]);
  const f = flights.find((f) => f.id === activeId);
  for (const instance of FlightActivity.getInstances()) {
    const p = f ? widgetProps(f, locale) : null;
    if (
      !f ||
      flightStatus(f, airportTimezones) !== "planned" ||
      !p?.departure ||
      p.departure <= Date.now()
    )
      await instance.end("immediate");
    else await instance.update(p, new Date(p.departure));
  }
}

export async function addFlightToCalendar(f: LocalFlight, locale: string) {
  const times = flightTimes(f, airportTimezones);
  if (
    times.departure == null ||
    times.arrival == null ||
    times.arrival <= times.departure
  )
    throw new Error(
      "Add departure time, arrival time and arrival date first / 请先补全出发时间、到达时间及到达日期",
    );
  const permission = await Calendar.requestCalendarPermissions(true);
  if (!permission.granted)
    throw new Error("Calendar permission denied / 未获得日历权限");
  const calendar =
    Platform.OS === "ios"
      ? Calendar.getDefaultCalendarSync()
      : (await Calendar.getCalendars(Calendar.EntityTypes.EVENT)).find(
          (c) => c.allowsModifications,
        );
  if (!calendar) throw new Error("No writable calendar / 未找到可写入的日历");
  return calendar.addEventWithForm({
    title: `${f.flight} · ${f.origin} → ${f.destination}`,
    startDate: new Date(times.departure),
    endDate: new Date(times.arrival),
    location: f.origin,
    notes: itineraryText(f, airportTimezones, locale),
    url: `skylog://flight/${encodeURIComponent(f.id)}`,
  });
}
