import {useEffect,useMemo,useRef,useState} from 'react';
import airportData from '@/data/airports.json';
import land from '@/data/world-land.json';
import {advanceReplay,replayFlights,replayLeg,replayPose} from '@/lib/replay.mjs';
import type {Flight} from '@/lib/types';
import {Icon} from './icons';

type Airport={city:string;latitude:number;longitude:number};
type Leg={flight:Flight;points:number[][];path:string;box:number[]};
const airports:Record<string,Airport>=airportData;

export function JourneyReplay({flights,initialYear,onClose}:{flights:Flight[];initialYear:string;onClose:()=>void}) {
  const years=[...new Set(flights.map(f=>f.date.slice(0,4)))].sort().reverse();
  const [year,setYear]=useState(years.includes(initialYear)?initialYear:years[0]);
  const legs=useMemo(()=>replayFlights(flights,year).map((f:Flight)=>replayLeg(f,airports)) as Leg[],[flights,year]);
  const [frame,setFrame]=useState({cursor:0,box:legs[0].box});
  const clock=useRef(frame);
  const [playing,setPlaying]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [reduced,setReduced]=useState(false);
  const [mobile,setMobile]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const map=useRef<SVGSVGElement>(null),plane=useRef<SVGGElement>(null),trail=useRef<SVGPathElement>(null),scrubber=useRef<HTMLInputElement>(null);
  const markers=useRef<(SVGGElement|null)[]>([]);
  const paint=(current:typeof frame)=>{
    const i=Math.min(Math.floor(current.cursor),legs.length-1),done=current.cursor>=legs.length;
    const pose=replayPose(legs[i],done||reduced?1:current.cursor-i,mobile||reduced);
    const box=mobile||reduced?legs[i].box:current.box;
    map.current?.setAttribute('viewBox',box.join(' '));
    trail.current?.setAttribute('d',pose.path);
    [legs[i].points[0],legs[i].points.at(-1)!].forEach((p,j)=>markers.current[j]?.setAttribute('transform',`translate(${p[0]} ${p[1]}) scale(${box[2]/(mobile?650:900)})`));
    plane.current?.setAttribute('transform',`translate(${pose.point[0]} ${pose.point[1]}) scale(${box[2]/(mobile?650:900)}) rotate(${pose.heading})`);
    plane.current?.setAttribute('opacity',String(reduced||done||!playing?1:pose.opacity));
    if(scrubber.current)scrubber.current.value=String(current.cursor);
  };
  const finished=frame.cursor>=legs.length;
  const index=Math.min(Math.floor(frame.cursor),legs.length-1);
  const leg=legs[index],flight=leg.flight;
  const pose=replayPose(leg,reduced||finished?1:frame.cursor-index,mobile||reduced);
  const box=mobile||reduced?leg.box:frame.box;
  const from=airports[flight.origin],to=airports[flight.destination];
  const phase=reduced?'静态预览':finished?'旅程已回放完毕':playing?(pose.progress===0?'准备起飞':pose.progress===1?'已抵达':'飞行中'):frame.cursor===0?'准备出发':'已暂停';
  const seek=(value:number)=>{
    setPlaying(false);
    const cursor=Math.max(0,Math.min(value,legs.length));
    const selected=legs[Math.min(Math.floor(cursor),legs.length-1)];
    clock.current={cursor,box:selected.box};setFrame(clock.current);
  };
  const changeYear=(value:string)=>{
    setPlaying(false);setYear(value);
    const first=replayFlights(flights,value)[0];
    clock.current={cursor:0,box:replayLeg(first,airports).box};setFrame(clock.current);
  };
  const toggle=()=>{
    if(reduced)return;
    if(finished){clock.current={cursor:0,box:legs[0].box};setFrame(clock.current);}
    setFrame(clock.current);setPlaying(value=>!value);
  };

  useEffect(()=>{
    const el=dialog.current!,previous=document.activeElement as HTMLElement|null;
    el.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{el.close();document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
  },[]);
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),size=window.matchMedia('(max-width: 600px)');
    const updateMotion=()=>{setFrame(clock.current);setReduced(motion.matches);if(motion.matches)setPlaying(false);};
    const updateSize=()=>{setFrame(clock.current);setMobile(size.matches);};
    const visibility=()=>{if(document.hidden){setFrame(clock.current);setPlaying(false);}};
    updateMotion();updateSize();motion.addEventListener('change',updateMotion);size.addEventListener('change',updateSize);document.addEventListener('visibilitychange',visibility);
    return()=>{motion.removeEventListener('change',updateMotion);size.removeEventListener('change',updateSize);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{
    if(!playing||reduced)return;
    let request=0,last=0,lastStage='';
    const tick=(now:number)=>{
      const delta=last?now-last:0;last=now;
      const cursor=advanceReplay(clock.current.cursor,delta,speed,legs.length);
      const i=Math.min(Math.floor(cursor),legs.length-1);
      const target=replayPose(legs[i],cursor>=legs.length?1:cursor-i,mobile).box;
      const ease=1-Math.exp(-Math.min(delta,100)/220);
      const box=target.map((v:number,j:number)=>clock.current.box[j]+(v-clock.current.box[j])*ease);
      clock.current={cursor,box};paint(clock.current);
      const phase=cursor-i,stage=`${i}:${phase<.12?'depart':phase<.86?'cruise':'arrive'}`;
      if(stage!==lastStage){lastStage=stage;setFrame(clock.current);}
      if(cursor>=legs.length){setFrame(clock.current);setPlaying(false);return;}
      request=requestAnimationFrame(tick);
    };
    request=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(request);
  },[playing,speed,legs,mobile,reduced]);
  useEffect(()=>paint(clock.current),[frame,legs,mobile,reduced,playing]);

  return <dialog ref={dialog} className="replay-dialog" aria-labelledby="replay-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="replay-shell">
      <header className="replay-heading"><div><span className="eyebrow">YOUR JOURNEY, IN MOTION</span><h2 id="replay-title">回放我的旅程</h2></div><button className="icon-button" aria-label="关闭旅程回放" onClick={onClose}><Icon name="close" size={23}/></button></header>
      <div className="replay-selectors"><label className="select-field"><span>回放年份</span><select aria-label="回放年份" value={year} onChange={e=>{changeYear(e.target.value);e.currentTarget.blur();}}><option value="all">全部年份 · {flights.length} 段</option>{years.map(y=><option key={y} value={y}>{y} 年 · {flights.filter(f=>f.date.startsWith(y)).length} 段</option>)}</select></label><label className="select-field"><span>跳转到航班</span><select aria-label="跳转到航班" value={index} onChange={e=>{seek(Number(e.target.value));e.currentTarget.blur();}}>{legs.map((l,i)=><option key={l.flight.id} value={i}>{l.flight.date} · {l.flight.flight} · {l.flight.origin} → {l.flight.destination}</option>)}</select></label></div>
      <div className="replay-stage">
        <div className="replay-stage-label"><span className={playing?'is-playing':''}><i/>{phase}</span><span>{String(index+1).padStart(2,'0')} / {String(legs.length).padStart(2,'0')}</span></div>
        <svg ref={map} className="replay-map" viewBox={box.join(' ')} role="img" aria-label={`${flight.origin} ${from.city} 飞往 ${flight.destination} ${to.city}，航线示意`}>
          <g className="map-grid" aria-hidden="true">{[0,75,150,225,300,375,450].map(y=><path key={'y'+y} d={`M-900 ${y}H1800`}/>)}{[-450,0,150,300,450,600,750,900,1350].map(x=><path key={'x'+x} d={`M${x} 0V450`}/>)}</g>
          <g className="map-land" aria-hidden="true">{[-1350,-450,450,1350].map(x=><path key={x} d={land.path} transform={`translate(${x} 0)`}/>)}</g>
          <g className="replay-history" aria-hidden="true">{legs.slice(0,index).map(l=><path key={l.flight.id} d={l.path}/>)}</g>
          <path className="replay-planned" d={leg.path}/><path ref={trail} className="replay-flown" d={pose.path}/>
          {[{code:flight.origin,point:leg.points[0]},{code:flight.destination,point:leg.points.at(-1)!}].map(({code,point},i)=><g ref={node=>{markers.current[i]=node;}} className="replay-airport" key={i} transform={`translate(${point[0]} ${point[1]}) scale(${box[2]/(mobile?650:900)})`}><circle r="4"/><circle className="replay-airport-ring" r="10"/><text x={i?12:-12} y="-12" textAnchor={i?'start':'end'}>{code}</text></g>)}
          <g ref={plane} className="replay-aircraft" transform={`translate(${pose.point[0]} ${pose.point[1]}) scale(${box[2]/(mobile?650:900)}) rotate(${pose.heading})`} aria-hidden="true"><path d="M0-16c2 0 3 4 3 7v4L18 5v3L3 3v9l5 4v2l-8-3-8 3v-2l5-4V3L-18 8V5L-3-5v-4c0-3 1-7 3-7Z"/></g>
        </svg>
        <div className="replay-map-caption"><span>{year==='all'?'ALL YEARS':year} / FLIGHTPATH</span><span>机场间示意路径</span></div>
      </div>
      <div className="replay-flight-card" aria-live="polite" aria-atomic="true"><div className="replay-flight-meta"><time>{flight.date.replaceAll('-','.')}</time><strong>{flight.flight}</strong><span>{flight.airline}</span></div><div className="replay-cities"><div><strong>{flight.origin}</strong><span>{from.city}</span></div><span className="replay-route-arrow"><Icon name="arrow" size={26}/></span><div><strong>{flight.destination}</strong><span>{to.city}</span></div><span className="replay-model">{flight.modelLabel}</span></div></div>
      <div className="replay-player"><input ref={scrubber} className="replay-scrubber" type="range" aria-label="旅程回放进度" aria-valuetext={`第 ${index+1} 段，共 ${legs.length} 段，${flight.flight}`} min="0" max={legs.length} step="0.001" value={frame.cursor} onChange={e=>seek(Number(e.target.value))}/><div className="replay-controls"><div className="replay-transport"><button className="replay-skip previous" disabled={index===0&&frame.cursor===0} aria-label="上一段旅程" onClick={()=>seek(Math.max(0,index-1))}><Icon name="arrow" size={18}/></button><button className="replay-play" disabled={reduced} onClick={toggle} aria-label={playing?'暂停回放':finished?'重新播放旅程':frame.cursor===0?'开始回放':'继续回放'}><Icon name={playing?'pause':'play'} size={17}/>{reduced?'静态浏览':playing?'暂停':finished?'重新播放':frame.cursor===0?'开始回放':'继续回放'}</button><button className="replay-skip" disabled={finished} aria-label="下一段旅程" onClick={()=>seek(Math.min(legs.length,index+1))}><Icon name="arrow" size={18}/></button></div><label className="replay-speed"><span>速度</span><select aria-label="回放速度" value={speed} disabled={reduced} onChange={e=>{setFrame(clock.current);setSpeed(Number(e.target.value));e.currentTarget.blur();}}>{[1,2,4].map(s=><option key={s} value={s}>{s}×</option>)}</select></label></div><p className="replay-note">{reduced?'已按系统设置减少动态效果，可用左右按钮逐段浏览。':'按乘机日期回放；同日保留记录顺序。航迹与播放时长均为示意。'}</p></div>
    </div>
  </dialog>;
}
