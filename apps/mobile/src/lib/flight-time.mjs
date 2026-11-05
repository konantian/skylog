const formatters = new Map();
function localParts(timestamp, zone) {
  let formatter = formatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(zone, formatter);
  }
  const p = Object.fromEntries(
    formatter.formatToParts(timestamp).map((p) => [p.type, p.value]),
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Reject the missing/repeated hour at DST transitions instead of guessing an instant.
export function airportInstant(local, zone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local || "") || !zone)
    return null;
  const clock = Date.parse(local + ":00Z");
  if (!Number.isFinite(clock)) return null;
  try {
    const offsets = new Set(
      [-36, -12, 0, 12, 36].map((h) => {
        const probe = clock + h * 3600000;
        return Date.parse(localParts(probe, zone) + ":00Z") - probe;
      }),
    );
    const matches = [...offsets]
      .map((offset) => clock - offset)
      .filter((candidate) => localParts(candidate, zone) === local);
    return matches.length === 1 ? matches[0] : null;
  } catch {
    return null;
  }
}

export function flightTimes(flight, zones) {
  const departureZone = flight.departureTimeZone || zones[flight.origin];
  const arrivalZone = flight.arrivalTimeZone || zones[flight.destination];
  const departure = airportInstant(
    `${flight.date}T${flight.departureTime}`,
    departureZone,
  );
  // No assumption that an overnight or date-line flight arrives on its departure date.
  const arrival = flight.arrivalDate
    ? airportInstant(`${flight.arrivalDate}T${flight.arrivalTime}`, arrivalZone)
    : null;
  return { departure, arrival, departureZone, arrivalZone };
}

export function connectionFor(flight, flights, zones) {
  const arrival = flightTimes(flight, zones).arrival;
  if (arrival == null || flight.status === "cancelled") return null;
  const candidates = flights
    .filter(
      (f) =>
        f.id !== flight.id &&
        f.status !== "cancelled" &&
        f.origin === flight.destination,
    )
    .map((f) => ({ flight: f, departure: flightTimes(f, zones).departure }))
    .filter(
      (c) =>
        c.departure != null &&
        c.departure >= arrival &&
        c.departure - arrival <= 24 * 3600000,
    )
    .sort((a, b) => a.departure - b.departure);
  const next = candidates[0];
  return next
    ? {
        flight: next.flight,
        minutes: Math.round((next.departure - arrival) / 60000),
      }
    : null;
}

export function reminderPlan(flights, zones, now = Date.now()) {
  return flights
    .filter((f) => f.status === "planned" && f.reminders)
    .flatMap((f) => {
      const departure = flightTimes(f, zones).departure;
      if (departure == null) return [];
      return [1440, 180]
        .map((minutes) => ({
          id: `skylog:${f.id}:${minutes}`,
          flight: f,
          minutes,
          at: departure - minutes * 60000,
        }))
        .filter((r) => r.at > now);
    })
    .sort((a, b) => a.at - b.at)
    .slice(0, 48);
}

export function itineraryText(f, zones, locale = "en") {
  const { departureZone, arrivalZone } = flightTimes(f, zones);
  return [
    f.airline,
    `${f.flight} · ${f.origin} → ${f.destination}`,
    `${f.date} ${f.departureTime || "—"} (${departureZone || f.origin})`,
    `${f.arrivalDate || "—"} ${f.arrivalTime || "—"} (${arrivalZone || f.destination})`,
    locale === "zh"
      ? "已保存的航程 · 请以航司最新信息为准"
      : "Saved itinerary · check the airline for updates",
    "SKYLOG",
  ].join("\n");
}
