import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  airportInstant,
  flightTimes,
  flightStatus,
  compareFlightDates,
  reminderPlan,
  connectionFor,
  itineraryText,
} from "../apps/mobile/src/lib/flight-time.mjs";
import {
  aircraftPosition,
  metarObservation,
  cachedProvider,
} from "../apps/mobile/src/lib/live-data.mjs";
import {
  aviationstackFlight,
} from "../apps/mobile/src/lib/flight-provider.mjs";
import { calendarFlight } from "../apps/mobile/src/lib/calendar-import.mjs";
import {
  initializeDatabase,
  saveFlight,
  readLocalData,
  mergeBackup,
  validateFlight,
} from "../apps/mobile/src/lib/database.mjs";
import { importFlightCsv } from "../apps/mobile/src/lib/flight-import.mjs";
const zones = {
  YYZ: "America/Toronto",
  YVR: "America/Vancouver",
  NRT: "Asia/Tokyo",
};
const f = {
  id: "one",
  date: "2025-11-04",
  departureTime: "20:20",
  arrivalDate: "2025-11-04",
  arrivalTime: "22:50",
  origin: "YYZ",
  destination: "YVR",
  flight: "AC125",
  airline: "Air Canada",
  status: "planned",
  notes: "private",
  bookingReference: "SECRET",
  reminders: true,
};
const now = Date.parse("2025-11-04T20:00:00Z");
test("flight status follows airport-local time, ignoring stale manual classifications", () => {
  const departure = Date.parse("2025-11-05T01:20:00Z");
  assert.equal(flightStatus({ ...f, status: "completed" }, zones, departure - 1), "planned");
  assert.equal(flightStatus(f, zones, departure), "completed");
  assert.equal(flightStatus({ ...f, status: "cancelled" }, zones, departure), "cancelled");
  const dateOnly = { ...f, departureTime: "", status: "completed" };
  assert.equal(flightStatus(dateOnly, zones, Date.parse("2025-11-05T04:59:59Z")), "planned");
  assert.equal(flightStatus(dateOnly, zones, Date.parse("2025-11-05T05:00:00Z")), "completed");
  assert.equal(flightStatus({ ...f, date: "2026-11-01", departureTime: "01:30" }, zones, Date.parse("2026-11-01T12:00Z")), "planned");
  // The later local clock can still be the earlier absolute departure.
  assert(compareFlightDates({ ...f, origin: "NRT", departureTime: "22:00" }, f, zones) < 0);
  assert(compareFlightDates(f, { ...f, departureTime: "" }, zones) < 0);
});
function database() {
  const sql = new DatabaseSync(":memory:");
  return {
    sql,
    execAsync: async (q) => sql.exec(q),
    runAsync: async (q, ...args) => sql.prepare(q).run(...args),
    getFirstAsync: async (q, ...args) => sql.prepare(q).get(...args),
    getAllAsync: async (q, ...args) => sql.prepare(q).all(...args),
    withTransactionAsync: async (fn) => {
      sql.exec("BEGIN");
      try {
        await fn();
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
test("airport-local times reject DST gaps/repeats and preserve date-line arrival dates", () => {
  assert.equal(
    airportInstant("2025-11-04T20:20", zones.YYZ),
    Date.parse("2025-11-05T01:20Z"),
  );
  assert.equal(airportInstant("2026-03-08T02:30", zones.YYZ), null);
  assert.equal(airportInstant("2026-11-01T01:30", zones.YYZ), null);
  assert.equal(airportInstant("2026-02-30T01:30", zones.YYZ), null);
  assert.equal(airportInstant("2025-11-04T20:20", "Invalid/Zone"), null);
  const times = flightTimes(
    {
      ...f,
      origin: "NRT",
      destination: "YVR",
      date: "2025-11-05",
      departureTime: "18:00",
      arrivalDate: "2025-11-05",
      arrivalTime: "10:00",
    },
    zones,
  );
  assert.equal((times.arrival - times.departure) / 3600000, 9);
  assert.equal(
    flightTimes({ ...f, arrivalDate: undefined }, zones).arrival,
    null,
  );
});
test("reminders exclude past/cancelled/disabled flights and reschedule from exact airport time", () => {
  const plan = reminderPlan(
    [
      f,
      { ...f, id: "cancel", status: "cancelled" },
      { ...f, id: "off", reminders: false },
    ],
    zones,
    now,
  );
  assert.equal(plan.length, 1);
  assert.equal(plan[0].at, Date.parse("2025-11-04T22:20Z"));
  assert.equal(reminderPlan([{ ...f, status: "completed" }], zones, now).length, 1);
  assert.equal(
    reminderPlan([f], zones, Date.parse("2025-11-05T02:00Z")).length,
    0,
  );
  assert.equal(reminderPlan([{ ...f, origin: "ZZZ" }], zones, now).length, 0);
  assert(!itineraryText(f, zones).includes("SECRET"));
  assert(!itineraryText(f, zones).includes("private"));
});
test("connections use destination local time, ignore cancellation and cap unrelated layovers", () => {
  const next = {
    ...f,
    id: "two",
    origin: "YVR",
    destination: "NRT",
    date: "2025-11-05",
    departureTime: "01:00",
  };
  assert.equal(connectionFor(f, [next], zones).minutes, 130);
  assert.equal(
    connectionFor(f, [{ ...next, status: "cancelled" }], zones),
    null,
  );
  assert.equal(
    connectionFor(f, [{ ...next, date: "2025-11-07" }], zones),
    null,
  );
});
test("ADS-B rejects wrong, stale, duplicate and future registrations; unknown values stay unknown", () => {
  const a = {
    r: "C-FABC",
    hex: "c00001",
    lat: 43.6,
    lon: -79.6,
    seen_pos: 10,
    flight: "ACA125  ",
    alt_baro: "ground",
  };
  const payload = { now: now / 1000, aircraft: [a] };
  const p = aircraftPosition(payload, "CFABC", now);
  assert(p.onGround);
  assert.equal(p.speed, null);
  assert.equal(p.observedAt, now - 10000);
  assert.equal(aircraftPosition(payload, "", now), null);
  assert.equal(aircraftPosition(payload, "C-FDEF", now), null);
  assert.equal(aircraftPosition(payload, "CFABC", now + 121000), null);
  assert.equal(
    aircraftPosition({ ...payload, now: (now + 40000) / 1000 }, "CFABC", now),
    null,
  );
  assert.equal(
    aircraftPosition({ ...payload, aircraft: [a, a] }, "CFABC", now),
    null,
  );
  assert.equal(
    metarObservation(
      [
        {
          icaoId: "CYYZ",
          rawOb: "CYYZ VRB02KT",
          obsTime: now / 1000,
          wdir: "VRB",
        },
      ],
      "CYYZ",
    ).windSpeed,
    null,
  );
});
test("provider cache deduplicates requests, persists offline data and retains observation timestamps", async () => {
  const db = database();
  await initializeDatabase(db, []);
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return { ok: true, status: 200, json: async () => ({ value: 42 }) };
  };
  try {
    const [a, b] = await Promise.all([
      cachedProvider(
        db,
        "test",
        "https://example.invalid",
        1000,
        (x) => x,
        now,
        fetcher,
      ),
      cachedProvider(
        db,
        "test",
        "https://example.invalid",
        1000,
        (x) => x,
        now,
        fetcher,
      ),
    ]);
    assert.equal(calls, 1);
    assert.deepEqual(a, b);
    await cachedProvider(
      db,
      "test",
      "https://example.invalid",
      1000,
      (x) => x,
      now + 500,
      fetcher,
    );
    assert.equal(calls, 1);
    const failure = await cachedProvider(
      db,
      "test",
      "https://example.invalid",
      1000,
      (x) => x,
      now + 2000,
      async () => {
        calls++;
        throw Error("offline");
      },
    );
    assert.equal(failure.data.value, 42);
    assert.equal(failure.dataFetchedAt, now);
    assert.equal(failure.error, "unavailable");
    await cachedProvider(
      db,
      "test",
      "https://example.invalid",
      1000,
      (x) => x,
      now + 2500,
      fetcher,
    );
    assert.equal(calls, 2);
  } finally {
    db.sql.close();
  }
});

test("Aviationstack must uniquely match date, route and flight; no registration guessing", () => {
  const r = {
    flight_date: f.date,
    flight: { iata: "AC125" },
    flight_status: "scheduled",
    airline: { name: "Air Canada" },
    departure: {
      iata: "YYZ",
      scheduled: "2025-11-04T20:20:00+00:00",
      gate: "D24",
    },
    arrival: { iata: "YVR" },
    aircraft: { registration: null },
  };
  assert.equal(
    aviationstackFlight({ data: [r] }, f).scheduledDeparture,
    "2025-11-04T20:20",
  );
  assert.equal(aviationstackFlight({ data: [r] }, f).registration, "");
  assert.equal(aviationstackFlight({ data: [r, r] }, f), null);
  assert.equal(
    aviationstackFlight({ data: [r] }, { ...f, date: "2025-11-03" }),
    null,
  );
  assert.throws(
    () => aviationstackFlight({ error: { message: "secret" } }, f),
    (e) => !e.message.includes("secret"),
  );
});
test("calendar import needs unambiguous flight and route and converts UTC to airport-local dates", () => {
  const event = {
    title: "AC125 YYZ → YVR",
    startDate: "2025-11-05T01:20Z",
    endDate: "2025-11-05T06:50Z",
    notes: "Personal data",
  };
  const result = calendarFlight(event, { YYZ: {}, YVR: {} }, zones, now);
  assert.equal(result.date, f.date);
  assert.equal(result.departureTime, "20:20");
  assert.equal(result.arrivalTime, "22:50");
  assert(!("notes" in result));
  assert.equal(
    calendarFlight(
      { ...event, title: "AC125 or AC127 YYZ → YVR" },
      { YYZ: {}, YVR: {} },
      zones,
    ),
    null,
  );
  assert.equal(
    calendarFlight({ ...event, title: "Dentist" }, { YYZ: {}, YVR: {} }, zones),
    null,
  );
});
test("Flighty import enriches actual times while retaining local edits and avoids duplicate rows", async () => {
  const csv =
    "Date,Airline,Flight,From,To,Gate Departure (Scheduled),Take off (Actual),Landing (Actual),Gate Arrival (Scheduled),Gate Arrival (Actual),Dep Gate,Seat Type,Cabin Class\n2025-11-04,Air Canada,AC125,YYZ,YVR,2025-11-04T20:20,2025-11-04T20:30,2025-11-04T22:40,2025-11-04T23:00,2025-11-04T22:50,D24,WINDOW,ECONOMY";
  const imported = importFlightCsv(csv, [], {}, [], "2025-11-05", zones);
  assert.equal(imported.flights[0].durationMinutes, 310);
  assert.equal(imported.flights[0].delayMinutes, -10);
  const db = database();
  await initializeDatabase(db, []);
  try {
    await saveFlight(db, { ...f, notes: "Keep my note", departureGate: "D20" });
    await mergeBackup(db, imported);
    await mergeBackup(db, imported);
    const rows = (await readLocalData(db)).flights;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "one");
    assert.equal(rows[0].notes, "Keep my note");
    assert.equal(rows[0].departureGate, "D20");
    assert.equal(rows[0].durationMinutes, 310);
    assert.throws(() =>
      validateFlight({ ...f, takeoffActual: "2026-02-30T10:00" }),
    );
  } finally {
    db.sql.close();
  }
});
