# SKYLOG native

Expo 57 / React Native 0.86 app for iOS and Android, in the same repository as the Next.js site. Uses native navigation, lists, sheets, date picker, gestures and sharing. It does not wrap the website.

Expo project: [@yuan-space/skylog](https://expo.dev/accounts/yuan-space/projects/skylog) (`8309a845-efea-4e8c-b893-fd8aa030b6a6`).

## Run

From the repository root:

```sh
npm ci
npm run mobile:install
npm run mobile
```

For a standalone iOS simulator build (Xcode and CocoaPods required):

```sh
cd apps/mobile
npx expo run:ios --configuration Release --no-bundler
```

For a connected iPhone use `npx expo run:ios --device`; a valid development certificate/provisioning profile is required. The app config uses the existing paid MotionCorrect Inc. Apple team for device distribution. SDK 57 enables `expo-build-properties`' `ios.enableSceneSupport` because Xcode 27 / iOS 27 require UIScene. Re-run `npx expo prebuild --platform ios --clean` after changing native config; do not hand-edit generated `ios` or `android` folders.

`eas.json` provides development, simulator/APK preview, `iphone` ad hoc device distribution and production profiles. The `iphone` profile uses the same preview environment and a standalone release build; it does not require a Metro server. Register the intended device with `npx eas-cli@latest device:create`, then run `npx eas-cli@latest build --platform ios --profile iphone`. The first device build requires Apple authentication and separate provisioning profiles for the main app and widget extension. Cloud builds, paid plans and store submission are not automatically triggered. A simulator build cannot be installed on a physical iPhone.

## Implemented offline

- Flight records with automatic past/upcoming classification from departure date/time; add/edit/delete; calendar date, airline, flight number, airports, aircraft/registration, private notes and trip name.
- Seat, cabin, booking reference, airport-local times, terminals, gates, baggage belt, actual duration, arrival delay and build year are optional manual fields. Local times do not infer duration across time zones. Unknown duration/delay remains unknown.
- Search, year/airline/model filters, one flight list with the nearest upcoming departures first, followed by history. No manual flight-status controls. Airport-local departure time determines whether a flight has been flown; date-only records enter history the next day. Imported cancellations remain in backups but are excluded from the list, statistics and reminders.
- Passport: yearly/all-time map and stamps, distance, duration, aircraft, airport, airline and route rankings; year/month/weekday charts, delay report, seat/cabin breakdown, personal longest/shortest/oldest/newest records; PNG sharing.
- Passport stamps use offline country flags and localized names. Missing duration/delay data shows an explanation and import entry point, not empty numeric tiles. The initial public log has no event times; a full Flighty CSV can enrich it without duplicating flights. Share cards show SKYLOG without a website URL.
- A native flight-path splash matches the first frame of the animated intro, once per cold launch. The tagline appears early and remains fully visible for at least 1.5 seconds before fading; entering the app skips the remaining animation/hold once ready. Reduce Motion uses a static frame. iOS Home Screen icons include light, dark and tinted variants; Android has adaptive and monochrome assets.
- Aircraft, airline and photo catalogs, detail pages, technical drawings, saved photos and native JPEG sharing.
- Airline display names follow the selected language across Home, collections, photo/airline details, flight cards, Passport and filters. Passport airport rankings and visited-airport lists use localized names plus IATA codes. Chinese airport labels cover the current 19 visited airports; unlisted airports fall back to the offline city name. Canonical stored names, identifiers and filter values stay unchanged.
- Aircraft labels translate manufacturer names in Chinese mode while retaining model numbers and suffixes (MAX, neo, ER, E2). Collection, photo and flight search accepts either language, including aircraft suggestions and filters. Aircraft source links and photo verification badges are hidden; underlying provenance remains in the catalog.
- Collection search/filter controls scroll with the list. Fullscreen photographs open in a landscape native screen with fit-to-screen sizing and zoom; closing returns to the portrait photo detail. Passport map region buttons follow the selected year's visited airports; the global view is always available.
- SQLite stores user flights, optional details, notes, favorites and language/theme. Public catalog/reference data, country/region flag SVGs, world geometry and airport coordinates ship with the app. Viewed photographs use an image disk cache; uncached photos require internet and the OS can evict cached images.
- JSON backup/restore and CSV flight export/import, including the Flighty export format used for the original flight log. Imports validate before committing and roll back on error. Flighty imports match date, flight number and route, fill missing fields and keep existing edits. SKYLOG backups update matching records; unrelated records remain. Back up before uninstalling or changing phones.

The initial public 86-flight log is copied into SQLite once. Deleting/editing a seed record stays effective after restarting; upgrades do not reseed it. Local changes and private booking details are never uploaded to the public website. SQLite is in the app's OS sandbox, not separately encrypted by this app. Exported backup files contain private fields: share them only where intended.

## Flighty comparison

Checked the user's Flighty Pro screens and [official Passport](https://flighty.com/help/passport), [pricing](https://flighty.com/pricing), [notifications](https://flighty.com/help/flighty-notifications) and [imports](https://flighty.com/help/importing-flights) on 2026-11-04. The features above cover the offline personal-log layer, not full Pro parity. No copied Flighty illustrations or branding.

Added native travel tools:

- Airport-local dates/times and explicit arrival dates with IANA time zones. Ambiguous/missing DST hours stay unresolved. Flighty CSV supports scheduled/actual gate times, takeoff/landing, seat type, cabin, gates and baggage; airborne duration and arrival delay are derived only when all required times/zones exist.
- Departure reminders at 24 hours and 3 hours, scheduled by the OS, reconciled after edits/deletion. At most 48 pending reminders; later ones are scheduled when opening the app again. These are local reminders, not provider change alerts.
- iOS Lock Screen / Dynamic Island Live Activity, started manually within three hours of scheduled departure, with saved gate/route and a native countdown. It becomes stale at departure and stops on next app refresh. Home Screen next-flight widgets support small and medium sizes. No background APNs service yet.
- Native calendar export dialog, selected-calendar import with a review step, route sharing without booking reference/private notes, repeat/return flights, airport maps and saved next-connection interval. Connection intervals are not airport minimum-connection-time assessments.
- Aviationstack key stays in a Cloudflare Worker secret. The internal app connects automatically with a separately revocable service token supplied by private build environment variables; no key-entry UI. The service token is extractable from an installed app and is suitable for this personal/internal distribution, not authentication for a public multi-user launch. Today's flight can be looked up by number; upcoming flight status/gates/baggage/tail can be checked manually within ±24 hours of scheduled departure. One-hour persistent cache, atomic rolling 31-day limit of 80 upstream attempts shared across all SKYLOG installations, enforced by one SQLite-backed Durable Object. The user's MCP shares the provider account's 100/month allowance; its requests are outside the SKYLOG service ledger. Network failures are counted and cached; no automatic polling or historical queries. Reinstalling the app does not reset the server ledger; provider quota remains authoritative.
- On-demand adsb.fi aircraft position by confirmed saved registration (coverage/freshness checked), plus Aviation Weather Center METAR for both airports. 30-second and 20-minute persistent caches, respectively. Old offline observations retain original timestamps and are marked outdated. Position does not prove that the airframe is operating the saved flight. Personal noncommercial adsb.fi use only; no redistribution on the public website.

Still requires additional data/platform integration: automatic delay/gate/cancellation push, remote Live Activity updates, delay predictions/reasons, verified inbound rotation, global historical flight lookup, aircraft-age lookup, Apple Watch, cloud sync, email/TripIt integration. Free Aviationstack is not a historical database. Friends are out of scope. No claim of full Flighty Pro parity.

Provider references: [Aviationstack](https://aviationstack.com/documentation), [adsb.fi public API](https://github.com/adsbfi/opendata), [Aviation Weather Center API](https://aviationweather.gov/data/api/), [Expo 57 widgets](https://docs.expo.dev/versions/v57.0.0/sdk/widgets/), [notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [calendar](https://docs.expo.dev/versions/v57.0.0/sdk/calendar/).

Statistics distinguish: airport departure/arrival events (connections count as separate events), any positive arrival delay vs the 15-minute on-time threshold, and great-circle estimates vs actual flown distance. Domestic/cross-border uses airport country/region codes. Flights of at least 4,000 km are explicitly labeled, not assumed long-haul. Unknown airports remain unclassified. Aircraft age from a manually entered build year is approximate.

The public mobile website also gains the database-free flight breakdown, time charts, airport/airframe rankings and airline-distance rankings. It does not gain private record editing or SQLite.

Airport IANA time zones and ICAO codes are matched by IATA and coordinates from [mwgg/Airports](https://github.com/mwgg/Airports), MIT license retained in `AIRPORT-TIMEZONES-LICENSE`. Regenerate with `python3 scripts/prepare-airport-timezones.py /path/to/mwgg-airports.json`; unresolved matches are deliberately absent. Time-zone rules come from the device OS: keep iOS/Android updated, including [BC’s permanent daylight time in 2026](https://www2.gov.bc.ca/gov/content/governments/celebrating-british-columbia/daylight-saving-time).

## Data and checks

`src/generated/drawings.json` comes from the repository's technical drawings. Regenerate via `npm run assets:prepare` after editing those drawings (also runs before start/export).

Regenerate app icon and launch-screen SVG/PNG assets with `node scripts/prepare-branding.mjs` from this directory (uses the root workspace's Sharp dependency). Icon/splash config changes need a native prebuild/rebuild; they cannot be delivered with a JavaScript-only update.

`src/generated/airports.json` includes IATA airports from the [public-domain OurAirports dataset](https://ourairports.com/data/). Refresh explicitly with `python3 scripts/prepare-airports.py /path/to/airports.csv`. No network is needed during app build.

```sh
# Repository root: real SQLite migration/CRUD/persistence, import and statistics tests
npm test
# apps/mobile
npm run typecheck
npm run lint
npm run export:native
npx expo-doctor
```

Dependency audit: the pinned SDK 57 toolchain still reports transitive advisories (including URI decoding in Expo Router). Do not use `npm audit fix --force`, which proposes unrelated major downgrades/upgrades. Recheck against the next SDK upgrade; no provider credentials or public server run inside this app.

Simulator validation (iPhone 17 / iOS 27, 2026-11-04): native navigation buttons in dark mode, keyboard Next/Done and bottom-note visibility, save/restart persistence, automatic service connection, AC125 lookup, Dynamic Island countdown and Lock Screen Live Activity passed. A widget timeline failure caused by a null property-list value was fixed and the integration error disappeared after reinstalling. The disposable flight was removed; the original 86 records remained. Physical-device behavior, notification delivery at its scheduled time, native calendar dialogs and Android interaction still need device validation.

## Private flight service deployment

`workers/flights` uses the same Cloudflare account as the visit counter, a separate Worker and a SQLite-backed Durable Object. Deploy with `npx wrangler deploy --config workers/flights/wrangler.jsonc`. Supply `AVIATIONSTACK_KEY` and a random `APP_TOKEN` through Wrangler secrets; never commit them. App builds use `EXPO_PUBLIC_FLIGHTS_URL` and `EXPO_PUBLIC_FLIGHTS_TOKEN` from ignored `.env.local` locally or Expo project environment variables in EAS. The latter is a limited internal client token, not the Aviationstack key. No booking references, notes or passenger names are sent. Only flight number/date/route are queried. Server endpoints require the token and enforce exact inputs/date bounds, one-hour caching and a global 80-request rolling budget. Requests are on demand; there is no background cron/APNs service.
