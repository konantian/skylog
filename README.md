# SKYLOG — Yuan’s aviation atlas

A personal aircraft, airline, and photography collection built with Next.js. All unlocked photographs were taken by Yuan at YYZ and YVR.

**Website:** https://konantian.github.io/skylog/

- 372 edited photographs, with full-color unlocked entries and grayscale wishlist silhouettes.
- Aircraft and airline catalogs, plus a photo gallery preserving multiple angles and liveries.
- Combine manufacturer, airline, model, livery, and photographed airport filters. Search filenames, aircraft, airlines (English/Chinese), or recorded flight numbers.
- Selecting a model displays separate cards for each photographed airline and livery, with other angles available inside each card. Airline details also support model and livery filtering.
- Desktop and mobile layouts, keyboard-operable photo viewer, and reduced-motion support.
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
- `scripts/build-catalog.py`: regenerate catalog from an existing album audit JSON; does not modify Photos.
- `scripts/prepare-photos.mjs`: prepare web JPGs from an already-exported folder of edited images, then record file sizes in `data/photo-verification.json`.

```sh
python3 scripts/build-catalog.py /path/to/album-audit.json
npm run photos:prepare -- /path/to/edited-exports
```

For manual additions, add a photo record and image files, and update the corresponding catalog entries’ `photoIds`, cover, dates, and unlocked status. Run tests before publishing. This is a static snapshot; it does not automatically sync with Apple Photos.

The source RAWs and photo library remain separate and unchanged. Website JPGs are presentation copies, not archival replacements. EXIF and GPS are stripped from these public copies. Livery names describe visible paint schemes; uncertain views are labeled `待确认`. Flight numbers reproduce the existing collection notes and retain inference labels where present.

The wishlist is a curated selection, not a worldwide aircraft registry or live YYZ/YVR schedule. Aircraft silhouettes are symbolic, not model-accurate technical drawings. Counts refer only to photographs included in this project. The prior Cargojet label on DSC09524 was corrected visually to Porter Dash 8-400.

## Rights

Photographs © Yuan Wang. All rights reserved. Public display does not grant permission to reuse or redistribute photographs.
