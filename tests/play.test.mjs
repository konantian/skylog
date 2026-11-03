import {test} from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../data/catalog.json' with {type:'json'};
import log from '../data/flights.json' with {type:'json'};
import profiles from '../data/aircraft-profiles.json' with {type:'json'};
import {quizPool,makeQuiz,recordGuess,quizScore,discoveryDeck,collectionAchievements} from '../lib/play.mjs';
const {aircraft,airlines,photos}=catalog;
const seeded=()=>{let n=42;return()=>((n=(1664525*n+1013904223)>>>0)/4294967296);};

test('quiz has five distinct series, four unique choices, and one unambiguous photographed answer',()=>{
  const pool=quizPool(aircraft,photos,profiles.families);
  const round=makeQuiz(pool,seeded());
  assert.equal(round.length,5);assert.equal(new Set(round.map(q=>q.answer)).size,5);
  for(const q of round){
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.equal(q.options.filter(v=>v===q.answer).length,1);
    assert.deepEqual(q.photo.models,[q.model]);assert.ok(q.profile.description&&q.profile.source);
  }
  const a320=pool.filter(p=>p.label.includes('A320'));assert.equal(a320.length,1);
  assert.ok(a320[0].examples.some(e=>e.model==='Airbus A321-200'));
  assert.ok(!pool.flatMap(p=>p.examples).some(e=>e.model==='Boeing 737-500'));
  assert.deepEqual(makeQuiz(pool.slice(0,4)),[]);
});
test('answers are recorded once, invalid choices are ignored, and scores cannot grow on repeat clicks',()=>{
  const qs=makeQuiz(quizPool(aircraft,photos,profiles.families),seeded());
  let answers=qs.map(()=>null);
  assert.equal(recordGuess(qs,answers,0,'not an option'),answers);
  answers=recordGuess(qs,answers,0,qs[0].answer);
  assert.equal(recordGuess(qs,answers,0,qs[0].options.find(v=>v!==qs[0].answer)),answers);
  assert.equal(quizScore(qs,answers),1);
  for(let i=1;i<qs.length;i++)answers=recordGuess(qs,answers,i,qs[i].answer);
  assert.equal(quizScore(qs,answers),5);assert.equal(recordGuess(qs,answers,99,'anything'),answers);
});
test('discovery has no repeats within a deck or at the boundary between decks',()=>{
  const deck=discoveryDeck(photos,null,seeded());
  assert.ok(deck.length>300);assert.equal(new Set(deck.map(p=>p.id)).size,deck.length);
  assert.ok(deck.every(p=>p.models.length===1&&(p.subjects?.length??1)===1));
  assert.notEqual(discoveryDeck(photos,deck[0].id,seeded())[0].id,deck[0].id);
  assert.deepEqual(discoveryDeck([],null),[]);
  assert.equal(discoveryDeck([deck[0]],deck[0].id)[0],deck[0]);
});
test('achievements use photographic unlocks and confirmed exact-airframe matches',()=>{
  const awards=collectionAchievements(aircraft,airlines,photos,log.flights);
  assert.equal(awards.length,8);
  assert.equal(awards.find(a=>a.key==='787').current,3);
  assert.deepEqual(awards.find(a=>a.key==='777').missing,['Boeing 777-200ER']);
  assert.equal(awards.find(a=>a.key==='fifty-airlines').current,45);
  assert.ok(awards.every(a=>a.photoIds.every(id=>photos.some(p=>p.id===id))));
  const sample=[{id:'A',models:[],airlines:[],airport:'YYZ',registration:{status:'inferred',value:'TEST'}}];
  assert.equal(collectionAchievements([],[],sample,[{registration:'TEST'}]).find(a=>a.key==='same-airframe').unlocked,false);
  sample[0].registration.status='confirmed';
  assert.equal(collectionAchievements([],[],sample,[{registration:'TEST'}]).find(a=>a.key==='same-airframe').unlocked,true);
  assert.ok(collectionAchievements([],[],[],[]).every(a=>!a.unlocked&&a.current===0));
});
