import assert from 'node:assert/strict';

// Run only against the local Worker: this test deliberately adds page views.
const endpoint='http://127.0.0.1:8787/visits';
const origin='https://konantian.github.io';
const read=async()=>{
  const response=await fetch(endpoint);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  return (await response.json()).count;
};
const before=await read();
for(const headers of [{},{Origin:'https://unrelated.example'}]){
  assert.equal((await fetch(endpoint,{method:'POST',headers})).status,403);
}
assert.equal((await fetch(endpoint,{method:'DELETE'})).status,405);
assert.equal((await fetch(endpoint+'/missing')).status,404);
const preflight=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:origin}});
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
assert.equal(await read(),before);
const increments=await Promise.all(Array.from({length:50},async()=>{
  const response=await fetch(endpoint,{method:'POST',headers:{Origin:origin}});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  return (await response.json()).count;
}));
assert.equal(new Set(increments).size,50);
assert.equal(await read(),before+50);
assert.equal(await read(),before+50);
console.log('Worker verified: persistent reads, 50 concurrent increments, CORS and rejected writes.');
