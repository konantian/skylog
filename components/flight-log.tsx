import {useState,useEffect,useRef} from 'react';
import {useMobileLayer} from './use-mobile-layer';
import { FlightAirlineMark } from "./flight-airline-mark";
import {useLocale} from './locale-provider';
import {FlightOverview} from './flight-overview';
import airportData from '@/data/airports.json';
import type { Filters, Flight, Photo } from '@/lib/types';
import { Icon } from './icons';
const airportCities:Record<string,{city:string}>=airportData;

function FlightDetails({flight:f,onClose}:{flight:Flight;onClose:()=>void}) {
  const {t}=useLocale();
  const dialog=useRef<HTMLDialogElement>(null);
  useMobileLayer(true,onClose);
  useEffect(()=>{
    const trigger=document.activeElement as HTMLElement|null;
    const node=dialog.current!;
    node.showModal();
    return ()=>{node.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className="travel-detail" aria-labelledby="travel-detail-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="dialog-heading"><div><span className="flight-carrier"><FlightAirlineMark airline={f.airline}/>{t(f.airline)} · {f.flight}</span><h2 id="travel-detail-title">{f.origin} → {f.destination}</h2><time dateTime={f.date}>{f.date}</time></div><button autoFocus className="icon-button" onClick={onClose} aria-label={t("关闭航班详情")}><Icon name="close" size={22}/></button></div>
    <dl className="travel-detail-facts"><div><dt>{t("机型")}</dt><dd>{t(f.modelLabel)}{!f.model&&f.modelLabel!=='机型待确认'?t(" · 子型号未记录"):''}</dd></div><div><dt>{t("注册号")}</dt><dd>{f.registration || '—'}</dd></div></dl>
  </dialog>;
}

export function FlightLog({flights,mapFlights,allFlights,filters,onFilter,limit,photos,total,onPhoto,onShare}:{flights:Flight[];mapFlights:Flight[];allFlights:Flight[];filters:Filters;onFilter:(key:keyof Filters,value:string)=>void;limit:number;photos:Photo[];total:number;onPhoto:(photo:Photo)=>void;onShare:(flight:Flight)=>void}) {
  const {t}=useLocale();
  const [detail,setDetail]=useState<Flight|null>(null);
  return <div className="flight-log">
    <div className="flight-log-intro"><div className="eyebrow">MY BOARDING HISTORY</div><h3>{t("从地面仰望，也从云端经过。")}</h3><p>{t("Flighty 记录 · 共")}{total} {t("段旅程。具体机型按原记录保留，未细分的家族名称不计入子型号解锁。")}</p></div>
    <FlightOverview filteredFlights={flights} allFlights={allFlights} mapFlights={mapFlights} filters={filters} onFilter={onFilter}/>
    <div className="flight-list-title"><h3>{t("航班记录")}</h3><span>{flights.length} {t("段符合当前筛选")}</span></div>
    <div className="flight-list">{flights.slice(0,limit).map(f=>{
      const photo = f.registration ? photos.find(p=>p.registration?.status==='confirmed'&&p.registration.value===f.registration) : undefined;
      return <article className="flight-row" key={f.id}>
        <header className="flight-carrier"><FlightAirlineMark airline={f.airline}/><span className="flight-carrier-name">{t(f.airline)}</span><b>{f.flight}</b><time dateTime={f.date}>{f.date}</time></header>
        <div className="flight-route"><div><span className="flight-endpoint"><strong>{f.origin}</strong><small>{t(airportCities[f.origin]?.city)}</small></span><span className="route-line"><Icon name="plane" size={17}/></span><span className="flight-endpoint"><strong>{f.destination}</strong><small>{t(airportCities[f.destination]?.city)}</small></span></div></div>
        <div className="flight-photo-link"><button onClick={()=>setDetail(f)} aria-label={t("查看 {0} 的航班详情",[f.flight])}>{t("航班详情")}<Icon name="arrow" size={15}/></button>{photo&&<button onClick={()=>onPhoto(photo)}><Icon name="camera" size={15}/><span>{t("也拍过这架")}</span><Icon name="diagonal" size={13}/></button>}<button onClick={()=>onShare(f)} aria-label={t("为 {0} {1} 生成登机牌",[f.date,f.flight])}><Icon name="ticket" size={15}/>{t("生成登机牌")}</button></div>
      </article>;
    })}</div>
    {detail&&<FlightDetails flight={detail} onClose={()=>setDetail(null)}/>}
  </div>;
}
