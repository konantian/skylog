import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};
import settings from '../data/photo-settings.json' with {type:'json'};
import heroes from '../data/hero-selections.json' with {type:'json'};
import {routeKey,collectRoutes,flightStats,routePath,projectAirport,collectionTimeline,shootingDays} from '../lib/insights.mjs';
import {initialFilters,filterFlights} from '../lib/filter.mjs';

const {photos,aircraft,airlines}=catalog;
test('flight statistics combine reverse routes without inventing aircraft variants',()=>{
  const stats=flightStats(log.flights);
  assert.equal(stats.total,86);assert.equal(stats.airports,19);
  assert.equal(stats.airlines.length,14);assert.equal(stats.models.length,18);assert.equal(stats.unspecifiedModels,18);
  assert.equal(stats.years.reduce((s,y)=>s+y.count,0),86);
  assert.equal(stats.routes.reduce((s,r)=>s+r.count,0),86);
  assert.deepEqual(collectRoutes([{origin:'YYZ',destination:'YVR'},{origin:'YVR',destination:'YYZ'}]),[{key:'YVR~YYZ',airports:['YVR','YYZ'],count:2}]);
  assert.equal(stats.routes.find(r=>r.key==='YEG~YVR').count,27);
});
test('map route, visited airport and year filters compose with existing filters',()=>{
  const selected=filterFlights(log.flights,{...initialFilters,flightYear:'2026',flightAirport:'YVR'},aircraft,airlines);
  assert.ok(selected.length>0);assert.ok(selected.every(f=>f.date.startsWith('2026')&&[f.origin,f.destination].includes('YVR')));
  const routed=filterFlights(log.flights,{...initialFilters,route:'YEG~YVR'},aircraft,airlines);
  assert.equal(routed.length,27);assert.ok(routed.every(f=>routeKey(f)==='YEG~YVR'));
  assert.equal(filterFlights(log.flights,{...initialFilters,route:'YEG~YVR',flightAirport:'ICN'},aircraft,airlines).length,0);
});
test('all actual routes project finite endpoints and break at the map seam',()=>{
  for(const flight of log.flights){
    const from=airports[flight.origin],to=airports[flight.destination];assert.ok(from&&to);
    const path=routePath(from,to);assert.doesNotMatch(path,/NaN|Infinity/);
    assert.ok(path.startsWith('M'+projectAirport(from).map(v=>v.toFixed(2)).join(',')));
    assert.ok(path.endsWith(projectAirport(to).map(v=>v.toFixed(2)).join(',')));
  }
  assert.equal((routePath({latitude:10,longitude:5},{latitude:10,longitude:-5}).match(/M/g)||[]).length,2);
  assert.equal(routePath(airports.YVR,airports.YVR),'');
});
test('timeline first sightings remain global when photography is filtered',()=>{
  const moments=collectionTimeline(photos,aircraft,airlines);
  assert.equal(moments.reduce((s,m)=>s+m.photos.length,0),photos.length);
  assert.equal(moments.reduce((s,m)=>s+m.newModels.length,0),54);
  assert.equal(moments.reduce((s,m)=>s+m.newAirlines.length,0),50);
  assert.equal(moments[0].cumulativeModels,54);assert.equal(moments[0].cumulativeAirlines,50);
  const filtered=collectionTimeline(photos.filter(p=>p.date==='2026-11-01'),aircraft,airlines);
  assert.deepEqual(filtered[0].newModels,moments.find(m=>m.date===filtered[0].date).newModels);
  assert.equal(filtered[0].cumulativeAirlines,45);
});

test('Europe view joins Greenwich while keeping Pacific routes off the continent',()=>{
  const west={latitude:50,longitude:-5},east={latitude:50,longitude:5};
  assert.ok(Math.abs(projectAirport(east,450)[0]-projectAirport(west,450)[0])<30);
  assert.equal((routePath(west,east,450).match(/M/g)||[]).length,1);
  assert.equal((routePath(airports.ICN,airports.YVR,450).match(/M/g)||[]).length,2);
  for(const code of ['KEF','PDL']){
    const [x,y]=projectAirport(airports[code],450);
    assert.ok(x>780&&x<1050&&y>30&&y<150);
  }
});
test('all published photos have date-matched camera settings without private EXIF',()=>{
  assert.equal(Object.keys(settings).length,photos.length);
  const allowed=new Set(['date','shutter','focalLengthMm','aperture','iso','lens','camera','source']);
  for(const photo of photos){const s=settings[photo.id];assert.equal(s.date,photo.date);assert.ok(s.focalLengthMm>0&&s.aperture>0&&s.iso>0&&s.lens);assert.ok(Object.keys(s).every(k=>allowed.has(k)));}
  assert.equal(new Set(heroes).size,10);assert.ok(heroes.every(id=>photos.some(p=>p.id===id)&&catalog.featuredPhotos.includes(id)));
});
test('EXIF importer accepts both archived formats and only extracts RAW settings',()=>{
  execFileSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('photo_import','scripts/import-photo-settings.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
r={'SourceFile':'/private/photos/DSC12345.ARW','DateTimeOriginal':'2026:10:18 12:15:00','FocalLength':'200.0 mm','ExposureTime':'1/1600','FNumber':8,'ISO':400,'GPSLatitude':123,'SerialNumber':'PRIVATE'}
id,s=m.normalize(r)
assert id=='DSC12345' and s['date']=='2026-10-18' and s['shutter']=='1/1600' and s['focalLengthMm']==200
assert 'PRIVATE' not in str(s) and 'GPSLatitude' not in s
assert m.normalize(dict(r,SourceFile='DSC12345.JPG')) is None
_,s=m.normalize({'name':'DSC12345.ARW','date':'2026:10:31 12:00:00','focal':200,'shutter':0.001,'aperture':8,'iso':100})
assert s['shutter']=='1/1000' and 'camera' not in s
`]);
});

test('flight breakdown retains unknown coverage, calendar buckets and connection events', async()=>{
 const {flightBreakdown}=await import('../lib/insights.mjs');
 const flights=[
 {date:'2026-10-31',origin:'YYZ',destination:'YVR',airline:'Air Canada',model:'Boeing 787-9',registration:'C-FABC'},
 {date:'2026-11-01',origin:'YVR',destination:'ICN',airline:'Air Canada',model:'Boeing 787-9',registration:'C-FABC'},
 {date:'2025-11-02',origin:'XXX',destination:'YYZ',airline:'Unknown',model:null,registration:null},
 ];
 const stats=flightBreakdown(flights,airports);
 assert.equal(stats.domestic,1);assert.equal(stats.international,1);assert.equal(stats.unclassified,1);
 assert.equal(stats.months[9].count,1);assert.equal(stats.months[10].count,2);
 assert.equal(stats.weekdays[6].count,1);assert.equal(stats.weekdays[0].count,2);
 assert.deepEqual(stats.years,[{name:'2025',count:1},{name:'2026',count:2}]);
 assert.equal(stats.airportRanking.find(a=>a.name==='YVR').count,2);
 assert.deepEqual(stats.airframes,[{name:'C-FABC',count:2}]);
 assert.equal(stats.airlineDistance.length,1);assert(stats.airlineDistance[0].count>10000);
 assert.equal(stats.longDistance,1);assert.equal(flightBreakdown([],airports).averageKm,null);
});

test('shooting days respect the filtered set, global first sightings and local capture order',()=>{
  const date='2026-11-05';
  const photo=(id,capturedAt)=>({id,date,capturedAt,airport:'YYZ',models:['A'],airlines:['B']});
  const visible=[photo('missing'),photo('late',date+'T09:10:00-08:00'),photo('early',date+'T11:15:00-05:00')];
  const [day]=shootingDays(visible,[{name:'A',firstSeen:'2026-10-25'}],[{name:'B',firstSeen:date}],['filtered-out','late']);
  assert.deepEqual(day.photos.map(p=>p.id),['early','late','missing']);
  assert.equal(day.cover.id,'late');
  assert.deepEqual(day.newModels,[]);assert.deepEqual(day.newAirlines,['B']);
  assert.equal(shootingDays(visible,[],[],[])[0].cover.id,'early');
  assert.deepEqual(shootingDays([],[],[],[]),[]);
});
