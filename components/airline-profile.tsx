import {useMemo} from 'react';
import profiles from '@/data/airline-profiles.json';
import selections from '@/data/cover-selections.json';
import {airlineCollection} from '@/lib/airline-collection.mjs';
import {photoImageSources} from '@/lib/photo-images.mjs';
import type {Entry, Flight, Photo} from '@/lib/types';
import {useLocale} from './locale-provider';
import {Icon} from './icons';
import {CountryFlags} from './country-flags';

export type AirlineGallery = {model?:string;livery?:string;photoId?:string};
type AirlineFacts = {designators:{icao:string;callsign:string;operator:string}[];alliance:string;note?:string};

export function AirlineProfile({entry,photos,flights,onGallery,onFlights}:{entry:Entry;photos:Photo[];flights:Flight[];onGallery:(selection:AirlineGallery)=>void;onFlights:()=>void}) {
  const {t,locale}=useLocale();
  const collection=useMemo(()=>airlineCollection(entry,photos,flights,selections.preferredPhotos),[entry,photos,flights]);
  const facts=(profiles.airlines as Record<string,AirlineFacts>)[entry.name];
  const cover=collection.cover as Photo|null;
  const missing='—';
  return <div className="airline-profile">
    {cover?<button className="airline-cover" onClick={()=>onGallery({photoId:cover.id})} aria-label={t('浏览 {0} 的全部照片',[entry.name])}>
      <img {...photoImageSources(cover,process.env.NEXT_PUBLIC_BASE_PATH)} sizes="(max-width:760px) 100vw, 1068px" alt={`${t(entry.name)} · ${cover.models.map(name=>t(name)).join(' / ')}`}/>
      <span className="airline-cover-caption"><span><strong>{t('从我的取景器里认识它')}</strong><span>{cover.airport} · {cover.date} · {t('摄影 © Yuan Wang')}</span></span><span>{t('浏览照片')}<Icon name="arrow" size={17}/></span></span>
    </button>:<div className="airline-wishlist"><div className="locked-airline-mark"><CountryFlags country={entry.country} size={56}/><span className="airline-code" aria-hidden="true">{entry.code||'—'}</span></div><div><span className="eyebrow">NEXT ON THE RADAR</span><h3>{t('下一次相遇，留给这家航司。')}</h3><p>{t('还没有拍摄记录，航司档案和乘机经历可以先收藏。')}</p></div></div>}

    <dl className="airline-stats">
      {[['拍摄照片',collection.photoCount],['拍过机型',collection.modelCount],['飞机注册号',collection.registrationCount],['乘坐航段',collection.flights.length]].map(([label,value])=><div key={label}><dt>{t(String(label))}</dt><dd>{value}</dd></div>)}
    </dl>

    <section className="airline-section" aria-labelledby="airline-facts-title">
      <div className="airline-section-heading"><h3 id="airline-facts-title"><Icon name="globe" size={18}/>{t('航司小档案')}</h3><span className="airline-alliance">{t(facts?.alliance||'—')}</span></div>
      <p className="airline-full-name">{t(entry.name)}{locale==='zh'&&entry.chineseName&&<span> · {entry.name}</span>}</p>
      <dl className="airline-facts">
        <div><dt>{t('国家／地区')}</dt><dd className="airline-country"><CountryFlags country={entry.country}/><span>{t(entry.country)}</span></dd></div>
        <div><dt>{t('IATA 代码')}</dt><dd>{entry.code||missing}</dd></div>
        <div><dt>{t('ICAO 代码')}</dt><dd>{facts?.designators.map(d=>d.icao).join(' / ')||missing}</dd></div>
        <div><dt>{t('无线电呼号')}</dt><dd>{facts?.designators.map(d=>d.callsign).join(' / ')||missing}</dd></div>
      </dl>
      <p className="airline-note">{t('代码与呼号对应航司运营实体，区域合作航班的实际承运人可能不同。')}</p>
      {facts?.note&&<p className="airline-note">{t(facts.note)}</p>}
    </section>

    {collection.firstSeen&&<section className="airline-encounters" aria-label={t('相遇记录')}>
      <div><Icon name="calendar" size={18}/><span><small>{t('第一次拍到')}</small><strong>{collection.firstSeen}</strong><span>{collection.firstAirports.join(' · ')}</span></span></div>
      <div><Icon name="pin" size={18}/><span><small>{t('最近一次拍到')}</small><strong>{collection.lastSeen}</strong><span>{t('拍摄足迹')} · {collection.airports.join(' · ')}</span></span></div>
    </section>}

    <section className="airline-section airline-journeys" aria-labelledby="airline-flights-title">
      <div className="airline-section-heading"><h3 id="airline-flights-title"><Icon name="ticket" size={18}/>{t('我的乘机记录')}</h3>{collection.flights.length>0&&<button onClick={onFlights}>{t('查看全部 {0} 段旅程',[collection.flights.length])}<Icon name="arrow" size={16}/></button>}</div>
      {collection.flights.length>0?<>
        <div className="airline-model-chips" aria-label={t('坐过的机型')}>{collection.flownModels.map(model=><span key={model}>{t(model)}</span>)}{collection.unknownFlightModels>0&&<span>{t('{0} 段机型待确认',[collection.unknownFlightModels])}</span>}</div>
        <div className="airline-journey-list">{collection.flights.slice(0,3).map((f:Flight)=><div key={f.id}><time>{f.date}</time><strong>{f.origin}<Icon name="arrow" size={14}/>{f.destination}</strong><span>{f.flight}</span></div>)}</div>
        {collection.both.length>0&&<div className="airline-reencounters"><p><Icon name="check" size={16}/>{t('{0} 架飞机，坐过也拍过',[collection.both.length])}</p>{collection.both.map(match=><button key={match.registration} aria-label={t('查看 {0} 的照片',[match.registration])} onClick={()=>onGallery({photoId:match.photoIds[0]})}>{match.registration}<Icon name="camera" size={14}/></button>)}</div>}
      </>:<p className="airline-note">{t('还没有这家航司的乘机记录。')}</p>}
    </section>

    <section className="airline-section" aria-labelledby="airline-collection-title">
      <div className="airline-section-heading"><h3 id="airline-collection-title"><Icon name="camera" size={18}/>{t('我的机型与涂装收藏')}</h3><span>{t('{0} 个组合',[collection.groups.length])}</span></div>
      <p className="airline-note">{t('按已拍照片整理，每种机型与涂装各选一张代表作。')}</p>
      {collection.groups.length?<div className="airline-collection-grid">{collection.groups.map(group=><button className="airline-collection-card" key={`${t(group.model)}:${group.livery}`} onClick={()=>onGallery({model:group.model,livery:group.livery,photoId:group.cover.id})} aria-label={t('查看 {0} · {1}，{2} 张照片',[group.model,t(group.livery),group.photoIds.length])}>
        <div className="airline-card-image"><img {...photoImageSources(group.cover,process.env.NEXT_PUBLIC_BASE_PATH)} sizes="(max-width:560px) 100vw, (max-width:900px) 50vw, 350px" alt={`${t(entry.name)} ${t(group.model)} · ${t(group.livery)}`} loading="lazy"/></div>
        <div className="airline-card-copy"><strong>{t(group.model)}</strong><span>{t(group.livery)}</span><small>{t('{0} 张照片',[group.photoIds.length])}<Icon name="arrow" size={15}/></small></div>
      </button>)}</div>:<p className="airline-empty">{t('等拍到第一架，就从这里开始。')}</p>}
    </section>
  </div>;
}
