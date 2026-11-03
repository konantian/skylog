import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observeReveals} from '../lib/scroll-motion.mjs';

test('scroll reveals never re-hide visited items and cleanup reveals pending content',()=>{
  let callback,disconnected=false;
  const observed=new Set();
  const element=(motion,bottom=200)=>({dataset:{...(motion?{motion}:{})},style:{setProperty(){}},getBoundingClientRect:()=>({bottom})});
  const seen=element('entered'),above=element(null,-10),first=element(),last=element();
  const listeners=new Map();
  const root={querySelectorAll:()=>[seen,above,first,last],addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k)};
  const original=globalThis.IntersectionObserver;
  globalThis.IntersectionObserver=class {constructor(fn){callback=fn;}observe(el){observed.add(el);}unobserve(el){observed.delete(el);}disconnect(){disconnected=true;}};
  try{
    const stop=observeReveals(root);
    assert.equal(seen.dataset.motion,'entered');assert.equal(above.dataset.motion,'entered');
    assert.deepEqual([...observed],[first,last]);
    callback([{target:first,isIntersecting:false}]);assert.equal(first.dataset.motion,'pending');
    callback([{target:first,isIntersecting:true}]);assert.equal(first.dataset.motion,'entered');assert.equal(observed.has(first),false);
    stop();assert.equal(last.dataset.motion,'entered');assert.ok(disconnected);assert.equal(listeners.size,0);
  }finally{if(original)globalThis.IntersectionObserver=original;else delete globalThis.IntersectionObserver;}
});
test('without IntersectionObserver all server-rendered content remains visible',()=>{
  const original=globalThis.IntersectionObserver;delete globalThis.IntersectionObserver;
  try{assert.doesNotThrow(()=>observeReveals({querySelectorAll(){throw Error('should not alter content');}})());}
  finally{if(original)globalThis.IntersectionObserver=original;}
});
