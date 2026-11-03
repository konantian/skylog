"""Import only public flight-log fields from a user-provided Flighty CSV."""
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
airlines = {
    'ACA': ('Air Canada', 'AC'), 'FLE': ('Flair Airlines', 'F8'),
    'CHH': ('Hainan Airlines', 'HU'), 'WJA': ('WestJet', 'WS'),
    'CCA': ('Air China', 'CA'), 'UAL': ('United Airlines', 'UA'),
    'POE': ('Porter Airlines', 'PD'), 'CES': ('China Eastern Airlines', 'MU'),
    'CSC': ('Sichuan Airlines', '3U'), 'RZO': ('Azores Airlines', 'S4'),
    'CPA': ('Cathay Pacific', 'CX'), 'AAR': ('Asiana Airlines', 'OZ'),
    'ASA': ('Alaska Airlines', 'AS'), 'DKH': ('Juneyao Air', 'HO'),
}
aliases = {
    'Boeing 777-300 ER': 'Boeing 777-300ER', 'Boeing 777-200 LR': 'Boeing 777-200LR',
    'Bombardier CRJ900': 'Bombardier CRJ-900', 'Embraer 195 E2': 'Embraer E195-E2',
    'DHC-8-400 Dash 8Q': 'De Havilland Canada Dash 8-400',
    'DHC-8-300 Dash 8': 'De Havilland Canada Dash 8-300',
}
families = {'Airbus A319', 'Airbus A320', 'Airbus A321', 'Airbus A330', 'Embraer RJ145'}

def registration(value):
    value = value.strip().upper()
    if re.fullmatch(r'C[FGI][A-Z]{3}', value): return value[0] + '-' + value[1:]
    if re.fullmatch(r'B[A-Z0-9]{3,4}', value): return value[0] + '-' + value[1:]
    if re.fullmatch(r'CS[A-Z]{3}', value): return value[:2] + '-' + value[2:]
    return value or None

def convert(rows, as_of):
    flights = []
    seen = set()
    for row in rows:
        day = date.fromisoformat(row['Date']).isoformat()
        if day > as_of or row['Canceled'].strip().lower() == 'true': continue
        airline, code = airlines[row['Airline'].strip()]
        number = row['Flight'].strip()
        if not re.fullmatch(r'\d{1,4}[A-Z]?', number): raise ValueError('Invalid flight number')
        origin, destination = row['From'].strip(), row['To'].strip()
        if not all(re.fullmatch(r'[A-Z]{3}', x) for x in [origin, destination]): raise ValueError('Invalid airport')
        key = f'{day}-{code}{number}-{origin}-{destination}'
        if key in seen: raise ValueError(f'Duplicate flight: {key}')
        seen.add(key)
        label = row['Aircraft Type Name'].strip()
        model = aliases.get(label, label) if label and label not in families else None
        flights.append({'id': key, 'date': day, 'airline': airline, 'flight': code + number,
            'origin': origin, 'destination': destination, 'model': model,
            'modelLabel': aliases.get(label, label) or '机型待确认',
            'registration': registration(row['Tail Number'])})
    return sorted(flights, key=lambda f: f['date'], reverse=True)

if __name__ == '__main__':
    as_of = sys.argv[2]
    with open(sys.argv[1], newline='', encoding='utf-8-sig') as file:
        flights = convert(csv.DictReader(file), as_of)
    output = {'asOf': as_of, 'source': 'Flighty',
        'note': '日期、机型与注册号按 Flighty 导出记录。仅有家族名称的旧记录保留原精度，不推定具体子型号。',
        'flights': flights}
    (ROOT / 'data/flights.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'flights': len(flights), 'airlines': len({f['airline'] for f in flights}),
        'exactModels': len({f['model'] for f in flights if f['model']}),
        'registrations': len({f['registration'] for f in flights if f['registration']})}))
