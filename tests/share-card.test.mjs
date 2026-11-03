import {test} from 'node:test';
import assert from 'node:assert/strict';
import {containRect,shareCardDetails} from '../lib/share-card.mjs';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};

test('photography cards preserve identification uncertainty and only export display fields',()=>{
  const photo={...catalog.photos.find(p=>p.id==='DSC08110'),note:'PRIVATE NOTE',registration:{value:'TEST',status:'inferred',basis:'PRIVATE AUDIT'}};
  const card=shareCardDetails({kind:'photo',photo},airports);
  assert.equal(card.filename,'SKYLOG-photo-DSC08110.png');
  assert.equal(card.registration,'TEST · 推测');assert.equal(card.model,'Airbus A330-300');
  assert.equal(card.airport,'YYZ · Toronto');assert.equal(card.credit,'PHOTOGRAPHY © Yuan Wang');
  assert.equal(JSON.stringify(card).includes('PRIVATE'),false);
  assert.deepEqual([card.width,card.height],[1080,1350]);
  const unknown=shareCardDetails({kind:'photo',photo:{...photo,registration:undefined,models:[],airlines:[]}},{});
  assert.equal(unknown.model,'机型待确认');assert.equal(unknown.registration,'待确认');assert.equal(unknown.airport,'YYZ');
});

test('boarding cards preserve broad models and never copy booking details or invent flight information',()=>{
  const flight={...log.flights.find(f=>!f.model),registration:null,seat:'PRIVATE SEAT',bookingReference:'PRIVATE PNR'};
  const card=shareCardDetails({kind:'flight',flight},airports);
  assert.equal(card.model,flight.modelLabel);assert.equal(card.registration,'未记录');
  assert.equal(card.originCity,airports[flight.origin].city);assert.equal(card.destinationCity,airports[flight.destination].city);
  assert.equal(card.flight,flight.flight);assert.equal(card.date,flight.date);
  assert.equal(JSON.stringify(card).includes('PRIVATE'),false);
  assert.deepEqual([card.width,card.height],[1080,720]);
  assert.ok(card.filename.endsWith('.png'));
  const special=shareCardDetails({kind:'flight',flight:{...flight,flight:'../TEST/1'}},{});
  assert.ok(!special.filename.includes('/'));assert.equal(special.originCity,'城市待确认');
});

test('photo placement preserves the whole image and its aspect ratio in both orientations',()=>{
  const box={x:48,y:162,width:984,height:690};
  for(const [width,height] of [[6000,4000],[4000,6000],[6000,1500],[2000,2000]]){
    const r=containRect(width,height,box);
    assert.ok(Math.abs(r.width/r.height-width/height)<1e-9);
    assert.ok(r.x>=box.x&&r.y>=box.y);
    assert.ok(r.x+r.width<=box.x+box.width+1e-9&&r.y+r.height<=box.y+box.height+1e-9);
    assert.ok(Math.abs(r.width-box.width)<1e-9||Math.abs(r.height-box.height)<1e-9);
  }
});
