import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import flightData from '../data/flights.json' with {type:'json'};
import profiles from '../data/airline-profiles.json' with {type:'json'};
import selections from '../data/cover-selections.json' with {type:'json'};
import {airlineCollection,airlineRegistrations} from '../lib/airline-collection.mjs';
import {modelsForAirline} from '../lib/filter.mjs';

const confirmed=value=>({value,status:'confirmed'});
const photo=(id,extra={})=>({id,date:'2026-10-01',airport:'YYZ',airlines:['A'],models:['M1'],livery:'Standard',registration:confirmed('C-ONE'),...extra});

test('airline collections deduplicate airframes, keep variants separate and choose curated covers',()=>{
  const photos=[photo('one'),photo('best'),photo('special',{livery:'Special',date:'2026-11-01',airport:'YVR',registration:{value:'C-TWO',status:'inferred'}}),photo('other',{airlines:['B']})];
  const entry={name:'A',photoIds:photos.map(p=>p.id),cover:'one'};
  const flights=[{id:'1',airline:'A',date:'2024-01-01',model:'M1',registration:'c one'},{id:'2',airline:'A',date:'2025-01-01',model:null,registration:'C-TWO'},{id:'3',airline:'B',date:'2026-01-01',model:'M2',registration:'C-ONE'}];
  const result=airlineCollection(entry,photos,flights,['best']);
  assert.equal(result.cover.id,'one');assert.equal(result.photoCount,3);assert.equal(result.modelCount,1);assert.equal(result.registrationCount,1);
  assert.equal(result.groups.length,2);assert.equal(result.groups[0].cover.id,'best');assert.deepEqual(result.groups[0].photoIds,['best','one']);
  assert.deepEqual(result.firstAirports,['YYZ']);assert.deepEqual(result.airports,['YVR','YYZ']);assert.equal(result.lastSeen,'2026-11-01');
  assert.deepEqual(result.flights.map(f=>f.id),['2','1']);assert.deepEqual(result.flownModels,['M1']);assert.equal(result.unknownFlightModels,1);
  assert.deepEqual(result.both,[{registration:'C-ONE',photoIds:['best','one']}]);
  assert.deepEqual(flights.map(f=>f.id),['1','2','3']);
});

test('multi-aircraft frames never assign another carrier’s model or registration',()=>{
  const mixed=photo('mixed',{airlines:['A','B'],models:['M1','M2'],registration:confirmed('WRONG'),subjects:[{airline:'A',model:'M1',registration:confirmed('A-ONE')},{airline:'B',model:'M2',registration:confirmed('B-ONE')}]});
  const result=airlineCollection({name:'A',photoIds:['mixed']},[mixed],[{airline:'A',date:'2025-01-01',registration:'B-ONE'}]);
  assert.deepEqual(result.groups.map(g=>g.model),['M1']);assert.equal(result.registrationCount,1);assert.equal(result.both.length,0);
  assert.deepEqual(airlineRegistrations(mixed,'A'),[confirmed('A-ONE')]);
  assert.deepEqual(airlineRegistrations({...mixed,subjects:undefined},'A'),[]);
});

test('unphotographed airlines retain flight records without claiming a photo unlock',()=>{
  const r=airlineCollection({name:'A',photoIds:[],cover:null},[],[{airline:'A',date:'2020-01-01',model:'M1'}]);
  assert.equal(r.cover,null);assert.equal(r.firstSeen,null);assert.equal(r.photoCount,0);assert.equal(r.registrationCount,0);assert.equal(r.groups.length,0);assert.equal(r.flights.length,1);assert.equal(r.both.length,0);
});

test('all public airlines have profiles and collection groups match their photographed subjects',()=>{
  assert.deepEqual(Object.keys(profiles.airlines).sort(),catalog.airlines.map(a=>a.name).sort());
  for(const entry of catalog.airlines){
    const facts=profiles.airlines[entry.name];assert.ok(facts.alliance);
    for(const key of facts.sources)assert.ok(profiles.sources[key]?.url.startsWith('https://'));
    for(const d of facts.designators){assert.match(d.icao,/^[A-Z]{3}$/);assert.ok(d.callsign);assert.ok(d.operator);}
    const r=airlineCollection(entry,catalog.photos,flightData.flights,selections.preferredPhotos);
    assert.equal(r.photoCount,entry.photoIds.length);
    for(const g of r.groups){assert.ok(modelsForAirline(g.cover,entry.name).includes(g.model));assert.equal(g.cover.livery,g.livery);assert.ok(g.photoIds.includes(g.cover.id));}
  }
  assert.equal(profiles.airlines['ITA Airways'].alliance,'Star Alliance');
  assert.equal(profiles.airlines.SAS.alliance,'SkyTeam');
  assert.equal(profiles.airlines['Philippine Airlines'].alliance,'oneworld · 未来成员');
  assert.equal(profiles.airlines['Juneyao Air'].alliance,'星空联盟优连伙伴');
  assert.equal(profiles.airlines['Porter Airlines'].designators.length,2);
  assert.equal(catalog.airlines.find(a=>a.name==='Iskwew Air').code,'');
});
