import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import identities from '../data/photo-identities.json' with {type:'json'};
import {filterPhotos,initialFilters,flightsForPhoto} from '../lib/filter.mjs';
import log from '../data/flights.json' with {type:'json'};
const byId=new Map(catalog.photos.map(p=>[p.id,p]));

test('every photograph uses date-matched identity evidence and explicit flight confidence',()=>{
  assert.equal(Object.keys(identities).length,372);
  for(const p of catalog.photos){
    const e=identities[p.id];
    assert.equal(e.date,p.date,p.id);
    assert.equal(p.capturedAt.slice(0,10),p.date,p.id);
    assert.ok(Number.isFinite(Date.parse(p.capturedAt)),p.id);
    for(const key of ['registration','flights','flightIdentification','capturedAt','subjects']){
      assert.deepEqual(p[key],e[key],`${p.id}: ${key}`);
    }
    assert.ok(['confirmed','inferred','unknown','not-applicable'].includes(p.flightIdentification.status));
    if(p.flightIdentification.status==='unknown'||p.flightIdentification.status==='not-applicable'){
      assert.deepEqual(p.flights,[]);
      assert.equal(p.flightIdentification.callsign,undefined);
    }
    if(p.flightIdentification.status==='inferred')assert.ok(p.flights.length===0||p.flights.every(f=>f.startsWith('推测航班 ')));
    if(p.registration)assert.match(p.registration.value,/^[A-Z0-9]+(?:-[A-Z0-9]+)?$/);
  }
  assert.doesNotMatch(JSON.stringify(identities),/\/Users\/|\/Volumes\/|\/L0\/|gh[pousr]_|asset_id|aircraft_hex/);
});

test('later selections inherit only the visually checked same-aircraft bursts',()=>{
  const pairs={DSC08173:'DSC08175',DSC08575:'DSC08582',DSC09096:'DSC09104',DSC09268:'DSC09272',DSC09553:'DSC09555'};
  for(const [id,neighbor] of Object.entries(pairs)){
    const p=byId.get(id), n=byId.get(neighbor),e=identities[id].evidence;
    const gap=(Date.parse(n.capturedAt)-Date.parse(p.capturedAt))/1000;
    assert.equal(p.date,n.date);assert.equal(p.airport,n.airport);
    assert.deepEqual(p.airlines,n.airlines);assert.deepEqual(p.models,n.models);
    assert.equal(p.registration.value,n.registration.value);assert.deepEqual(p.flights,n.flights);
    assert.deepEqual(e.neighborPhotos,[neighbor]);assert.equal(e.neighborGapSeconds,gap);assert.ok(gap>0&&gap<=5);
  }
});

test('new direct readings match historical operating flights, not nearby aircraft',()=>{
  for(const [id,registration,flight,callsign] of [['DSC08570','C-GZQB','PD302','POE302'],['DSC09470','C-GJNZ','AC8890','JZA890']]){
    const p=byId.get(id);assert.equal(p.registration.value,registration);assert.deepEqual(p.flights,[flight]);
    const track=identities[id].evidence.track[0];assert.equal(track.registration,registration);assert.equal(track.operating_callsign,callsign);
    const gap=(Date.parse(track.timestamp_utc)-Date.parse(p.capturedAt))/1000;assert.ok(gap>=480&&gap<=540);
  }
  assert.deepEqual(byId.get('DSC07036').flights,['PD204']);
});

test('airframe certainty remains separate from uncertain flight attribution',()=>{
  for(const id of ['DSC00376','DSC09237']){
    const p=byId.get(id);assert.equal(p.registration.status,'confirmed');assert.equal(p.flightIdentification.status,'inferred');
  }
  for(const id of ['DSC06147','DSC07662','DSC07805','DSC08002','DSC08005','DSC08319']){
    const p=byId.get(id);assert.equal(p.registration.status,'inferred');assert.equal(flightsForPhoto(p,log.flights).length,0);
  }
  assert.deepEqual(byId.get('DSC00376').flights,['推测航班 AC8376']);
  assert.ok(!byId.get('DSC00376').flights.some(f=>f.includes('AC8377')));
  assert.equal(byId.get('DSC00376').capturedAt,'2026-10-31T12:17:25-07:00');
  // B.C. retains UTC-07:00 from 2026; the camera itself retained its -04:00 EXIF offset.
  // https://news.gov.bc.ca/releases/2026AG0013-000209
  assert.ok(catalog.photos.filter(p=>p.date==='2026-11-01').every(p=>p.capturedAt.endsWith('-07:00')));
});

test('callsigns stay distinct from commercial flight numbers and remain searchable',()=>{
  for(const [id,call] of [['DSC09643','N617MW'],['DSC09667','SYB242'],['DSC09694','CGAGE'],['DSC07697','ASP501']]){
    const p=byId.get(id);assert.deepEqual(p.flights,[]);assert.equal(p.flightIdentification.callsign,call);
    assert.ok(filterPhotos(catalog.photos,{...initialFilters,query:call},catalog.aircraft,catalog.airlines).some(p=>p.id===id));
  }
  assert.equal(byId.get('DSC00780').flightIdentification.callsign,'JBA392');
  assert.deepEqual(byId.get('DSC00780').flights,['JB392']);
});

test('stored and multi-aircraft photographs do not inherit active flight numbers',()=>{
  for(const id of ['DSC06734','DSC09786']){
    const p=byId.get(id);assert.equal(p.registration.value,'RA-82078');assert.equal(p.flightIdentification.status,'not-applicable');assert.deepEqual(p.flights,[]);
  }
  const ramp=byId.get('DSC06736');assert.equal(ramp.registration,undefined);assert.deepEqual(ramp.flights,[]);
  assert.deepEqual(ramp.subjects.map(s=>[s.airline,s.registration.value]),[['Air Canada','C-FIUW'],['SWISS','HB-JHJ']]);
  assert.ok(filterPhotos(catalog.photos,{...initialFilters,query:'C-FIUW'},catalog.aircraft,catalog.airlines).some(p=>p.id===ramp.id));
  for(const id of ['DSC06296','DSC07460','DSC07884','DSC07935'])assert.equal(byId.get(id).flightIdentification.status,'unknown');
});
