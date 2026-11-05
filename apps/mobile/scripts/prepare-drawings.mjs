import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../../../", import.meta.url);
const specs = JSON.parse(
  await readFile(new URL("data/aircraft-drawings.json", root), "utf8"),
);
const drawings = {};
for (const [model, spec] of Object.entries(specs))
  if (spec.asset)
    drawings[model] = await readFile(
      new URL(`public${spec.asset}`, root),
      "utf8",
    );
await writeFile(
  new URL("../src/generated/drawings.json", import.meta.url),
  JSON.stringify(drawings),
);
console.log(
  `Bundled ${Object.keys(drawings).length} offline reference drawings.`,
);
const countries = JSON.parse(
  await readFile(new URL("data/country-flags.json", root), "utf8"),
);
const flags = {};
for (const code of new Set(Object.values(countries).flat()))
  flags[code] = await readFile(
    new URL(`public/flags/${code}.svg`, root),
    "utf8",
  );
await writeFile(
  new URL("../src/generated/flags.json", import.meta.url),
  JSON.stringify(flags) + "\n",
);
console.log(`Bundled ${Object.keys(flags).length} offline flags.`);
