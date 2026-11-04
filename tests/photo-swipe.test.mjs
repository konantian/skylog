import {test} from 'node:test';
import assert from 'node:assert/strict';
import {photoSwipe} from '../lib/photo-swipe.mjs';
test('photo gestures leave scrolling, taps and pinch zoom alone',()=>{
  const start={x:100,y:100,endX:20,endY:105};
  assert.equal(photoSwipe(start),1);
  assert.equal(photoSwipe({...start,endX:180}),-1);
  assert.equal(photoSwipe({...start,endX:80}),0);
  assert.equal(photoSwipe({...start,endY:220}),0);
  assert.equal(photoSwipe({...start,multiTouch:true}),0);
  assert.equal(photoSwipe({...start,scale:2}),0);
});
