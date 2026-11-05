export function aircraftPosition(payload, registration, now = Date.now()) {
  if (!/^[A-Z0-9-]{3,12}$/i.test(registration || "")) return null;
  const rawTime = payload?.now;
  const timestamp =
    typeof rawTime === "number"
      ? rawTime < 1e12
        ? rawTime * 1000
        : rawTime
      : NaN;
  if (
    !Number.isFinite(timestamp) ||
    now - timestamp > 120000 ||
    timestamp - now > 30000
  )
    return null;
  const normalize = (value) =>
    String(value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  const matches = (
    Array.isArray(payload?.aircraft)
      ? payload.aircraft
      : Array.isArray(payload?.ac)
        ? payload.ac
        : []
  ).filter(
    (a) =>
      normalize(a.r) === normalize(registration) &&
      Number.isFinite(a.lat) &&
      Math.abs(a.lat) <= 90 &&
      Number.isFinite(a.lon) &&
      Math.abs(a.lon) <= 180 &&
      Number.isFinite(a.seen_pos) &&
      a.seen_pos >= 0 &&
      a.seen_pos <= 120,
  );
  if (matches.length !== 1) return null;
  const a = matches[0],
    observedAt = timestamp - a.seen_pos * 1000;
  if (now - observedAt > 120000 || !/^[a-f0-9]{6}$/i.test(a.hex || ""))
    return null;
  return {
    registration: a.r,
    hex: a.hex,
    callsign: String(a.flight || "").trim(),
    latitude: a.lat,
    longitude: a.lon,
    altitude: Number.isFinite(a.alt_baro) ? a.alt_baro : null,
    speed: Number.isFinite(a.gs) ? a.gs : null,
    track: Number.isFinite(a.track) ? a.track : null,
    onGround: a.alt_baro === "ground",
    observedAt,
  };
}

export function metarObservation(payload, station) {
  const row = Array.isArray(payload)
    ? payload.find((r) => r.icaoId === station)
    : null;
  if (!row || typeof row.rawOb !== "string" || !Number.isFinite(row.obsTime))
    return null;
  return {
    station,
    text: row.rawOb,
    observedAt: row.obsTime * 1000,
    temperature: Number.isFinite(row.temp) ? row.temp : null,
    windSpeed: Number.isFinite(row.wspd) ? row.wspd : null,
    windDirection: Number.isFinite(row.wdir)
      ? row.wdir
      : row.wdir === "VRB"
        ? "VRB"
        : null,
    category: typeof row.fltCat === "string" ? row.fltCat : null,
  };
}

const inFlight = new Map();
export async function cachedProvider(
  db,
  key,
  url,
  ttl,
  parse,
  now = Date.now(),
  fetcher = fetch,
) {
  if (inFlight.has(key)) return inFlight.get(key);
  const run = async () => {
    const existing = await db.getFirstAsync(
      "SELECT * FROM provider_cache WHERE key=?",
      key,
    );
    if (existing && now - existing.fetchedAt < ttl)
      return { ...JSON.parse(existing.value), fetchedAt: existing.fetchedAt };
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let result;
      try {
        const response = await fetcher(url, {
          signal: controller.signal,
          headers: { "User-Agent": "SKYLOG/1.0 (personal flight journal)" },
        });
        if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
        result = response.status === 204 ? null : parse(await response.json());
      } finally {
        clearTimeout(timer);
      }
      const value = { data: result, error: null, dataFetchedAt: now };
      await db.runAsync(
        "INSERT INTO provider_cache(key,value,fetchedAt) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,fetchedAt=excluded.fetchedAt",
        key,
        JSON.stringify(value),
        now,
      );
      return { ...value, fetchedAt: now };
    } catch {
      // Cache a bounded failure as well, so reopening a screen cannot hammer a provider.
      const previous = existing ? JSON.parse(existing.value) : null;
      const value = {
        data: previous?.data || null,
        dataFetchedAt: previous?.dataFetchedAt || existing?.fetchedAt || null,
        error: "unavailable",
      };
      await db.runAsync(
        "INSERT INTO provider_cache(key,value,fetchedAt) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,fetchedAt=excluded.fetchedAt",
        key,
        JSON.stringify(value),
        now,
      );
      return { ...value, fetchedAt: now };
    }
  };
  const task = run().finally(() => inFlight.delete(key));
  inFlight.set(key, task);
  return task;
}
