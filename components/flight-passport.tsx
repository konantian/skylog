"use client";
import { useMemo, useState } from "react";
import airports from "@/data/airports.json";
import { flightBreakdown } from "@/lib/insights.mjs";
import type { Flight, Filters } from "@/lib/types";
import { useLocale } from "./locale-provider";

export function FlightPassport({
  flights,
  year,
  onFilter,
}: {
  flights: Flight[];
  year: string;
  onFilter: (key: keyof Filters, value: string) => void;
}) {
  const { locale, t } = useLocale();
  const w = (en: string, zh: string) => (locale === "en" ? en : zh);
  const [period, setPeriod] = useState<"years" | "months" | "weekdays">(
    "months",
  );
  const [ranking, setRanking] = useState<"airports" | "airframes" | "distance">(
    "airports",
  );
  const stats = useMemo(() => flightBreakdown(flights, airports), [flights]);
  const bars = stats[period] as { name: string; count: number }[],
    max = Math.max(1, ...bars.map((b) => b.count));
  const ranks = (
    ranking === "airports"
      ? stats.airportRanking
      : ranking === "airframes"
        ? stats.airframes
        : stats.airlineDistance
  ) as { name: string; count: number }[];
  const weekdays =
    locale === "en"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["日", "一", "二", "三", "四", "五", "六"];
  return (
    <section
      className="flight-passport"
      aria-labelledby="flight-passport-title"
    >
      <header>
        <div>
          <span className="eyebrow">PERSONAL FLIGHT PASSPORT</span>
          <h4 id="flight-passport-title">
            {w("A closer look at your journeys", "把旅途看得更细")}
          </h4>
        </div>
        <span className="passport-scope">
          {year === "all" ? w("All years", "全部年份") : year} ·{" "}
          {flights.length} {w("flights in current filters", "段当前筛选航班")}
        </span>
      </header>
      <div className="passport-facts">
        {[
          [stats.domestic, w("Domestic / regional", "境内航段")],
          [stats.international, w("Cross-border", "跨境航段")],
          [stats.longDistance, w("Routes over 4,000 km", "4,000 km 以上航段")],
          [stats.countries.length, w("Countries / regions", "国家／地区")],
          [
            stats.averageKm === null
              ? "—"
              : `${Math.round(stats.averageKm).toLocaleString()} km`,
            w("Average route · estimated", "平均航程 · 估算"),
          ],
          [
            `${stats.earthTrips.toFixed(1)}×`,
            w("Around Earth · estimated", "绕地球圈数 · 估算"),
          ],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="passport-explore">
        <div>
          <div
            className="ranking-tabs"
            role="group"
            aria-label={w("Chart grouping", "统计时间粒度")}
          >
            {[
              ["years", w("Year", "按年")],
              ["months", w("Month", "按月")],
              ["weekdays", w("Weekday", "按星期")],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={period === key}
                onClick={() => setPeriod(key as typeof period)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="passport-chart"
            role="img"
            aria-label={bars
              .map(
                (b) =>
                  `${period === "weekdays" ? weekdays[Number(b.name)] : b.name}: ${b.count}`,
              )
              .join(", ")}
          >
            {bars.map((b) => (
              <div key={b.name}>
                <b>{b.count || ""}</b>
                <span className="passport-bar">
                  <i style={{ height: `${(b.count / max) * 100}%` }} />
                </span>
                <small>
                  {period === "weekdays"
                    ? weekdays[Number(b.name)]
                    : period === "years"
                      ? b.name.slice(-2)
                      : b.name}
                </small>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div
            className="ranking-tabs"
            role="group"
            aria-label={w("Journey rankings", "旅程排行")}
          >
            {[
              ["airports", w("Airports", "机场")],
              ["airframes", w("Airframes", "具体飞机")],
              ["distance", w("Airline distance", "航司里程")],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={ranking === key}
                onClick={() => setRanking(key as typeof ranking)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="passport-ranking">
            {ranks.length ? (
              ranks.slice(0, 8).map((item, i) => (
                <button
                  key={t(item.name)}
                  onClick={() =>
                    onFilter(
                      ranking === "airports"
                        ? "flightAirport"
                        : ranking === "airframes"
                          ? "query"
                          : "airline",
                      item.name,
                    )
                  }
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <strong>
                    {t(item.name)}
                    {ranking === "airports" && (
                      <small>
                        {
                          t((airports as Record<string, { city: string }>)[
                            item.name
                          ]?.city)
                        }
                      </small>
                    )}
                  </strong>
                  <b>
                    {item.count.toLocaleString()}
                    <small>
                      {ranking === "distance"
                        ? " km"
                        : ranking === "airports"
                          ? w(" events", " 次起降")
                          : w(" flights", " 段")}
                    </small>
                  </b>
                </button>
              ))
            ) : (
              <p>{w("No matching records.", "暂无符合筛选的记录。")}</p>
            )}
          </div>
        </div>
      </div>
      <p className="stats-note">
        {w(
          "Updates with your filters. Distances use great-circle estimates. Airport rankings count each departure and arrival, including connections. Domestic / cross-border uses airport country or region codes.",
          "跟随当前筛选更新。航程按大圆距离估算；机场排行逐次统计起降，包含转机。境内／跨境按机场国家或地区代码区分。",
        )}
        {stats.unclassified > 0 &&
          w(
            ` ${stats.unclassified} flights lack airport country data.`,
            ` ${stats.unclassified} 段缺少机场国家资料。`,
          )}
      </p>
    </section>
  );
}
