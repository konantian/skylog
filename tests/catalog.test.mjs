import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import data from '../data/catalog.json' with {type:'json'};
import verification from '../data/photo-verification.json' with {type:'json'};
import {photoImageSources,originalPhoto} from '../lib/photo-images.mjs';
import { initialFilters, filterCatalog, filterPhotos, photoMatches, airlinesForModel, modelsForAirline } from '../lib/filter.mjs';
const f = extra => ({...initialFilters,...extra});

test('all entries and photos have consistent links and unlock states',()=>{
  const ids=new Set(data.photos.map(p=>p.id));
  assert.equal(ids.size,441);
  assert.equal(new Set(data.aircraft.map(a=>a.id)).size,data.aircraft.length);
  for(const e of [...data.aircraft,...data.airlines]){
    assert.equal(e.unlocked,e.photoIds.length>0);
    assert.ok(e.photoIds.every(id=>ids.has(id)));
    assert.ok(e.cover===null||e.photoIds.includes(e.cover));
    for(const id of e.photoIds){const p=data.photos.find(p=>p.id===id);assert.ok((e.kind==='aircraft'?p.models:p.airlines).includes(e.name));}
  }
  assert.equal(data.aircraft.filter(e=>e.unlocked).length,53);
  assert.equal(data.airlines.filter(e=>e.unlocked).length,47);
});
test('manufacturer, airline and model combine on actual photographs',()=>{
  const filters=f({manufacturer:'Airbus',airline:'Air Canada',model:'Airbus A330-300'});
  const ps=filterPhotos(data.photos,filters,data.aircraft,data.airlines);
  assert.ok(ps.length>5);
  assert.ok(ps.every(p=>p.airlines.includes('Air Canada')&&p.models.includes('Airbus A330-300')));
  assert.deepEqual(filterCatalog(data.aircraft,data.photos,filters,'aircraft',data.aircraft,data.airlines).map(e=>e.name),['Airbus A330-300']);
  assert.equal(filterPhotos(data.photos,f({...filters,manufacturer:'Boeing'}),data.aircraft).length,0);
});
test('one model and airline retain different liveries and angles',()=>{
  const ps=filterPhotos(data.photos,f({airline:'Air Canada',model:'Airbus A330-300'}),data.aircraft);
  assert.ok(new Set(ps.map(p=>p.livery)).size>=4);
  const star=filterPhotos(data.photos,f({airline:'Air Canada',model:'Airbus A330-300',livery:'Star Alliance 星空联盟涂装'}),data.aircraft);
  assert.equal(star.length,7);
  assert.ok(star.every(p=>p.livery.startsWith('Star Alliance')));
});
test('locked targets do not claim airport sightings or airline relationships',()=>{
  const locked=filterCatalog(data.aircraft,data.photos,f({status:'locked',manufacturer:'Airbus'}),'aircraft',data.aircraft);
  assert.ok(locked.length>0&&locked.every(e=>!e.unlocked&&e.manufacturer==='Airbus'));
  assert.equal(filterCatalog(data.aircraft,data.photos,f({status:'locked',airport:'YYZ'}),'aircraft',data.aircraft).length,0);
  assert.equal(filterCatalog(data.airlines,data.photos,f({status:'locked',livery:'标准涂装'}),'airlines',data.aircraft).length,0);
});
test('search understands punctuation and Chinese airline names',()=>{
  assert.ok(filterCatalog(data.aircraft,data.photos,f({query:'777200LR'}),'aircraft',data.aircraft).some(e=>e.name==='Boeing 777-200LR'));
  const ps=filterPhotos(data.photos,f({query:'汉莎'}),data.aircraft,data.airlines);
  assert.ok(ps.length>0&&ps.every(p=>p.airlines.includes('Lufthansa')));
});
test('empty models stay visible until model-specific filters are selected',()=>{
  const p={...data.photos[0],models:[]};
  assert.ok(photoMatches(p,f({}),data.aircraft));
  assert.equal(photoMatches(p,f({manufacturer:'Airbus'}),data.aircraft),false);
});
test('reviewed business and turboprop models unlock under their own manufacturers',()=>{
  for(const [photoId,name,manufacturer,category] of [
    ['DSC07662','Cessna Citation II','Cessna','公务机'],
    ['DSC00768','Beechcraft 1900D','Beechcraft','涡桨飞机'],
  ]){
    const p=data.photos.find(p=>p.id===photoId), model=data.aircraft.find(m=>m.name===name);
    assert.deepEqual(p.models,[name]);assert.equal(p.note,'');
    assert.equal(model.manufacturer,manufacturer);assert.equal(model.category,category);
    assert.equal(model.unlocked,true);assert.equal(model.cover,photoId);
    assert.deepEqual(filterPhotos(data.photos,f({manufacturer,model:name}),data.aircraft).map(p=>p.id),[photoId]);
  }
});
test('visual review fixes the Porter photo without making a Cargojet unlock',()=>{
  const p=data.photos.find(p=>p.id==='DSC09524');
  assert.deepEqual(p.airlines,['Porter Airlines']);
  assert.deepEqual(p.models,['De Havilland Canada Dash 8-400']);
  assert.deepEqual(p.flights,['P39002']);
  assert.equal(p.flightIdentification.callsign,'PTR9002');
  assert.equal(data.airlines.find(e=>e.name==='Cargojet').unlocked,false);
});
test('every responsive JPG has its advertised dimensions, preserves the crop and strips private metadata',async()=>{
  assert.equal(verification.count,data.photos.length);
  assert.equal(new Set(verification.files.map(f=>f.photo)).size,data.photos.length);
  for(const p of data.photos){
    const record=verification.files.find(f=>f.photo===p.id);
    const original=originalPhoto(p.id);
    assert.match(original.url,new RegExp(`^https://github.com/konantian/skylog/releases/download/[\\w.-]+/${p.id}\\.jpg$`));
    assert.ok(original.width>0&&original.height>0&&original.bytes>1000);
    for(const [url,limit,width,bytes] of [
      [p.image,3200,record.width,record.imageBytes],
      [`/photos/medium/${p.id}.jpg`,1600,record.mediumWidth,record.mediumBytes],
      [p.thumbnail,800,record.thumbnailWidth,record.thumbnailBytes],
    ]){
      assert.match(url,/^\/photos\/((thumbs|medium)\/)?DSC\d+\.jpg$/);
      const file=`public${url}`;
      assert.equal((await stat(file)).size,bytes);
      const m=await sharp(file).metadata();
      assert.equal(m.format,'jpeg');assert.ok(m.width<=limit&&m.height<=limit);
      assert.equal(m.width,width);assert.equal(m.exif,undefined);assert.equal(m.xmp,undefined);assert.equal(m.iptc,undefined);
      assert.ok(m.width<=original.width&&m.height<=original.height,'Never upscale a cropped source');
      assert.ok(Math.abs(m.height-m.width*original.height/original.width)<=1,'Keep original composition');
    }
  }
});

test('responsive images honor the base path and keep full-size downloads out of the display sources',()=>{
  for(const photo of data.photos){
    const sources=photoImageSources(photo,'/skylog');
    assert.equal(sources.src,`/skylog${photo.image}`);
    const candidates=sources.srcSet.split(', ').map(s=>s.split(' '));
    const widths=candidates.map(([,w])=>parseInt(w));
    assert.deepEqual(widths,[...new Set(widths)].sort((a,b)=>a-b));
    assert.ok(candidates.every(([url])=>url.startsWith('/skylog/photos/')));
    assert.equal(sources.srcSet.includes('releases/download'),false);
    assert.ok(sources.width>0&&sources.height>0);
  }
});
test('published data contains no library IDs, workstation paths or credentials',async()=>{
  const raw=await readFile('data/catalog.json','utf8');
  assert.doesNotMatch(raw,/\/Users\/|\/Volumes\/|\/L0\/|gh[pousr]_|source_repository_credential/);
});

test('model selection lists each airline and livery as parallel cards',async()=>{
  const {groupModelVariants}=await import('../lib/filter.mjs');
  const a380=data.aircraft.find(a=>a.name==='Airbus A380-800');
  const ps=filterPhotos(data.photos,f({model:a380.name}),data.aircraft);
  const groups=groupModelVariants(a380,ps,data.airlines);
  assert.deepEqual(new Set(groups.map(g=>g.name)),new Set(['Emirates','Etihad Airways']));
  assert.equal(groups.length,2);
  assert.equal(groups.flatMap(g=>g.photoIds).length,9);
  const a330=data.aircraft.find(a=>a.name==='Airbus A330-300');
  const ac=groupModelVariants(a330,filterPhotos(data.photos,f({model:a330.name,airline:'Air Canada'}),data.aircraft),data.airlines).filter(g=>g.name==='Air Canada');
  assert.ok(ac.length>=4);
  assert.ok(ac.every(g=>g.name==='Air Canada'));
  assert.equal(ac.length,new Set(ac.map(g=>g.livery)).size);
});
test('multi-aircraft ramp images retain each visible airline/model pair without inventing others',()=>{
  const p=data.photos.find(p=>p.id==='DSC06736');
  assert.equal(photoMatches(p,f({airline:'SWISS',model:'Boeing 777-300ER'}),data.aircraft),false);
  assert.equal(photoMatches(p,f({airline:'SWISS',model:'Airbus A330-300'}),data.aircraft),true);
  assert.equal(photoMatches(p,f({airline:'Air Canada',model:'Airbus A330-300'}),data.aircraft),true);
  assert.equal(photoMatches(p,f({airline:'Air Canada',model:'Boeing 777-300ER'}),data.aircraft),true);
  assert.equal(photoMatches(p,f({airline:'Etihad Airways',model:'Boeing 777-300ER'}),data.aircraft),false);
  assert.deepEqual(airlinesForModel(p,'Boeing 777-300ER'),['Air Canada']);
  assert.deepEqual(airlinesForModel(p,'Airbus A330-300'),['SWISS','Air Canada']);
  assert.deepEqual(modelsForAirline(p,'SWISS'),['Airbus A330-300']);
  assert.deepEqual(modelsForAirline(p,'Air Canada'),['Boeing 777-300ER','Airbus A330-300']);
  assert.deepEqual(modelsForAirline(p,'Etihad Airways'),[]);
  const single=data.photos.find(p=>p.id==='DSC08110');
  assert.deepEqual(airlinesForModel(single,'Airbus A330-300'),['SWISS']);
  assert.deepEqual(modelsForAirline(single,'SWISS'),['Airbus A330-300']);
  assert.deepEqual(modelsForAirline(single,'Air Canada'),[]);
});

test('every unlocked aircraft uses its visually selected cover',async()=>{
  const covers=JSON.parse(await readFile('data/cover-selections.json','utf8'));
  for(const entry of data.aircraft.filter(e=>e.unlocked)){
    assert.equal(entry.cover,covers.aircraft[entry.name]);
    assert.equal(entry.photoIds[0],entry.cover);
  }
});

test('model aliases never leak into the flight-number field',()=>{
  for(const p of data.photos) for(const flight of p.flights) assert.match(flight,/^(?:推测航班\s+)?[A-Z0-9]{2,3}\s?\d{1,4}(?:\s+\(inferred\))?$/);
});

test('confirmed same-aircraft bursts keep consistent livery classifications',()=>{
  const photos=data.photos.filter(p=>p.registration?.status==='confirmed');
  for(let i=0;i<photos.length;i++)for(let j=i+1;j<photos.length;j++){
    const a=photos[i],b=photos[j];
    if(a.registration.value===b.registration.value&&a.date===b.date&&a.airport===b.airport&&Math.abs(Date.parse(a.capturedAt)-Date.parse(b.capturedAt))<=120000){
      assert.equal(a.livery,b.livery,`${a.id} / ${b.id}: same aircraft photographed within two minutes`);
    }
  }
});
