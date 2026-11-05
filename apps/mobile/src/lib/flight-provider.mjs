export function aviationstackFlight(payload, flight) {
  if (payload?.error)
    throw new Error(
      "Flight provider rejected the request. Check your account and plan.",
    );
  const normalize = (s) =>
    String(s || "")
      .toUpperCase()
      .replace(/\s/g, "");
  const rows = (Array.isArray(payload?.data) ? payload.data : []).filter(
    (row) =>
      normalize(row.flight?.iata) === normalize(flight.flight) &&
      row.flight_date === flight.date &&
      (!flight.origin || row.departure?.iata === flight.origin) &&
      (!flight.destination || row.arrival?.iata === flight.destination),
  );
  if (rows.length !== 1) return null;
  const r = rows[0];
  const text = (v) => (typeof v === "string" && v.length <= 100 ? v : "");
  // Provider operational timestamps have airport-local wall times; do not trust their UTC suffix.
  const local = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d/.test(v)
      ? v.slice(0, 16)
      : "";
  return {
    status: text(r.flight_status),
    flight: text(r.flight.iata),
    airline: text(r.airline?.name),
    origin: text(r.departure.iata),
    destination: text(r.arrival.iata),
    departureTerminal: text(r.departure.terminal),
    departureGate: text(r.departure.gate),
    arrivalTerminal: text(r.arrival.terminal),
    arrivalGate: text(r.arrival.gate),
    baggage: text(r.arrival.baggage),
    registration: text(r.aircraft?.registration),
    aircraftCode: text(r.aircraft?.iata),
    scheduledDeparture: local(r.departure.scheduled),
    estimatedDeparture: local(r.departure.estimated),
    actualDeparture: local(r.departure.actual),
    scheduledArrival: local(r.arrival.scheduled),
    estimatedArrival: local(r.arrival.estimated),
    actualArrival: local(r.arrival.actual),
    departureTimeZone: text(r.departure.timezone),
    arrivalTimeZone: text(r.arrival.timezone),
  };
}
