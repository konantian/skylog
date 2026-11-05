import test from "node:test";
import assert from "node:assert/strict";
import { FlightCache, validateQuery } from "../workers/flights/service.mjs";
const now = Date.parse("2026-11-04T20:00:00Z");
const input = {
  date: "2026-11-04",
  flight: "AC125",
  origin: "YYZ",
  destination: "YVR",
};
function store() {
  const data = new Map();
  let queue = Promise.resolve();
  const s = {
    get: async (k) => data.get(k),
    put: async (k, v) => {
      data.set(k, v);
    },
    transaction: (fn) => {
      const job = queue.catch(() => {}).then(() => fn(s));
      queue = job;
      return job;
    },
  };
  return s;
}
const payload = {
  data: [
    {
      flight_date: input.date,
      flight: { iata: input.flight },
      departure: { iata: "YYZ", gate: "D24" },
      arrival: { iata: "YVR" },
      flight_status: "scheduled",
    },
  ],
};
test("proxy validates short, current, exact flight inputs", () => {
  assert.deepEqual(validateQuery(input, now), input);
  for (const f of [
    { ...input, date: "2020-01-01" },
    { ...input, flight: "x&access_key=bad" },
    { ...input, date: "2026-02-30" },
    { ...input, origin: "../../" },
    { ...input, flight: "12345" },
  ])
    assert.equal(validateQuery(f, now), null);
});
test("proxy shares lookup and route cache, coalesces concurrent checks and returns no provider key", async () => {
  let calls = 0;
  const service = new FlightCache(
    store(),
    "private-test-key",
    async function () {
      assert.equal(this, globalThis);
      calls++;
      return Response.json(payload);
    },
    () => now,
  );
  const [a, b] = await Promise.all([
    service.query(input),
    service.query({ ...input, origin: "", destination: "" }),
  ]);
  assert.equal(calls, 1);
  assert.equal(a.data.departureGate, "D24");
  assert.equal(b.data.origin, "YYZ");
  assert(!JSON.stringify(a).includes("private-test-key"));
  assert(!JSON.stringify(a).includes("payload"));
  assert.equal(
    (await service.query({ ...input, destination: "NRT" })).data,
    null,
  );
  assert.equal(calls, 1);
  assert.equal((await service.usage()).used, 1);
});
test("proxy atomically caps account-side requests and expires rolling use", async () => {
  let clock = now,
    calls = 0;
  const service = new FlightCache(
    store(),
    "test",
    async () => {
      calls++;
      return Response.json({ data: [] });
    },
    () => clock,
  );
  const results = await Promise.all(
    Array.from({ length: 90 }, (_, n) =>
      service.query({ ...input, flight: "AC" + (100 + n) }),
    ),
  );
  assert.equal(calls, 80);
  assert.equal(results.filter((x) => x.error === "quota").length, 10);
  clock += 31 * 86400000 + 1;
  await service.query({ ...input, flight: "AC999" });
  assert.equal(calls, 81);
  assert.equal((await service.usage()).used, 1);
});
test("proxy counts failures once, caches outage and retains original successful timestamp", async () => {
  let clock = now,
    fail = false,
    calls = 0;
  const service = new FlightCache(
    store(),
    "test",
    async () => {
      calls++;
      if (fail) throw Error("network");
      return Response.json(payload);
    },
    () => clock,
  );
  await service.query(input);
  clock += 3600001;
  fail = true;
  const result = await service.query(input);
  assert.equal(result.error, "unavailable");
  assert.equal(result.dataFetchedAt, now);
  assert.equal(result.data.departureGate, "D24");
  await service.query(input);
  assert.equal(calls, 2);
  assert.equal((await service.usage()).used, 2);
});
