# SKYLOG — Yuan’s aviation atlas

A personal aircraft, airline, and photography collection built with Next.js. All unlocked photographs were taken by Yuan at YYZ and YVR.

**Website:** https://konantian.github.io/skylog/

- 372 edited photographs, with full-color unlocked entries and grayscale wishlist silhouettes.
- Aircraft and airline catalogs, plus a photo gallery preserving multiple angles and liveries.
- Combine manufacturer, airline country/region, airline, model, livery, and photographed airport filters. Search filenames, aircraft, airlines (English/Chinese), registration numbers, or recorded flight numbers.
- Selecting a model displays separate cards for each photographed airline and livery, with other angles available inside each card. Airline details also support model and livery filtering.
- Desktop and mobile layouts, keyboard-operable photo viewer, dark/light themes with a remembered preference, and reduced-motion support.
- Registration evidence, named liveries, and compact aircraft profiles with manufacturer references in the photo viewer. Unconfirmed registrations stay labeled as such.
- A separate Flighty flight log: 86 past segments across 14 airlines, with 18 explicitly recorded aircraft variants. Flown badges do not unlock unphotographed aircraft. Confirmed registration matches connect flights with photos of the same airframe.
- Restrained fly-by animations when switching collections.

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. To verify and export:

```sh
npm test
npm run build
```

The static website is generated in `out/`. GitHub Actions builds with `NEXT_PUBLIC_BASE_PATH=/skylog` and deploys it to GitHub Pages after pushes to `main`. Set Pages source to **GitHub Actions**. No server, account, or database is required.

## Photos and data

- `public/photos/DSCxxxxx.jpg`: edited, sRGB display copies, maximum 2000-pixel long edge.
- `public/photos/thumbs/`: 800-pixel card previews.
- `data/catalog.json`: the website’s curated collection snapshot.
- `data/cover-selections.json`: visually selected aircraft covers and preferred photographs for each airline/livery combination.
- `data/photo-annotations.json`: visually reviewed livery descriptions and identification corrections.
- `data/photo-identities.json`: 78 date-matched registration records (77 confirmed, one inferred); imported from the existing identification audit or read directly from photographs. Inferred registrations never create exact-airframe flight matches.
- `data/liveries.json` and `data/aircraft-profiles.json`: livery descriptions and aircraft family/variant reference information, with primary-source links where available. Basic profiles use catalog manufacturer, family, and category when detailed specifications have not been collected.
- `data/flights.json`: allowlisted public flight-log fields, imported from the owner’s Flighty export.
- `scripts/import-flights.py`: imports past, non-canceled flights; rejects duplicates and does not copy booking references, seats, notes, private Flighty IDs, or other CSV fields.
- `scripts/build-catalog.py`: regenerate catalog from an existing album audit JSON; does not modify Photos.
- `scripts/prepare-photos.mjs`: prepare web JPGs from an already-exported folder of edited images, then record file sizes in `data/photo-verification.json`.

```sh
python3 scripts/import-flights.py /path/to/FlightyExport.csv YYYY-MM-DD
python3 scripts/build-catalog.py /path/to/album-audit.json
npm run photos:prepare -- /path/to/edited-exports
```

For manual additions, add a photo record and image files, and update the corresponding catalog entries’ `photoIds`, cover, dates, and unlocked status. Run tests before publishing. This is a static snapshot; it does not automatically sync with Apple Photos.

The source RAWs and photo library remain separate and unchanged. Website JPGs are presentation copies, not archival replacements. EXIF and GPS are stripped from these public copies. Livery names describe visible paint schemes; uncertain views are labeled `待确认`. Flight numbers reproduce the existing collection notes and retain inference labels where present.

Flight dates, models, and registrations reproduce the Flighty export; they are not a fresh verification of historic operations. Family-only labels (for example, `Airbus A330`) remain broad and do not create a specific model badge. A photographed livery may differ from the livery at the time of a past flight. Aircraft/airline unlock counts refer to photography, while flight-log counts refer to personal travel. Raw Flighty CSV files are not published.

The wishlist is a curated selection, not a worldwide aircraft registry or live YYZ/YVR schedule. Aircraft silhouettes are symbolic, not model-accurate technical drawings. Counts refer only to photographs included in this project. The prior Cargojet label on DSC09524 was corrected visually to Porter Dash 8-400.

## Rights

Photographs © Yuan Wang. All rights reserved. Public display does not grant permission to reuse or redistribute photographs.
