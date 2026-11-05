# Airline collection profiles

`data/airline-profiles.json` contains the public airline facts used by the airline detail view. The `checkedAt` date and source links are shown in the interface. This is a manually verified snapshot, not a live fleet or route database.

- ICAO designators and radio callsigns were checked against the FAA company-designator table. Operating entities can differ from the commercial brand (Porter includes POE and PTR); regional partner flights can use another entity's callsign.
- Alliance membership was checked against the linked official alliance or member-airline pages. Juneyao is a Star Alliance Connecting Partner, not a full member. Philippine Airlines is listed as a future oneworld member. ITA is a Star Alliance member as of April 2026.
- Harbour Air and Iskwew Air have no verified ICAO/callsign in this snapshot, so these values remain blank and display “Not yet verified”. Iskwew's previous IATA value `SG` was removed from the catalog and catalog builder: IATA assigns it to SpiceJet.
- Existing catalog IATA codes are reused; the source list includes IATA checks for Harbour Air (`YB`) and the Iskwew correction.

Personal stats are calculated by `lib/airline-collection.mjs` from the photo catalog and Flighty records. Only confirmed registrations count as identified airframes; a multi-aircraft photo contributes only the subjects belonging to that airline. “Flown and photographed” requires an exact normalized registration match within the same airline. This does not claim to resolve aircraft re-registrations.

Model/livery combinations cover the photographed collection only. Covers prefer the existing curated selections, then the catalog order; the airline hero retains its existing selected cover. Aircraft and livery gallery navigation uses the existing photo browser. Desktop and mobile Back preserve the collection's scroll position; mobile browser Back closes one layer at a time.
