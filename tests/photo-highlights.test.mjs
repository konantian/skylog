import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import review from '../data/photo-highlights.json' with {type:'json'};
import heroes from '../data/hero-selections.json' with {type:'json'};
import {initialFilters, filterPhotos} from '../lib/filter.mjs';
import {coverByAlternate, photoBrowseMode, photoGalleryIds, photoGroups, photoGridCards, photoHighlights} from '../lib/photo-highlights.mjs';

const {photos, aircraft, airlines} = catalog;
const ids = photos => photos.map(p => p.id);
const byId = new Map(photos.map(p => [p.id, p]));
function grid(filters = {}, preferred = 'portfolio') {
  const f = {...initialFilters, ...filters};
  const matched = filterPhotos(photos, f, aircraft, airlines);
  const cards = photoGridCards(matched, photoBrowseMode(f, preferred), f.sort);
  return {cards, gallery: photoGalleryIds(cards, matched)};
}

test('home, portfolio and representative sets nest without duplicate cards or missing combinations', () => {
  const {cards} = grid();
  assert.equal(cards.length, 35);
  assert.deepEqual(ids(cards), review.portfolio);
  assert.equal(new Set(review.portfolio).size, review.portfolio.length);
  assert.ok(heroes.every(id => review.portfolio.includes(id)));
  const all = grid({}, 'representatives').cards;
  assert.deepEqual(ids(all), review.representatives);
  assert.ok(review.portfolio.every(id => review.representatives.includes(id)));
  assert.deepEqual(new Set(all.flatMap(photoGroups)), new Set(photos.flatMap(photoGroups)));
  assert.ok(all.every(p => !coverByAlternate.has(p.id)));
});

test('filtering widens either tab to matching representatives and respects sorting', () => {
  for (const f of [{airline:'Air North'}, {model:'Airbus A330-300'}, {query:'A330-300'}, {airport:'YVR'}, {livery:'蓝色百年主题涂装'}]) {
    const matches = filterPhotos(photos,{...initialFilters,...f,sort:'latest'},aircraft,airlines);
    const expected = matches.filter(p=>review.representatives.includes(p.id));
    assert.ok(expected.length);
    for (const scope of ['portfolio','representatives']) {
      assert.deepEqual(grid({...f,sort:'latest'},scope).cards, expected);
    }
  }
  assert.deepEqual(new Set(grid({airline:'Air North'}).cards.flatMap(p=>p.models)),new Set(['Boeing 737-500','Boeing 737-800']));
  assert.equal(grid({sort:'latest'}).cards.length,35);
  assert.deepEqual(grid({query:'DSC06147'}).cards.map(p=>p.id),['DSC06147']);
});

test('all supplementary views follow their cover in the viewer only, within the active filters', () => {
  const {gallery} = grid({}, 'representatives');
  assert.equal(new Set(gallery).size, gallery.length);
  assert.equal(coverByAlternate.size,14);
  for (const [alternate,cover] of coverByAlternate) {
    assert.deepEqual(photoGroups(byId.get(cover)),photoGroups(byId.get(alternate)));
    assert.ok(gallery.includes(cover));
    assert.equal(gallery[gallery.indexOf(cover)+1],alternate);
  }
  assert.ok(grid({query:'DSC09272'}).gallery.length===1);
  assert.deepEqual(grid({model:'Boeing 747-400', airline:'Lufthansa'}).gallery.slice(0,2),['DSC09272','DSC09279']);
  assert.deepEqual(grid({query:'DSC09279'}).gallery,['DSC09279']);
  assert.deepEqual(grid({airport:'YVR',airline:'Air North'}).gallery,grid({airport:'YVR',airline:'Air North'}).cards.map(p=>p.id));
});

test('the native gallery selector keeps its ordering and retains a cover for filtered groups', () => {
  const reviewed = [...review.representatives, ...Object.values(review.alternateViews)];
  assert.deepEqual(ids(photoHighlights(photos)), reviewed);
  const subset = photos.filter(p => p.airport === 'YVR' && !reviewed.includes(p.id)).reverse();
  const picks = photoHighlights(subset, 'latest');
  assert.deepEqual(new Set(picks.flatMap(photoGroups)), new Set(subset.flatMap(photoGroups)));
  assert.deepEqual(picks, subset.filter(p => picks.includes(p)));
});
