import {FlightOverview} from './flight-overview';
import airportData from '@/data/airports.json';
import type { Filters, Flight, Photo } from '@/lib/types';
import { Icon } from './icons';
const airportCities:Record<string,{city:string}>=airportData;

export function FlightLog({flights,mapFlights,allFlights,filters,onFilter,limit,photos,total,onPhoto,onShare}:{flights:Flight[];mapFlights:Flight[];allFlights:Flight[];filters:Filters;onFilter:(key:keyof Filters,value:string)=>void;limit:number;photos:Photo[];total:number;onPhoto:(photo:Photo)=>void;onShare:(flight:Flight)=>void}) {
  return <div className="flight-log">
    <div className="flight-log-intro"><div className="eyebrow">MY BOARDING HISTORY</div><h3>从地面仰望，也从云端经过。</h3><p>Flighty 记录 · 共 {total} 段旅程。具体机型按原记录保留，未细分的家族名称不计入子型号解锁。</p></div>
    <FlightOverview allFlights={allFlights} mapFlights={mapFlights} filters={filters} onFilter={onFilter}/>
    <div className="flight-list-title"><h3>航班记录</h3><span>{flights.length} 段符合当前筛选</span></div>
    <div className="flight-list">{flights.slice(0,limit).map(f=>{
      const photo = f.registration ? photos.find(p=>p.registration?.status==='confirmed'&&p.registration.value===f.registration) : undefined;
      return <article className="flight-row" key={f.id}>
        <div className="flight-date"><time dateTime={f.date}>{f.date.slice(0,4)}<strong>{f.date.slice(5).replace('-',' / ')}</strong></time><span>{f.flight}</span></div>
        <div className="flight-route"><div><span className="flight-endpoint"><strong>{f.origin}</strong><small>{airportCities[f.origin]?.city}</small></span><span className="route-line"><Icon name="plane" size={17}/></span><span className="flight-endpoint"><strong>{f.destination}</strong><small>{airportCities[f.destination]?.city}</small></span></div><span>{f.airline}</span></div>
        <div className="flight-aircraft"><strong>{f.modelLabel}</strong><span>{f.registration || '注册号待确认'}{!f.model&&f.modelLabel!=='机型待确认'?' · 子型号未记录':''}</span></div>
        <div className="flight-photo-link">{photo&&<button onClick={()=>onPhoto(photo)}><Icon name="camera" size={15}/><span>也拍过这架</span><Icon name="diagonal" size={13}/></button>}<button onClick={()=>onShare(f)} aria-label={`为 ${f.date} ${f.flight} 生成登机牌`}><Icon name="ticket" size={15}/>生成登机牌</button></div>
      </article>;
    })}</div>
  </div>;
}
