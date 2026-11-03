"""Build the public catalog from the read-only album audit. No Photos writes."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = json.loads(Path(sys.argv[1]).read_text())
aliases = {
    'Bombardier CRJ900': 'Bombardier CRJ-900',
    'De Havilland Canada DHC-8-400': 'De Havilland Canada Dash 8-400',
}
airline_rows = '''ANA|全日空|NH|日本|亚洲
Aer Lingus|爱尔兰航空|EI|爱尔兰|欧洲
Aeromexico|墨西哥航空|AM|墨西哥|美洲
Air Canada|加拿大航空|AC|加拿大|美洲
Air France|法国航空|AF|法国|欧洲
Air India|印度航空|AI|印度|亚洲
Air New Zealand|新西兰航空|NZ|新西兰|大洋洲
Air North|北方航空|4N|加拿大|美洲
Air Transat|越洋航空|TS|加拿大|美洲
Alaska Airlines|阿拉斯加航空|AS|美国|美洲
American Airlines|美国航空|AA|美国|美洲
Avianca|哥伦比亚航空|AV|哥伦比亚|美洲
Biman Bangladesh Airlines|孟加拉航空|BG|孟加拉国|亚洲
Cargojet|加拿大货运航空|W8|加拿大|美洲
Caribbean Airlines|加勒比航空|BW|特立尼达和多巴哥|美洲
Cathay Pacific|国泰航空|CX|中国香港|亚洲
China Airlines|中华航空|CI|中国台湾|亚洲
China Eastern Airlines|中国东方航空|MU|中国|亚洲
Condor|神鹰航空|DE|德国|欧洲
Delta Air Lines|达美航空|DL|美国|美洲
Egyptair|埃及航空|MS|埃及|非洲
Emirates|阿联酋航空|EK|阿联酋|亚洲
Ethiopian Airlines|埃塞俄比亚航空|ET|埃塞俄比亚|非洲
Etihad Airways|阿提哈德航空|EY|阿联酋|亚洲
Fiji Airways|斐济航空|FJ|斐济|大洋洲
Flair Airlines|Flair 航空|F8|加拿大|美洲
Helijet International|Helijet 航空|JB|加拿大|美洲
ITA Airways|意大利航空|AZ|意大利|欧洲
Iberia|西班牙国家航空|IB|西班牙|欧洲
Japan Airlines|日本航空|JL|日本|亚洲
KLM|荷兰皇家航空|KL|荷兰|欧洲
Kalitta Air|卡利塔航空|K4|美国|美洲
Korean Air|大韩航空|KE|韩国|亚洲
Lufthansa|汉莎航空|LH|德国|欧洲
Pacific Coastal Airlines|太平洋海岸航空|8P|加拿大|美洲
Pakistan International Airlines|巴基斯坦国际航空|PK|巴基斯坦|亚洲
Porter Airlines|波特航空|PD|加拿大|美洲
Qatar Airways|卡塔尔航空|QR|卡塔尔|亚洲
SAS|北欧航空|SK|北欧|欧洲
SWISS|瑞士国际航空|LX|瑞士|欧洲
Saudia|沙特阿拉伯航空|SV|沙特阿拉伯|亚洲
T'way Air / Trinity Airways|德威航空|TW|韩国|亚洲
TAP Air Portugal|葡萄牙航空|TP|葡萄牙|欧洲
United Airlines|美国联合航空|UA|美国|美洲
Volga-Dnepr Airlines|伏尔加第聂伯航空|VI|俄罗斯|欧洲
WestJet|西捷航空|WS|加拿大|美洲
British Airways|英国航空|BA|英国|欧洲
Turkish Airlines|土耳其航空|TK|土耳其|亚洲
EVA Air|长荣航空|BR|中国台湾|亚洲
Air China|中国国际航空|CA|中国|亚洲
China Southern|中国南方航空|CZ|中国|亚洲
Hainan Airlines|海南航空|HU|中国|亚洲
Philippine Airlines|菲律宾航空|PR|菲律宾|亚洲
Icelandair|冰岛航空|FI|冰岛|欧洲
LOT|波兰航空|LO|波兰|欧洲
Virgin Atlantic|维珍大西洋航空|VS|英国|欧洲
Royal Jordanian|皇家约旦航空|RJ|约旦|亚洲
Royal Air Maroc|摩洛哥皇家航空|AT|摩洛哥|非洲
Copa Airlines|巴拿马航空|CM|巴拿马|美洲
Arajet|Arajet 航空|DM|多米尼加|美洲
Azores Airlines|亚速尔航空|S4|葡萄牙|欧洲
BermudAir|百慕大航空|2T|百慕大|美洲
Qantas|澳洲航空|QF|澳大利亚|大洋洲
Beijing Capital Airlines|首都航空|JD|中国|亚洲
Hong Kong Airlines|香港航空|HX|中国香港|亚洲
Sichuan Airlines|四川航空|3U|中国|亚洲
XiamenAir|厦门航空|MF|中国|亚洲
ZIPAIR|ZIPAIR 航空|ZG|日本|亚洲
JetBlue|捷蓝航空|B6|美国|美洲
Finnair|芬兰航空|AY|芬兰|欧洲
Air Serbia|塞尔维亚航空|JU|塞尔维亚|欧洲
Edelweiss|雪绒花航空|WK|瑞士|欧洲
FedEx Express|联邦快递航空|FX|美国|美洲
UPS Airlines|联合包裹航空|5X|美国|美洲
MNG Airlines|MNG 货运航空|MB|土耳其|亚洲
Central Mountain Air|中央山地航空|9M|加拿大|美洲
Iskwew Air|Iskwew 航空|SG|加拿大|美洲
Harbour Air|港湾航空|YB|加拿大|美洲'''
airline_info = {r.split('|')[0]: r.split('|')[1:] for r in airline_rows.splitlines()}
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def model_meta(name):
    maker = next((x for x in ['Airbus','Boeing','Bombardier','Embraer','De Havilland Canada','Cessna','Gulfstream','Saab','Antonov'] if name.startswith(x)), 'Other')
    family = re.search(r'(A\d{3}|7\d7|CRJ|Dash 8|DHC-8|E\d{3}|ERJ-145|Challenger|Global|Praetor|Citation|Conquest|An-124|340|G200)', name)
    family = family.group() if family else name
    if any(x in name for x in ['777F','ERF','BDSF','P2F','-200F','-600F','747-8F','An-124']): category='货机'
    elif any(x in name for x in ['Challenger','Global','Praetor','Citation','Gulfstream']): category='公务机'
    elif any(x in name for x in ['Dash 8','DHC-8','Saab','Conquest','ATR']): category='涡桨飞机'
    elif any(x in name for x in ['CRJ','E170','E175','E190','E195','ERJ']): category='支线客机'
    elif any(x in name for x in ['A300','A310','A330','A340','A350','A380','747','767','777','787','MD-11']): category='宽体客机'
    else: category='窄体客机'
    return maker, family, category

photos=[]
for row in source['photo_audit']:
    name=Path(row['filename']).stem
    models=[aliases.get(k,k) for k in row['keywords'] if any(k.startswith(x) for x in ['Airbus','Boeing','Embraer','Bombardier','De Havilland','Cessna','Gulfstream','Saab','Antonov'])]
    # Existing audit flags this photo's Dash 8 keyword as conflicting with Cargojet.
    # Do not turn an unresolved identification into an aircraft unlock.
    if name=='DSC09524': models=[]
    flights=[k for k in row['keywords'] if re.fullmatch(r'(?:推测航班\s+)?[A-Z0-9]{2,3}\s?\d{1,4}(?:\s+\(inferred\))?', k)]
    date='-'.join([str(row['date_parts'][0]),f"{row['date_parts'][1]:02}",f"{row['date_parts'][2]:02}"])
    photos.append({'id':name,'filename':row['filename'],'date':date,'airport':row['album'].split(' ')[0],
        'models':list(dict.fromkeys(models)),'airlines':row['airlines'],'flights':flights,
        'image':f'/photos/{name}.jpg','thumbnail':f'/photos/thumbs/{name}.jpg',
        'note':'机型关键词有冲突，暂不用于机型解锁。' if name=='DSC09524' else ('机型待确认' if not models else '')})

locked_models = ['Airbus A220-100','Airbus A318-100','Airbus A319neo','Airbus A321neo','Airbus A300-600F','Airbus A310-300',
    'Airbus A330-800','Airbus A330-200F','Airbus A330-300P2F','Airbus A340-300','Airbus A340-500','Airbus A340-600',
    'Boeing 737-700','Boeing 737-900','Boeing 747-8','Boeing 747-8F','Boeing 757-200','Boeing 757-300',
    'Boeing 767-300ER','Boeing 767-400ER','Boeing 777-200ER','McDonnell Douglas MD-11F',
    'Embraer E190','Embraer E190-E2','Bombardier CRJ-200','ATR 72-600']
annotations=json.loads((ROOT/'data/photo-annotations.json').read_text())['photos']
for photo in photos:
    photo.update(annotations.get(photo['id'], {'livery':'待确认'}))
model_names=list(dict.fromkeys([m for p in photos for m in p['models']]+locked_models))
cover_selections=json.loads((ROOT/'data/cover-selections.json').read_text())
featured=cover_selections['preferredPhotos']
def ranked(ids):
    return sorted(ids,key=lambda i:(featured.index(i) if i in featured else 999, i))
def entry_common(ids):
    ps=[p for p in photos if p['id'] in ids];ids=ranked(ids)
    return {'photoIds':ids,'cover':ids[0] if ids else None,'unlocked':bool(ids),
        'airports':sorted(set(p['airport'] for p in ps)),
        'firstSeen':min((p['date'] for p in ps),default=None),'lastSeen':max((p['date'] for p in ps),default=None)}
models=[]
priority=['Airbus A350-900','Airbus A380-800','Boeing 747-400','Boeing 787-9','Airbus A340-300','Boeing 777-300ER','Airbus A330-300','Boeing 777-200LR','Airbus A350-1000']
for name in model_names:
    ids=[p['id'] for p in photos if name in p['models']]
    maker,family,category=model_meta(name)
    if name.startswith('McDonnell'): maker='McDonnell Douglas';family='MD-11';category='货机'
    if name.startswith('ATR'): maker='ATR';family='ATR 72';category='涡桨飞机'
    e={'id':slug(name),'name':name,'manufacturer':maker,'family':family,'category':category,
       'shortName':name.removeprefix(maker+' '),'kind':'aircraft',**entry_common(ids)}
    if ids:
        e['cover']=cover_selections['aircraft'][name]
        e['photoIds']=[e['cover']]+[i for i in e['photoIds'] if i!=e['cover']]
    models.append(e)
models.sort(key=lambda m:(priority.index(m['name']) if m['name'] in priority else 99,m['manufacturer'],m['name']))

airlines=[]
for name,(zh,code,country,region) in airline_info.items():
    ids=[p['id'] for p in photos if name in p['airlines']]
    # Prefer a photo with only this airline over a multi-aircraft ramp scene.
    common=entry_common(ids)
    cover=next((i for i in common['photoIds'] if len(next(p for p in photos if p['id']==i)['airlines'])==1), common['cover'])
    airlines.append({'id':slug(name),'name':name,'chineseName':zh,'code':code,'country':country,'region':region,'kind':'airline',**common,'cover':cover})
airline_priority=['Air Canada','Lufthansa','Emirates','SWISS','Qantas','Japan Airlines','Cathay Pacific','ANA','Fiji Airways']
airlines.sort(key=lambda a:(airline_priority.index(a['name']) if a['name'] in airline_priority else 99,not a['unlocked'],a['name']))
data={'updatedAt':source['audit_date'],'scope':'YYZ / YVR 已整理收藏','photos':photos,'aircraft':models,'airlines':airlines,
    'heroPhoto':'DSC07776','featuredPhotos':featured,'scopeNote':'机型涵盖已确认拍摄型号及常见民航补拍目标；航司以 YYZ / YVR 收藏及补拍清单为主，并非全球完整名录。未解锁不代表当前有定期航班。'}
(ROOT/'data/catalog.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert len(photos)==372 and len({p['id'] for p in photos})==372
assert len({m['id'] for m in models})==len(models)
assert all(a in airline_info for p in photos for a in p['airlines'])
print(json.dumps({'photos':len(photos),'aircraft':len(models),'aircraftUnlocked':sum(m['unlocked'] for m in models),'airlines':len(airlines),'airlinesUnlocked':sum(a['unlocked'] for a in airlines)}))
