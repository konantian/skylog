import { todayLocal, validateFlight } from "./database.mjs";
export function parseCsv(text) {
  if (text.length > 10_000_000) throw new Error("CSV is too large");
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length < 2 || rows.length > 10001)
    throw new Error("CSV must contain 1–10000 flights");
  const headers = rows.shift().map((s) => s.replace(/^\uFEFF/, "").trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("Duplicate CSV columns");
  return rows.map((cells, index) => {
    if (cells.length !== headers.length)
      throw new Error(`CSV row ${index + 2}: wrong column count`);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}
const aliases = {
  "Boeing 777-300 ER": "Boeing 777-300ER",
  "Boeing 777-200 LR": "Boeing 777-200LR",
  "Bombardier CRJ900": "Bombardier CRJ-900",
  "Embraer 195 E2": "Embraer E195-E2",
  "DHC-8-400 Dash 8Q": "De Havilland Canada Dash 8-400",
  "DHC-8-300 Dash 8": "De Havilland Canada Dash 8-300",
};
export function importFlightCsv(
  text,
  airlines,
  profiles,
  aircraft,
  today = todayLocal(),
) {
  const rows = parseCsv(text),
    flights = [],
    keys = new Set();
  let duplicates = 0;
  for (const [index, row] of rows.entries()) {
    try {
      const date = (row.Date || row.date || "").trim();
      const raw = (row.Airline || row.airline || "").trim();
      const carrier = airlines.find(
        (a) =>
          a.name.toLowerCase() === raw.toLowerCase() ||
          a.code === raw ||
          profiles[a.name]?.designators.some((d) => d.icao === raw),
      );
      const airline = carrier?.name || raw;
      let number = (row.Flight || row.flight || "")
        .trim()
        .replace(/\s/g, "")
        .toUpperCase();
      if (/^\d{1,4}[A-Z]?$/.test(number)) {
        if (!carrier?.code)
          throw new Error("Unknown airline code; use a full flight number");
        number = carrier.code + number;
      }
      const origin = (row.From || row.origin || "").trim().toUpperCase(),
        destination = (row.To || row.destination || "").trim().toUpperCase();
      const key = `${date}-${number}-${origin}-${destination}`;
      if (keys.has(key)) {
        duplicates++;
        continue;
      }
      keys.add(key);
      const label = (row["Aircraft Type Name"] || row.modelLabel || "").trim();
      const modelLabel = aliases[label] || label;
      let registration = (row["Tail Number"] || row.registration || "")
        .trim()
        .toUpperCase();
      if (/^C[FGI][A-Z]{3}$/.test(registration))
        registration = registration[0] + "-" + registration.slice(1);
      if (/^B[A-Z0-9]{3,4}$/.test(registration))
        registration = "B-" + registration.slice(1);
      if (/^CS[A-Z]{3}$/.test(registration))
        registration = "CS-" + registration.slice(2);
      const status =
        String(row.Canceled || "").toLowerCase() === "true"
          ? "cancelled"
          : row.status || (date > today ? "planned" : "completed");
      const f = {
        id: row.id || key,
        date,
        flight: number,
        airline,
        origin,
        destination,
        model: aircraft.some((a) => a.name === modelLabel) ? modelLabel : null,
        modelLabel,
        registration,
        status,
        notes: row.Notes || row.notes || "",
        seat: row.Seat || row.seat || "",
        seatPosition: row.seatPosition || "",
        cabin: row.Cabin || row.cabin || "",
        durationMinutes: row.durationMinutes || null,
        delayMinutes: row.delayMinutes || null,
        aircraftYear: row.aircraftYear || null,
      };
      for (const key of [
        "departureTime",
        "arrivalTime",
        "departureTerminal",
        "arrivalTerminal",
        "departureGate",
        "arrivalGate",
        "baggage",
        "trip",
        "bookingReference",
      ])
        f[key] = row[key] || "";
      flights.push(validateFlight(f, today));
    } catch (error) {
      throw new Error(`Row ${index + 2}: ${error.message}`);
    }
  }
  return {
    format: "skylog-local",
    version: 1,
    flights,
    saved: [],
    preferences: {},
    duplicates,
  };
}
export function flightsCsv(flights) {
  const keys = [
    "id",
    "date",
    "airline",
    "flight",
    "origin",
    "destination",
    "modelLabel",
    "registration",
    "status",
    "durationMinutes",
    "delayMinutes",
    "aircraftYear",
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
    "notes",
  ];
  const cell = (value) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  return [
    keys.map(cell).join(","),
    ...flights.map((f) => keys.map((k) => cell(f[k])).join(",")),
  ].join("\r\n");
}
