import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initializeDatabase,
  saveFlight,
  deleteFlight,
  readLocalData,
  setPreference,
  setPhotoSaved,
  exportBackup,
  mergeBackup,
  validateFlight,
} from "../apps/mobile/src/lib/database.mjs";
import {
  parseCsv,
  importFlightCsv,
  flightsCsv,
} from "../apps/mobile/src/lib/flight-import.mjs";
import { passportStats } from "../apps/mobile/src/lib/passport.mjs";
const read = (file) =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
const catalog = read("../data/catalog.json"),
  profiles = read("../data/airline-profiles.json").airlines,
  airports = read("../apps/mobile/src/generated/airports.json");
const seed = read("../data/flights.json").flights;
const flight = (extra = {}) => ({
  id: "manual-one",
  date: "2026-10-31",
  airline: "Air Canada",
  flight: "AC123",
  origin: "YYZ",
  destination: "YVR",
  model: "Boeing 787-9",
  modelLabel: "Boeing 787-9",
  registration: "C-FABC",
  status: "completed",
  notes: "",
  ...extra,
});
function connect(path = ":memory:") {
  const sql = new DatabaseSync(path);
  return {
    sql,
    execAsync: async (q) => sql.exec(q),
    runAsync: async (q, ...args) => sql.prepare(q).run(...args),
    getFirstAsync: async (q, ...args) => sql.prepare(q).get(...args),
    getAllAsync: async (q, ...args) => sql.prepare(q).all(...args),
    withTransactionAsync: async (callback) => {
      sql.exec("BEGIN");
      try {
        await callback();
        sql.exec("COMMIT");
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
}
test("native SQLite seeds once; CRUD, details, preferences and bookmarks survive a fresh connection", async () => {
  const dir = mkdtempSync(join(tmpdir(), "skylog-db-")),
    path = join(dir, "test.db");
  let db = connect(path);
  try {
    await initializeDatabase(db, seed);
    assert.equal((await readLocalData(db)).flights.length, seed.length);
    await deleteFlight(db, seed[0].id);
    await saveFlight(
      db,
      flight({
        notes: "Window view, 'quoted'\nYYZ",
        seat: "12A",
        durationMinutes: 250,
        delayMinutes: -5,
        departureGate: "D20",
      }),
    );
    await setPreference(db, "locale", "zh");
    await setPreference(db, "theme", "light");
    await setPhotoSaved(db, "DSC08110", true);
    await setPhotoSaved(db, "DSC08110", true);
    db.sql.close();
    db = connect(path);
    await initializeDatabase(db, seed);
    let data = await readLocalData(db);
    assert.equal(data.flights.length, seed.length);
    assert(!data.flights.some((f) => f.id === seed[0].id));
    const saved = data.flights.find((f) => f.id === "manual-one");
    assert.equal(saved.seat, "12A");
    assert.equal(saved.delayMinutes, -5);
    assert.equal(saved.notes, "Window view, 'quoted'\nYYZ");
    assert.deepEqual(data.saved, ["DSC08110"]);
    assert.equal(data.preferences.locale, "zh");
    await saveFlight(db, flight({ notes: "Updated" }));
    data = await readLocalData(db);
    assert.equal(
      data.flights.find((f) => f.id === "manual-one").notes,
      "Updated",
    );
    await assert.rejects(
      saveFlight(db, flight({ id: "duplicate" })),
      /already exists/,
    );
    await setPhotoSaved(db, "DSC08110", false);
    assert.deepEqual((await readLocalData(db)).saved, []);
  } finally {
    db.sql.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("backup validates every row before mutation and rolls back on database errors", async () => {
  const db = connect();
  try {
    await initializeDatabase(db, []);
    await saveFlight(db, flight());
    const backup = await exportBackup(db);
    await mergeBackup(db, backup);
    assert.equal((await readLocalData(db)).flights.length, 1);
    await assert.rejects(
      mergeBackup(db, {
        ...backup,
        flights: [
          flight({ id: "two", flight: "AC125" }),
          flight({ id: "bad", date: "2025-02-29" }),
        ],
      }),
    );
    assert.equal((await readLocalData(db)).flights.length, 1);
    db.sql.exec(
      "CREATE TRIGGER reject_test BEFORE INSERT ON saved_photos BEGIN SELECT RAISE(ABORT,'test failure'); END",
    );
    await assert.rejects(
      mergeBackup(db, {
        ...backup,
        flights: [flight({ id: "new", flight: "AC126" })],
        saved: ["DSC08110"],
      }),
      /test failure/,
    );
    assert(!(await readLocalData(db)).flights.some((f) => f.id === "new"));
  } finally {
    db.sql.close();
  }
});
test("schema upgrade retains version 1 records and rejects a newer database", async () => {
  const db = connect();
  try {
    db.sql.exec(
      "CREATE TABLE flights (id TEXT PRIMARY KEY,date TEXT,airline TEXT,flight TEXT,origin TEXT,destination TEXT,model TEXT,modelLabel TEXT,registration TEXT,status TEXT,notes TEXT,updatedAt TEXT); CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE saved_photos(photoId TEXT PRIMARY KEY,savedAt TEXT); PRAGMA user_version=1;",
    );
    await initializeDatabase(db, seed);
    assert.equal((await readLocalData(db)).flights.length, 0);
    await saveFlight(db, flight({ seat: "1A" }));
    assert.equal((await readLocalData(db)).flights[0].seat, "1A");
    db.sql.exec("PRAGMA user_version=99");
    await assert.rejects(initializeDatabase(db, seed), /newer version/);
  } finally {
    db.sql.close();
  }
});
test("flight validation handles future records, leap days, unknown values and local times", () => {
  assert.equal(
    validateFlight(flight({ date: "2024-02-29", flight: " ac 123 " })).flight,
    "AC123",
  );
  assert.throws(() => validateFlight(flight({ date: "2025-02-29" })));
  assert.equal(
    validateFlight(flight({ date: "2099-01-01" }), "2026-11-04").status,
    "planned",
  );
  assert.equal(validateFlight(flight({ status: undefined }), "2026-11-04").status, "completed");
  assert.equal(validateFlight(flight({ date: "2026-11-04", status: undefined }), "2026-11-04").status, "planned");
  assert.equal(
    validateFlight(flight({ date: "2099-01-01", status: "planned" })).status,
    "planned",
  );
  assert.equal(
    validateFlight(
      flight({ airline: "", flight: "", model: null, modelLabel: "" }),
    ).model,
    null,
  );
  assert.equal(
    validateFlight(flight({ durationMinutes: "" })).durationMinutes,
    null,
  );
  assert.throws(() => validateFlight(flight({ durationMinutes: "abc" })));
  assert.throws(() => validateFlight(flight({ arrivalTime: "24:30" })));
  assert.throws(() =>
    validateFlight(flight({ origin: "YYZ", destination: "YYZ" })),
  );
});
test("Passport excludes future/cancelled flights; unknown delay and duration are not zero", () => {
  const rows = [
    flight({ durationMinutes: 300, delayMinutes: 20, aircraftYear: 2010 }),
    flight({
      id: "2",
      date: "2025-10-01",
      origin: "YVR",
      destination: "NRT",
      flight: "AC3",
      durationMinutes: 540,
      delayMinutes: -8,
    }),
    flight({ id: "3", flight: "AC5" }),
    flight({
      id: "4",
      flight: "AC6",
      status: "cancelled",
      durationMinutes: 900,
    }),
    flight({ id: "5", flight: "AC7", status: "planned", durationMinutes: 900 }),
  ];
  const all = passportStats(rows, airports);
  assert.equal(all.total, 3);
  assert.equal(all.durationMinutes, 840);
  assert.equal(all.durationKnown, 2);
  assert.equal(all.delayKnown, 2);
  assert.equal(all.delayMinutes, 20);
  assert.equal(all.onTime, 50);
  assert.deepEqual(all.countries, ["CA", "JP"]);
  assert.equal(all.oldest.age, 16);
  assert(all.totalKm > 10000);
  const year = passportStats(rows, airports, "2026");
  assert.equal(year.total, 2);
  assert.equal(year.durationKnown, 1);
  assert.equal(year.onTime, 0);
  const unknown = passportStats([flight()], airports);
  assert.equal(unknown.onTime, null);
  assert.equal(unknown.durationKnown, 0);
  assert.equal(unknown.worstDelay, null);
  assert.equal(passportStats([], airports).total, 0);
});
test("Flighty CSV resolves airline/model/registration and ignores duplicates", () => {
  const csv =
    'Date,Airline,Flight,From,To,Aircraft Type Name,Tail Number,Canceled,Notes\r\n2026-10-31,AC,123,YYZ,YVR,Boeing 777-300 ER,CFABC,false,"Window, clouds\nWonderful"\r\n2026-10-31,AC,123,YYZ,YVR,Boeing 777-300 ER,CFABC,false,Duplicate';
  const result = importFlightCsv(
    csv,
    catalog.airlines,
    profiles,
    catalog.aircraft,
  );
  assert.equal(result.duplicates, 1);
  assert.equal(result.flights.length, 1);
  assert.equal(result.flights[0].flight, "AC123");
  assert.equal(result.flights[0].airline, "Air Canada");
  assert.equal(result.flights[0].model, "Boeing 777-300ER");
  assert.equal(result.flights[0].registration, "C-FABC");
  assert.equal(result.flights[0].notes, "Window, clouds\nWonderful");
  assert.equal(result.flights[0].durationMinutes, null);
});
test("CSV round trip preserves extras; malformed input does not silently import", () => {
  const original = validateFlight(
    flight({
      seat: "1A",
      cabin: "business",
      durationMinutes: 240,
      delayMinutes: 0,
      bookingReference: "ABC123",
      trip: "A, B",
      notes: 'He said "hello"\nAgain',
    }),
  );
  const result = importFlightCsv(
    flightsCsv([original]),
    catalog.airlines,
    profiles,
    catalog.aircraft,
  );
  assert.deepEqual(result.flights[0], original);
  assert.throws(() => parseCsv("Date,Date\n1,2"), /Duplicate/);
  assert.throws(() => parseCsv('a,b\n"unterminated'), /Unclosed/);
  assert.throws(() => parseCsv("a,b\n1,2,3"), /column count/);
});
