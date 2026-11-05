import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../data/catalog.json" with { type: "json" };
import flights from "../data/flights.json" with { type: "json" };
import {
  airlineName,
  airportName,
  aircraftName,
  aircraftSearchQuery,
} from "../apps/mobile/src/lib/flight-labels.ts";
import {
  filterFlights,
  filterPhotos,
  filterCatalog,
  initialFilters,
} from "../lib/filter.mjs";

test("flight labels switch language and preserve unknown names and canonical identifiers", () => {
  assert.equal(airlineName("Air Canada", "zh"), "加拿大航空");
  assert.equal(airlineName("Air Canada", "en"), "Air Canada");
  assert.equal(airlineName("Custom Airline", "zh"), "Custom Airline");
  assert.equal(airportName("CTU", "zh"), "成都双流");
  assert.equal(airportName("TFU", "zh"), "成都天府");
  assert.equal(airportName("YVR", "zh"), "温哥华");
  assert.equal(airportName("YVR", "en"), "Vancouver");
  assert.equal(airportName("ZZZ", "zh"), "ZZZ");
  for (const airline of catalog.airlines) {
    assert.equal(airlineName(airline.name, "zh"), airline.chineseName);
    assert.equal(airlineName(airline.name, "en"), airline.name);
  }
  const before = JSON.stringify(flights);
  for (const flight of flights.flights) {
    assert.match(
      airlineName(flight.airline, "zh"),
      /\p{Script=Han}/u,
      flight.airline,
    );
    for (const code of [flight.origin, flight.destination])
      assert.match(airportName(code, "zh"), /\p{Script=Han}/u, code);
  }
  assert.equal(JSON.stringify(flights), before);
  const matched = filterFlights(
    flights.flights,
    { ...initialFilters, airline: "Air Canada", flightAirport: "YVR" },
    catalog.aircraft,
    catalog.airlines,
  );
  assert(matched.length > 0);
  assert(
    matched.every(
      (f) =>
        f.airline === "Air Canada" &&
        (f.origin === "YVR" || f.destination === "YVR"),
    ),
  );
});

test("aircraft display names translate manufacturers while keeping exact variants and canonical records", () => {
  const examples = [
    ["Airbus A321neo LR", "空客 A321neo LR"],
    ["Boeing 737 MAX 8", "波音 737 MAX 8"],
    ["Boeing 777-300ER", "波音 777-300ER"],
    ["Embraer E195-E2", "巴航工业 E195-E2"],
    ["Bombardier CRJ-900", "庞巴迪 CRJ-900"],
    ["De Havilland Canada Dash 8-400", "加拿大德哈维兰 Dash 8-400"],
    ["ATR 72-600", "ATR 72-600"],
    ["Custom aircraft", "Custom aircraft"],
  ];
  for (const [english, chinese] of examples) {
    assert.equal(aircraftName(english, "zh"), chinese);
    assert.equal(aircraftName(english, "en"), english);
    assert.equal(aircraftSearchQuery(chinese), aircraftSearchQuery(english));
  }
  const original = JSON.stringify(catalog);
  for (const model of catalog.aircraft) {
    const translated = aircraftName(model.name, "zh");
    assert.equal(
      aircraftSearchQuery(translated),
      aircraftSearchQuery(model.name),
    );
    if (model.manufacturer !== "ATR")
      assert.match(translated, /\p{Script=Han}/u);
    assert.equal(
      translated.slice(aircraftName(model.manufacturer, "zh").length),
      model.name.slice(model.manufacturer.length),
    );
    assert.equal(aircraftName(model.name, "en"), model.name);
  }
  assert.equal(JSON.stringify(catalog), original);
});

test("Chinese aircraft queries give the same catalog, photo and flight matches as English", () => {
  for (const [chinese, english] of [
    ["空客", "Airbus"],
    ["空客A350-900", "Airbus A350-900"],
    ["波音７８７－９", "Boeing 787-9"],
    ["巴航工业 E195-E2", "Embraer E195-E2"],
    ["庞巴迪CRJ-900", "Bombardier CRJ-900"],
  ]) {
    const zh = { ...initialFilters, query: aircraftSearchQuery(chinese) };
    const en = { ...initialFilters, query: english };
    assert.deepEqual(
      filterCatalog(
        catalog.aircraft,
        catalog.photos,
        zh,
        "aircraft",
        catalog.aircraft,
        catalog.airlines,
      ),
      filterCatalog(
        catalog.aircraft,
        catalog.photos,
        en,
        "aircraft",
        catalog.aircraft,
        catalog.airlines,
      ),
    );
    assert.deepEqual(
      filterCatalog(
        catalog.airlines,
        catalog.photos,
        zh,
        "airlines",
        catalog.aircraft,
        catalog.airlines,
      ),
      filterCatalog(
        catalog.airlines,
        catalog.photos,
        en,
        "airlines",
        catalog.aircraft,
        catalog.airlines,
      ),
    );
    assert.deepEqual(
      filterPhotos(catalog.photos, zh, catalog.aircraft, catalog.airlines),
      filterPhotos(catalog.photos, en, catalog.aircraft, catalog.airlines),
    );
    assert.deepEqual(
      filterFlights(flights.flights, zh, catalog.aircraft, catalog.airlines),
      filterFlights(flights.flights, en, catalog.aircraft, catalog.airlines),
    );
  }
  const query = aircraftSearchQuery("波音 ７３７ MAX ８");
  const match = catalog.aircraft.find(
    (a) => aircraftSearchQuery(a.name) === query,
  );
  assert.equal(match.name, "Boeing 737 MAX 8");
  for (const query of ["加拿大航空", "C-FIVM", "DSC08110", "AC34", "787-9"]) {
    assert.deepEqual(
      filterPhotos(
        catalog.photos,
        { ...initialFilters, query: aircraftSearchQuery(query) },
        catalog.aircraft,
        catalog.airlines,
      ),
      filterPhotos(
        catalog.photos,
        { ...initialFilters, query },
        catalog.aircraft,
        catalog.airlines,
      ),
    );
  }
});
