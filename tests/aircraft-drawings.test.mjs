import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import catalog from '../data/catalog.json' with {type:'json'};
import drawings from '../data/aircraft-drawings.json' with {type:'json'};
import {aircraftDrawing} from '../lib/aircraft-drawings.mjs';

test('every catalog model has a reference or an explicit pending state',()=>{
  assert.deepEqual(Object.keys(drawings).sort(),catalog.aircraft.map(a=>a.name).sort());
  for(const [name,spec] of Object.entries(drawings)){
    if(spec.status==='pending'){
      assert.equal(spec.asset,undefined,name);
      assert.equal(spec.length,undefined,`${name}: do not present unverified dimensions`);
      continue;
    }
    assert.equal(spec.status,'reference',name);
    for(const key of ['length','span','height','artHeight'])assert.ok(Number.isFinite(spec[key])&&spec[key]>0,`${name}: ${key}`);
    for(const source of [spec.source,...(spec.additionalSources||[])]){
      assert.ok(new URL(source.url).protocol==='https:',name);
      assert.ok(source.title,name);
      if(source.page!==undefined)assert.ok(Number.isInteger(source.page)&&source.page>0,name);
    }
    assert.match(spec.asset,/^\/aircraft\/[a-z0-9-]+\.svg$/);
    assert.ok(fs.existsSync(path.join('public',spec.asset)),name);
  }
  assert.equal(aircraftDrawing('Unknown aircraft'),null);
});

test('technical diagrams use a single physical scale per family and fit their frame',()=>{
  const groups=new Map();
  for(const [name,spec] of Object.entries(drawings)){
    if(spec.status!=='reference')continue;
    const d=aircraftDrawing(name);
    assert.ok(d.x>=49&&d.x+d.width<=551,name);
    assert.ok(d.y>=30&&d.y+d.drawnHeight<=205.001,name);
    assert.ok(Math.abs(d.width/d.length-d.scale)<1e-10,name);
    if(groups.has(d.group))assert.equal(d.scale,groups.get(d.group),name);
    groups.set(d.group,d.scale);
  }
  assert.ok(aircraftDrawing('Airbus A318-100').width<aircraftDrawing('Airbus A321-200').width);
  assert.ok(aircraftDrawing('Boeing 787-8').width<aircraftDrawing('Boeing 787-10').width);
});

test('reference SVGs render visible geometry and contain no embedded external content',async()=>{
  for(const [name,spec] of Object.entries(drawings)){
    if(spec.status!=='reference')continue;
    const svg=fs.readFileSync(path.join('public',spec.asset),'utf8');
    assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|\bon\w+=|https?:\/\/(?!www.w3.org)/i,name);
    const {data,info}=await sharp(Buffer.from(svg)).resize({width:600}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let count=0,left=info.width,right=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      if(data[(y*info.width+x)*4+3]>16){count++;left=Math.min(left,x);right=Math.max(right,x);}
    }
    assert.ok(count>400,`${name}: missing geometry`);
    assert.ok(right-left>info.width*.90,`${name}: incomplete length`);
  }
});

test('card silhouettes do not load technical drawings',()=>{
  const preview=fs.readFileSync('components/plane-silhouette.tsx','utf8');
  assert.doesNotMatch(preview,/aircraftDrawing|\/aircraft\/|<image/);
  assert.match(preview,/aircraftShape/);
});
