import {
  flightStats,
  flightRecords,
  flightBreakdown,
} from "../../../../lib/insights.mjs";
export function passportStats(flights, airports, year = "all") {
  const completed = flights.filter(
    (f) =>
      f.status === "completed" &&
      (year === "all" || f.date.startsWith(year + "-")),
  );
  const basic = flightStats(completed),
    records = flightRecords(completed, airports);
  const knownDuration = completed.filter((f) =>
    Number.isFinite(f.durationMinutes),
  );
  const knownDelay = completed.filter((f) => Number.isFinite(f.delayMinutes));
  const countries = [
    ...new Set(
      completed
        .flatMap((f) => [
          airports[f.origin]?.country,
          airports[f.destination]?.country,
        ])
        .filter(Boolean),
    ),
  ].sort();
  const rank = (values) => {
    const counts = new Map();
    for (const value of values)
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  const ages = completed
    .filter((f) => Number.isInteger(f.aircraftYear))
    .map((f) => ({
      flight: f,
      age: Number(f.date.slice(0, 4)) - f.aircraftYear,
    }));
  const breakdown = flightBreakdown(completed, airports);
  const delayed = knownDelay.filter((f) => f.delayMinutes > 0);
  const delayAirlines = [...new Set(delayed.map((f) => f.airline))]
    .filter(Boolean)
    .map((name) => ({
      name,
      count: delayed
        .filter((f) => f.airline === name)
        .reduce((s, f) => s + f.delayMinutes, 0),
    }))
    .sort((a, b) => b.count - a.count);
  return {
    ...basic,
    ...breakdown,
    delayCount: delayed.length,
    delayPercent: knownDelay.length
      ? Math.round((delayed.length / knownDelay.length) * 100)
      : null,
    averageDelay: delayed.length
      ? Math.round(
          delayed.reduce((s, f) => s + f.delayMinutes, 0) / delayed.length,
        )
      : null,
    delayAirlines,
    ...records,
    flights: completed,
    countries,
    durationMinutes: knownDuration.reduce((s, f) => s + f.durationMinutes, 0),
    durationKnown: knownDuration.length,
    delayMinutes: knownDelay.reduce(
      (s, f) => s + Math.max(0, f.delayMinutes),
      0,
    ),
    delayKnown: knownDelay.length,
    onTime: knownDelay.length
      ? Math.round(
          (knownDelay.filter((f) => f.delayMinutes < 15).length /
            knownDelay.length) *
            100,
        )
      : null,
    worstDelay:
      [...knownDelay].sort((a, b) => b.delayMinutes - a.delayMinutes)[0] ||
      null,
    airframes: rank(completed.map((f) => f.registration)),
    seats: rank(completed.map((f) => f.seatPosition)),
    cabins: rank(completed.map((f) => f.cabin)),
    oldest: [...ages].sort((a, b) => b.age - a.age)[0] || null,
    newest: [...ages].sort((a, b) => a.age - b.age)[0] || null,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: completed.filter((f) => Number(f.date.slice(5, 7)) === i + 1)
        .length,
    })),
    visited: [
      ...new Set(completed.flatMap((f) => [f.origin, f.destination])),
    ].sort(),
    flightDays: new Set(completed.map((f) => f.date)).size,
  };
}
