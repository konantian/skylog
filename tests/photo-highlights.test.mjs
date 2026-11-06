import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import review from '../data/photo-highlights.json' with {type:'json'};
import {photoGroups, photoHighlights} from '../lib/photo-highlights.mjs';

test('the showcase covers every photographed airline, model and livery, including private aircraft', () => {
  const picks = photoHighlights(catalog.photos);
  const reviewed = [...review.representatives, ...review.alternateViews];
  assert.equal(new Set(reviewed).size, reviewed.length);
  assert.deepEqual(picks.map(p=>p.id), reviewed);
  assert.deepEqual(new Set(picks.flatMap(photoGroups)), new Set(catalog.photos.flatMap(photoGroups)));
  assert.ok(picks.length < catalog.photos.length / 2);
  const multi = catalog.photos.find(p=>p.subjects?.length > 1);
  assert.deepEqual(photoGroups(multi).map(k => JSON.parse(k).slice(0,2)), multi.subjects.map(s=>[s.airline,s.model]));
});

test('a filtered collection keeps its combinations and user ordering when its usual cover is unavailable', () => {
  const eligible = catalog.photos.filter(p => p.airport==='YVR' && !review.representatives.includes(p.id)).reverse();
  const picks = photoHighlights(eligible, 'latest');
  assert.ok(picks.length);
  assert.deepEqual(new Set(picks.flatMap(photoGroups)), new Set(eligible.flatMap(photoGroups)));
  assert.deepEqual(picks, eligible.filter(p=>picks.includes(p)));
  assert.deepEqual(photoHighlights([eligible[0]]),[eligible[0]]);
});
