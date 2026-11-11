import {translate} from './i18n.mjs';

export function shuffle(items,random=Math.random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

export function quizPool(aircraft,photos,profiles) {
  const groups=new Map();
  for(const entry of aircraft){
    if(!entry.unlocked)continue;
    const key=/^A31[89]$|^A32[01]$/.test(entry.family)?'A320 family':entry.name.includes('737 MAX')?'737 MAX':/737-(700|800|900)/.test(entry.name)?'737 NG':entry.name.includes('Dash 8-400')?'Dash 8-400':entry.family;
    const profile=profiles[key];if(!profile)continue;
    // Use reviewed covers and exclude multi-aircraft identifications from the quiz.
    const candidates=photos.filter(p=>entry.photoIds.includes(p.id)&&p.models.length===1&&p.models[0]===entry.name);
    const photo=candidates.find(p=>p.id===entry.cover)||candidates[0];if(!photo)continue;
    const label=`${entry.manufacturer} ${key==='A320 family'?'A320 家族':key}`;
    if(!groups.has(label))groups.set(label,{label,profile,examples:[]});
    groups.get(label).examples.push({photo,model:entry.name});
  }
  return [...groups.values()];
}

export function makeQuiz(pool,random=Math.random) {
  if(pool.length<5)return [];
  return shuffle(pool,random).slice(0,5).map(group=>({
    ...shuffle(group.examples,random)[0],answer:group.label,profile:group.profile,
    options:shuffle([group.label,...shuffle(pool.filter(p=>p.label!==group.label),random).slice(0,3).map(p=>p.label)],random),
  }));
}

export function recordGuess(questions,answers,index,choice) {
  if(!questions[index]?.options.includes(choice)||answers[index]!=null)return answers;
  return answers.map((value,i)=>i===index?choice:value);
}
export const quizScore=(questions,answers)=>questions.filter((q,i)=>q.answer===answers[i]).length;

export function discoveryDeck(photos,previousId,random=Math.random) {
  const deck=shuffle(photos.filter(p=>p.models.length===1&&(p.subjects?.length??1)===1),random);
  if(deck.length>1&&deck[0].id===previousId)[deck[0],deck[1]]=[deck[1],deck[0]];
  return deck;
}

export function collectionAchievements(aircraft,airlines,photos,flights,locale='zh') {
  const unlocked=new Set(aircraft.filter(a=>a.unlocked).map(a=>a.name));
  const airportSet=new Set(photos.map(p=>p.airport));
  const registration=value=>typeof value==='string'?value.trim().toUpperCase():'';
  const confirmed=photos.filter(p=>p.registration?.status==='confirmed'&&registration(p.registration.value));
  const flightRegistrations=new Set(flights.filter(f=>!f.status||f.status==='completed').map(f=>registration(f.registration)).filter(Boolean));
  const same=confirmed.filter(p=>flightRegistrations.has(registration(p.registration.value)));
  const allIds=[...new Set([...aircraft.filter(a=>a.unlocked&&a.cover).map(a=>a.cover),...photos.map(p=>p.id)])];
  const sameCount=new Set(same.map(p=>registration(p.registration.value))).size;
  const airframeDates=new Map();
  for(const photo of confirmed){
    const key=registration(photo.registration.value);
    if(!airframeDates.has(key))airframeDates.set(key,new Set());
    const date=photo.date;
    if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date)airframeDates.get(key).add(date);
  }
  const threeVisits=new Set([...airframeDates].filter(([,dates])=>dates.size>=3).map(([key])=>key));
  const modelGoal=(key,title,description,models)=>{
    const matches=photos.filter(p=>p.models.some(m=>models.includes(m)));
    const covers=models.flatMap(m=>{const a=aircraft.find(e=>e.name===m);return a?.unlocked&&a.cover?[a.cover]:[];});
    return {key,title,description,current:models.filter(m=>unlocked.has(m)).length,target:models.length,missing:models.filter(m=>!unlocked.has(m)),photoIds:[...new Set([...covers,...matches.map(p=>p.id)])]};
  };
  const familyGoal=(key,title,description,families,category)=>{
    const groups=families.map(family=>({family,models:aircraft.filter(a=>a.family===family&&a.category===category).map(a=>a.name)}));
    const missing=groups.filter(g=>!g.models.some(m=>unlocked.has(m))).map(g=>g.family);
    return {...modelGoal(key,title,description,groups.flatMap(g=>g.models)),current:families.length-missing.length,target:families.length,missing};
  };
  const airportRegistrations=new Map();
  for(const photo of confirmed){
    if(!['YYZ','YVR'].includes(photo.airport))continue;
    const key=registration(photo.registration.value);
    if(!airportRegistrations.has(key))airportRegistrations.set(key,new Set());
    airportRegistrations.get(key).add(photo.airport);
  }
  const reunited=new Set([...airportRegistrations].filter(([,airports])=>airports.size===2).map(([registration])=>registration));
  return [
    {key:'century',title:'百张天空',description:'用自己的照片，收藏一百次与飞机的相遇。',current:photos.length,target:100,missing:[],photoIds:allIds},
    {key:'two-airports',title:'双城追光',description:'在 YYZ 和 YVR 都留下自己的飞机摄影。',current:['YYZ','YVR'].filter(a=>airportSet.has(a)).length,target:2,missing:['YYZ','YVR'].filter(a=>!airportSet.has(a)),photoIds:[...new Set([...['YYZ','YVR'].flatMap(a=>photos.find(p=>p.airport===a)?.id||[]),...photos.filter(p=>['YYZ','YVR'].includes(p.airport)).map(p=>p.id)])]},
    modelGoal('787','787 三兄弟','拍齐 787-8、787-9 与 787-10。',['Boeing 787-8','Boeing 787-9','Boeing 787-10']),
    modelGoal('a350','A350 双子星','用镜头集齐 A350-900 和 A350-1000。',['Airbus A350-900','Airbus A350-1000']),
    modelGoal('a380','遇见双层巨人','把 Airbus A380-800 收入摄影图鉴。',['Airbus A380-800']),
    modelGoal('777','777 家族图鉴','解锁图鉴里的四款 777：-200ER、-200LR、-300ER 和 777F。',['Boeing 777-200ER','Boeing 777-200LR','Boeing 777-300ER','Boeing 777F']),
    {key:'fifty-airlines',title:'五十家航司',description:'用照片收集五十家不同航司，按图鉴已解锁航司统计。',current:airlines.filter(a=>a.unlocked).length,target:50,missing:[],photoIds:allIds.filter(id=>photos.find(p=>p.id===id)?.airlines.some(name=>airlines.some(a=>a.name===name&&a.unlocked)))},
    {key:'same-airframe',title:'拍过，也坐过',description:translate(locale,'照片与乘机记录的注册号相同，且照片注册号已确认。目前有 {0} 架符合条件。',[sameCount]),current:sameCount,target:1,missing:[],photoIds:same.map(p=>p.id)},
    modelGoal('a220','A220 双子','拍齐 A220-100 与 A220-300，两款都需要自己的照片。',['Airbus A220-100','Airbus A220-300']),
    modelGoal('747-generations','747 客货双代','拍齐图鉴中的 747-400、747-400ERF、747-8 和 747-8F，收藏两代客机与货机。',['Boeing 747-400','Boeing 747-400ERF','Boeing 747-8','Boeing 747-8F']),
    familyGoal('four-engines','四发三巨头','拍到 A340、747 与 A380 的客机，每个家族任一型号即可；货机不计入。',['A340','747','A380'],'宽体客机'),
    familyGoal('boeing-widebodies','波音宽体四家族','拍到 747、767、777 与 787 的客机，每个家族计一次；已拍到的 767 货机不替代客机。',['747','767','777','787'],'宽体客机'),
    familyGoal('cargo-six','货运六家族','收集 A300、A330、747、767、777 与 MD-11 的货机，每个家族任一已确认货机型号即可；客机不计入。',['A300','A330','747','767','777','MD-11'],'货机'),
    familyGoal('turboprop-trio','涡桨三剑客','拍到图鉴中的 ATR 72、Dash 8 与 Saab 340 家族，每个家族计一次。',['ATR 72','Dash 8','340'],'涡桨飞机'),
    {key:'two-airport-reunion',title:'双城重逢',description:'在 YYZ 和 YVR 分别拍到同一架飞机，两地照片都需要确认相同注册号；同航司、同机型不能代替同一架。',current:reunited.size,target:1,missing:[],photoIds:confirmed.filter(p=>reunited.has(registration(p.registration.value))&&['YYZ','YVR'].includes(p.airport)).map(p=>p.id)},
    {key:'model-collector',title:'机型收藏家',description:'按图鉴已解锁的具体机型统计，同一机型的多张照片只计一次。',current:unlocked.size,target:50,missing:[],photoIds:allIds},
    {key:'airframe-collector',title:'注册号收藏家',description:'按照片中已确认的注册号去重；同一架飞机无论拍摄多少张，都只计一次。',current:airframeDates.size,target:100,missing:[],photoIds:confirmed.map(p=>p.id)},
    {key:'three-encounters',title:'三次相遇',description:'在至少三个不同拍摄日拍到同一架飞机，注册号必须已确认。同一天的连拍只算一次相遇，按符合条件的飞机数量累计。',current:threeVisits.size,target:1,missing:[],photoIds:confirmed.filter(p=>threeVisits.has(registration(p.registration.value))).map(p=>p.id)},
  ].map(a=>{
    const targets={century:[100,500,1000],'fifty-airlines':[50,75,100],'same-airframe':[1,5,10,20],'two-airport-reunion':[1,5,10],'model-collector':[50,75,100],'airframe-collector':[100,300,500],'three-encounters':[1,5,10]}[a.key]||[a.target];
    const unit=a.key==='century'?'{0} 张照片':a.key==='fifty-airlines'?'{0} 家航司':a.key==='two-airports'?'{0} 个机场':['same-airframe','two-airport-reunion','airframe-collector','three-encounters'].includes(a.key)?'{0} 架飞机':['four-engines','boeing-widebodies','cargo-six','turboprop-trio'].includes(a.key)?'{0} 个家族':'{0} 种机型';
    const countLabel=count=>locale==='en'&&count===1?{'{0} 张照片':'1 photo','{0} 家航司':'1 airline','{0} 个机场':'1 airport','{0} 架飞机':'1 aircraft','{0} 个家族':'1 family','{0} 种机型':'1 aircraft type'}[unit]:translate(locale,unit,[count]);
    const stages=targets.map(target=>({target,label:countLabel(target),unlocked:a.current>=target}));
    const next=stages.find(stage=>!stage.unlocked);
    return {...a,unlocked:a.current>=a.target,stages,currentLabel:countLabel(a.current),nextTarget:next?.target??null,nextLabel:next?.label??null,progressTarget:next?.target??targets.at(-1)??a.target};
  });
}
