// Regional zoom choices describe endpoint visits, not countries flown over.
export const mapRegions = [
  { id: "world", en: "World", zh: "全球", box: "0 0 900 400", countries: [] },
  {
    id: "america",
    en: "North America",
    zh: "北美",
    box: "400 40 400 230",
    countries:
      "CA US MX GL BM PM BS CU HT DO JM PR VI VG AI AG AW BB BQ BZ CR CW DM GD GP GT HN KN KY LC MF MQ MS NI PA BL SV SX TC TT VC".split(
        " ",
      ),
  },
  {
    id: "asia",
    en: "East Asia",
    zh: "东亚",
    box: "200 80 190 150",
    countries: "CN HK MO TW JP KR KP MN".split(" "),
  },
  {
    id: "europe",
    en: "Europe",
    zh: "欧洲",
    box: "780 30 270 120",
    countries:
      "AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA XK".split(
        " ",
      ),
  },
];

export function visitedMapRegions(flights, airports) {
  const countries = new Set(
    flights
      .flatMap((flight) => [
        airports[flight.origin]?.country,
        airports[flight.destination]?.country,
      ])
      .filter(Boolean),
  );
  return mapRegions.filter(
    (region) =>
      region.id === "world" ||
      region.countries.some((country) => countries.has(country)),
  );
}
