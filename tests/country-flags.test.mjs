import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
test('every airline has correct flag assets bundled identically for web and offline native use', () => {
  const countries = read('data/country-flags.json');
  const native = read('apps/mobile/src/generated/flags.json');
  const airlines = read('data/catalog.json').airlines;
  for (const airline of airlines) {
    const codes = countries[airline.country];
    assert(codes?.length, `Missing country mapping: ${airline.name}`);
    for (const code of codes) {
      assert.match(code, /^[a-z]{2}$/);
      const svg = readFileSync(new URL(`../public/flags/${code}.svg`, import.meta.url), 'utf8');
      assert.equal(native[code], svg, `Offline flag differs: ${code}`);
      assert.match(svg, /<svg\b/);
      assert.doesNotMatch(svg, /<script\b|\bonload=|(?:xlink:)?href="https?:/i);
    }
  }
  assert.deepEqual(countries['澳大利亚'], ['au']);
  assert.deepEqual(countries['中国'], ['cn']);
  assert.deepEqual(countries['北欧'], ['dk', 'no', 'se']);
});

test('every country in the flight passport has an offline flag and a display name', () => {
  const countries = read('data/country-flags.json');
  const flags = read('apps/mobile/src/generated/flags.json');
  const airports = read('apps/mobile/src/generated/airports.json');
  const flights = read('data/flights.json').flights;
  const visited = new Set(flights.flatMap(f => [airports[f.origin]?.country, airports[f.destination]?.country]));
  for (const country of visited) {
    const code = country.toLowerCase();
    assert(flags[code], `Missing passport flag: ${country}`);
    assert(Object.values(countries).some(codes => codes.includes(code)), `Missing country name: ${country}`);
  }
});
