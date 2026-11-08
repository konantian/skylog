import {test} from 'node:test';
import ramp from './fixtures/ramp-photo.json' with {type:'json'};
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import {initialFilters,filterCatalog,filterPhotos,photoMatches,filterFlights,flightsForEntry,flightsForPhoto} from '../lib/filter.mjs';
const filters = patch=>({...initialFilters,...patch});
const {aircraft,airlines,photos}=catalog;

test('country filters scope airline and aircraft to the same photographed subject',()=>{
  const japan=filterPhotos(photos,filters({country:'日本'}),aircraft,airlines);
  assert.ok(japan.length>0);
  assert.ok(japan.every(p=>p.airlines.some(name=>['ANA','Japan Airlines'].includes(name))));
  assert.equal(filterPhotos(photos,filters({country:'日本',airline:'Air Canada'}),aircraft,airlines).length,0);
  const locked=filterCatalog(airlines,photos,filters({country:'日本',status:'locked'}),'airlines',aircraft,airlines);
  assert.deepEqual(locked.map(a=>a.name),['ZIPAIR']);
  assert.equal(photoMatches(ramp,filters({country:'加拿大',model:'Airbus A330-300'}),aircraft,airlines),true);
  assert.equal(photoMatches(ramp,filters({country:'阿联酋',model:'Airbus A330-300'}),aircraft,airlines),false);
  assert.equal(photoMatches(ramp,filters({country:'瑞士',model:'Airbus A330-300'}),aircraft,airlines),true);
  const rampModels=aircraft.filter(m=>ramp.models.includes(m.name)).map(m=>({...m,photoIds:[ramp.id]}));
  const models=filterCatalog(rampModels,[ramp],filters({country:'瑞士'}),'aircraft',aircraft,airlines);
  assert.deepEqual(models.map(a=>a.name),['Airbus A330-300']);
});

test('flown registrations link only confirmed photographs of the same airframe',()=>{
  const cfivm=filterPhotos(photos,filters({query:'cfivm'}),aircraft,airlines);
  assert.deepEqual(new Set(cfivm.map(p=>p.id)),new Set(['DSC07125','DSC07130','DSC07141','DSC09420','DSC09427']));
  assert.deepEqual(flightsForPhoto(cfivm[0],log.flights).map(f=>f.id),['2024-08-23-AC64-ICN-YVR']);
  assert.equal(flightsForPhoto({...cfivm[0],registration:{...cfivm[0].registration,status:'inferred'}},log.flights).length,0);
  assert.equal(flightsForPhoto(photos.find(p=>p.id==='DSC00502'),log.flights).length,2);
  assert.equal(photos.filter(p=>p.registration).length,550);
});

test('flown-only aircraft remain unphotographed and broad model labels do not become variants',()=>{
  for(const name of ['Boeing 737-400','De Havilland Canada Dash 8-300']){
    const entry=aircraft.find(a=>a.name===name);
    assert.equal(entry.unlocked,false);
    assert.ok(flightsForEntry(entry,log.flights).length>0);
  }
  const broad=log.flights.filter(f=>f.modelLabel==='Airbus A330');
  assert.equal(broad.length,2);
  assert.ok(broad.every(f=>f.model===null));
  assert.equal(flightsForEntry(aircraft.find(a=>a.name==='Airbus A330-300'),broad).length,0);
});

test('flight search, country, airline and exact model combine without hidden photo filters',()=>{
  const flights=filterFlights(log.flights,filters({country:'加拿大',airline:'Air Canada',model:'Boeing 787-9',airport:'YYZ',livery:'标准涂装'}),aircraft,airlines);
  assert.ok(flights.length>0&&flights.every(f=>f.airline==='Air Canada'&&f.model==='Boeing 787-9'));
  assert.equal(filterFlights(log.flights,filters({country:'日本'}),aircraft,airlines).length,0);
  assert.equal(filterFlights(log.flights,filters({query:'C-FIVM'}),aircraft,airlines).length,1);
});

test('published flight data uses a small public-field allowlist',()=>{
  assert.equal(log.flights.length,86);
  assert.equal(new Set(log.flights.map(f=>f.airline)).size,14);
  assert.equal(new Set(log.flights.filter(f=>f.model).map(f=>f.model)).size,18);
  const fields=['id','date','airline','flight','origin','destination','model','modelLabel','registration'].sort();
  const known=new Set(aircraft.map(a=>a.name));
  for(const f of log.flights){
    assert.deepEqual(Object.keys(f).sort(),fields);
    assert.ok(f.date<=log.asOf);
    assert.ok(f.model===null||known.has(f.model));
    assert.ok(airlines.some(a=>a.name===f.airline));
  }
});

test('CSV import excludes canceled/future flights and never copies private columns',()=>{
  execFileSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('flight_import','scripts/import-flights.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
r={'Date':'2024-01-01','Canceled':'false','Airline':'ACA','Flight':'64','From':'ICN','To':'YVR','Aircraft Type Name':'Airbus A330','Tail Number':'CFIVM','Booking Code':'PRIVATE','Notes':'PRIVATE'}
f=m.convert([r], '2026-11-02')[0]
assert f['model'] is None and f['registration']=='C-FIVM'
assert 'PRIVATE' not in str(f)
assert m.convert([dict(r,Canceled='true'),dict(r,Date='2027-01-01')], '2026-11-02')==[]
try: m.convert([r,r], '2026-11-02')
except ValueError: pass
else: raise AssertionError('duplicate not rejected')
`],{cwd:process.cwd()});
});
