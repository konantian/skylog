import {test} from 'node:test';
import assert from 'node:assert/strict';

test('one increment per production document, with no duplicate request on remount',async()=>{
  const calls=[];
  globalThis.window={location:{origin:'https://konantian.github.io',pathname:'/skylog/'}};
  const original=globalThis.fetch;
  globalThis.fetch=async(...args)=>{calls.push(args);return Response.json({count:1234});};
  try{
    const {loadPageViews}=await import('../lib/page-views.mjs?production');
    assert.deepEqual(await Promise.all([loadPageViews('https://counter.test/visits'),loadPageViews('https://counter.test/visits')]),[1234,1234]);
    window.location.pathname='/skylog/?view=photos';
    assert.equal(await loadPageViews('https://counter.test/visits'),1234);
    assert.equal(calls.length,1);
    assert.equal(calls[0][1].method,'POST');
    assert.equal(calls[0][1].credentials,'omit');
  }finally{globalThis.fetch=original;delete globalThis.window;}
});

test('local previews only read the total, and a new document can count again',async()=>{
  const methods=[];
  globalThis.window={location:{origin:'http://127.0.0.1:3107',pathname:'/skylog/'}};
  const original=globalThis.fetch;
  globalThis.fetch=async(_,options)=>{methods.push(options.method);return Response.json({count:2});};
  try{
    const preview=await import('../lib/page-views.mjs?preview');
    await preview.loadPageViews('https://counter.test/visits');
    window.location.origin='https://konantian.github.io';
    const reload=await import('../lib/page-views.mjs?reload');
    await reload.loadPageViews('https://counter.test/visits');
    assert.deepEqual(methods,['GET','POST']);
  }finally{globalThis.fetch=original;delete globalThis.window;}
});

test('unavailable or malformed counters fail without inventing a number or retrying writes',async()=>{
  globalThis.window={location:{origin:'https://konantian.github.io',pathname:'/skylog/'}};
  const original=globalThis.fetch;
  try{
    for(const [index,response] of [new Response('Unavailable',{status:503}),Response.json({count:-1}),Response.json({count:'123'}),Response.json({count:1.5})].entries()){
      let calls=0;
      globalThis.fetch=async()=>{calls++;return response;};
      const {loadPageViews}=await import(`../lib/page-views.mjs?invalid=${index}`);
      await assert.rejects(loadPageViews('https://counter.test/visits'));
      await assert.rejects(loadPageViews('https://counter.test/visits'));
      assert.equal(calls,1);
    }
  }finally{globalThis.fetch=original;delete globalThis.window;}
});
