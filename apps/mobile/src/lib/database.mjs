export const SCHEMA_VERSION = 4;
export function todayLocal(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validateFlight(input, today = todayLocal()) {
  const text = (key) => String(input[key] ?? "").trim();
  const date = text("date");
  const parsed = new Date(`${date}T12:00:00`);
  const flight = {
    id: text("id"),
    date,
    airline: text("airline"),
    flight: text("flight").toUpperCase().replace(/\s/g, ""),
    origin: text("origin").toUpperCase(),
    destination: text("destination").toUpperCase(),
    model: text("model") || null,
    modelLabel: text("modelLabel") || text("model") || "—",
    registration: text("registration").toUpperCase() || null,
    status: text("status") || "planned",
    notes: text("notes"),
  };
  if (!flight.id || flight.id.length > 100)
    throw new Error("Invalid record ID");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.valueOf()) ||
    todayLocal(parsed) !== date
  )
    throw new Error("Enter a valid date / 请输入有效日期");
  if (flight.airline.length > 100)
    throw new Error("Enter an airline / 请输入航司");
  if (flight.flight && !/^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(flight.flight))
    throw new Error(
      "Enter a flight number such as AC123 / 请输入航班号，例如 AC123",
    );
  if (
    !/^[A-Z]{3}$/.test(flight.origin) ||
    !/^[A-Z]{3}$/.test(flight.destination) ||
    flight.origin === flight.destination
  )
    throw new Error(
      "Use different 3-letter airport codes / 请输入不同的三位机场代码",
    );
  if (!["completed", "planned", "cancelled"].includes(flight.status))
    throw new Error("Invalid flight status");
  if (flight.status !== "cancelled")
    flight.status = date < today ? "completed" : "planned";
  if (
    (flight.registration?.length || 0) > 30 ||
    (flight.model?.length || 0) > 100 ||
    flight.modelLabel.length > 100 ||
    flight.notes.length > 4000
  )
    throw new Error("A field is too long / 输入内容过长");
  const details = {};
  for (const [key, max] of [
    ["durationMinutes", 2880],
    ["delayMinutes", 20160],
    ["aircraftYear", Number(date.slice(0, 4))],
  ]) {
    if (input[key] != null && String(input[key]).trim() !== "") {
      const n = Number(input[key]);
      const min =
        key === "delayMinutes" ? -1440 : key === "aircraftYear" ? 1903 : 0;
      if (!Number.isInteger(n) || n < min || n > max)
        throw new Error(`Invalid ${key} / 数值超出范围`);
      details[key] = n;
    } else details[key] = null;
  }
  for (const key of [
    "seat",
    "seatPosition",
    "cabin",
    "departureTime",
    "arrivalTime",
    "departureTerminal",
    "arrivalTerminal",
    "departureGate",
    "arrivalGate",
    "baggage",
    "trip",
    "bookingReference",
    "arrivalDate",
    "departureTimeZone",
    "arrivalTimeZone",
    "gateDepartureScheduled",
    "gateDepartureActual",
    "takeoffActual",
    "landingActual",
    "gateArrivalScheduled",
    "gateArrivalActual",
  ]) {
    const value = text(key);
    if (value.length > 100) throw new Error("A field is too long");
    if (
      value &&
      ["departureTime", "arrivalTime"].includes(key) &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    )
      throw new Error("Use HH:MM for local times / 时间格式请用 HH:MM");
    details[key] = value;
  }
  if (
    details.arrivalDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(details.arrivalDate) ||
      todayLocal(new Date(`${details.arrivalDate}T12:00:00`)) !==
        details.arrivalDate)
  )
    throw new Error("Invalid arrival date / 到达日期无效");
  for (const key of ["departureTimeZone", "arrivalTimeZone"]) {
    if (details[key]) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: details[key] }).format();
      } catch {
        throw new Error("Invalid time zone / 时区无效");
      }
    }
  }
  for (const key of [
    "gateDepartureScheduled",
    "gateDepartureActual",
    "takeoffActual",
    "landingActual",
    "gateArrivalScheduled",
    "gateArrivalActual",
  ]) {
    if (
      details[key] &&
      (!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(details[key]) ||
        !Number.isFinite(Date.parse(details[key] + ":00Z")) ||
        new Date(details[key] + ":00Z").toISOString().slice(0, 16) !==
          details[key])
    )
      throw new Error("Invalid flight event time");
  }
  details.reminders = input.reminders === true;
  return { ...flight, ...details };
}
export async function initializeDatabase(db, seed) {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync("PRAGMA user_version");
  if (row.user_version > SCHEMA_VERSION)
    throw new Error("This database needs a newer version of SKYLOG.");
  if (row.user_version === 0) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`CREATE TABLE flights (
        id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, airline TEXT NOT NULL, flight TEXT NOT NULL,
        origin TEXT NOT NULL, destination TEXT NOT NULL, model TEXT, modelLabel TEXT NOT NULL, registration TEXT,
        status TEXT NOT NULL CHECK(status IN ('completed','planned','cancelled')), notes TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}'
      ); CREATE INDEX flight_date ON flights(date);
      CREATE TABLE preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE saved_photos (photoId TEXT PRIMARY KEY NOT NULL, savedAt TEXT NOT NULL);`);
      for (const f of seed)
        await writeFlight(db, { ...f, status: "completed", notes: "" });
      await db.execAsync("PRAGMA user_version = 2");
    });
  } else if (row.user_version === 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        "ALTER TABLE flights ADD COLUMN details TEXT NOT NULL DEFAULT '{}'; PRAGMA user_version = 2",
      );
    });
  }
  if (row.user_version < 3)
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        "CREATE TABLE IF NOT EXISTS provider_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, fetchedAt INTEGER NOT NULL); PRAGMA user_version=3",
      );
    });
  if (row.user_version < 4)
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        "DROP TABLE IF EXISTS provider_requests; PRAGMA user_version=4",
      );
    });
}
async function writeFlight(db, f) {
  const details = Object.fromEntries(
    Object.entries(f).filter(
      ([key]) =>
        ![
          "id",
          "date",
          "airline",
          "flight",
          "origin",
          "destination",
          "model",
          "modelLabel",
          "registration",
          "status",
          "notes",
          "updatedAt",
        ].includes(key),
    ),
  );
  await db.runAsync(
    `INSERT INTO flights (id,date,airline,flight,origin,destination,model,modelLabel,registration,status,notes,updatedAt,details)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET date=excluded.date,airline=excluded.airline,flight=excluded.flight,
    origin=excluded.origin,destination=excluded.destination,model=excluded.model,modelLabel=excluded.modelLabel,registration=excluded.registration,
    status=excluded.status,notes=excluded.notes,updatedAt=excluded.updatedAt,details=excluded.details`,
    f.id,
    f.date,
    f.airline,
    f.flight,
    f.origin,
    f.destination,
    f.model,
    f.modelLabel,
    f.registration,
    f.status,
    f.notes,
    new Date().toISOString(),
    JSON.stringify(details),
  );
}
export async function saveFlight(db, input, today) {
  const f = validateFlight(input, today);
  if (f.flight) {
    const duplicate = await db.getFirstAsync(
      "SELECT id FROM flights WHERE date=? AND flight=? AND origin=? AND destination=? AND id<>?",
      f.date,
      f.flight,
      f.origin,
      f.destination,
      f.id,
    );
    if (duplicate)
      throw new Error(
        "This flight already exists / 这段航班已存在，请编辑原记录",
      );
  }
  await writeFlight(db, f);
  return f;
}
export async function deleteFlight(db, id) {
  await db.runAsync("DELETE FROM flights WHERE id = ?", id);
}
export async function readLocalData(db) {
  const [flights, preferences, saved] = await Promise.all([
    db.getAllAsync("SELECT * FROM flights ORDER BY date DESC, id"),
    db.getAllAsync("SELECT * FROM preferences"),
    db.getAllAsync("SELECT photoId FROM saved_photos ORDER BY savedAt DESC"),
  ]);
  return {
    flights: flights.map(({ details, ...f }) => ({
      ...f,
      ...JSON.parse(details),
    })),
    preferences: Object.fromEntries(preferences.map((p) => [p.key, p.value])),
    saved: saved.map((s) => s.photoId),
  };
}
export async function setPreference(db, key, value) {
  if (
    !(
      (key === "locale" && ["en", "zh"].includes(value)) ||
      (key === "theme" && ["dark", "light", "system"].includes(value)) ||
      (key === "activeFlight" &&
        typeof value === "string" &&
        value.length <= 100)
    )
  )
    throw new Error("Invalid preference");
  await db.runAsync(
    "INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    key,
    value,
  );
}
export async function setPhotoSaved(db, photoId, saved) {
  if (saved)
    await db.runAsync(
      "INSERT OR IGNORE INTO saved_photos (photoId,savedAt) VALUES (?,?)",
      photoId,
      new Date().toISOString(),
    );
  else await db.runAsync("DELETE FROM saved_photos WHERE photoId = ?", photoId);
}
export async function exportBackup(db) {
  return {
    format: "skylog-local",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(await readLocalData(db)),
  };
}

export function validateBackup(value, today) {
  if (
    value?.format !== "skylog-local" ||
    value.version !== 1 ||
    !Array.isArray(value.flights) ||
    value.flights.length > 10000 ||
    !Array.isArray(value.saved) ||
    value.saved.length > 10000
  )
    throw new Error("Invalid SKYLOG backup");
  const flights = value.flights.map((f) => validateFlight(f, today));
  if (new Set(flights.map((f) => f.id)).size !== flights.length)
    throw new Error("Duplicate record IDs");
  if (value.saved.some((id) => typeof id !== "string" || id.length > 100))
    throw new Error("Invalid saved photographs");
  const preferences = {};
  if (["en", "zh"].includes(value.preferences?.locale))
    preferences.locale = value.preferences.locale;
  if (["dark", "light", "system"].includes(value.preferences?.theme))
    preferences.theme = value.preferences.theme;
  return { flights, saved: [...new Set(value.saved)], preferences };
}
export async function mergeBackup(db, value, today) {
  const backup = validateBackup(value, today);
  await db.withTransactionAsync(async () => {
    for (const f of backup.flights) {
      const existing = f.flight
        ? await db.getFirstAsync(
            "SELECT * FROM flights WHERE date=? AND flight=? AND origin=? AND destination=?",
            f.date,
            f.flight,
            f.origin,
            f.destination,
          )
        : null;
      if (value.source === "flighty-csv" && existing) {
        const { details, ...base } = existing;
        const current = { ...base, ...JSON.parse(details) };
        const filled = {
          ...f,
          ...Object.fromEntries(
            Object.entries(current).filter(
              ([, v]) => v != null && v !== "" && v !== "—",
            ),
          ),
        };
        await writeFlight(db, validateFlight(filled, today));
      } else await writeFlight(db, { ...f, id: existing?.id || f.id });
    }
    for (const id of backup.saved) await setPhotoSaved(db, id, true);
    for (const [key, value] of Object.entries(backup.preferences))
      await setPreference(db, key, value);
  });
}
