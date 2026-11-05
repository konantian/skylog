"""Match an offline mwgg/Airports airports.json download against our airport coordinates.
Source: https://github.com/mwgg/Airports (MIT; see AIRPORT-TIMEZONES-LICENSE).
Usage: python3 scripts/prepare-airport-timezones.py /path/to/airports.json
Builds never download data. Ambiguous or distant matches stay unknown.
"""
import json
import sys
from pathlib import Path
from collections import defaultdict
root = Path(__file__).resolve().parents[1] / 'src/generated'
reference = json.loads(Path(sys.argv[1]).read_text())
local = json.loads((root / 'airports.json').read_text())
by_iata = defaultdict(list)
for row in reference.values():
    if row.get('iata'):
        by_iata[row['iata']].append(row)
zones, icaos = {}, {}
for code, airport in local.items():
    matches = [r for r in by_iata[code] if abs(float(r['lat']) - airport['latitude']) < .2 and abs(float(r['lon']) - airport['longitude']) < .2]
    tz = {r['tz'] for r in matches if r.get('tz')}
    icao = {r['icao'] for r in matches if len(r.get('icao', '')) == 4}
    if len(tz) == 1: zones[code] = tz.pop()
    if len(icao) == 1: icaos[code] = icao.pop()
for name, data in [('airport-timezones.json', zones), ('airport-icao.json', icaos)]:
    (root / name).write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, separators=(',', ':')) + '\n')
    print(name, len(data))
