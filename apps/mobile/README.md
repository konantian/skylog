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

For a connected iPhone use `npx expo run:ios --device`; a valid development certificate/provisioning profile is required. The app config uses Yuan's existing Apple team. SDK 57 enables `expo-build-properties`' `ios.enableSceneSupport` because Xcode 27 / iOS 27 require UIScene. Re-run `npx expo prebuild --platform ios --clean` after changing native config; do not hand-edit generated `ios` or `android` folders.

`eas.json` provides development, simulator/APK preview and production profiles. Cloud builds, paid plans and store submission are not automatically triggered. A simulator build cannot be installed on a physical iPhone.

## Implemented offline

- Past, planned and cancelled flights; add/edit/delete; calendar date, airline, flight number, airports, aircraft/registration, private notes and trip name.
- Seat, cabin, booking reference, airport-local times, terminals, gates, baggage belt, actual duration, arrival delay and build year are optional manual fields. Local times do not infer duration across time zones. Unknown duration/delay remains unknown.
- Search, year/airline/model filters, separate upcoming and completed lists. Only completed flights count toward Passport.
- Passport: yearly/all-time map and stamps, distance, duration, aircraft, airport, airline and route rankings; year/month/weekday charts, delay report, seat/cabin breakdown, personal longest/shortest/oldest/newest records; PNG sharing.
- Aircraft, airline and photo catalogs, detail pages, technical drawings, saved photos and native JPEG sharing.
- SQLite stores user flights, optional details, notes, favorites and language/theme. Public catalog/reference data, world geometry and airport coordinates ship with the app. Viewed photographs use an image disk cache; uncached photos require internet and the OS can evict cached images.
- JSON backup/restore and CSV flight export/import, including the Flighty export format used for the original flight log. Imports validate before committing and roll back on error. Same-ID records are updated; unrelated records remain. Back up before uninstalling or changing phones.

The initial public 86-flight log is copied into SQLite once. Deleting/editing a seed record stays effective after restarting; upgrades do not reseed it. Local changes and private booking details are never uploaded to the public website. SQLite is in the app's OS sandbox, not separately encrypted by this app. Exported backup files contain private fields: share them only where intended.

## Flighty comparison

Checked the user's Flighty Pro screens and [official Passport](https://flighty.com/help/passport), [pricing](https://flighty.com/pricing), [notifications](https://flighty.com/help/flighty-notifications) and [imports](https://flighty.com/help/importing-flights) on 2026-11-04. The features above cover the offline personal-log layer, not full Pro parity. No copied Flighty illustrations or branding.

Deferred per user choice: live positions, flight status/gate/baggage changes, delay predictions and reasons, inbound aircraft, historical operational data/aircraft age lookup, weather, notifications/Live Activities, widgets/Watch, cloud sync, email/calendar/TripIt integrations. These need data providers and/or additional platform work; no invented live results or automatic delay numbers. Friends are out of scope.

Statistics distinguish: airport departure/arrival events (connections count as separate events), any positive arrival delay vs the 15-minute on-time threshold, and great-circle estimates vs actual flown distance. Domestic/cross-border uses airport country/region codes. Flights of at least 4,000 km are explicitly labeled, not assumed long-haul. Unknown airports remain unclassified. Aircraft age from a manually entered build year is approximate.

The public mobile website also gains the database-free flight breakdown, time charts, airport/airframe rankings and airline-distance rankings. It does not gain private record editing or SQLite.

## Data and checks

`src/generated/drawings.json` comes from the repository's technical drawings. Regenerate via `npm run assets:prepare` after editing those drawings (also runs before start/export).

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
