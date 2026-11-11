import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};
import {greatCircleKm,flightRecords,aircraftFamilies} from '../lib/insights.mjs';

test('great-circle distances are symmetric, cross the date line, and tolerate missing airports',()=>{
  const a={latitude:0,longitude:0},b={latitude:0,longitude:90};
  assert.ok(Math.abs(greatCircleKm(a,b)-10007.557)<.001);
  assert.equal(greatCircleKm(a,b),greatCircleKm(b,a));
  assert.equal(greatCircleKm(a,a),0);
  assert.ok(Math.abs(greatCircleKm({latitude:0,longitude:179},{latitude:0,longitude:-179})-222.39)<.01);
  assert.equal(greatCircleKm(a,undefined),null);
});
test('records count every flight once, exclude missing distances, and retain tied years',()=>{
  const locations={A:{latitude:0,longitude:0},B:{latitude:0,longitude:10},C:{latitude:0,longitude:20}};
  const flights=[{date:'2025-01-01',origin:'A',destination:'B'},{date:'2025-01-02',origin:'B',destination:'A'},{date:'2026-01-01',origin:'A',destination:'C'},{date:'2026-01-02',origin:'A',destination:'UNKNOWN'}];
  const r=flightRecords(flights,locations);
  assert.equal(r.measured,3);assert.ok(Math.abs(r.totalKm-greatCircleKm(locations.A,locations.B)*4)<1e-8);
  assert.equal(r.shortest.flight,flights[0]);assert.equal(r.longest.flight,flights[2]);
  assert.deepEqual(r.busiestYears,[{name:'2025',count:2},{name:'2026',count:2}]);
  assert.deepEqual(flightRecords([],locations),{totalKm:0,measured:0,shortest:null,longest:null,busiestYears:[]});
});
test('all public flight records have measured distances and chronological year counts',()=>{
  const records=flightRecords(log.flights,airports);
  assert.equal(records.measured,86);assert.ok(records.totalKm>200000&&records.totalKm<500000);
  assert.equal(records.busiestYears[0].name,'2024');assert.equal(records.busiestYears[0].count,14);
  assert.ok(records.shortest.km>40&&records.shortest.km<100);
  assert.deepEqual([records.longest.flight.origin,records.longest.flight.destination].sort(),['HKG','YVR']);
  assert.ok(records.longest.km>10200&&records.longest.km<10300);
});
test('family collection preserves every model and only unlocks photographed entries',()=>{
  const families=aircraftFamilies(catalog.aircraft);
  assert.equal(families.reduce((n,g)=>n+g.entries.length,0),82);
  assert.equal(new Set(families.flatMap(g=>g.entries.map(e=>e.id))).size,82);
  assert.equal(families.reduce((n,g)=>n+g.unlocked,0),56);
  const triple=families.find(g=>g.key==='Boeing:777');
  assert.equal(triple.unlocked,3);assert.equal(triple.entries.length,4);
  assert.equal(triple.entries.find(e=>e.name==='Boeing 777-200ER').unlocked,false);
  assert.equal(families.find(g=>g.key==='Boeing:787').unlocked,3);
  assert.ok(families.every(g=>g.entries.filter(e=>e.unlocked).every(e=>e.cover&&catalog.photos.some(p=>p.id===e.cover&&p.models.includes(e.name)))));
  assert.equal(aircraftFamilies([{name:'A',manufacturer:'One',family:'Same',unlocked:true},{name:'B',manufacturer:'Two',family:'Same',unlocked:false}]).length,2);
});
