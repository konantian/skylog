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
  assert.equal(awards.length,18);
  assert.equal(awards.find(a=>a.key==='787').current,3);
  assert.deepEqual(awards.find(a=>a.key==='777').missing,['Boeing 777-200ER']);
  assert.equal(awards.find(a=>a.key==='fifty-airlines').current,52);
  assert.ok(awards.every(a=>a.photoIds.every(id=>photos.some(p=>p.id===id))));
  const sample=[{id:'A',models:[],airlines:[],airport:'YYZ',registration:{status:'inferred',value:'TEST'}}];
  assert.equal(collectionAchievements([],[],sample,[{registration:'TEST'}]).find(a=>a.key==='same-airframe').unlocked,false);
  sample[0].registration.status='confirmed';
  assert.equal(collectionAchievements([],[],sample,[{registration:'TEST'}]).find(a=>a.key==='same-airframe').unlocked,true);
  assert.ok(collectionAchievements([],[],[],[]).every(a=>!a.unlocked&&a.current===0));
});

test('milestones retain earned achievements, show real totals and advance only at each threshold',()=>{
  const photo=i=>({id:String(i),models:[],airlines:[],airport:'YYZ'});
  for(const [count,unlocked,next,progress] of [[99,false,100,100],[100,true,500,500],[499,true,500,500],[500,true,1000,1000],[999,true,1000,1000],[1000,true,null,1000],[1001,true,null,1000]]){
    const a=collectionAchievements([],[],Array.from({length:count},(_,i)=>photo(i)),[]).find(a=>a.key==='century');
    assert.equal(a.current,count);assert.equal(a.target,100);assert.equal(a.unlocked,unlocked);
    assert.equal(a.nextTarget,next);assert.equal(a.progressTarget,progress);
    assert.equal(a.currentLabel,`${count} 张照片`);
    assert.deepEqual(a.stages.map(s=>s.unlocked),[100,500,1000].map(target=>count>=target));
  }
  const current=collectionAchievements(aircraft,airlines,photos,log.flights);
  const expected={'century':[598,1000],'fifty-airlines':[52,75],'same-airframe':[13,20],'two-airport-reunion':[4,5],'model-collector':[56,75],'airframe-collector':[328,500],'three-encounters':[4,5]};
  for(const [key,[count,next]] of Object.entries(expected)){
    const a=current.find(a=>a.key===key);assert.equal(a.current,count,key);assert.equal(a.nextTarget,next,key);
  }
  assert.equal(current.filter(a=>a.unlocked).length,12);
});

test('airframe collectors and three encounters require confirmed registrations and distinct valid shooting dates',()=>{
  const p=(id,reg,date,status='confirmed')=>({id,airport:'YYZ',models:[],airlines:[],date,registration:{value:reg,status}});
  const rows=[p('A','C-ONE','2026-11-01'),p('B',' c-one ','2026-11-01'),p('C','C-ONE','2026-11-02'),p('D','C-ONE','2026-11-03','inferred'),p('E','C-TWO','2026-11-03'),p('F','','2026-11-03'),p('G','   ','2026-11-03'),p('H','C-ONE','2026-11-31'),p('I','C-ONE','')];
  const awards=ps=>collectionAchievements([],[],ps,[]);
  const find=(ps,key)=>awards(ps).find(a=>a.key===key);
  assert.equal(find(rows,'airframe-collector').current,2);
  assert.equal(find(rows,'three-encounters').current,0);
  rows.push(p('J','C-ONE','2026-11-03'));
  const three=find(rows,'three-encounters');assert.equal(three.current,1);assert.equal(three.unlocked,true);
  assert.ok(three.photoIds.includes('J'));assert.ok(!three.photoIds.some(id=>['D','E','F','G'].includes(id)));
  const known=[{name:'One',unlocked:true,cover:'A'},{name:'One',unlocked:true,cover:'B'},{name:'Two',unlocked:false}];
  assert.equal(collectionAchievements(known,[],rows,[]).find(a=>a.key==='model-collector').current,1);
  assert.equal(collectionAchievements([],[],rows,[{registration:'c-one',status:'planned'},{registration:'C-TWO',status:'cancelled'}]).find(a=>a.key==='same-airframe').current,0);
  assert.equal(collectionAchievements([],[],rows,[{registration:'c-one',status:'completed'}]).find(a=>a.key==='same-airframe').current,1);
});
test('new family goals count distinct families and keep passenger and cargo aircraft separate',()=>{
  const awards=collectionAchievements(aircraft,airlines,photos,log.flights);
  const expected={a220:[1,2,['Airbus A220-100']],'747-generations':[2,4,['Boeing 747-8','Boeing 747-8F']],'four-engines':[3,3,[]],'boeing-widebodies':[3,4,['767']],'cargo-six':[3,6,['A300','A330','MD-11']],'turboprop-trio':[2,3,['ATR 72']]};
  for(const [key,[current,target,missing]] of Object.entries(expected)){
    const award=awards.find(a=>a.key===key);
    assert.equal(award.current,current);assert.equal(award.target,target);assert.deepEqual(award.missing,missing);assert.equal(award.unlocked,current===target);
  }
  const boeing=awards.find(a=>a.key==='boeing-widebodies');
  assert.ok(!boeing.photoIds.some(id=>photos.find(p=>p.id===id).models.includes('Boeing 767-300BDSF')));
  const with767=aircraft.map(a=>a.name==='Boeing 767-300ER'?{...a,unlocked:true}:a);
  assert.equal(collectionAchievements(with767,airlines,photos,[]).find(a=>a.key==='boeing-widebodies').unlocked,true);
  assert.equal(collectionAchievements(with767,airlines,photos,[]).find(a=>a.key==='cargo-six').current,3);
});
test('two-airport reunion requires confirmed matching registrations at both named airports',()=>{
  const photo=(id,airport,registration,status='confirmed')=>({id,airport,models:[],airlines:[],registration:{value:registration,status}});
  const sample=[photo('A','YYZ','TEST'),photo('B','YYZ','TEST'),photo('C','YVR','TEST','inferred'),photo('D','YVR','OTHER'),photo('E','JFK','TEST')];
  const reunion=ps=>collectionAchievements([],[],ps,[]).find(a=>a.key==='two-airport-reunion');
  assert.equal(reunion(sample).current,0);assert.deepEqual(reunion(sample).photoIds,[]);
  sample.push(photo('F','YVR','TEST'));
  assert.equal(reunion(sample).current,1);assert.equal(reunion(sample).unlocked,true);
  assert.deepEqual(reunion(sample).photoIds,['A','B','F']);
});
