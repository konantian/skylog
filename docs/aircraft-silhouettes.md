# Aircraft silhouettes

The gray placeholders are original, stylized side-profile SVGs for the 35 catalog
families and 76 named models. They are not copies of manufacturer CAD artwork.
They distinguish nose proportions, fuselage depth, swept/high wings, tail layouts,
engine arrangements, upper decks, cargo windows and representative wing tips.

`lib/aircraft-silhouettes.mjs` holds model lengths in metres and separate artistic
shape controls. Card, family-progress and detail views pass the full model name.
Each family uses a fixed scale, so a stretched variant really is longer; the
A318/A319/A320/A321 and E-Jet groups also share their respective scales. The
remaining nose, windows and engines are not horizontally stretched. Separate
families are fitted independently to keep small aircraft legible.

## Reference material

- [Airbus airport-planning publications](https://www.aircraft.airbus.com/en/customer-care/fleet-wide-care/airport-operations-and-aircraft-characteristics/aircraft-characteristics)
  and [three-view drawing directory](https://www.aircraft.airbus.com/en/customer-care/fleet-wide-care/airport-operations-and-aircraft-characteristics/autocad-3-view-aircraft-drawings).
- [Boeing airport-planning manuals](https://www.boeing.com/commercial/airports/plan-manuals)
  and [three-view drawing directory](https://www.boeing.com/commercial/airports/3-view), including the legacy MD-11.
- [Embraer E-Jets E2 airport planning manual](https://www.embraercommercialaviation.com/wp-content/uploads/2017/06/E-JETS-E2_APM_E-JetsE2.pdf).
- [MHIRJ CRJ family](https://mhirj.com/en/products-and-services/crj-series).
- [De Havilland Dash 8-400 dimensions](https://dehavilland.com/wp-content/uploads/2025/01/DHC_Dash8_SpecSheet_v9_DIGITAL.pdf)
  and [legacy Dash 8 family](https://dehavilland.com/legacy-aircraft/).
- [ATR 72-600 factsheet](https://www.atr-aircraft.com/wp-content/uploads/2020/07/Factsheets_-_ATR_72-600.pdf).
- [Antonov An-124](https://www.antonov.com/en/history/an-124-ruslan).

These links are technical references, not licences to redistribute manufacturer
artwork. The card illustrations do not bundle third-party SVG libraries. Existing project
specifications and rounded reference lengths guide the illustrations; this is not
a dimensioned technical drawing, and no centimetre-level accuracy is claimed.

## Representational limits

These are simplified side elevations: only the near-side wing engines are shown,
plus a central tail engine where applicable. Far-side engines are hidden. The
fin sweeps aft, the horizontal stabilizer is edge-on, and wing dihedral raises
the projected tip rather than showing a downward, plan-view wing. Wings do not
represent measured span. Doors and window spacing are simplified. Airframe
retrofits, alternate engines and airline-specific winglets are not exhaustive.
LR/ER variants with the same length stay the same length; identical visible
configurations deliberately share geometry. Airline-only placeholders remain
generic and do not imply an airline operates a particular model.

Tests check catalog coverage, family scale consistency, key configuration
features and rasterized bounds for every model.

## Detail-only technical references

Cards and family-progress previews continue to use the original illustrations
above. `AircraftTechnicalDrawing` is a separate detail-only component; it does
not change the cards or replace the photographer's images.

`data/aircraft-drawings.json` records the source and configuration of each
technical elevation. All 76 entries now have a dimensioned reference view.
Sources include Airbus and Boeing public three-view CAD, manufacturer airport
planning and recovery manuals, specification brochures, and regulator archives.
Old manufacturer publications sometimes require a public mirror; the original
author and figure remain identified. SVGs are cleaned vector extractions or
simplified hand traces of the cited profiles, not manufacturer-endorsed
engineering deliverables. Source copyright remains with its owner. Links and
available PDF page numbers are displayed with each drawing. Original manuals
and CAD archives are not distributed in the app.

The length dimension and ruler use a fixed metres-to-pixels scale within each
family. The A320 family and E-Jets share scales across their related model
names. Different families are fitted independently. Dimensions describe
representative configurations: wing options, loading, gear compression and
modifications change them. Original manual lines may show alternative engine
installations or ground references. A310's source is gear-up; preliminary
A330neo drawings and family-level references are explicitly annotated.

The remaining 17 references were added on 2026-11-04. Important distinctions:

- A330-300P2F and 767-300BDSF retain the manufacturer base-airframe geometry,
  with schematic cargo doors and plugged windows guided by EFW and IAI/BEDEK.
  Both sources are linked; these are explicitly labeled conversion references,
  not exact conversion-company CAD.
- E175 uses the enhanced-wingtip figure (28.65 m), ERJ-145LR uses standard tips,
  and Citation X uses the original X rather than the larger X+.
- Challenger 350 and Global 6500 use their specifically labeled Bombardier
  figures. AN-124 uses Antonov's shared -100/-100M-150 family illustration.
- Citation Excel combines EASA 560XL dimensions with a FlightSafety training
  profile. G200 uses FlightSafety's manufacturer-data-based dimension figure.
  These two are labeled technical references, not direct manufacturer drawings.
- ATR, CJ3+, XLS+ and Praetor profiles are simplified from factory brochure
  three-views; Praetor is shown gear-up. Saab 340B uses the CAA three-view and
  Saab's standard-wingtip dimensions.

The data format still supports an explicit `pending` state for future models;
unverified entries must not receive invented technical dimensions.

`tests/aircraft-drawings.test.mjs` checks catalog coverage, pending-state honesty,
family scale, SVG rendering and bounds, source links, and the separation from
card previews.
