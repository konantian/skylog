import type { Flight, Photo } from '@/lib/types';
import { Icon } from './icons';

export function FlightLog({flights,photos,total,onPhoto}:{flights:Flight[];photos:Photo[];total:number;onPhoto:(photo:Photo)=>void}) {
  return <div className="flight-log">
    <div className="flight-log-intro"><div className="eyebrow">MY BOARDING HISTORY</div><h3>从地面仰望，也从云端经过。</h3><p>Flighty 记录 · 共 {total} 段旅程。具体机型按原记录保留，未细分的家族名称不计入子型号解锁。</p></div>
    <div className="flight-list">{flights.map(f=>{
      const photo = f.registration ? photos.find(p=>p.registration?.status==='confirmed'&&p.registration.value===f.registration) : undefined;
      return <article className="flight-row" key={f.id}>
        <div className="flight-date"><time dateTime={f.date}>{f.date.slice(0,4)}<strong>{f.date.slice(5).replace('-',' / ')}</strong></time><span>{f.flight}</span></div>
        <div className="flight-route"><div><strong>{f.origin}</strong><span className="route-line"><Icon name="plane" size={17}/></span><strong>{f.destination}</strong></div><span>{f.airline}</span></div>
        <div className="flight-aircraft"><strong>{f.modelLabel}</strong><span>{f.registration || '注册号待确认'}{!f.model&&f.modelLabel!=='机型待确认'?' · 子型号未记录':''}</span></div>
        <div className="flight-photo-link">{photo?<button onClick={()=>onPhoto(photo)}><Icon name="camera" size={15}/><span>也拍过这架</span><Icon name="diagonal" size={13}/></button>:<span>FLIGHT LOG</span>}</div>
      </article>;
    })}</div>
  </div>;
}
