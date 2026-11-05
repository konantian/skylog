import {test} from 'node:test';
import assert from 'node:assert/strict';
import {translate} from '../lib/i18n.mjs';
import {containRect,shareCardDetails} from '../lib/share-card.mjs';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};

test('photography cards hide status labels while preserving underlying identity data',()=>{
  const photo={...catalog.photos.find(p=>p.id==='DSC08110'),note:'PRIVATE NOTE',registration:{value:'TEST',status:'inferred',basis:'PRIVATE AUDIT'}};
  const card=shareCardDetails({kind:'photo',photo},airports);
  assert.equal(card.filename,'SKYLOG-photo-DSC08110-landscape.png');
  assert.equal(card.registration,'TEST');assert.equal(card.model,'空客 A330-300');
  assert.equal(photo.registration.status,'inferred');assert.equal(photo.registration.basis,'PRIVATE AUDIT');
  assert.equal(card.airport,'YYZ · 多伦多皮尔逊');assert.equal(card.credit,'摄影 © 王源');
  assert.equal(JSON.stringify(card).includes('PRIVATE'),false);
  assert.deepEqual([card.width,card.height],[1620,1080]);
  const unknown=shareCardDetails({kind:'photo',photo:{...photo,registration:undefined,models:[],airlines:[]}},{});
  assert.equal(unknown.model,'机型待确认');assert.equal(unknown.registration,'—');assert.equal(unknown.airport,'YYZ');
});

test('boarding cards preserve broad models and never copy booking details or invent flight information',()=>{
  const flight={...log.flights.find(f=>!f.model),registration:null,seat:'PRIVATE SEAT',bookingReference:'PRIVATE PNR'};
  const card=shareCardDetails({kind:'flight',flight},airports);
  assert.equal(card.model,translate('zh',flight.modelLabel));assert.equal(card.registration,'未记录');
  assert.equal(card.originCity,translate('zh',airports[flight.origin].city));assert.equal(card.destinationCity,translate('zh',airports[flight.destination].city));
  assert.equal(card.flight,flight.flight);assert.equal(card.date,flight.date);
  assert.equal(JSON.stringify(card).includes('PRIVATE'),false);
  assert.deepEqual([card.width,card.height],[1080,720]);
  assert.ok(card.filename.endsWith('.png'));
  const special=shareCardDetails({kind:'flight',flight:{...flight,flight:'../TEST/1'}},{});
  assert.ok(!special.filename.includes('/'));assert.equal(special.originCity,'—');
});

test('photo placement preserves the whole image and its aspect ratio in both orientations',()=>{
  for(const box of [{x:48,y:162,width:984,height:690},{x:48,y:152,width:1524,height:620}])for(const [width,height] of [[6000,4000],[4000,6000],[6000,1500],[2000,2000]]){
    const r=containRect(width,height,box);
    assert.ok(Math.abs(r.width/r.height-width/height)<1e-9);
    assert.ok(r.x>=box.x&&r.y>=box.y);
    assert.ok(r.x+r.width<=box.x+box.width+1e-9&&r.y+r.height<=box.y+box.height+1e-9);
    assert.ok(Math.abs(r.width-box.width)<1e-9||Math.abs(r.height-box.height)<1e-9);
  }
});

test('orientation changes the export size and filename while retaining the same photo or flight',()=>{
  for(const source of [{kind:'photo',photo:catalog.photos[0]},{kind:'flight',flight:log.flights[0]}]){
    const landscape=shareCardDetails(source,airports),portrait=shareCardDetails(source,airports,'portrait');
    assert.equal(landscape.orientation,'landscape');assert.equal(portrait.orientation,'portrait');
    assert.ok(landscape.width>landscape.height);assert.ok(portrait.height>portrait.width);
    assert.deepEqual([portrait.width,portrait.height],[1080,1350]);
    assert.equal(landscape.filename.replace('-landscape.png','-portrait.png'),portrait.filename);
    const {width,height,filename,orientation,...landscapeData}=landscape;
    const {width:pw,height:ph,filename:pf,orientation:po,...portraitData}=portrait;
    assert.deepEqual(landscapeData,portraitData);
    assert.deepEqual(shareCardDetails(source,airports,'invalid'),landscape);
  }
});
