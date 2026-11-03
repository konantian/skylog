import {useMemo,useState} from 'react';
import airportData from '@/data/airports.json';
import land from '@/data/world-land.json';
import {collectRoutes,flightStats,projectAirport,routePath} from '@/lib/insights.mjs';
import type {Filters,Flight} from '@/lib/types';
import {Icon} from './icons';
import {JourneyReplay} from './journey-replay';

type Airport={name:string;city:string;latitude:number;longitude:number;country:string};
type Ranked={name:string;count:number};
type Route={key:string;airports:string[];count:number};
const airports:Record<string,Airport>=airportData;
const regions=[{id:'world',label:'全球',box:'0 0 900 400'},{id:'america',label:'北美',box:'400 40 400 230'},{id:'asia',label:'东亚',box:'200 80 190 150'}];
const showLabels=new Set(['YVR','YYZ','ICN','HKG','PEK','CTU','KEF','PDL','SFO']);

function Ranking({title,items}:{title:string;items:Ranked[]}) {
  return <div className="flight-ranking"><h4>{title}</h4>{items.slice(0,3).map((item,i)=><div className="ranking-row" key={item.name}><span>{String(i+1).padStart(2,'0')}</span><strong>{item.name}</strong><b>{item.count}<small> 段</small></b></div>)}</div>;
}

export function FlightOverview({allFlights,mapFlights,filters,onFilter}:{allFlights:Flight[];mapFlights:Flight[];filters:Filters;onFilter:(key:keyof Filters,value:string)=>void}) {
  const stats=useMemo(()=>flightStats(allFlights),[allFlights]);
  const routes=useMemo(()=>collectRoutes(mapFlights) as Route[],[mapFlights]);
  const visited=[...new Set(mapFlights.flatMap(f=>[f.origin,f.destination]))];
  const [region,setRegion]=useState('world');
  const [replayOpen,setReplayOpen]=useState(false);
  const [rankType,setRankType]=useState('airlines');
  const [focused,setFocused]=useState<string|null>(null);
  const view=regions.find(r=>r.id===region)!;
  const selectedName=filters.flightAirport!=='all'?`${filters.flightAirport} · ${airports[filters.flightAirport]?.city||''}`:filters.route!=='all'?filters.route.replace('~',' ↔ '):'全部航线';
  const years:Ranked[]=stats.years;
  const maxYear=Math.max(...years.map(y=>y.count),1);
  const startYear=Number(years[0]?.name||new Date().getFullYear());
  const endYear=Number(years.at(-1)?.name||startYear);
  const rankItems:Ranked[]=rankType==='routes'?stats.routes.map((r:Route)=>({name:r.airports.join(' ↔ '),count:r.count})):stats[rankType as 'airlines'|'models'];

  return <details className="flight-overview" open>
    <summary><span><Icon name="globe" size={17}/>航线地图与飞行统计</span><span>MY FLIGHTPATH <Icon name="chevron" size={13}/></span></summary>
    <div className="flight-metrics" aria-label="全部乘机记录统计">
      {[[stats.total,'乘坐航段'],[stats.airlines.length,'坐过航司'],[stats.models.length,'明确机型'],[stats.airports,'到访机场']].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}
    </div>
    <div className="flight-overview-grid">
      <section className="route-map" aria-labelledby="route-map-title">
        <div className="map-heading"><div><span className="eyebrow">ACROSS THE PACIFIC & BEYOND</span><h4 id="route-map-title">把旅途连成一张地图</h4></div><div className="map-regions" aria-label="地图区域">{regions.map(r=><button key={r.id} aria-pressed={region===r.id} onClick={()=>setRegion(r.id)}>{r.label}</button>)}</div></div>
        <div className="replay-entry"><span>把坐过的航班，重新飞一遍。</span><button onClick={()=>setReplayOpen(true)}><Icon name="play" size={15}/>回放我的旅程</button></div>
        {replayOpen&&<JourneyReplay flights={allFlights} initialYear={filters.flightYear} onClose={()=>setReplayOpen(false)}/>}
        <svg className="flight-map-svg" viewBox={view.box} aria-labelledby="map-title map-description">
          <title id="map-title">已乘坐航线地图</title><desc id="map-description">{visited.length} 个机场，{routes.length} 条往返合并航线。航线与机场均可点击或用键盘选择，也可使用下方下拉菜单。</desc>
          <defs><clipPath id="world-clip"><rect width="900" height="400"/></clipPath></defs>
          <g clipPath="url(#world-clip)">
            <g className="map-grid" aria-hidden="true">{[75,150,225,300,375].map(y=><path key={`y${y}`} d={`M0 ${y}H900`}/>)}{[150,300,450,600,750].map(x=><path key={`x${x}`} d={`M${x} 0V400`}/>)}</g>
            <g className="map-land" aria-hidden="true"><path d={land.path} transform="translate(-450 0)"/><path d={land.path} transform="translate(450 0)"/></g>
            {routes.map(route=>{
              const [a,b]=route.airports;const active=filters.route===route.key||route.airports.includes(filters.flightAirport);
              if(!airports[a]||!airports[b])return null;
              const choose=()=>onFilter('route',filters.route===route.key?'all':route.key);
              return <g className={`map-route ${active?'selected':''}`} key={route.key} role="button" tabIndex={0} aria-label={`${a} 与 ${b}，含往返 ${route.count} 段乘机记录`} aria-pressed={filters.route===route.key} onClick={choose} onFocus={()=>setFocused(`${a} ↔ ${b} · ${route.count} 段`)} onBlur={()=>setFocused(null)} onMouseEnter={()=>setFocused(`${a} ↔ ${b} · ${route.count} 段`)} onMouseLeave={()=>setFocused(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}}}>
                <path className="route-hit" d={routePath(airports[a],airports[b])}/><path className="route-line-visible" pathLength={1} d={routePath(airports[a],airports[b])}/>
              </g>;
            })}
            {visited.map(code=>{
              const airport=airports[code];if(!airport)return null;const [x,y]=projectAirport(airport);const active=filters.flightAirport===code;
              const choose=()=>onFilter('flightAirport',active?'all':code);
              return <g className={`map-airport ${active?'selected':''}`} key={code} role="button" tabIndex={0} aria-label={`${code} ${airport.city}，查看相关航班`} aria-pressed={active} onClick={choose} onFocus={()=>setFocused(`${code} · ${airport.city}`)} onBlur={()=>setFocused(null)} onMouseEnter={()=>setFocused(`${code} · ${airport.city}`)} onMouseLeave={()=>setFocused(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}}}>
                <circle className="airport-hit" cx={x} cy={y} r={10}/><circle className="airport-dot" cx={x} cy={y} r={active?4:2.8}/>{(region!=='world'||showLabels.has(code)||active)&&<text x={x+6} y={y-7}>{code}</text>}
              </g>;
            })}
          </g>
        </svg>
        <div className="map-status"><span><i/> {focused||selectedName}</span><span>{routes.length} 条航线 · {visited.length} 个机场</span></div>
        <div className="map-selectors">
          <label className="select-field"><span>按到访机场查看</span><select aria-label="到访机场" value={filters.flightAirport} onChange={e=>{onFilter('flightAirport',e.target.value);e.currentTarget.blur();}}><option value="all">全部机场</option>{Object.entries(airports).map(([code,a])=><option key={code} value={code}>{code} · {a.city}</option>)}</select></label>
          <label className="select-field"><span>按航线查看（含往返）</span><select aria-label="乘坐航线" value={filters.route} onChange={e=>{onFilter('route',e.target.value);e.currentTarget.blur();}}><option value="all">全部航线</option>{stats.routes.map((r:Route)=><option key={r.key} value={r.key}>{r.airports.join(' ↔ ')} · {r.count} 段</option>)}</select></label>
        </div>
        <p className="map-credit">连线为机场间的大圆弧示意。地图随航司、机型和年份筛选。 <a href="https://ourairports.com/data/" target="_blank" rel="noreferrer">OurAirports</a> / <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth</a></p>
      </section>
      <aside className="flight-statistics" aria-label="个人飞行统计">
        <div className="eyebrow">MY MOST FLOWN</div><h4>旅途里的常客</h4><div className="ranking-tabs" aria-label="飞行排行分类">{[['airlines','航司'],['models','机型'],['routes','航线']].map(([id,label])=><button key={id} aria-pressed={rankType===id} onClick={()=>setRankType(id)}>{label}</button>)}</div>
        <Ranking title={rankType==='models'?'最常坐的明确机型':rankType==='routes'?'最常飞的航线（含往返）':'最常坐的航司'} items={rankItems}/>
        <div className="annual-heading"><span>每年的飞行</span><span>{startYear}—{endYear}</span></div><div className="annual-chart" aria-label="每年乘机次数">
          {Array.from({length:endYear-startYear+1},(_,i)=>String(startYear+i)).map(year=>{const count=years.find(y=>y.name===year)?.count||0;return <button key={year} disabled={!count} aria-label={`${year} 年 ${count} 段，筛选该年份`} aria-pressed={filters.flightYear===year} onClick={()=>onFilter('flightYear',filters.flightYear===year?'all':year)}><span className="annual-value">{count||''}</span><span className="annual-track"><i style={{height:`${count/maxYear*100}%`}}/></span><span>{year.slice(2)}</span></button>;})}
        </div><p className="stats-note">统计覆盖全部 {stats.total} 段记录；{stats.unspecifiedModels} 段未明确子型号，不计入机型数量。点击年份可筛选航班。</p>
      </aside>
    </div>
  </details>;
}
