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
