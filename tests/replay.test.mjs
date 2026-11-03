import {test} from 'node:test';
import assert from 'node:assert/strict';
import log from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};
import {replayFlights,replayLeg,replayPose,advanceReplay,LEG_DURATION} from '../lib/replay.mjs';

test('replay is chronological, keeps same-day connections, and respects the selected year',()=>{
  const all=replayFlights(log.flights,'all');assert.equal(all.length,86);
  assert.ok(all.every((f,i)=>!i||f.date>=all[i-1].date));
  assert.deepEqual(all.filter(f=>f.date==='2024-08-23').map(f=>f.flight),['OZ324','AC64','AC126']);
  const recent=replayFlights(log.flights,'2026');assert.equal(recent.length,6);assert.equal(recent[0].flight,'F8650');assert.equal(recent.at(-1).flight,'F8608');
  assert.equal(replayFlights(log.flights,'1900').length,0);
});
test('each aircraft travels from the actual departure to arrival, in either direction',()=>{
  for(const flight of log.flights){
    const leg=replayLeg(flight,airports),start=replayPose(leg,0),end=replayPose(leg,1);
    assert.deepEqual(start.point,leg.points[0]);
    end.point.forEach((n,i)=>assert.ok(Math.abs(n-leg.points.at(-1)[i])<1e-8));
    assert.equal(start.progress,0);assert.equal(end.progress,1);
    assert.ok(leg.box.every(Number.isFinite));assert.ok(leg.box[2]>=180&&leg.box[2]<=900);
    for(const phase of [0,.3,.5,.7,1]){
      const p=replayPose(leg,phase);
      assert.ok(p.point.every(Number.isFinite)&&Number.isFinite(p.heading)&&p.box.every(Number.isFinite));
      assert.doesNotMatch(p.path,/NaN|Infinity/);
      assert.deepEqual(replayPose(leg,phase,true).box,leg.box);
    }
  }
});
test('replay unwraps the world seam rather than drawing a long line across the map',()=>{
  const leg=replayLeg({origin:'A',destination:'B'},{A:{latitude:10,longitude:5},B:{latitude:10,longitude:-5}});
  assert.ok(leg.points.every((p,i)=>!i||Math.abs(p[0]-leg.points[i-1][0])<450));
  assert.ok(Math.abs(leg.points.at(-1)[0]-leg.points[0][0])<30);
});
test('playback timing supports speeds, clamps completion, and avoids background jumps',()=>{
  const one=advanceReplay(.4,50,1,6),four=advanceReplay(.4,50,4,6);
  assert.ok(Math.abs((four-.4)-4*(one-.4))<1e-12);
  assert.equal(advanceReplay(5.999,100,4,6),6);
  assert.equal(advanceReplay(.3,0,1,6),.3);
  assert.equal(advanceReplay(.3,-10,1,6),.3);
  assert.equal(advanceReplay(0,60000,1,6),100/LEG_DURATION);
});

test('fast playback preserves takeoff and arrival transitions',()=>{
  assert.equal(advanceReplay(.02,50,4,6),advanceReplay(.02,50,1,6));
  assert.equal(advanceReplay(.95,50,4,6),advanceReplay(.95,50,1,6));
  const leg=replayLeg(log.flights.find(f=>f.flight==='AC64'),airports);
  const start=replayPose(leg,.121),later=replayPose(leg,.13);
  assert.ok(start.progress<later.progress*.03);
  assert.equal(replayPose(leg,0).opacity,0);assert.equal(replayPose(leg,.5).opacity,1);
});

test('every leg boundary advances without floating-point stalls at any speed',()=>{
  for(const speed of [1,2,4]){
    for(let i=0;i<86;i++){
      for(const phase of [.119,.12,.859,.86,.999]){
        const cursor=i+phase,next=advanceReplay(cursor,16.667,speed,86);
        assert.ok(next>cursor&&next<=86,`${cursor} at ${speed}x`);
      }
    }
  }
});
