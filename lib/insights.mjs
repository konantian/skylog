export const routeKey = flight => [flight.origin,flight.destination].sort().join('~');

export function collectRoutes(flights) {
  const routes=new Map();
  for(const flight of flights){
    const key=routeKey(flight);
    if(!routes.has(key)) routes.set(key,{key,airports:key.split('~'),count:0});
    routes.get(key).count++;
  }
  return [...routes.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key));
}

const ranking = values => {
  const counts=new Map();
  for(const value of values) if(value) counts.set(value,(counts.get(value)||0)+1);
  return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
};

export function flightStats(flights) {
  return {
    total:flights.length,
    airports:new Set(flights.flatMap(f=>[f.origin,f.destination])).size,
    airlines:ranking(flights.map(f=>f.airline)),
    models:ranking(flights.map(f=>f.model)),
    routes:collectRoutes(flights),
    years:ranking(flights.map(f=>f.date.slice(0,4))).sort((a,b)=>a.name.localeCompare(b.name)),
    unspecifiedModels:flights.filter(f=>!f.model).length,
  };
}

export function greatCircleKm(from,to) {
  if(!from||!to||![from.latitude,from.longitude,to.latitude,to.longitude].every(Number.isFinite))return null;
  const rad=Math.PI/180;
  const h=Math.sin((to.latitude-from.latitude)*rad/2)**2+Math.cos(from.latitude*rad)*Math.cos(to.latitude*rad)*Math.sin((to.longitude-from.longitude)*rad/2)**2;
  return 6371.0088*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}

export function flightRecords(flights,airports) {
  const measured=flights.map(flight=>({flight,km:greatCircleKm(airports[flight.origin],airports[flight.destination])})).filter(r=>r.km!==null);
  const ordered=[...measured].sort((a,b)=>a.km-b.km||a.flight.date.localeCompare(b.flight.date));
  const years=ranking(flights.map(f=>f.date.slice(0,4)));
  return {
    totalKm:measured.reduce((sum,r)=>sum+r.km,0),
    measured:measured.length,
    shortest:ordered[0]??null,
    longest:ordered.at(-1)??null,
    busiestYears:years.filter(y=>y.count===years[0].count),
  };
}

export function aircraftFamilies(aircraft) {
  const groups=new Map();
  for(const entry of aircraft){
    const manufacturer=entry.manufacturer||'',family=entry.family||entry.name,key=`${manufacturer}:${family}`;
    if(!groups.has(key))groups.set(key,{key,manufacturer,family,name:family.startsWith(manufacturer+' ')?family:`${manufacturer} ${family}`.trim(),entries:[]});
    groups.get(key).entries.push(entry);
  }
  return [...groups.values()].map(group=>({...group,entries:[...group.entries].sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true})),unlocked:group.entries.filter(e=>e.unlocked).length})).sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
}

// Pacific-centered by default; offset 450 keeps Europe continuous across Greenwich.
export const projectAirport = (airport,offset=0) => {
  const x=((airport.longitude%360+360)%360)*2.5;
  return [x<offset?x+900:x,(90-airport.latitude)*2.5];
};

export function routePoints(from,to) {
  const rad=Math.PI/180;
  const vector=a=>[Math.cos(a.latitude*rad)*Math.cos(a.longitude*rad),Math.cos(a.latitude*rad)*Math.sin(a.longitude*rad),Math.sin(a.latitude*rad)];
  const a=vector(from),b=vector(to);
  const angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((sum,v,i)=>sum+v*b[i],0))));
  if(angle<1e-8) return [projectAirport(from)];
  return Array.from({length:65},(_,i)=>{
    const t=i/64,sin=Math.sin(angle);
    const v=a.map((n,j)=>(n*Math.sin((1-t)*angle)+b[j]*Math.sin(t*angle))/sin);
    return projectAirport({longitude:Math.atan2(v[1],v[0])/rad,latitude:Math.atan2(v[2],Math.hypot(v[0],v[1]))/rad});
  });
}

export function routePath(from,to,offset=0) {
  const points=routePoints(from,to);
  if(points.length<2)return '';
  let lastX=null;
  return points.map(([x,y])=>{
    if(x<offset)x+=900;
    // Break at the map seam instead of drawing a false line across the world.
    const command=lastX===null||Math.abs(x-lastX)>450?'M':'L';lastX=x;
    return `${command}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

export function collectionTimeline(visiblePhotos,aircraft,airlines) {
  const dates=[...new Set(visiblePhotos.map(p=>p.date))].sort().reverse();
  return dates.map(date=>{
    const photos=visiblePhotos.filter(p=>p.date===date);
    const models=new Set(photos.flatMap(p=>p.models));
    const carriers=new Set(photos.flatMap(p=>p.airlines));
    return {date,photos,airports:[...new Set(photos.map(p=>p.airport))],
      newModels:aircraft.filter(e=>e.firstSeen===date&&models.has(e.name)).map(e=>e.name),
      newAirlines:airlines.filter(e=>e.firstSeen===date&&carriers.has(e.name)).map(e=>e.name),
      cumulativeModels:aircraft.filter(e=>e.unlocked&&e.firstSeen<=date).length,
      cumulativeAirlines:airlines.filter(e=>e.unlocked&&e.firstSeen<=date).length,
    };
  });
}
