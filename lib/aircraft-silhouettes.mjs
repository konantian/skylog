// Original illustrative profiles. Lengths are metres; shape controls are artistic,
// not engineering drawings. References and representational limits: docs/aircraft-silhouettes.md.
const airbusSingle={group:'A320 family',diameter:4.14,nose:5.2,fin:7.8,finChord:5.8,finSweep:2.7,wing:.52,chord:6.3,sweep:7,reach:3.6,engine:2.1,engineLength:3.6,tip:'fence',cockpit:'airbus'};
const ejet={group:'E-Jets',diameter:3.35,nose:4.5,fin:6.8,finChord:5,finSweep:2.4,wing:.50,chord:5.6,sweep:5.7,reach:3.4,engine:1.9,engineLength:3,tip:'up',cockpit:'embraer'};
export const aircraftFamilies={
  A220:{diameter:3.5,nose:5.8,fin:7.1,finChord:5.5,finSweep:2.9,wing:.51,chord:6,sweep:6.3,reach:3.8,engine:2.35,engineLength:3.9,tip:'up',cockpit:'mask'},
  A300:{diameter:5.64,nose:6.9,fin:10.8,finChord:9.5,finSweep:4.3,wing:.52,chord:9.9,sweep:8.5,reach:5,engine:2.9,engineLength:5,tip:'fence',cockpit:'airbus'},
  A310:{diameter:5.64,nose:6.9,fin:10.5,finChord:8.8,finSweep:4.1,wing:.53,chord:9.1,sweep:7.5,reach:4.6,engine:2.9,engineLength:5,tip:'fence',cockpit:'airbus'},
  A318:{...airbusSingle,fin:8.55}, A319:{...airbusSingle}, A320:{...airbusSingle}, A321:{...airbusSingle,chord:6.6},
  A330:{diameter:5.64,nose:7.1,fin:11.3,finChord:9.8,finSweep:4.8,wing:.52,chord:11,sweep:12.8,reach:5.2,engine:3.1,engineLength:5.5,tip:'up',cockpit:'airbus'},
  A340:{diameter:5.64,nose:7.1,fin:11.4,finChord:9.8,finSweep:4.8,wing:.51,chord:11,sweep:12.8,reach:5.4,engine:2.3,engineLength:4.1,engines:4,tip:'up',cockpit:'airbus'},
  A350:{diameter:5.96,nose:8.3,fin:12.2,finChord:10.2,finSweep:5.2,wing:.53,chord:12,sweep:14.6,reach:5.6,engine:3.8,engineLength:6.1,tip:'curved',cockpit:'mask',droop:.2},
  A380:{diameter:8.4,nose:8.2,fin:15.2,finChord:13,finSweep:6.8,wing:.51,chord:15,sweep:15.1,reach:6.2,engine:3.9,engineLength:6.2,engines:4,deck:'double',tip:'fence',cockpit:'airbus'},
  '737':{diameter:4.01,nose:5.1,fin:7,finChord:5.8,finSweep:2.6,wing:.49,chord:6.1,sweep:6.8,reach:3.4,engine:2,engineLength:3.4,tip:'up',cockpit:'boeing',flattened:true},
  '747':{diameter:6.5,nose:7.5,fin:12.8,finChord:11.8,finSweep:5.2,wing:.52,chord:13,sweep:14.2,reach:5.8,engine:3.1,engineLength:5.1,engines:4,deck:'hump',tip:'up',cockpit:'boeing'},
  '757':{diameter:4.01,nose:6.5,fin:9.6,finChord:7.7,finSweep:3.1,wing:.50,chord:8,sweep:8.3,reach:4.2,engine:2.65,engineLength:4.6,tip:'none',cockpit:'boeing'},
  '767':{diameter:5.41,nose:6.6,fin:10.3,finChord:8.9,finSweep:4,wing:.51,chord:9.4,sweep:10.2,reach:4.5,engine:2.85,engineLength:5,tip:'none',cockpit:'boeing'},
  '777':{diameter:6.2,nose:7.5,fin:12.2,finChord:10.8,finSweep:5.5,wing:.52,chord:12.1,sweep:13.3,reach:5.3,engine:3.9,engineLength:6.5,tip:'raked',cockpit:'boeing'},
  '787':{diameter:5.91,nose:8,fin:11.2,finChord:9.5,finSweep:5.2,wing:.52,chord:11.8,sweep:14.2,reach:5.5,engine:3.5,engineLength:5.4,tip:'raked',cockpit:'dreamliner',chevrons:true,droop:.28},
  'MD-11':{diameter:6.02,nose:6.8,fin:11.8,finChord:10.6,finSweep:4,wing:.52,chord:11.3,sweep:10.4,reach:5.2,engine:3.1,engineLength:5.8,engines:3,tip:'up',cockpit:'douglas'},
  'An-124':{diameter:10.1,nose:9.5,fin:14.2,finChord:12.3,finSweep:4.8,wing:.54,chord:13.2,sweep:12.1,reach:6,engine:3.4,engineLength:5.6,engines:4,highWing:true,tip:'none',cockpit:'raised',droop:.25},
  CRJ:{diameter:2.69,nose:4.2,fin:5.8,finChord:5.5,finSweep:2.2,wing:.44,chord:4.7,sweep:5.7,reach:3.2,engine:1.35,engineLength:2.9,rear:true,tTail:true,tip:'up',cockpit:'crj'},
  'ERJ-145':{diameter:2.28,nose:5.2,fin:5.5,finChord:4.9,finSweep:2.7,wing:.43,chord:4.2,sweep:4.8,reach:2.8,engine:1.2,engineLength:3,rear:true,tTail:true,tip:'none',cockpit:'embraer'},
  E170:{...ejet},E175:{...ejet},E190:{...ejet,fin:7.2,chord:6,sweep:6.3},E195:{...ejet,fin:7.2,chord:6.7,sweep:7.7,engine:2.5,engineLength:3.7,tip:'raked'},
  'Dash 8':{diameter:2.69,nose:4.5,fin:6.4,finChord:5,finSweep:1.5,wing:.57,chord:3.5,sweep:1.6,reach:4.6,engine:1.3,engineLength:5,prop:4.11,blades:6,highWing:true,tTail:true,tip:'none',cockpit:'dash'},
  'ATR 72':{diameter:2.86,nose:3.9,fin:5.8,finChord:5.3,finSweep:2,wing:.56,chord:3.5,sweep:1.2,reach:4.4,engine:1.25,engineLength:3.7,prop:3.93,blades:6,highWing:true,tTail:true,tip:'none',cockpit:'atr'},
  '1900':{diameter:1.98,nose:4.2,fin:4.9,finChord:3.9,finSweep:1.1,wing:.54,chord:3.4,sweep:2,reach:3,engine:1,engineLength:3.6,prop:2.79,blades:4,tTail:true,tip:'none',cockpit:'beech',strakes:true},
  '340':{diameter:2.31,nose:3.9,fin:5.1,finChord:3.9,finSweep:1.5,wing:.55,chord:3.3,sweep:1.7,reach:3.4,engine:1.1,engineLength:3.2,prop:3.35,blades:4,tip:'none',cockpit:'saab'},
  Conquest:{diameter:1.65,nose:3,fin:3.5,finChord:2.8,finSweep:1.2,wing:.50,chord:2.8,sweep:1.2,reach:2.5,engine:.8,engineLength:2.8,prop:2.3,blades:4,tip:'none',cockpit:'cessna',window:'large'},
  Challenger:{group:'Challenger',diameter:2.69,nose:4,fin:5.6,finChord:4.5,finSweep:1.9,wing:.46,chord:4.7,sweep:5.1,reach:3.3,engine:1.3,engineLength:2.7,rear:true,tTail:true,tip:'up',cockpit:'crj',window:'large'},
  Global:{diameter:2.69,nose:5.6,fin:6.1,finChord:5.5,finSweep:2.8,wing:.44,chord:5.5,sweep:6.4,reach:3.9,engine:1.6,engineLength:3.4,rear:true,tTail:true,tip:'up',cockpit:'global',window:'large'},
  Citation:{diameter:1.73,nose:3.7,fin:3.7,finChord:3.5,finSweep:1.6,wing:.44,chord:3.2,sweep:2.1,reach:2.8,engine:.95,engineLength:2.1,rear:true,tTail:true,tip:'none',cockpit:'cessna',window:'large'},
  Praetor:{diameter:2.25,nose:4.3,fin:4.8,finChord:4,finSweep:2,wing:.45,chord:4.2,sweep:5,reach:3.3,engine:1.2,engineLength:2.6,rear:true,tTail:true,tip:'up',cockpit:'mask',window:'large'},
  G200:{diameter:2.31,nose:4,fin:5.6,finChord:4.1,finSweep:1.8,wing:.47,chord:4.4,sweep:4.8,reach:3.4,engine:1.4,engineLength:2.9,rear:true,tTail:false,tip:'none',cockpit:'gulfstream',window:'large'},
};

// Explicit names prevent suffix collisions (-8 vs -800, ER vs freighter, E1 vs E2).
export const aircraftModels={
  'Airbus A220-100':{length:35},'Airbus A220-300':{length:38.7},
  'Airbus A300-600F':{length:54.08},'Airbus A310-300':{length:46.66},
  'Airbus A318-100':{length:31.44},'Airbus A319-100':{length:33.84},'Airbus A319neo':{length:33.84,engine:2.6,tip:'up'},
  'Airbus A320-200':{length:37.57},'Airbus A320neo':{length:37.57,engine:2.6,tip:'up'},
  'Airbus A321-200':{length:44.51},'Airbus A321neo':{length:44.51,engine:2.6,tip:'up'},'Airbus A321neo LR':{length:44.51,engine:2.6,tip:'up'},'Airbus A321XLR':{length:44.51,engine:2.6,tip:'up'},
  'Airbus A330-200':{length:58.82,fin:12.1},'Airbus A330-300':{length:63.66},'Airbus A330-800':{length:58.82,fin:12.1,engine:3.8,engineLength:6,tip:'curved'},'Airbus A330-900':{length:63.66,engine:3.8,engineLength:6,tip:'curved'},'Airbus A330-200F':{length:58.82,fin:12.1},'Airbus A330-300P2F':{length:63.66},
  'Airbus A340-300':{length:63.69},'Airbus A340-500':{length:67.93,engine:3.2,engineLength:5.4,chord:12,sweep:13.3},'Airbus A340-600':{length:75.36,engine:3.2,engineLength:5.4,chord:12,sweep:13.3},
  'Airbus A350-900':{length:66.8},'Airbus A350-1000':{length:73.79},'Airbus A380-800':{length:72.72},
  'Boeing 737-400':{length:36.45,tip:'none',engine:1.8,fin:6.6},'Boeing 737-500':{length:31.01,tip:'none',engine:1.8,fin:6.6},'Boeing 737-700':{length:33.63},'Boeing 737-800':{length:39.47},'Boeing 737-900':{length:42.11},'Boeing 737-900ER':{length:42.11},'Boeing 737 MAX 8':{length:39.52,engine:2.35,engineLength:3.8,tip:'split',chevrons:true,flattened:false},'Boeing 737 MAX 9':{length:42.16,engine:2.35,engineLength:3.8,tip:'split',chevrons:true,flattened:false},
  'Boeing 747-400':{length:70.66,hump:23},'Boeing 747-400ERF':{length:70.66,hump:13},'Boeing 747-8':{length:76.25,hump:29,engine:3.4,tip:'raked',chevrons:true},'Boeing 747-8F':{length:76.25,hump:13,engine:3.4,tip:'raked',chevrons:true},
  'Boeing 757-200':{length:47.32},'Boeing 757-300':{length:54.47},
  'Boeing 767-300ER':{length:54.94},'Boeing 767-300BDSF':{length:54.94},'Boeing 767-400ER':{length:61.37,tip:'raked'},
  'Boeing 777-200ER':{length:63.73,engine:3.3,tip:'none'},'Boeing 777-200LR':{length:63.73},'Boeing 777-300ER':{length:73.86},'Boeing 777F':{length:63.73},
  'Boeing 787-8':{length:56.72},'Boeing 787-9':{length:62.81},'Boeing 787-10':{length:68.28},
  'Bombardier CRJ-200':{length:26.77,engine:1.15,fin:5.5},'Bombardier CRJ-700':{length:32.51},'Bombardier CRJ-900':{length:36.37},
  'Embraer E170':{length:29.9},'Embraer E175':{length:31.68},'Embraer E190':{length:36.24},'Embraer E190-E2':{length:36.24,engine:2.5,engineLength:3.7,tip:'raked',sweep:7.3},'Embraer E195-E2':{length:41.6},'Embraer ERJ-145LR':{length:29.87},
  'De Havilland Canada Dash 8-300':{length:25.68,engineLength:3.8,prop:3.96,blades:4},'De Havilland Canada Dash 8-400':{length:32.83},'ATR 72-600':{length:27.17},
  'Antonov An-124-100-150':{length:69.1},'McDonnell Douglas MD-11F':{length:61.21},'Beechcraft 1900D':{length:17.62},'Saab 340B':{length:19.73},'Cessna 441 Conquest II':{length:11.89},
  'Bombardier Challenger 350':{length:20.9,diameter:2.5,nose:4.3},'Bombardier Challenger 604':{length:20.85},'Bombardier Global 6500':{length:30.3},
  'Cessna Citation CJ3+':{length:15.59},'Cessna Citation II':{length:14.39,tTail:false},'Cessna Citation Excel':{length:16,diameter:1.96,engine:1.15},'Cessna Citation XLS+':{length:16,diameter:1.96,engine:1.15},'Cessna Citation X':{length:22.05,diameter:1.96,fin:4.9,finChord:4.5,sweep:5.3,chord:4.3,engine:1.65,engineLength:3.8},
  'Embraer Praetor 500':{length:19.69},'Gulfstream G200':{length:18.97},
};

const familyOf=name=>name.startsWith('ATR ')?'ATR 72':name.startsWith('De Havilland')?'Dash 8':name.startsWith('Beechcraft')?'1900':name.startsWith('Saab')?'340':name.includes('441 Conquest')?'Conquest':name.split(' ').find(p=>Object.hasOwn(aircraftFamilies,p))||name.match(/\b(A\d{3}|737|747|757|767|777|787|E170|E175|E190|E195|CRJ|ERJ-145|An-124|MD-11)/)?.[1];
const groupLengths={},groupScales={};
for(const [name,spec] of Object.entries(aircraftModels)){
  const family=familyOf(name),group=aircraftFamilies[family]?.group||family;
  groupLengths[group]=Math.max(groupLengths[group]||0,spec.length);
}
for(const [name,spec] of Object.entries(aircraftModels)){
  const family=familyOf(name),f={...aircraftFamilies[family],...spec},group=f.group||family,r=f.diameter/2;
  const above=Math.max(f.fin+.25,r+(f.deck==='hump'?2.15:0));
  const wingBelow=(f.highWing?-r:r*.48)+f.reach+(f.tip==='split'?1.8:1.1);
  const engineBelow=f.rear?r:f.prop?(f.highWing?-r:r*.48)+f.reach*.55+f.prop/2:r+f.engine*1.05+f.reach*(f.engines===4?.63:.25);
  const scale=Math.min(500/groupLengths[group],120/above,70/Math.max(wingBelow,engineBelow));
  groupScales[group]=Math.min(groupScales[group]||Infinity,scale);
}

/** No model identity is implied when used for an airline-only placeholder. */
export function aircraftShape({model='',family='',category='宽体客机'}={}){
  const resolvedFamily=familyOf(model)||family;
  const base=aircraftFamilies[resolvedFamily];
  const modelSpec=aircraftModels[model];
  const known=Boolean(base&&modelSpec);
  const f={...(base||aircraftFamilies['787']),...(modelSpec||{length:base?groupLengths[base.group||resolvedFamily]:62.81})};
  const {length:L,diameter:d,nose:n,fin:F}=f,r=d/2,cargo=category==='货机',hump=f.deck==='hump';
  // Keep each family's scale fixed. Stretch the cabin, never the nose/engines/windows.
  const scale=groupScales[f.group||resolvedFamily]||groupScales['787'];
  const offset=(600-L*scale)/2,paths=[];
  // SVG coordinates need stable rounding: browser and Node trig can differ at the last bit.
  const add=(feature,d,fill='body',stroke='',strokeWidth=0)=>paths.push({feature,d:d.replace(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi,n=>String(+Number(n).toFixed(4))),fill,stroke,strokeWidth});
  const poly=(pts)=>`M${pts.map(p=>p.join(' ')).join('L')}Z`;
  const box=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
  const ellipse=(x,y,rx,ry)=>`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0`;
  // Nose points right. Both fin edges sweep aft (left), especially the leading edge.
  const tailX=d*.6,finTop=Math.max(.35,tailX-f.finSweep*.5),finFront=tailX+f.finChord;
  const finTipFront=finTop+f.finChord*.27;
  add('vertical-tail',`M${tailX} ${-r*.5}L${finTop} ${-F+.15}Q${finTop+.05} ${-F} ${finTop+.25} ${-F}H${finTipFront}L${finFront-1.5} ${-r-1}Q${finFront} ${-r*.65} ${finFront+1} ${-r*.65}Z`);
  add('rudder',poly([[tailX,-r*.7],[finTop+.13,-F+.2],[finTop+f.finChord*.09,-F+.2],[tailX+f.finChord*.23,-r*.7]]),'shade');
  const cone=d*1.65,shoulder=L-n,tipY=(f.droop||.08)*d;
  let crown=`H${shoulder}`;
  if(hump){const start=L-(f.hump||22);crown=`H${start-4}Q${start-1} ${-r} ${start+1} ${-r-1.7}Q${start+2} ${-r-2.15} ${start+4} ${-r-2.15}H${L-n*.85}`;}
  const noseTop=hump?-r-2.15:-r;
  const pointed=['boeing','embraer','cessna','global','gulfstream','crj'].includes(f.cockpit);
  add('fuselage',`M0 ${-r*.22}Q${cone*.5} ${-r*.6} ${cone} ${-r}${crown}C${L-n*.55} ${noseTop} ${L-n*.29} ${noseTop*.55} ${L-n*.13} ${noseTop*.23}Q${L} ${tipY-(pointed?.07:.18)*d} ${L} ${tipY}C${L} ${r*.48} ${L-n*.37} ${r*.98} ${L-n} ${r}H${cone}Q${cone*.45} ${r*.8} 0 ${-r*.12}Z`);
  add('belly',`M${cone*.3} ${-r*.04}Q${cone} ${r*.77} ${cone*1.4} ${r*.77}H${L-n}Q${L-n*.37} ${r*.8} ${L} ${tipY}C${L} ${r*.48} ${L-n*.37} ${r*.98} ${L-n} ${r}H${cone}Q${cone*.45} ${r*.8} ${cone*.3} ${-r*.04}Z`,'shade');
  add('crown-highlight',`M${cone+1} ${-r+.12}H${hump?L-(f.hump||22)-5:shoulder-.3}`,'none','highlight',.13);
  const cockpitY=f.cockpit==='raised'?-r*.8:hump?-r-1.2:-r*.56,cockpitX=L-n*.63;
  if(f.cockpit==='mask')add('cockpit-mask',`M${cockpitX-1} ${cockpitY-.35}Q${cockpitX+1.2} ${cockpitY-.65} ${cockpitX+2.15} ${cockpitY+.7}L${cockpitX-1} ${cockpitY+.7}Q${cockpitX-1.45} ${cockpitY+.1} ${cockpitX-1} ${cockpitY-.35}Z`,'window');
  else add('cockpit-windows',poly([[cockpitX-1.2,cockpitY],[cockpitX+.2,cockpitY],[cockpitX+1.4,cockpitY+.75],[cockpitX-1.2,cockpitY+.65]]),'window');
  add('cockpit-divider',`M${cockpitX+.05} ${cockpitY}l.08 .68`,'none','body',.14);
  const windows=(start,end,y,large=false,feature='cabin-windows')=>{
    const gap=large?1.22:.72,w=large?.54:.29,h=large?.64:.43;
    let shape='';for(let x=start;x<end;x+=gap)shape+=ellipse(x,y,w/2,h/2);
    if(shape)add(feature,shape,'window');
  };
  if(!cargo){
    windows(cone+1,L-n-1,f.deck==='double'?.75:-r*.38,f.window==='large');
    if(f.deck==='double')windows(cone+1,L-n-1,-r*.55,false,'upper-deck-windows');
  }
  if(hump)windows(L-(f.hump||22)+5,L-n,-r-1.2,false,'upper-deck-windows');
  if(cargo)add('cargo-door',box(L-n-7,-r+.6,5,d-1.2),'none','shade',.14);
  else{
    for(const x of [cone+.1,L-n+.2])add('cabin-door',box(x,-r+.45,.55,d-.9),'none','shade',.1);
    if(L>42)for(const x of [L*.36,L*.63])add('cabin-door',box(x,-r+.45,.55,d-.9),'none','shade',.1);
  }
  const stabilizerY=f.tTail?-F+.12:-r*.24;
  const stabilizerX=f.tTail?finTop:Math.max(.4,tailX-d*.3);
  const stabilizerLength=f.tTail?f.finChord*.8:d*1.65;
  add('horizontal-tail',`M${stabilizerX+stabilizerLength} ${stabilizerY+.15}Q${stabilizerX+stabilizerLength*.7} ${stabilizerY-.25} ${stabilizerX} ${stabilizerY-.5}L${stabilizerX-.15} ${stabilizerY-.16}Q${stabilizerX+stabilizerLength*.5} ${stabilizerY+.55} ${stabilizerX+stabilizerLength} ${stabilizerY+.15}Z`,'body','shade',.12);
  // In a side elevation the swept wing is foreshortened; dihedral lifts its tip.
  const wx=L*f.wing,wy=f.highWing?-r+.1:r*.48,tx=wx-f.sweep;
  const ty=wy+(f.prop?-.12:f.highWing?f.reach*.12:-f.reach*.55);
  add('wing',`M${wx+f.chord*.5} ${wy}Q${wx-f.chord*.1} ${wy+.8} ${wx-f.chord*.55} ${wy+.4}L${tx-1.1} ${ty+.2}L${tx} ${ty}Q${wx-f.sweep*.45} ${wy+.1} ${wx+f.chord*.5} ${wy}Z`,'shade');
  add('wing-leading-edge',`M${wx+f.chord*.5} ${wy}Q${wx-f.sweep*.45} ${wy-.15} ${tx} ${ty}L${tx-.8} ${ty+.1}Q${wx-f.sweep*.35} ${wy+.3} ${wx+f.chord*.5} ${wy}Z`,'body','shade',.08);
  if(f.tip==='up'||f.tip==='curved')add('wingtip',f.tip==='curved'?`M${tx} ${ty}Q${tx-.8} ${ty-.5} ${tx-1.25} ${ty-2}Q${tx-.5} ${ty-1} ${tx+.65} ${ty-.2}Z`:poly([[tx-.7,ty+.15],[tx-1.2,ty-1.8],[tx-.65,ty-1.8],[tx+.6,ty]]));
  if(f.tip==='split')add('wingtip',poly([[tx,ty],[tx-1.3,ty-1.8],[tx-.8,ty-1.8],[tx+.8,ty],[tx-.7,ty+1.1],[tx-1.1,ty+.9]]));
  if(f.tip==='fence')add('wingtip',poly([[tx-.5,ty-.7],[tx+.4,ty],[tx-.1,ty+.7],[tx-.7,ty+.2]]));
  if(f.tip==='raked')add('wingtip',poly([[tx+.8,ty+.1],[tx-2.5,ty-.5],[tx-3,ty-.65],[tx-.5,ty-.35]]));
  function engine(cx,cy,size=f.engine,length=f.engineLength,feature='wing-engine'){
    const back=cx-length*.5,front=cx+length*.5,er=size/2;
    add(feature,`M${back} ${cy-er*.65}Q${cx} ${cy-er*1.08} ${front-.3} ${cy-er}Q${front+.2} ${cy-er*.7} ${front} ${cy}Q${front+.2} ${cy+er*.7} ${front-.3} ${cy+er}Q${cx} ${cy+er} ${back} ${cy+er*.55}Z`,'body','shade',.08);
    add('engine-shade',`M${back} ${cy+.1}Q${cx} ${cy+er*.6} ${front-.1} ${cy+er*.4}L${front-.3} ${cy+er}Q${cx} ${cy+er} ${back} ${cy+er*.55}Z`,'shade');
    add('engine-intake',ellipse(front-.12,cy,.15,er*.78),'window');
    if(f.flattened)add('flattened-nacelle',`M${back+.1} ${cy+er*.7}H${front-.2}L${front-.4} ${cy+er*.95}H${back+.8}Z`,'shade');
    if(f.chevrons){for(let k=-1;k<=1;k++)add('engine-chevron',poly([[back+.22,cy+k*er*.55-er*.2],[back-.2,cy+k*er*.55],[back+.22,cy+k*er*.55+er*.2]]),'shade');}
  }
  if(f.prop){
    const ex=wx+.25,ey=wy+f.engine*.6;
    engine(ex,ey,f.engine,f.engineLength,'prop-nacelle');
    const px=ex+f.engineLength/2+.22,pr=f.prop/2;
    for(let k=0;k<f.blades;k++){const a=k*2*Math.PI/f.blades;const x=Math.cos(a)*pr*.22,y=Math.sin(a)*pr;add('propeller-blade',poly([[px-.1,ey],[px+x-.09,ey+y],[px+x+.13,ey+y],[px+.12,ey+.05]]),'window');}
    add('propeller-hub',ellipse(px,ey,.19,.19));
  }else if(f.rear){
    engine(cone+f.engineLength*.25,-r*.3,f.engine,f.engineLength,'rear-engine');
  }else{
    const ey=f.highWing?-r+f.engine*.7:r+f.engine*.27;
    const ex=wx+f.chord*.22;
    add('engine-pylon',poly([[ex-.6,wy],[ex+.7,wy],[ex+.7,ey],[ex-.6,ey]]),'shade');
    engine(ex,ey);
    if(f.engines===4){const ox=ex-f.sweep*.48,oy=ey-f.reach*.2;add('outer-pylon',poly([[ox-.4,wy-f.reach*.2],[ox+.6,wy-f.reach*.2],[ox+.6,oy],[ox-.4,oy]]),'shade');engine(ox,oy,f.engine*.9,f.engineLength*.94,'outer-wing-engine');}
  }
  if(f.engines===3)engine(tailX+f.finChord*.52,-r-f.engine*.7,f.engine*.92,f.engineLength,'tail-engine');
  if(f.strakes)add('ventral-strakes',poly([[tailX+.3,r*.5],[tailX-.2,r+1],[tailX+2,r*.7]]),'shade');
  if(resolvedFamily==='An-124')add('nose-cargo-seam',`M${L-n*.6} ${-r*.8}Q${L-n*.3} 0 ${L-n*.8} ${r*.8}`,'none','shade',.16);
  return {family:base?resolvedFamily:'generic',known,model:known?model:'',length:L,scale,offset,cargo,engines:f.engines||2,paths};
}
