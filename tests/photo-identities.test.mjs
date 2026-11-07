import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import identities from '../data/photo-identities.json' with {type:'json'};
import {filterPhotos,initialFilters,flightsForPhoto} from '../lib/filter.mjs';
import log from '../data/flights.json' with {type:'json'};
const byId=new Map(catalog.photos.map(p=>[p.id,p]));

test('every photograph uses date-matched identity evidence and explicit flight confidence',()=>{
  assert.equal(Object.keys(identities).length,catalog.photos.length);
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
  for(const id of ['DSC00376','DSC07460']){
    const p=byId.get(id);assert.equal(p.registration.status,'confirmed');assert.equal(p.flightIdentification.status,'inferred');
  }
  const inferred={...byId.get('DSC06147'),registration:{value:log.flights.find(f=>f.registration).registration,status:'inferred'}};
  assert.equal(flightsForPhoto(inferred,log.flights).length,0);
  assert.equal(byId.get('DSC07460').flightIdentification.callsign,'LJY47');
  assert.deepEqual(byId.get('DSC07460').flights,[]);
  assert.deepEqual(byId.get('DSC00376').flights,['推测航班 AC8376']);
  assert.ok(!byId.get('DSC00376').flights.some(f=>f.includes('AC8377')));
  assert.equal(byId.get('DSC00376').capturedAt,'2026-10-31T12:17:25-07:00');
  // B.C. retains UTC-07:00 from 2026; the camera itself retained its -04:00 EXIF offset.
  // https://news.gov.bc.ca/releases/2026AG0013-000209
  assert.ok(catalog.photos.filter(p=>p.date==='2026-11-01').every(p=>p.capturedAt.endsWith('-07:00')));
});

test('full RAW readings resolve nearby frames only after date and fleet checks',()=>{
  for(const [id,registration,flight,callsign] of [
    ['DSC06147','N765YX','UA3648'],['DSC07662','C-GJNE',null,'FSY332'],
    ['DSC07805','B-LXM','CX805'],['DSC08002','C-GUPK','AC1018','ACA1018'],
    ['DSC08005','C-GUPK','AC1018','ACA1018'],['DSC08319','SU-GEU','MS996','MSR996'],
    ['DSC09237','B-LXQ','CX805','CPA805'],
  ]){
    const p=byId.get(id), evidence=identities[id].evidence;
    assert.equal(p.registration.value,registration);assert.equal(p.registration.status,'confirmed');
    assert.deepEqual(p.flights,flight?[flight]:[]);assert.equal(p.flightIdentification.status,'confirmed');
    assert.equal(p.flightIdentification.callsign,callsign);
    assert.ok(evidence.rawReview.frames.length>0);
    for(const frame of evidence.rawReview.frames){
      assert.equal(frame.capturedAt.slice(0,10),p.date);
      assert.ok(Math.abs(Date.parse(frame.capturedAt)-Date.parse(p.capturedAt))<=30000);
      assert.ok(frame.reading.length>0);
    }
  }
  assert.equal(identities.DSC06147.evidence.rawReview.fleetNumber,'765');
  assert.equal(identities.DSC08002.evidence.rawReview.fleetNumber,'124');
  assert.deepEqual(identities.DSC08002.evidence.rawReview,identities.DSC08005.evidence.rawReview);
  assert.equal(byId.get('DSC06147').livery,'标准涂装');
});

test('callsigns stay distinct from commercial flight numbers and remain searchable',()=>{
  for(const [id,call] of [['DSC09643','N617MW'],['DSC09667','SYB242'],['DSC09694','CGAGE'],['DSC07697','ASP501']]){
    const p=byId.get(id);assert.deepEqual(p.flights,[]);assert.equal(p.flightIdentification.callsign,call);
    assert.ok(filterPhotos(catalog.photos,{...initialFilters,query:call},catalog.aircraft,catalog.airlines).some(p=>p.id===id));
  }
  assert.equal(byId.get('DSC00780').flightIdentification.callsign,'JBA392');
  assert.deepEqual(byId.get('DSC00780').flights,['JB392']);
});

test('stored aircraft do not inherit active flight numbers',()=>{
  for(const id of ['DSC06734','DSC09786']){
    const p=byId.get(id);assert.equal(p.registration.value,'RA-82078');assert.equal(p.flightIdentification.status,'not-applicable');assert.deepEqual(p.flights,[]);
  }
  for(const id of ['DSC06296','DSC07884','DSC07935'])assert.equal(byId.get(id).flightIdentification.status,'unknown');
});

test('November 4 preserves camera timestamps and matches all 69 edited photos to actual tracks',()=>{
  const batch=catalog.photos.filter(p=>p.date==='2026-11-04');
  assert.equal(batch.length,69);
  assert.equal(batch.filter(p=>p.flights.length===1).length,63);
  assert.equal(batch.filter(p=>!p.flights.length&&p.flightIdentification.callsign).length,6);
  for(const p of batch){
    const e=identities[p.id];
    assert.equal(p.registration.status,'confirmed');assert.equal(p.flightIdentification.status,'confirmed');
    assert.equal(p.capturedAt.slice(-6),'-05:00');
    assert.equal(e.evidence.cameraClockCorrectionSeconds,Number(p.id.slice(3))<947?480:0);
    const corrected=Date.parse(p.capturedAt)+e.evidence.cameraClockCorrectionSeconds*1000;
    assert.equal(corrected,Date.parse(e.evidence.lookupTime));
    assert.ok(Math.abs(Date.parse(e.evidence.track[0].timestamp_utc)-corrected)<=12000,p.id);
  }
  assert.deepEqual(byId.get('DSC01095').models,['Airbus A321neo LR']);
  assert.deepEqual(byId.get('DSC01106').flights,['BA93']);
  assert.equal(byId.get('DSC01106').flightIdentification.callsign,'BAW9ZY');
  assert.deepEqual(byId.get('DSC01054').flights,['QR767']);
  assert.equal(byId.get('DSC01054').flightIdentification.callsign,'QTR65U');
  assert.deepEqual(byId.get('DSC01070').models,['Cessna Citation CJ3']);
  assert.notEqual(catalog.aircraft.find(a=>a.name==='Cessna Citation CJ3').id,catalog.aircraft.find(a=>a.name==='Cessna Citation CJ3+').id);
});

test('November 5 imports use observed airframes and actual callsigns, including cargo operators',()=>{
  const groups=[
    [['DSC01172','DSC01175','DSC01182','DSC01185'],'Air Canada','Airbus A330-300','C-GOFV','AC855','ACA855'],
    [['DSC01198','DSC01202','DSC01205'],'Qatar Airways','Airbus A350-1000','A7-AOJ','QR767','QTR65U'],
    [['DSC01210','DSC01215','DSC01217','DSC01220'],'Atlas Air','Boeing 747-400F','N485MC','5Y841','GTI841'],
    [['DSC01230','DSC01234','DSC01237','DSC01239'],'Aer Lingus','Airbus A321XLR','EI-XLR','EI127','EIN1EN'],
    [['DSC01244','DSC01246','DSC01248'],'China Airlines','Boeing 777F','B-18776','CI5301','CAL5301'],
    [['DSC01264','DSC01273','DSC01276','DSC01279'],'KLM','Airbus A350-900','PH-ZNA','KL691','KLM147'],
    [['DSC01287','DSC01289','DSC01292'],'Air Canada','Airbus A320-200','C-GKOE','AC266','ACA266'],
    [['DSC01297','DSC01305','DSC01309','DSC01310'],'China Southern','Boeing 777F','B-20EM','CZ485','CSN485'],
  ];
  assert.equal(catalog.photos.filter(p=>p.date==='2026-11-05').length,29);
  for(const [ids,airline,model,registration,flight,callsign] of groups)for(const id of ids){
    const p=byId.get(id),i=identities[id];
    assert.deepEqual(p.airlines,[airline]);assert.deepEqual(p.models,[model]);
    assert.equal(p.registration.value,registration);assert.equal(p.registration.status,'confirmed');
    assert.deepEqual(p.flights,[flight]);assert.equal(p.flightIdentification.callsign,callsign);
    assert.equal(i.evidence.cameraClockCorrectionSeconds,0);
    assert.match(p.capturedAt,/^2026-11-05T\d{2}:\d{2}:\d{2}-05:00$/);
    assert.ok(Math.abs(Date.parse(p.capturedAt)-Date.parse(i.evidence.track[0].timestamp_utc))<9000);
    assert.equal(i.evidence.track[0].on_ground,airline==='China Airlines'?1:0);
  }
  assert.equal(byId.get('DSC01217').livery,'Flexport 货运涂装');
  assert.equal(catalog.aircraft.find(a=>a.name==='Boeing 747-400F').cover,'DSC01217');
});
