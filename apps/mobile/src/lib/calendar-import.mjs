export function calendarFlight(event, airports, zones, now = Date.now()) {
  if (event.allDay) return null;
  // Only explicit flight/route patterns. Calendar notes never leave this device.
  const text =
    `${event.title || ""} ${event.location || ""} ${event.notes || ""}`.toUpperCase();
  const numbers = [
    ...new Set(
      [
        ...text.matchAll(/\b((?:[A-Z][A-Z0-9]|[0-9][A-Z])\s?\d{1,4}[A-Z]?)\b/g),
      ].map((m) => m[1].replace(/\s/g, "")),
    ),
  ];
  const routes = [
    ...text.matchAll(/\b([A-Z]{3})\s*(?:→|->|–|—|-|TO)\s*([A-Z]{3})\b/g),
  ].filter((m) => airports[m[1]] && airports[m[2]] && m[1] !== m[2]);
  const uniqueRoutes = [
    ...new Map(routes.map((m) => [`${m[1]}-${m[2]}`, m])).values(),
  ];
  if (numbers.length !== 1 || uniqueRoutes.length !== 1) return null;
  const [, origin, destination] = uniqueRoutes[0];
  if (!zones[origin] || !zones[destination]) return null;
  const start = new Date(event.startDate).getTime(),
    end = new Date(event.endDate).getTime();
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    end - start > 48 * 3600000
  )
    return null;
  const local = (value, zone) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(value)
        .map((p) => [p.type, p.value]),
    );
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      time: `${parts.hour}:${parts.minute}`,
    };
  };
  const dep = local(start, zones[origin]),
    arr = local(end, zones[destination]);
  return {
    flight: numbers[0],
    origin,
    destination,
    date: dep.date,
    departureTime: dep.time,
    arrivalDate: arr.date,
    arrivalTime: arr.time,
    status: start > now ? "planned" : "completed",
  };
}
