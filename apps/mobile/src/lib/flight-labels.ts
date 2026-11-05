import catalog from "../../../../data/catalog.json" with { type: "json" };
import airports from "../generated/airports.json" with { type: "json" };
import chineseAirports from "./airport-names-zh.json" with { type: "json" };

const chineseAirlines = new Map(
  catalog.airlines.map((a) => [a.name, a.chineseName]),
);
export { aircraftName, aircraftSearchQuery } from "../../../../lib/aircraft-labels.mjs";

export function airlineName(name: string, locale: string) {
  return locale === "zh" ? chineseAirlines.get(name) || name : name;
}

export function airportName(code: string, locale: string) {
  return (
    (locale === "zh" && (chineseAirports as Record<string, string>)[code]) ||
    (airports as Record<string, { city: string }>)[code]?.city ||
    code
  );
}
