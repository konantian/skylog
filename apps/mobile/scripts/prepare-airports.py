# Refresh from the public-domain OurAirports airports.csv. No network at build time.
import csv,json,sys
result={}
priority={'large_airport':4,'medium_airport':3,'small_airport':2,'heliport':1}
for row in csv.DictReader(open(sys.argv[1],encoding='utf-8-sig')):
 code=row.get('iata_code','')
 if len(code)!=3 or row.get('type')=='closed': continue
 try: lat,lon=float(row['latitude_deg']),float(row['longitude_deg'])
 except (ValueError,KeyError): continue
 if not (-90<=lat<=90 and -180<=lon<=180): continue
 score=(row.get('scheduled_service')=='yes',priority.get(row['type'],0))
 if code in result and result[code][0]>=score: continue
 result[code]=(score,{'name':row['name'],'city':row.get('municipality','') or row['name'],'country':row.get('iso_country',''),'latitude':lat,'longitude':lon})
from pathlib import Path
result={k:v[1] for k,v in sorted(result.items())}
assert 'YYZ' in result and 'YVR' in result and len(result)>5000, 'Incomplete airport dataset'
output=Path(__file__).resolve().parent.parent / 'src/generated/airports.json'
output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'Bundled {len(result)} IATA airports.')
