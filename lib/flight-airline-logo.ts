import catalog from "../data/catalog.json";
import markAC from "../assets/airline-logos/AC.png";
import markAS from "../assets/airline-logos/AS.png";
import markCA from "../assets/airline-logos/CA.png";
import markCX from "../assets/airline-logos/CX.png";
import markF8 from "../assets/airline-logos/F8.png";
import markHO from "../assets/airline-logos/HO.png";
import markHU from "../assets/airline-logos/HU.png";
import markMU from "../assets/airline-logos/MU.png";
import markOZ from "../assets/airline-logos/OZ.png";
import markPD from "../assets/airline-logos/PD.png";
import markS4 from "../assets/airline-logos/S4.png";
import markUA from "../assets/airline-logos/UA.png";
import markWS from "../assets/airline-logos/WS.png";
import mark3U from "../assets/airline-logos/3U.png";

// Local airline marks are bundled with each client so flight history also works offline.
const marks = new Map([
  ["AC", markAC],
  ["AS", markAS],
  ["CA", markCA],
  ["CX", markCX],
  ["F8", markF8],
  ["HO", markHO],
  ["HU", markHU],
  ["MU", markMU],
  ["OZ", markOZ],
  ["PD", markPD],
  ["S4", markS4],
  ["UA", markUA],
  ["WS", markWS],
  ["3U", mark3U],
]);

const byName = new Map<string, string>();
for (const entry of catalog.airlines) {
  if (!entry.code || !marks.has(entry.code)) continue;
  for (const label of [entry.name, entry.chineseName, entry.code]) {
    if (label) byName.set(label.trim().toLowerCase(), entry.code);
  }
}

// These single-colour marks can use a light reversed rendering on a dark card.
const reverseOnDark = new Set(["AS", "CX", "F8", "PD", "UA"]);

export function flightAirlineLogo(airline: string) {
  const code = byName.get(airline.trim().toLowerCase());
  if (!code) return undefined;
  return { image: marks.get(code)!, reverseOnDark: reverseOnDark.has(code) };
}
