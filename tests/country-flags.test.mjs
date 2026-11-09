import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';

const read = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const flagMap = readFileSync(new URL('../apps/mobile/src/generated/flags.ts', import.meta.url), 'utf8');
const offlineFlag = code => new URL(`../apps/mobile/assets/flags/${code}.png`, import.meta.url);

test('every airline flag has an offline image rendered from the matching web SVG', async () => {
  const countries = read('data/country-flags.json');
  const checked = new Set();
  const airlines = read('data/catalog.json').airlines;
  for (const airline of airlines) {
    const codes = countries[airline.country];
    assert(codes?.length, `Missing country mapping: ${airline.name}`);
    for (const code of codes) {
      assert.match(code, /^[a-z]{2}$/);
      const svg = readFileSync(new URL(`../public/flags/${code}.svg`, import.meta.url), 'utf8');
      if (!checked.has(code)) {
        assert(flagMap.includes(`"${code}": require("../../assets/flags/${code}.png")`));
        const pixels = image => image.resize(32, 24).ensureAlpha().raw().toBuffer();
        const png = sharp(readFileSync(offlineFlag(code)));
        assert.equal((await png.metadata()).width, 192);
        const actual = await pixels(png);
        const reference = await sharp(Buffer.from(svg), {density: 192}).resize({width: 192}).png().toBuffer();
        const expected = await pixels(sharp(reference));
        const difference = actual.reduce((sum, channel, i) => sum + Math.abs(channel - expected[i]), 0);
        assert(difference / expected.length < 4, `Offline flag differs: ${code}`);
        checked.add(code);
      }
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
  const airports = read('apps/mobile/src/generated/airports.json');
  const flights = read('data/flights.json').flights;
  const visited = new Set(flights.flatMap(f => [airports[f.origin]?.country, airports[f.destination]?.country]));
  for (const country of visited) {
    const code = country.toLowerCase();
    assert(flagMap.includes(`"${code}": require("../../assets/flags/${code}.png")`), `Missing passport flag: ${country}`);
    assert(Object.values(countries).some(codes => codes.includes(code)), `Missing country name: ${country}`);
  }
});
