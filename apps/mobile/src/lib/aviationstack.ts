import type { SQLiteDatabase } from "expo-sqlite";
import { cachedProvider } from "./live-data.mjs";
import { aviationstackFlight } from "./flight-provider.mjs";
import { flightTimes } from "./flight-time.mjs";
import { airportTimezones, type LocalFlight } from "./catalog";
const endpoint = process.env.EXPO_PUBLIC_FLIGHTS_URL || "";
const appToken = process.env.EXPO_PUBLIC_FLIGHTS_TOKEN || "";
export const flightServiceConfigured = !!endpoint && !!appToken;
type Observation = {
  data: ReturnType<typeof aviationstackFlight>;
  error: string | null;
  dataFetchedAt?: number | null;
  used?: number;
  limit?: number;
};
async function service(path: string, body?: object) {
  if (!flightServiceConfigured)
    throw new Error(
      "Flight service unavailable in this build / 当前构建未配置航班服务",
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  let response: Response;
  try {
    response = await fetch(endpoint + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${appToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok)
    throw new Error("Flight service unavailable / 航班服务暂不可用");
  return response.json();
}
export async function providerUsage() {
  return service("/usage") as Promise<{ used: number; limit: number }>;
}
async function observation(
  db: SQLiteDatabase,
  f: { date: string; flight: string; origin?: string; destination?: string },
) {
  const result = await cachedProvider(
    db,
    `proxy:${f.date}:${f.flight}:${f.origin || ""}:${f.destination || ""}`,
    "skylog-service",
    60000,
    (value: Observation) => value,
    Date.now(),
    async () => {
      const result = await service("/flight", f);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  );
  return {
    data: result.data?.data || null,
    error: result.error || result.data?.error || null,
    fetchedAt: result.fetchedAt,
    dataFetchedAt: result.data?.dataFetchedAt || null,
  };
}
export async function queryFlight(db: SQLiteDatabase, flight: LocalFlight) {
  const departure = flightTimes(flight, airportTimezones).departure;
  if (
    flight.status !== "planned" ||
    departure == null ||
    Math.abs(departure - Date.now()) > 86400000
  )
    throw new Error(
      "Available around upcoming flights only / 仅在计划出发前后 24 小时内查询待出发行程",
    );
  return observation(db, {
    date: flight.date,
    flight: flight.flight,
    origin: flight.origin,
    destination: flight.destination,
  });
}
export async function lookupCurrentFlight(
  db: SQLiteDatabase,
  date: string,
  number: string,
) {
  const local = new Date();
  const today = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
  if (date !== today)
    throw new Error(
      "Free-plan lookup is available for today. Use Flighty CSV for history or enter future itineraries manually. / 免费方案仅查询今天；历史记录可导入 Flighty CSV，未来行程可手动填写。",
    );
  if (!/^(?:[A-Z][A-Z0-9]|[0-9][A-Z])\d{1,4}[A-Z]?$/.test(number))
    throw new Error("Enter a flight number / 请填写航班号");
  return observation(db, { date, flight: number });
}
