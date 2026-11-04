import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import {comparisonCues,comparisonDrawings,updateComparison} from '../lib/aircraft-comparison.mjs';

test('comparison keeps models unique, permits replacement/removal, and stops at three',()=>{
  const two=['Airbus A320-200','Airbus A380-800'];
  assert.deepEqual(updateComparison(two,two[0]),two);
  assert.deepEqual(updateComparison(two,'Boeing 787-9',1),[two[0],'Boeing 787-9']);
  assert.deepEqual(updateComparison(two,'',0),[two[1]]);
  const three=updateComparison(two,'Boeing 787-9');
  assert.deepEqual(updateComparison(three,'Boeing 747-400'),three);
  assert.deepEqual(two,['Airbus A320-200','Airbus A380-800']);
});

test('unrelated families share one scale with noses and ground aligned',()=>{
  const models=['Airbus A320-200','Airbus A380-800','Boeing 787-9'];
  const shapes=comparisonDrawings(models).map(d=>d.drawing);
  for(const d of shapes){
    assert.equal(d.scale,shapes[0].scale);
    assert.ok(Math.abs(d.x+d.width-550)<1e-9);
    assert.ok(Math.abs(d.y+d.drawnHeight-205)<1e-9);
    assert.ok(Math.abs(d.width/shapes[0].width-d.length/shapes[0].length)<1e-9);
  }
  assert.ok(shapes[1].width>shapes[0].width*1.9);
  assert.deepEqual(comparisonDrawings([]),[]);
  assert.deepEqual(comparisonDrawings(['Unknown']),[]);
});

test('every catalog model fits the shared canvas alongside the largest model',()=>{
  for(const entry of catalog.aircraft){
    const [{drawing:d}]=comparisonDrawings([entry.name,'Airbus A380-800']);
    assert.ok(d.x>=49&&d.x+d.width<=551,entry.name);
    assert.ok(d.y>=30&&d.y+d.drawnHeight<=205.001,entry.name);
  }
});

test('spotting cues retain engine count, double decks and propeller power',()=>{
  const cues=name=>comparisonCues(catalog.aircraft.find(a=>a.name===name));
  assert.equal(cues('Airbus A340-600').engines,4);
  assert.equal(cues('McDonnell Douglas MD-11F').engines,3);
  assert.ok(cues('Airbus A380-800').features.includes('全长双层客舱'));
  assert.ok(cues('ATR 72-600').features.includes('涡桨动力'));
  assert.ok(cues('Bombardier CRJ-900').features.includes('尾部发动机'));
  for(const entry of catalog.aircraft)assert.ok(comparisonCues(entry).features.length>0);
});
