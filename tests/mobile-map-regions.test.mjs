import test from "node:test";
import assert from "node:assert/strict";
import flights from "../data/flights.json" with { type: "json" };
import airports from "../apps/mobile/src/generated/airports.json" with { type: "json" };
import { passportStats } from "../apps/mobile/src/lib/passport.mjs";
import { visitedMapRegions } from "../apps/mobile/src/lib/map-regions.mjs";

test("Passport map offers only regions visited in the selected year's completed flights", () => {
  const history = flights.flights.map((f) => ({ ...f, status: "completed" }));
  history.push({
    date: "2022-12-30",
    origin: "YVR",
    destination: "NRT",
    status: "cancelled",
  });
  history.push({
    date: "2022-12-31",
    origin: "YVR",
    destination: "LHR",
    status: "planned",
  });
  for (const [year, expected] of [
    ["2022", ["world", "america"]],
    ["2025", ["world", "america", "asia"]],
    ["2026", ["world", "america", "europe"]],
    ["2023", ["world", "america", "asia", "europe"]],
    ["all", ["world", "america", "asia", "europe"]],
    ["2010", ["world"]],
  ]) {
    assert.deepEqual(
      visitedMapRegions(
        passportStats(history, airports, year).flights,
        airports,
      ).map((region) => region.id),
      expected,
      year,
    );
  }
  assert.deepEqual(
    visitedMapRegions([{ origin: "ZZZ", destination: "ZZZ" }], airports).map(
      (region) => region.id,
    ),
    ["world"],
  );
});
