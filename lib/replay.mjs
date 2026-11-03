import {routePoints} from './insights.mjs';
export const LEG_DURATION=7000;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const replayFlights=(flights,year)=>flights.filter(f=>year==='all'||f.date.startsWith(year)).sort((a,b)=>a.date.localeCompare(b.date));
export function advanceReplay(cursor,delta,speed,total) {
  let remaining=clamp(delta,0,100);
  while(remaining>0&&cursor<total){
    const index=Math.floor(cursor),departure=index+.12,arrival=index+.86;
    const boundary=cursor<departure?departure:cursor<arrival?arrival:index+1;
    // Keep departure/arrival transitions calm even at faster cruise speeds.
    const rate=cursor>=departure&&cursor<arrival?speed:1;
    const duration=(boundary-cursor)*LEG_DURATION/rate;
    if(duration>remaining){cursor+=remaining*rate/LEG_DURATION;break;}
    cursor=boundary;remaining-=duration;
  }
  return clamp(cursor,0,total);
}
export const pointsPath=points=>points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

export function replayLeg(flight,airports) {
  let previous=null;
  const points=routePoints(airports[flight.origin],airports[flight.destination]).map(([x,y])=>{
    if(previous!==null){while(x-previous>450)x-=900;while(x-previous < -450)x+=900;}
    previous=x;return [x,y];
  });
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const width=clamp(Math.max(Math.max(...xs)-Math.min(...xs)+70,(Math.max(...ys)-Math.min(...ys)+65)*2),180,900);
  const height=width/2;
  const box=[(Math.min(...xs)+Math.max(...xs)-width)/2,clamp((Math.min(...ys)+Math.max(...ys)-height)/2,0,450-height),width,height];
  return {flight,points,path:pointsPath(points),box};
}

export function replayPose(leg,phase,steady=false) {
  const linear=clamp((phase-.12)/.74,0,1);
  const progress=linear*linear*(3-2*linear);
  const offset=progress*(leg.points.length-1),index=Math.min(Math.floor(offset),leg.points.length-2);
  const from=leg.points[Math.max(0,index)],to=leg.points[Math.max(0,index+1)];
  const mix=leg.points.length>1?offset-index:0;
  const point=from.map((v,i)=>v+(to[i]-v)*mix);
  const before=leg.points[Math.max(0,index-1)],after=leg.points[Math.min(leg.points.length-1,index+2)];
  const tangent=from.map((_,j)=>(to[j]-before[j])*(1-mix)+(after[j]-from[j])*mix);
  const heading=Math.atan2(tangent[1],tangent[0])*180/Math.PI+90;
  const path=pointsPath([...leg.points.slice(0,Math.max(0,index)+1),point]);
  let box=leg.box;
  if(!steady){
    const zoom=1+.12*Math.sin(progress*Math.PI),width=box[2]/zoom,height=box[3]/zoom;
    const cx=box[0]+box[2]/2,cy=box[1]+box[3]/2;
    box=[cx+(point[0]-cx)*.1-width/2,cy+(point[1]-cy)*.1-height/2,width,height];
  }
  const opacity=phase<.08?clamp(phase/.08,0,1):phase>.92?clamp((1-phase)/.08,0,1):1;
  return {progress,point,heading,path,box,opacity};
}
