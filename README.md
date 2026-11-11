# SKYLOG — Yuan’s aviation atlas

A personal aircraft, airline, and photography collection built with Next.js. All unlocked photographs were taken by Yuan Wang at YYZ and YVR.

**Website:** https://konantian.github.io/skylog/

**Native iOS / Android app:** [Expo app, offline flight log and Passport](apps/mobile/README.md). The website stays public and read-only; personal native records remain in on-device SQLite.

- 586 edited photographs, with full-color unlocked entries and grayscale wishlist silhouettes.
- Aircraft and airline catalogs, plus a photo gallery preserving multiple angles and liveries.
- Combine manufacturer, airline country/region, airline, model, livery, and photographed airport filters. Search filenames, aircraft, airlines (English/Chinese), registration numbers, or recorded flight numbers.
- Selecting a model displays separate cards for each photographed airline and livery, with other angles available inside each card. Airline details also support model and livery filtering.
- A collapsible aircraft-family collection panel shows progress across the catalog's 36 recorded families, with curated photo covers for photographed models and gray silhouettes for wishlist models. Model cards open the existing photo viewer or aircraft profile. Progress uses the full photographic collection, includes only models in this catalog, and does not count flown-only aircraft as unlocked.
- Chinese / English UI with a switch in the header and activity/photo dialogs. Explicit `?lang=en` or `?lang=zh` links take precedence, followed by the saved browser choice and then the browser language. Switching updates labels, accessible names, page metadata and exported cards without remounting the collection, resetting filters, or restarting an activity. The static HTML fallback remains Chinese until hydration. English copy lives in `data/locale-en.json`; source data and filter values stay unchanged. English card filenames end in `-en.png`.
- Desktop and mobile layouts, keyboard-operable photo viewer, dark/light themes with a remembered preference, and reduced-motion support.
- A phone app shell with five persistent bottom tabs, per-tab filters and scroll position, a cancelable filter sheet, full-screen photo browsing with horizontal swipe, and system Back handling for nested dialogs. Touch controls respect safe areas; search fields use 16 px text without disabling pinch zoom. Desktop retains its full collection layout.
- A navy and ice-blue airliner badge for browser tabs and installed home-screen apps. `app/icon.svg` is the vector source; its opaque PNG exports are `app/apple-icon.png` (180 px) and `public/icons/skylog-{192,512}.png`. The manifest keeps installation and launch paths inside the GitHub Pages base path. Installed apps still need an internet connection.
- A five-question aircraft recognition game uses reviewed single-model covers, four family/series choices, and manufacturer-sourced explanations after each answer. Scores last for the current round only.
- Random discovery draws from single-subject photographs without repeats within a round, with a brief radar reveal on demand. Reduced-motion users see the photo directly.
- Fifteen aviation collection achievements show automatic photographic progress, missing targets, related photos, and unlocked/pending filters. Goals include aircraft variants, passenger-only and cargo-only families, and photographing the same confirmed registration at both YYZ and YVR. Flown-only models never unlock photography achievements; all same-airframe achievements require confirmed registration matches. Targets are collection goals, not claims of current local flight schedules.
- Photo details export a PNG photography card with the full image, identification, date, location, and Yuan Wang credit. Both photography cards (1620×1080 landscape / 1080×1350 portrait) and boarding-pass-style flight memories (1080×720 landscape / 1080×1350 portrait) offer a landscape/portrait switch with distinct layouts. Both default to landscape and remember their last orientation separately in the current browser; filenames include the orientation. Cards are rendered locally, with PNG download and file sharing where supported. No booking codes, seats, gates, or barcodes are invented or included; these are commemorative cards, not boarding documents.
- Registration evidence, named liveries, and compact aircraft profiles with manufacturer references in the photo viewer. Unconfirmed registrations stay labeled as such.
- A separate Flighty flight log: 86 past segments across 14 airlines, with 18 explicitly recorded aircraft variants. Flown badges do not unlock unphotographed aircraft. Confirmed registration matches connect flights with photos of the same airframe.
- A route map with global, North America, East Asia, and Europe views, airport/route selection, annual flight counts, and most-flown airline/model/route rankings. Flight rows show the city below each airport code.
- Flight mileage and personal records show cumulative estimated distance, longest/shortest routes, and the busiest year (including ties), using all logged segments independently of filters. Distances use the haversine formula with a mean Earth radius of 6,371.0088 km and the existing airport coordinates; repeated and return journeys each count once per segment. Missing coordinates are excluded and disclosed. These are great-circle estimates, not actual flown tracks or reward miles.
- An optional journey replay by year, with chronological great-circle routes, an animated aircraft, pause/resume, flight skipping, scrubbing, and 1×/2×/4× cruise speed. Departure and arrival transitions retain their timing at higher speeds. Desktop uses gentle camera following; mobile holds the camera steady within each leg. Background tabs pause playback and reduced-motion users get a static, navigable preview. Paths and durations are illustrative, not recorded tracks or real flight times.
- Ice-blue accents on deep navy, with a darker accessible blue in the light theme.
- A photography timeline of first collected models and airlines, plus date-matched camera settings in all 586 photo details.
- Ten selected photographs in the homepage carousel, shuffled on each page load while retaining that order in the photo viewer, with automatic rotation, pause/previous/next controls, and native horizontal swipe. Rotation pauses offscreen, in background tabs, while hovered, and after manual navigation; reduced-motion preference disables automatic rotation.
- Scroll-triggered card entrances, route drawing, timeline accents, and a small aircraft showing page progress. Native scrolling is preserved, visited items stay readable, and reduced-motion users receive the static content.

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

The static website is generated in `out/`. GitHub Actions builds with `NEXT_PUBLIC_BASE_PATH=/skylog` and deploys it to GitHub Pages after pushes to `main`. Set Pages source to **GitHub Actions**. The collection remains static; only the optional page-view counter uses a small Cloudflare Worker.

## Page-view counter

The footer displays cumulative page views (PV), not unique people. Each production document load or refresh counts once; filters, photo navigation, and React remounts do not increment again. Local previews read the total without incrementing. Counting begins when the feature is enabled; no historical visits are invented. If the service fails, the footer shows `—` rather than a made-up number.

`workers/visits/index.mjs` stores a single total in a SQLite-backed Durable Object. It has no reset/decrement endpoint, cookies, visitor IDs, IP storage, or request logging enabled. `GET /visits` reads the total and `POST /visits` adds one. Writes require the production origin; reads are public. The total survives Worker deployments. Keep the Worker name, binding, migration, and object name when updating it.

```sh
npx --yes wrangler@4.156.2 login --scopes account:read user:read workers_scripts:write
npx --yes wrangler@4.156.2 deploy --config workers/visits/wrangler.jsonc
```

Set the GitHub repository variable `NEXT_PUBLIC_VISITS_URL` to the deployed Worker URL plus `/visits`, then redeploy Pages. This is a public endpoint, not a secret; no Cloudflare credentials are shipped to browsers or committed. Without that variable, the counter is omitted. Both services can use Cloudflare's free tier; exceeding its limits makes the counter temporarily unavailable.

For a local Worker check, start `npx --yes wrangler@4.156.2 dev --config workers/visits/wrangler.jsonc --local --port 8787`, then run `node workers/visits/smoke-test.mjs` in another terminal. The smoke test deliberately increments **only the local counter**, checking 50 concurrent writes and rejected methods/origins. `npm test` checks browser request deduplication, preview behavior, and failure handling.

<!-- ponytail: This is a public PV counter, not audited analytics. Origin checks do not stop scripted inflation; add edge rate limiting or bot controls if abuse appears. -->

## Photos and data

- `public/photos/DSCxxxxx.jpg`: edited, sRGB display copies, maximum 3200-pixel long edge (JPEG quality 94), never upscaled.
- `public/photos/thumbs/`: 800-pixel card previews.
- `public/photos/medium/`: 1600-pixel responsive display copies. Homepage and detail images use actual-width `srcset` candidates so small screens do not have to download the largest copy.
- Full-resolution, edited sRGB JPEGs (quality 95) are downloadable individually from the photo viewer. These are GitHub Release assets, loaded only on request, outside the Pages build and Git history. RAWs remain private and unchanged.
- `data/photo-verification.json`: dimensions, byte sizes and full-resolution download URLs for all public photo variants.
- `data/catalog.json`: the website’s curated collection snapshot.
- `data/cover-selections.json`: visually selected aircraft covers and preferred photographs for each airline/livery combination.
- `data/photo-annotations.json`: visually reviewed livery descriptions and identification corrections.
- `data/photo-identities.json`: date-matched identity evidence for all 586 photos, including registrations, flight confidence and neighboring RAW-frame readings. Fleet-number matches are distinguished from directly visible full registrations; uncertain flights retain inference labels. Inferred registrations never create exact-airframe flight matches.
- `data/liveries.json` and `data/aircraft-profiles.json`: livery descriptions and aircraft family/variant reference information, with primary-source links where available. Basic profiles use catalog manufacturer, family, and category when detailed specifications have not been collected.
- `data/flights.json`: allowlisted public flight-log fields, imported from the owner’s Flighty export.
- `data/airports.json`: the 19 flight-log airports, sourced from the public-domain OurAirports dataset. Route lines are great-circle illustrations, not recorded flight tracks.
- `data/world-land.json`: simplified SVG land outline derived from Natural Earth 1:110m public-domain land polygons (https://www.naturalearthdata.com/about/terms-of-use/).
- `data/photo-settings.json`: date-and-filename matched RAW EXIF audit records. Publishes focal length, shutter, aperture, ISO, lens, and camera when explicitly recorded; does not publish GPS, serial numbers, file paths, or library identifiers.
- `data/hero-selections.json`: the ten curated homepage photos, all from the existing edited collection.
- `scripts/import-photo-settings.py`: reads the preserved EXIF audit archives and joins RAW records to catalog photos by capture date and filename. Missing camera bodies are not inferred.
- `scripts/import-flights.py`: imports past, non-canceled flights; rejects duplicates and does not copy booking references, seats, notes, private Flighty IDs, or other CSV fields.
- `scripts/build-catalog.py`: regenerate catalog from an existing album audit JSON; does not modify Photos.
- `scripts/prepare-photos.mjs`: prepare every size directly from an already-exported folder of final edited images; strip EXIF/GPS, preserve composition and color, and record dimensions and file sizes in `data/photo-verification.json`.

```sh
python3 scripts/import-flights.py /path/to/FlightyExport.csv YYYY-MM-DD
python3 scripts/build-catalog.py /path/to/album-audit.json
npm run photos:prepare -- /path/to/edited-exports /path/to/full-size-jpgs https://github.com/konantian/skylog/releases/download/TAG
```

Upload the generated full-size JPGs to that GitHub Release, verify the asset names and sizes, and publish the release before deploying the website. The build does not upload download files. Use a new release tag when replacing the edited masters.

For manual additions, add a photo record and image files, and update the corresponding catalog entries’ `photoIds`, cover, dates, and unlocked status. Run tests before publishing. This is a static snapshot; it does not automatically sync with Apple Photos.

The 586 presentation photos come from the edited YYZ (515) and YVR (71) collections. The source RAWs and photo library remain separate and unchanged. Website JPGs are presentation copies, not archival replacements. EXIF and GPS are stripped from these public copies. Livery names describe visible paint schemes; uncertain views are labeled `待确认`. Flight numbers reproduce the existing collection notes and retain inference labels where present.

Timeline first sightings refer only to photos in the current catalog. Its cumulative totals use the whole catalog even when the displayed photos are filtered.

Flight dates, models, and registrations reproduce the Flighty export; they are not a fresh verification of historic operations. Family-only labels (for example, `Airbus A330`) remain broad and do not create a specific model badge. A photographed livery may differ from the livery at the time of a past flight. Aircraft/airline unlock counts refer to photography, while flight-log counts refer to personal travel. Raw Flighty CSV files are not published.

The wishlist is a curated selection, not a worldwide aircraft registry or live YYZ/YVR schedule. Uncollected aircraft use original gray SVG profiles covering all 36 catalog families and 82 named models. Each family keeps a shared scale across its length variants, with separate nose, wing, tail and engine geometry, neo/MAX engine and wingtip changes, and passenger/freighter upper-deck differences. These are representative illustrations rather than technical drawings; engines on the far side are hidden in the side view. Cargo illustrations omit passenger cabin windows. Cards, family progress and locked details all pass the full model name to the same component. See [silhouette references and limits](docs/aircraft-silhouettes.md). Counts refer only to photographs included in this project. The prior Cargojet label on DSC09524 was corrected visually to Porter Dash 8-400.

The 2026-11-04 update adds 69 edited YYZ photos, with 63 operating flight numbers and six business-jet callsigns. The original camera timestamps remain visible; identity evidence records the confirmed 12:53 EST reset and the approximate eight-minute lookup correction for earlier frames. Three newly photographed business-jet variants have illustrative profiles; their detail engineering drawings remain explicitly pending.

The 2026-11-10 update adds 36 final YYZ photographs from the approved Apple Photos → PhotoCraft TIFF masters, including eight supplementary selections. The 12 priority selections join the portfolio; four same-aircraft alternate angles follow their cover in the viewer. Operating callsigns are matched to the locally recorded ADS-B approaches; commercial flight numbers remain unfilled until independently verified. Citation Latitude and Citation XLS Gen2 are newly collected models, with technical side elevations explicitly pending.

## Rights

Photographs © Yuan Wang. All rights reserved. Public display does not grant permission to reuse or redistribute photographs.
