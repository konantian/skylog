"""Read preserved EXIF audit records; publish only date-matched camera settings."""
import json, re, sys, tarfile
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMBERS = {
 'work/yvr-2026-1031-1101-review/inventory.json',
 'work/yyz-20261018-review/metadata.json',
 'work/yyz-20261024-review/metadata.json',
 'work/yyz-20261025-review/metadata.json',
}

def normalize(row):
    filename = row.get('SourceFile') or row.get('name', '')
    if not filename.lower().endswith('.arw'): return None
    stamp = row.get('DateTimeOriginal') or row.get('date', '')
    day = stamp[:10].replace(':', '-')
    focal = row.get('FocalLength', row.get('focal'))
    exposure = row.get('ExposureTime', row.get('shutter'))
    aperture = row.get('FNumber', row.get('aperture'))
    iso = row.get('ISO', row.get('iso'))
    if any(x is None for x in [focal, exposure, aperture, iso]): return None
    seconds = float(Fraction(str(exposure)))
    focal = float(str(focal).split()[0])
    assert seconds > 0 and focal > 0 and float(aperture) > 0 and int(iso) > 0
    shutter = f'1/{round(1/seconds)}' if seconds < 1 else f'{seconds:g} s'
    result = {'date':day,'shutter':shutter,'focalLengthMm':focal,'aperture':float(aperture),'iso':int(iso),
              'source':'原片 EXIF 核验记录'}
    lens = row.get('LensModel') or row.get('lens')
    if lens: result['lens'] = lens
    if row.get('Model'): result['camera'] = row['Model']
    return Path(filename).stem, result

if __name__ == '__main__':
    photos = {p['id']:p for p in json.loads((ROOT/'data/catalog.json').read_text())['photos']}
    settings = {}
    for archive in sys.argv[1:]:
        with tarfile.open(archive) as tar:
            for member in tar:
                if member.name not in MEMBERS: continue
                for row in json.load(tar.extractfile(member)):
                    parsed = normalize(row)
                    if not parsed: continue
                    key, value = parsed
                    if key not in photos or value['date'] != photos[key]['date']: continue
                    if key in settings:
                        for field in ['shutter','focalLengthMm','aperture','iso']:
                            assert settings[key][field] == value[field], f'Conflicting EXIF: {key} {field}'
                        settings[key].update(value)
                    else: settings[key] = value
    (ROOT/'data/photo-settings.json').write_text(json.dumps(dict(sorted(settings.items())),ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'matched':len(settings),'total':len(photos),'missing':sorted(set(photos)-set(settings)),
        'withLens':sum('lens' in s for s in settings.values()),'withCamera':sum('camera' in s for s in settings.values())}))
