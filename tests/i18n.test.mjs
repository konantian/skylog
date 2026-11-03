import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
import english from '../data/locale-en.json' with {type:'json'};
import catalog from '../data/catalog.json' with {type:'json'};
import profiles from '../data/aircraft-profiles.json' with {type:'json'};
import liveries from '../data/liveries.json' with {type:'json'};
import flightData from '../data/flights.json' with {type:'json'};
import airports from '../data/airports.json' with {type:'json'};
import {localeUrl,resolveLocale,translate} from '../lib/i18n.mjs';
import {filterCatalog,filterPhotos,initialFilters} from '../lib/filter.mjs';
import {collectionAchievements} from '../lib/play.mjs';
import {renderShareCard,shareCardDetails} from '../lib/share-card.mjs';

const han=value=>/\p{Script=Han}/u.test(value);

test('explicit language links override saved choices, then the browser preference is used',()=>{
  assert.equal(resolveLocale({search:'?lang=en',stored:'zh',languages:['zh-CN']}),'en');
  assert.equal(resolveLocale({search:'?lang=zh',stored:'en',languages:['en-CA']}),'zh');
  assert.equal(resolveLocale({search:'?lang=invalid',stored:'en',languages:['zh-HK']}),'en');
  assert.equal(resolveLocale({stored:'invalid',languages:['zh-TW','en']}),'zh');
  assert.equal(resolveLocale({languages:['en-CA','zh-CN']}),'en');
  assert.equal(resolveLocale({languages:['fr-CA']}),'en');
  assert.equal(resolveLocale(), 'zh');
});

test('switching languages preserves the view, filters, path and fragment in shared links',()=>{
  const original=new URL('https://konantian.github.io/skylog/?view=photos&country=中国&model=Airbus+A330-300&query=DSC08110&sort=latest#collection');
  const englishUrl=new URL(localeUrl(original.href,'en'),original);
  assert.equal(englishUrl.pathname,original.pathname);assert.equal(englishUrl.hash,original.hash);
  for(const [key,value] of original.searchParams)assert.equal(englishUrl.searchParams.get(key),value);
  assert.equal(englishUrl.searchParams.get('lang'),'en');
  const chineseUrl=new URL(localeUrl(englishUrl.href,'zh'),original);
  assert.equal(chineseUrl.searchParams.get('lang'),'zh');
  assert.equal(chineseUrl.searchParams.getAll('lang').length,1);
});

test('every current public Chinese data field and UI translation key has an English counterpart',()=>{
  const check=value=>{
    if(typeof value==='string'&&han(value)){
      assert.ok(Object.hasOwn(english,value),`Missing data translation: ${value}`);
      assert.equal(han(translate('en',value)),false,value);
    }else if(value&&typeof value==='object')Object.values(value).forEach(check);
  };
  [catalog,profiles,liveries,flightData].forEach(check);
  for(const file of readdirSync(new URL('../components/',import.meta.url)).filter(f=>f.endsWith('.tsx'))){
    const source=readFileSync(new URL('../components/'+file,import.meta.url),'utf8');
    const root=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const visit=node=>{
      if(ts.isCallExpression(node)&&node.expression.getText(root)==='t'&&ts.isStringLiteral(node.arguments[0])){
        const key=node.arguments[0].text;
        if(han(key))assert.ok(Object.hasOwn(english,key),`${file}: ${key}`);
      }
      ts.forEachChild(node,visit);
    };visit(root);
  }
  for(const [key,value] of Object.entries(english)){
    assert.equal(han(value),false,key);
    assert.deepEqual([...key.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort(),[...value.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort(),`Interpolation mismatch: ${key}`);
  }
});

test('translation preserves aircraft identifiers, interpolation and the original Chinese text',()=>{
  assert.equal(translate('en','DSC08110'),'DSC08110');
  assert.equal(translate('en','constructor'),'constructor');
  assert.equal(translate('en','Airbus A330-300'),'Airbus A330-300');
  assert.equal(translate('zh','{0} 张照片',[3]),'3 张照片');
  assert.equal(translate('en','{0} 张照片',[3]),'3 photos');
  assert.equal(translate('en','查看 {0}',['$& <test>']),'View $& <test>');
});

test('English livery and category searches use the same photographs and source filter values',()=>{
  const original={...initialFilters,livery:'标准涂装'};
  const matches=filterPhotos(catalog.photos,original,catalog.aircraft,catalog.airlines);
  assert.ok(matches.length>0);
  assert.deepEqual(filterPhotos(catalog.photos,{...original,query:'Standard livery'},catalog.aircraft,catalog.airlines),matches);
  const widebody=filterCatalog(catalog.aircraft,catalog.photos,{...initialFilters,query:'Widebody airliner'},'aircraft',catalog.aircraft,catalog.airlines);
  assert.ok(widebody.length>0);assert.ok(widebody.every(a=>a.category==='宽体客机'));
  assert.equal(original.livery,'标准涂装');
});

test('achievement language never changes progress, photo associations or unlock decisions',()=>{
  const zh=collectionAchievements(catalog.aircraft,catalog.airlines,catalog.photos,flightData.flights);
  const en=collectionAchievements(catalog.aircraft,catalog.airlines,catalog.photos,flightData.flights,'en');
  assert.deepEqual(en.map(({description,...a})=>a),zh.map(({description,...a})=>a));
  for(const award of en){assert.equal(han(translate('en',award.title)),false);assert.equal(han(translate('en',award.description)),false);}
});

test('English share cards translate uncertainty, liveries and every drawn label in both orientations',async()=>{
  const originals={document:globalThis.document,Image:globalThis.Image,Path2D:globalThis.Path2D};
  let labels=[];
  const context=new Proxy({measureText:value=>({width:String(value).length*10}),fillText:value=>labels.push(String(value))},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
  globalThis.document={createElement:()=>({getContext:()=>context,toBlob:callback=>callback(new Blob(['PNG'],{type:'image/png'}))})};
  globalThis.Image=class {naturalWidth=6000;naturalHeight=4000;async decode(){}};
  globalThis.Path2D=class {};
  try{
    const source={kind:'photo',photo:{...catalog.photos[0],registration:{value:'C-TEST',status:'inferred'},livery:'标准涂装'}};
    for(const orientation of ['portrait','landscape'])for(const entry of [source,{kind:'flight',flight:{...flightData.flights[0],modelLabel:'机型待确认',registration:null}}]){
      labels=[];const card=shareCardDetails(entry,airports,orientation,'en');
      assert.equal(han(JSON.stringify(card)),false);
      assert.ok(card.filename.endsWith('-en.png'));
      await renderShareCard(card);
      assert.ok(labels.length>10);assert.equal(labels.some(han),false,labels.join('\n'));
      assert.ok(labels.some(label=>label.includes('REGISTRATION')));
      if(entry.kind==='photo'){assert.equal(card.registration,'C-TEST · inferred');assert.equal(card.livery,'Standard livery');}
    }
  }finally{
    for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
  }
});
