import { aviationstackFlight } from "../../apps/mobile/src/lib/flight-provider.mjs";
const WINDOW = 31 * 86400000;
export const LIMIT = 80;
export function validateQuery(input, now = Date.now()) {
  if (!input || typeof input !== "object") return null;
  const { date, flight, origin = "", destination = "" } = input;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date || "") ||
    !/^(?:[A-Z][A-Z0-9]|[0-9][A-Z])\d{1,4}[A-Z]?$/.test(flight || "")
  )
    return null;
  const day = Date.parse(date + "T12:00:00Z");
  if (
    !Number.isFinite(day) ||
    new Date(day).toISOString().slice(0, 10) !== date ||
    Math.abs(day - now) > 48 * 3600000
  )
    return null;
  if (
    (origin && !/^[A-Z]{3}$/.test(origin)) ||
    (destination && !/^[A-Z]{3}$/.test(destination))
  )
    return null;
  return { date, flight, origin, destination };
}
export class FlightCache {
  constructor(storage, key, fetcher = fetch, clock = Date.now) {
    this.storage = storage;
    this.key = key;
    this.fetcher = fetcher;
    this.clock = clock;
    this.pending = new Map();
  }
  async usage() {
    const values = (await this.storage.get("requests")) || [];
    return {
      used: values.filter((t) => t > this.clock() - WINDOW).length,
      limit: LIMIT,
    };
  }
  async query(input) {
    // One upstream response can serve both lookup and later route-specific checks.
    const cacheKey = `flight:v3:${input.date}:${input.flight}`;
    if (this.pending.has(cacheKey))
      return this.pending
        .get(cacheKey)
        .then((value) => this.select(value, input));
    const work = this.load(cacheKey, input).finally(() =>
      this.pending.delete(cacheKey),
    );
    this.pending.set(cacheKey, work);
    return this.select(await work, input);
  }
  select(value, input) {
    return {
      ...value,
      data: value.payload ? aviationstackFlight(value.payload, input) : null,
      payload: undefined,
    };
  }
  async load(cacheKey, input) {
    const now = this.clock();
    const cached = await this.storage.get(cacheKey);
    if (cached && now - cached.checkedAt < 3600000)
      return { ...cached, ...(await this.usage()) };
    if (!this.key)
      return {
        error: "not_configured",
        dataFetchedAt: null,
        ...(await this.usage()),
      };
    const allowed = await this.storage.transaction(async (tx) => {
      const recent = ((await tx.get("requests")) || []).filter(
        (t) => t > now - WINDOW,
      );
      if (recent.length >= LIMIT) return false;
      await tx.put("requests", [...recent, now]);
      return true;
    });
    if (!allowed) return { ...cached, error: "quota", ...(await this.usage()) };
    let value;
    let reason = "network";
    try {
      const response = await this.fetcher.call(
        globalThis,
        `https://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(this.key)}&flight_iata=${encodeURIComponent(input.flight)}&limit=100`,
        {
          signal: AbortSignal.timeout(20000),
          headers: { "User-Agent": "SKYLOG/1.0" },
        },
      );
      if (!response.ok) {
        reason = `http_${response.status}`;
        throw Error("upstream");
      }
      const payload = await response.json();
      if (payload.error || !Array.isArray(payload.data)) {
        const code = payload.error?.code;
        reason = [
          "invalid_access_key",
          "usage_limit_reached",
          "function_access_restricted",
          "https_access_restricted",
          "rate_limit_reached",
        ].includes(code)
          ? code
          : "invalid_response";
        throw Error("upstream");
      }
      // Persist only the requested date/number, not unrelated people or provider metadata.
      const rows = payload.data.filter(
        (r) =>
          r.flight_date === input.date &&
          String(r.flight?.iata || "")
            .replace(/\s/g, "")
            .toUpperCase() === input.flight,
      );
      value = {
        payload: { data: rows },
        error: null,
        checkedAt: now,
        dataFetchedAt: now,
      };
    } catch {
      value = {
        payload: cached?.payload || null,
        error: "unavailable",
        reason,
        checkedAt: now,
        dataFetchedAt: cached?.dataFetchedAt || null,
      };
    }
    await this.storage.put(cacheKey, value);
    return { ...value, ...(await this.usage()) };
  }
}
