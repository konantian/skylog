import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import data from '../data/catalog.json' with {type:'json'};
import { initialFilters, filterCatalog, filterPhotos, photoMatches } from '../lib/filter.mjs';
const f = extra => ({...initialFilters,...extra});

test('all entries and photos have consistent links and unlock states',()=>{
  const ids=new Set(data.photos.map(p=>p.id));
  assert.equal(ids.size,372);
  for(const e of [...data.aircraft,...data.airlines]){
    assert.equal(e.unlocked,e.photoIds.length>0);
    assert.ok(e.photoIds.every(id=>ids.has(id)));
    assert.ok(e.cover===null||e.photoIds.includes(e.cover));
    for(const id of e.photoIds){const p=data.photos.find(p=>p.id===id);assert.ok((e.kind==='aircraft'?p.models:p.airlines).includes(e.name));}
  }
  assert.equal(data.aircraft.filter(e=>e.unlocked).length,46);
  assert.equal(data.airlines.filter(e=>e.unlocked).length,45);
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
  assert.equal(star.length,5);
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
  const p=data.photos.find(p=>p.models.length===0);
  assert.ok(photoMatches(p,f({}),data.aircraft));
  assert.equal(photoMatches(p,f({manufacturer:'Airbus'}),data.aircraft),false);
});
test('visual review fixes the Porter photo without making a Cargojet unlock',()=>{
  const p=data.photos.find(p=>p.id==='DSC09524');
  assert.deepEqual(p.airlines,['Porter Airlines']);
  assert.deepEqual(p.models,['De Havilland Canada Dash 8-400']);
  assert.deepEqual(p.flights,['P39002']);
  assert.equal(p.flightIdentification.callsign,'PTR9002');
  assert.equal(data.airlines.find(e=>e.name==='Cargojet').unlocked,false);
});
test('every public JPG and thumbnail exists, decodes and has no EXIF/GPS',async()=>{
  for(const p of data.photos){
    for(const key of ['image','thumbnail']){
      assert.match(p[key],/^\/photos\/(thumbs\/)?DSC\d+\.jpg$/);
      const file=`public${p[key]}`;
      assert.ok((await stat(file)).size>1000);
      const m=await sharp(file).metadata();
      assert.equal(m.format,'jpeg');assert.ok(m.width<=2000&&m.height<=2000);assert.equal(m.exif,undefined);
    }
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
  const ac=groupModelVariants(a330,filterPhotos(data.photos,f({model:a330.name,airline:'Air Canada'}),data.aircraft),data.airlines);
  assert.ok(ac.length>=4);
  assert.ok(ac.every(g=>g.name==='Air Canada'));
  assert.equal(ac.length,new Set(ac.map(g=>g.livery)).size);
});
test('multi-aircraft ramp images do not invent airline/model pairs',()=>{
  const p=data.photos.find(p=>p.id==='DSC06736');
  assert.equal(photoMatches(p,f({airline:'SWISS',model:'Boeing 777-300ER'}),data.aircraft),false);
  assert.equal(photoMatches(p,f({airline:'SWISS',model:'Airbus A330-300'}),data.aircraft),true);
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
