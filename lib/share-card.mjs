import {translate} from './i18n.mjs';

const FONT='Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
const COLORS={bg:'#0b1723',paper:'#eff6fa',ink:'#102b3e',accent:'#91d3f4',text:'#f3f8fc',muted:'#a5bbcc',line:'#304858'};
const safeName=value=>String(value).replace(/[^a-zA-Z0-9_-]+/g,'-');

export function shareCardDetails(source,airports={},orientation='landscape',locale='zh') {
  const t=(key)=>translate(locale,key);
  orientation=orientation==='portrait'?'portrait':'landscape';
  const size=orientation==='portrait'?{width:1080,height:1350}:source.kind==='photo'?{width:1620,height:1080}:{width:1080,height:720};
  if(source.kind==='photo'){
    const p=source.photo;
    return {kind:'photo',...size,orientation,locale,filename:`SKYLOG-photo-${safeName(p.id)}-${orientation}${locale==='en'?'-en':''}.png`,image:p.image,id:p.id,date:p.date,
      model:p.models.map(t).join(' / ')||t('机型待确认'),airline:p.airlines.map(t).join(' / ')||'Private / Business',
      airport:[p.airport,t(airports[p.airport]?.city)].filter(Boolean).join(' · '),
      registration:p.registration?.value||'—',livery:t(p.livery||'待确认'),credit:t('PHOTOGRAPHY © Yuan Wang')};
  }
  const f=source.flight;
  return {kind:'flight',...size,orientation,locale,filename:`SKYLOG-flight-${safeName(`${f.date}-${f.flight}-${f.origin}-${f.destination}`)}-${orientation}${locale==='en'?'-en':''}.png`,date:f.date,
    flight:f.flight,airline:t(f.airline),origin:f.origin,destination:f.destination,originCity:t(airports[f.origin]?.city)||'—',destinationCity:t(airports[f.destination]?.city)||'—',
    model:t(f.modelLabel||'机型待确认'),registration:f.registration||t('未记录'),credit:t('TRAVEL JOURNAL · Yuan Wang')};
}

export function containRect(width,height,box) {
  const scale=Math.min(box.width/width,box.height/height);
  return {x:box.x+(box.width-width*scale)/2,y:box.y+(box.height-height*scale)/2,width:width*scale,height:height*scale};
}

function text(ctx,value,x,y,width,size,color=COLORS.text,weight=400) {
  const chars=Array.from(String(value));let label=chars.join(''),fontSize=size;
  const font=()=>{ctx.font=`${weight} ${fontSize}px ${FONT}`;};font();
  while(ctx.measureText(label).width>width&&fontSize>18){fontSize--;font();}
  while(ctx.measureText(label).width>width&&chars.length){chars.pop();label=chars.join('')+'…';}
  ctx.fillStyle=color;ctx.fillText(label,x,y);
}
function line(ctx,x,y,toX,toY,color=COLORS.line) {
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(toX,toY);ctx.stroke();
}
function plane(ctx,x,y,scale,color,rotation=Math.PI/2) {
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);ctx.fillStyle=color;
  ctx.fill(new Path2D('M0-16c2 0 3 4 3 7v4L18 5v3L3 3v9l5 4v2l-8-3-8 3v-2l5-4V3L-18 8V5L-3-5v-4c0-3 1-7 3-7Z'));ctx.restore();
}
function field(ctx,label,value,x,y,width,light=false) {
  text(ctx,label,x,y,width,17,light?'#526d80':COLORS.muted,600);
  text(ctx,value,x,y+36,width,27,light?COLORS.ink:COLORS.text,500);
}

export async function renderShareCard(details,basePath='') {
  const t=(key)=>translate(details.locale||'zh',key);
  const canvas=document.createElement('canvas');canvas.width=details.width;canvas.height=details.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建图片画布');
  ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  if(details.kind==='photo'){
    const image=new Image();image.src=`${basePath}${details.image}`;await image.decode();
    const portrait=details.orientation==='portrait';
    plane(ctx,70,74,1.05,COLORS.accent);text(ctx,'SKYLOG',108,88,500,38,COLORS.text,700);
    text(ctx,'FROM MY VIEWFINDER',48,128,700,17,COLORS.muted,600);
    text(ctx,details.id,details.width-230,86,182,22,COLORS.accent,600);
    const box=portrait?{x:48,y:162,width:984,height:690}:{x:48,y:152,width:1524,height:620};
    ctx.fillStyle='#071019';ctx.fillRect(box.x,box.y,box.width,box.height);
    const rect=containRect(image.naturalWidth,image.naturalHeight,box);
    ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height);
    ctx.strokeStyle=COLORS.line;ctx.strokeRect(box.x,box.y,box.width,box.height);
    if(portrait){
      text(ctx,details.airport,48,898,984,21,COLORS.accent,600);
      text(ctx,details.model,48,968,984,52,COLORS.text,700);
      text(ctx,details.airline,48,1016,984,31,COLORS.muted,400);
      line(ctx,48,1050,1032,1050);
      field(ctx,t('REGISTRATION / 注册号'),details.registration,48,1090,450);
      field(ctx,t('CAPTURED / 拍摄日期'),details.date,558,1090,474);
      field(ctx,t('LIVERY / 涂装'),details.livery,48,1180,984);
      line(ctx,48,1258,1032,1258);
      text(ctx,details.credit,48,1305,560,20,COLORS.text,600);
      text(ctx,'SKYLOG',650,1305,382,19,COLORS.muted);
    }else{
      text(ctx,details.airport,48,816,900,21,COLORS.accent,600);
      text(ctx,details.model,48,876,900,46,COLORS.text,700);
      text(ctx,details.airline,48,920,900,29,COLORS.muted);
      text(ctx,`${t('LIVERY / 涂装')} · ${details.livery}`,48,969,900,22,COLORS.muted);
      field(ctx,t('REGISTRATION / 注册号'),details.registration,1080,820,492);
      field(ctx,t('CAPTURED / 拍摄日期'),details.date,1080,926,492);
      line(ctx,48,1008,1572,1008);
      text(ctx,details.credit,48,1050,800,20,COLORS.text,600);
      text(ctx,'SKYLOG',1190,1050,382,19,COLORS.muted);
    }
  }else if(details.orientation==='portrait'){
    ctx.fillStyle=COLORS.paper;ctx.beginPath();ctx.roundRect(28,28,1024,1294,20);ctx.fill();
    ctx.fillStyle='#dbeef9';ctx.fillRect(48,908,984,394);
    ctx.save();ctx.setLineDash([8,9]);line(ctx,48,884,1032,884,'#adc7d8');ctx.restore();
    for(const x of [28,1052]){ctx.fillStyle=COLORS.bg;ctx.beginPath();ctx.arc(x,884,18,0,Math.PI*2);ctx.fill();}
    plane(ctx,88,106,1.2,COLORS.ink);text(ctx,'SKYLOG',130,122,800,48,COLORS.ink,700);
    text(ctx,'MY BOARDING HISTORY',64,169,952,21,'#526d80',600);
    text(ctx,details.airline,64,247,952,40,COLORS.ink,600);
    text(ctx,details.origin,64,377,330,112,COLORS.ink,700);
    line(ctx,358,338,636,338,'#adc7d8');plane(ctx,497,338,1.5,'#1a719d');
    text(ctx,details.destination,684,377,332,112,COLORS.ink,700);
    text(ctx,details.originCity,64,430,560,29,'#526d80');text(ctx,details.destinationCity,684,430,332,29,'#526d80');
    line(ctx,64,476,1016,476,'#c9dbe6');
    field(ctx,t('DATE / 日期'),details.date,64,536,440,true);field(ctx,t('FLIGHT / 航班'),details.flight,558,536,458,true);
    field(ctx,t('AIRCRAFT / 机型'),details.model,64,650,952,true);
    field(ctx,t('REGISTRATION / 注册号'),details.registration,64,764,440,true);field(ctx,t('TRAVELLER / 乘机人'),'Yuan Wang',558,764,458,true);
    text(ctx,'FLIGHT MEMORY',76,963,700,22,'#526d80',600);
    text(ctx,details.origin,76,1060,330,72,COLORS.ink,700);plane(ctx,497,1034,1.3,'#1a719d');text(ctx,details.destination,684,1060,320,72,COLORS.ink,700);
    field(ctx,t('FLIGHT / 航班'),details.flight,76,1134,430,true);field(ctx,t('DATE / 日期'),details.date,558,1134,446,true);
    text(ctx,'Yuan Wang',76,1235,430,27,COLORS.ink,600);text(ctx,'SKYLOG',558,1235,446,22,'#526d80');
    text(ctx,t('飞行纪念卡，非登机凭证'),76,1282,928,19,'#526d80');
  }else{
    ctx.fillStyle=COLORS.paper;ctx.beginPath();ctx.roundRect(28,28,1024,664,20);ctx.fill();
    ctx.fillStyle='#dbeef9';ctx.fillRect(848,48,184,624);
    ctx.save();ctx.setLineDash([8,9]);line(ctx,826,48,826,672,'#adc7d8');ctx.restore();
    for(const y of [28,692]){ctx.fillStyle=COLORS.bg;ctx.beginPath();ctx.arc(826,y,18,0,Math.PI*2);ctx.fill();}
    plane(ctx,81,91,1.05,COLORS.ink);text(ctx,'SKYLOG',118,105,510,40,COLORS.ink,700);
    text(ctx,'MY BOARDING HISTORY',64,142,720,17,'#526d80',600);
    text(ctx,details.airline,64,193,718,32,COLORS.ink,600);
    text(ctx,details.origin,64,306,300,94,COLORS.ink,700);
    line(ctx,294,272,504,272,'#adc7d8');plane(ctx,399,272,1.2,'#1a719d');
    text(ctx,details.destination,542,306,244,94,COLORS.ink,700);
    text(ctx,details.originCity,64,350,380,25,'#526d80');text(ctx,details.destinationCity,542,350,244,25,'#526d80');
    line(ctx,64,389,786,389,'#c9dbe6');
    field(ctx,t('DATE / 日期'),details.date,64,429,340,true);field(ctx,t('FLIGHT / 航班'),details.flight,440,429,346,true);
    field(ctx,t('AIRCRAFT / 机型'),details.model,64,513,722,true);
    field(ctx,t('REGISTRATION / 注册号'),details.registration,64,597,340,true);field(ctx,t('TRAVELLER / 乘机人'),'Yuan Wang',440,597,346,true);
    text(ctx,t('FLIGHT MEMORY · 飞行纪念卡，非登机凭证'),64,672,722,16,'#526d80');
    text(ctx,'FLIGHT MEMORY',866,103,148,17,'#526d80',600);
    text(ctx,details.origin,866,228,148,48,COLORS.ink,700);plane(ctx,938,286,1.1,'#1a719d',Math.PI);
    text(ctx,details.destination,866,377,148,48,COLORS.ink,700);
    text(ctx,details.flight,866,462,148,26,COLORS.ink,600);text(ctx,details.date,866,502,148,20,'#526d80');
    text(ctx,'Yuan Wang',866,585,148,23,COLORS.ink,600);
    text(ctx,'konantian.github.io',866,631,148,14,'#526d80');text(ctx,'/skylog',866,654,148,16,'#526d80');
  }
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 导出失败')),'image/png'));
}
