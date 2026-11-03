const FONT='Arial, "PingFang SC", "Microsoft YaHei", sans-serif';
const COLORS={bg:'#0b1723',paper:'#eff6fa',ink:'#102b3e',accent:'#91d3f4',text:'#f3f8fc',muted:'#a5bbcc',line:'#304858'};
const safeName=value=>String(value).replace(/[^a-zA-Z0-9_-]+/g,'-');

export function shareCardDetails(source,airports={}) {
  if(source.kind==='photo'){
    const p=source.photo;
    return {kind:'photo',width:1080,height:1350,filename:`SKYLOG-photo-${safeName(p.id)}.png`,image:p.image,id:p.id,date:p.date,
      model:p.models.join(' / ')||'机型待确认',airline:p.airlines.join(' / ')||'Private / Business',
      airport:[p.airport,airports[p.airport]?.city].filter(Boolean).join(' · '),
      registration:p.registration?`${p.registration.value}${p.registration.status==='confirmed'?'':' · 推测'}`:'待确认',livery:p.livery||'待确认',credit:'PHOTOGRAPHY © Yuan Wang'};
  }
  const f=source.flight;
  return {kind:'flight',width:1080,height:720,filename:`SKYLOG-flight-${safeName(`${f.date}-${f.flight}-${f.origin}-${f.destination}`)}.png`,date:f.date,
    flight:f.flight,airline:f.airline,origin:f.origin,destination:f.destination,originCity:airports[f.origin]?.city||'城市待确认',destinationCity:airports[f.destination]?.city||'城市待确认',
    model:f.modelLabel||'机型待确认',registration:f.registration||'未记录',credit:'TRAVEL JOURNAL · Yuan Wang'};
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
  const canvas=document.createElement('canvas');canvas.width=details.width;canvas.height=details.height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建图片画布');
  ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  if(details.kind==='photo'){
    const image=new Image();image.src=`${basePath}${details.image}`;await image.decode();
    plane(ctx,70,74,1.05,COLORS.accent);text(ctx,'SKYLOG',108,88,500,38,COLORS.text,700);
    text(ctx,'FROM MY VIEWFINDER',48,128,700,17,COLORS.muted,600);
    text(ctx,details.id,850,86,182,22,COLORS.accent,600);
    const box={x:48,y:162,width:984,height:690};
    ctx.fillStyle='#071019';ctx.fillRect(box.x,box.y,box.width,box.height);
    const rect=containRect(image.naturalWidth,image.naturalHeight,box);
    ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height);
    ctx.strokeStyle=COLORS.line;ctx.strokeRect(box.x,box.y,box.width,box.height);
    text(ctx,details.airport,48,898,984,21,COLORS.accent,600);
    text(ctx,details.model,48,968,984,52,COLORS.text,700);
    text(ctx,details.airline,48,1016,984,31,COLORS.muted,400);
    line(ctx,48,1050,1032,1050);
    field(ctx,'REGISTRATION / 注册号',details.registration,48,1090,450);
    field(ctx,'CAPTURED / 拍摄日期',details.date,558,1090,474);
    field(ctx,'LIVERY / 涂装',details.livery,48,1180,984);
    line(ctx,48,1258,1032,1258);
    text(ctx,details.credit,48,1305,560,20,COLORS.text,600);
    text(ctx,'konantian.github.io/skylog',650,1305,382,19,COLORS.muted);
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
    field(ctx,'DATE / 日期',details.date,64,429,340,true);field(ctx,'FLIGHT / 航班',details.flight,440,429,346,true);
    field(ctx,'AIRCRAFT / 机型',details.model,64,513,722,true);
    field(ctx,'REGISTRATION / 注册号',details.registration,64,597,340,true);field(ctx,'TRAVELLER / 乘机人','Yuan Wang',440,597,346,true);
    text(ctx,'FLIGHT MEMORY · 飞行纪念卡，非登机凭证',64,672,722,16,'#526d80');
    text(ctx,'FLIGHT MEMORY',866,103,148,17,'#526d80',600);
    text(ctx,details.origin,866,228,148,48,COLORS.ink,700);plane(ctx,938,286,1.1,'#1a719d',Math.PI);
    text(ctx,details.destination,866,377,148,48,COLORS.ink,700);
    text(ctx,details.flight,866,462,148,26,COLORS.ink,600);text(ctx,details.date,866,502,148,20,'#526d80');
    text(ctx,'Yuan Wang',866,585,148,23,COLORS.ink,600);
    text(ctx,'konantian.github.io',866,631,148,14,'#526d80');text(ctx,'/skylog',866,654,148,16,'#526d80');
  }
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG 导出失败')),'image/png'));
}
