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
artwork. No third-party drawings or SVG libraries are bundled. Existing project
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
