import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import catalog from '../data/catalog.json' with {type:'json'};
import {aircraftShape,aircraftFamilies,aircraftModels} from '../lib/aircraft-silhouettes.mjs';

const shape=name=>{const entry=catalog.aircraft.find(a=>a.name===name);assert.ok(entry,name);return aircraftShape({model:name,family:entry.family,category:entry.category});};
const has=(s,feature)=>s.paths.some(p=>p.feature===feature);

test('every catalog model has a specific profile; airline placeholders stay unidentified',()=>{
  for(const entry of catalog.aircraft){
    const s=shape(entry.name);
    assert.equal(s.known,true,entry.name);
    assert.equal(s.family,entry.family);
    assert.equal(s.length,aircraftModels[entry.name].length);
    assert.ok(s.scale>0&&Number.isFinite(s.scale));
    assert.ok(s.paths.every(p=>p.d&&!/NaN|undefined|Infinity/.test(p.d)));
  }
  assert.equal(Object.keys(aircraftFamilies).length,new Set(catalog.aircraft.map(a=>a.family)).size);
  assert.equal(aircraftShape().known,false);
  assert.equal(aircraftShape({model:'Future aircraft'}).model,'');
});

test('stretch variants keep one family scale and preserve their real length ratios',()=>{
  const groups=[['Airbus A318-100','Airbus A319-100','Airbus A320-200','Airbus A321-200'],['Airbus A340-300','Airbus A340-500','Airbus A340-600'],['Boeing 737-500','Boeing 737-800','Boeing 737 MAX 9'],['Boeing 757-200','Boeing 757-300'],['Boeing 787-8','Boeing 787-9','Boeing 787-10'],['Bombardier CRJ-200','Bombardier CRJ-700','Bombardier CRJ-900'],['De Havilland Canada Dash 8-300','De Havilland Canada Dash 8-400']];
  for(const names of groups){const profiles=names.map(shape);assert.equal(new Set(profiles.map(s=>s.scale)).size,1,names.join(', '));for(let i=1;i<profiles.length;i++)assert.ok(profiles[i].length*profiles[i].scale>profiles[i-1].length*profiles[i-1].scale);}
  const short=shape('Airbus A340-300'),long=shape('Airbus A340-600');
  assert.ok(Math.abs(long.length/short.length-75.36/63.69)<1e-10);
  assert.equal(shape('Airbus A320neo').scale,shape('Airbus A320-200').scale);
  assert.equal(shape('Boeing 777-200ER').length,shape('Boeing 777-200LR').length);
});

test('side profiles have aft-swept fins and stable cross-runtime SVG coordinates',()=>{
  for(const entry of catalog.aircraft){
    const s=shape(entry.name),fin=s.paths.find(p=>p.feature==='vertical-tail').d;
    const [,rootX,rootY,tipX,tipY]=fin.match(/^M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/).map(Number);
    assert.ok(tipX<rootX&&tipY<rootY,`${entry.name}: fin must sweep toward the tail`);
    assert.ok(s.paths.every(p=>!/-?\d+\.\d{5,}/.test(p.d)),`${entry.name}: unstable coordinate precision`);
  }
});

test('distinct engine, wingtip, upper deck and cargo features survive rendering',()=>{
  const a380=shape('Airbus A380-800'),md11=shape('McDonnell Douglas MD-11F'),crj=shape('Bombardier CRJ-200');
  assert.equal(a380.engines,4);assert.ok(has(a380,'outer-wing-engine'));assert.ok(has(a380,'upper-deck-windows'));
  assert.equal(md11.engines,3);assert.ok(has(md11,'tail-engine'));assert.ok(!has(md11,'cabin-windows'));assert.ok(has(md11,'cargo-door'));
  assert.ok(has(crj,'rear-engine'));assert.ok(!has(crj,'wing-engine'));
  assert.equal(shape('De Havilland Canada Dash 8-300').paths.filter(p=>p.feature==='propeller-blade').length,4);
  assert.equal(shape('De Havilland Canada Dash 8-400').paths.filter(p=>p.feature==='propeller-blade').length,6);
  assert.notDeepEqual(shape('Boeing 737 MAX 8').paths,shape('Boeing 737-800').paths);
  assert.notDeepEqual(shape('Airbus A330-300').paths,shape('Boeing 777-300ER').paths);
  const pax=shape('Boeing 747-8'),cargo=shape('Boeing 747-8F');
  assert.equal(pax.length,cargo.length);assert.ok(!has(cargo,'cabin-windows'));assert.ok(has(cargo,'upper-deck-windows'));
  assert.notEqual(pax.paths.find(p=>p.feature==='fuselage').d,cargo.paths.find(p=>p.feature==='fuselage').d);
});

test('all generated silhouettes rasterize within the shared card viewport without clipping',async()=>{
  for(const entry of catalog.aircraft){
    const s=shape(entry.name);
    const paths=s.paths.map(p=>`<path d="${p.d}" fill="${p.fill==='none'?'none':'#999'}" stroke="${p.stroke?'#555':'none'}" stroke-width="${p.strokeWidth}"/>`).join('');
    const {data,info}=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240"><g transform="translate(${s.offset} 145) scale(${s.scale})">${paths}</g></svg>`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let minX=600,minY=240,maxX=0,maxY=0;
    for(let y=0;y<240;y++)for(let x=0;x<600;x++)if(data[(y*600+x)*info.channels+3]>10){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    assert.ok(minX>=10&&maxX<=590&&minY>=10&&maxY<=230,`${entry.name}: ${[minX,minY,maxX,maxY]}`);
    assert.ok(maxX-minX>180,`${entry.name} too small to recognize`);
  }
});
