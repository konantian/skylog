'use client';
import {LanguageSwitch,useLocale} from './locale-provider';
import {useMobileLayer} from './use-mobile-layer';
import {coverByAlternate, photoBrowseMode, photoGalleryIds, photoGridCards} from '@/lib/photo-highlights.mjs';
import {usePhotoSwipe} from './use-photo-swipe';


import { useEffect, useMemo, useRef, useState } from 'react';
import data from '@/data/catalog.json';
import flightData from '@/data/flights.json';
import heroIds from '@/data/hero-selections.json';
import { HeroGallery } from './hero-gallery';
import { VisitCounter } from './visit-counter';
import { AircraftProfile, PhotoIdentity, FlownDetails } from './collection-details';
import {AirlineProfile,type AirlineGallery} from './airline-profile';
import { FlightLog } from './flight-log';
import { CollectionTimeline } from './collection-timeline';
import { PhotoSettings } from './photo-settings';
import {PhotoFullscreen} from './photo-fullscreen';
import { ScrollExperience } from './scroll-experience';
import { AircraftFamilies } from './aircraft-families';
import {AircraftComparison,CompareButton,ComparisonTray} from './aircraft-comparison';
import {updateComparison} from '@/lib/aircraft-comparison.mjs';
import { AviationPlayground } from './aviation-playground';
import { ShareCard,type ShareCardSource } from './share-card';
import { filterCatalog, filterPhotos, initialFilters, photoMatches, groupModelVariants, airlinesForModel, modelsForAirline, filterFlights, flightsForEntry, flightsForPhoto } from '@/lib/filter.mjs';
import type { Entry, Filters, Flight, Mode, Photo } from '@/lib/types';
import { Icon, PlaneSilhouette } from './icons';
import { CountryFlags } from './country-flags';
import {photoImageSources,originalPhoto} from '@/lib/photo-images.mjs';

const aircraft: Entry[] = data.aircraft;
const airlines: Entry[] = data.airlines;
const photos: Photo[] = data.photos;
const flights: Flight[] = flightData.flights;
const byId = new Map(photos.map(p => [p.id,p]));
const phoneQuery='(max-width: 760px), (max-height: 500px) and (pointer: coarse)';
const photoSizes='(max-width: 760px) 100vw, (max-width: 1190px) calc(100vw - 72px), 1118px';
const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
const modes: {id: Mode; name: string; english: string; icon: string}[] = [
  {id:'aircraft',name:'机型图鉴',english:'AIRCRAFT',icon:'plane'},
  {id:'airlines',name:'航司图鉴',english:'AIRLINES',icon:'globe'},
  {id:'photos',name:'摄影集',english:'PHOTO LOG',icon:'camera'},
  {id:'flights',name:'乘机记录',english:'FLIGHT LOG',icon:'plane'},
];
const featured = [...photos].sort((a,b) => {
  const rank = (id: string) => { const i = data.featuredPhotos.indexOf(id); return i < 0 ? 1000 : i; };
  return rank(a.id)-rank(b.id);
});
const unique = (values: (string|undefined)[]) => [...new Set(values.filter((v):v is string => !!v))].sort();
const manufacturers = unique(aircraft.map(a => a.manufacturer));

function FlyPlane() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 2c2 0 3 4 3 7v10l17 12v4L27 28v11l6 5v2l-9-3-9 3v-2l6-5V28L4 35v-4l17-12V9c0-3 1-7 3-7Z"/></svg>;
}

export default function Atlas() {
  const {t,locale}=useLocale();
  const [mode,setMode] = useState<Mode>('aircraft');
  const [filters,setFilters] = useState<Filters>(initialFilters);
  const [ready,setReady] = useState(false);
  const [historyRevision,setHistoryRevision]=useState(0);
  useEffect(()=>{const sync=()=>setHistoryRevision(n=>n+1);window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  const [photoGrid,setPhotoGrid]=useState<'grid'|'representatives'>('grid');
  const [timeline,setTimeline]=useState(false);
  const photoLayout=timeline?'timeline':photoGrid;
  const [expanded,setExpanded] = useState(false);
  const [mobileHome,setMobileHome]=useState(true);
  const [filterSheet,setFilterSheet]=useState(false);
  const [draft,setDraft]=useState<Filters>(initialFilters);
  const sheet=useRef<HTMLDialogElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const sheetDrag=useRef<{y:number;distance:number}|null>(null);
  const tabMemory=useRef(new Map<string,{filters:Filters;limit:number;y:number}>());
  const tabRestore=useRef<number|null>(null);
  useMobileLayer(filterSheet,()=>setFilterSheet(false));
  const [limit,setLimit] = useState(24);
  const [flight,setFlight] = useState(0);
  const [theme,setTheme] = useState('dark');
  const [variant,setVariant] = useState({airline:'all',model:'all',livery:'all'});
  const [detail,setDetail] = useState<{entry?:Entry; ids:string[]; index:number; onNavigate?:()=>void}|null>(null);
  const [airlineGallery,setAirlineGallery]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const airlineReturn=useRef({scroll:0,label:''});
  const [shareCard,setShareCard] = useState<ShareCardSource|null>(null);
  const [compared,setCompared]=useState<string[]>([]);
  const [comparing,setComparing]=useState(false);
  const toggleCompare=(model:string)=>setCompared(current=>{const index=current.indexOf(model);return updateComparison(current,index<0?model:'',index<0?current.length:index);});
  useMobileLayer(!!detail,()=>setDetail(null));
  useMobileLayer(!!detail&&airlineGallery,()=>setAirlineGallery(false));
  const dialog = useRef<HTMLDialogElement>(null);
  const collection = useRef<HTMLElement>(null);
  const heroPhotos = heroIds.map(id=>byId.get(id)!);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('skylog-theme');
      if(saved==='light') {setTheme('light');document.documentElement.dataset.theme='light';}
    } catch { /* Private browsing may disable storage; the toggle still works. */ }
    history.replaceState({...history.state,skylogLayers:[]},'');
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    setMobileHome(!view&&!Object.keys(initialFilters).some(key=>params.has(key))&&window.location.hash!=='#collection');
    const layout = params.get('layout');
    if(layout==='timeline') setTimeline(true);
    if(layout==='representatives') setPhotoGrid(layout);
    if (modes.some(m => m.id === view)) setMode(view as Mode);
    const next = {...initialFilters};
    for (const key of Object.keys(next) as (keyof Filters)[]) {
      const value = params.get(key);
      if (value) next[key] = value;
    }
    setFilters(next); setReady(true);
  },[]);
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    for(const key of ['view','layout',...Object.keys(initialFilters)])params.delete(key);
    const onPhone=window.matchMedia(phoneQuery).matches;
    if(onPhone&&!mobileHome||!onPhone&&mode!=='aircraft') params.set('view',mode);
    if(mode==='photos'&&photoLayout!=='grid'&&!(onPhone&&mobileHome))params.set('layout',photoLayout);
    for (const key of Object.keys(filters) as (keyof Filters)[]) if (!(onPhone&&mobileHome)&&filters[key] !== initialFilters[key]) params.set(key,filters[key]);
    window.history.replaceState(history.state,'',`${window.location.pathname}${params.size ? `?${params}` : ''}${onPhone?mobileHome?'':'#collection':window.location.hash}`);
  },[filters,mode,ready,photoLayout,mobileHome,historyRevision]);
  useEffect(() => {
    if (!detail) return;
    const el = dialog.current!;
    const previousFocus = document.activeElement as HTMLElement|null;
    el.showModal();
    return () => { el.close(); if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true}); };
  },[!!detail]);

  useEffect(()=>{
    if(detail?.entry?.kind!=='airline')return;
    const frame=requestAnimationFrame(()=>{
      const el=dialog.current;if(!el)return;
      el.scrollTop=airlineGallery?0:airlineReturn.current.scroll;
      const target=airlineGallery?el.querySelector<HTMLButtonElement>('.airline-gallery-back'):[...el.querySelectorAll<HTMLButtonElement>('button[aria-label]')].find(button=>button.getAttribute('aria-label')===airlineReturn.current.label);
      target?.focus({preventScroll:true});
    });
    return()=>cancelAnimationFrame(frame);
  },[airlineGallery,detail?.entry?.id]);

  useEffect(()=>{
    if(!filterSheet)return;
    const el=sheet.current!;el.showModal();
    return()=>el.close();
  },[filterSheet]);
  useEffect(()=>{
    if(tabRestore.current===null)return;
    const y=tabRestore.current;tabRestore.current=null;
    const frame=requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}));
    return()=>cancelAnimationFrame(frame);
  },[mode,mobileHome,limit]);
  const mobileTab=(next:Mode|'home')=>{
    const current=mobileHome?'home':mode;
    if(next===current){window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
    tabMemory.current.set(current,{filters:{...filters},limit,y:window.scrollY});
    const saved=tabMemory.current.get(next);
    tabRestore.current=saved?.y??0;
    setMobileHome(next==='home');
    if(next!=='home')setMode(next);
    setFilters(saved?.filters??{...initialFilters,...(next==='flights'?{sort:'latest'}:{})});
    setLimit(saved?.limit??24);
    setExpanded(false);
  };
  const openFilters=()=>{
    if(window.matchMedia(phoneQuery).matches){setDraft({...filters});setFilterSheet(true);}
    else setExpanded(!expanded);
  };

  const matchedPhotos = useMemo(() => filterPhotos(featured,filters,aircraft,airlines) as Photo[],[filters]);
  const browseMode = photoBrowseMode(filters, photoGrid==='representatives' ? 'representatives' : 'portfolio');
  const searchingPhotos = browseMode==='lookup' || browseMode==='filtered';
  const displayPhotos = useMemo(() => mode==='photos' && photoLayout!=='timeline'
    ? photoGridCards(matchedPhotos,browseMode,filters.sort) as Photo[] : matchedPhotos,[mode,photoLayout,browseMode,filters.sort,matchedPhotos]);
  const openGridPhoto = (photo:Photo) => {
    const ids = photoGalleryIds(displayPhotos,matchedPhotos) as string[];
    openDetail({ids,index:ids.indexOf(photo.id)});
  };
  const entries = useMemo(() => {
    if (mode === 'photos' || mode === 'flights') return [];
    const base = filterCatalog(mode === 'aircraft' ? aircraft : airlines,photos,filters,mode,aircraft,airlines) as Entry[];
    if(mode === 'aircraft' && filters.model !== 'all' && base[0]?.unlocked) {
      const groups = (groupModelVariants(base[0],matchedPhotos,airlines) as Entry[]).filter(g=>(filters.airline==='all'||g.name===filters.airline)&&(filters.country==='all'||g.country===filters.country));
      if(filters.sort==='name') groups.sort((a,b)=>a.name.localeCompare(b.name));
      if(filters.sort==='count') groups.sort((a,b)=>b.photoIds.length-a.photoIds.length);
      if(filters.sort==='latest') groups.sort((a,b)=>(b.lastSeen??'').localeCompare(a.lastSeen??''));
      return groups;
    }
    return base;
  },[mode,filters,matchedPhotos]);
  const matchedFlights = useMemo(()=>filterFlights(flights,filters,aircraft,airlines) as Flight[],[filters]);
  const mapFlights = useMemo(()=>filterFlights(flights,{...filters,route:'all',flightAirport:'all'},aircraft,airlines) as Flight[],[filters]);
  const count = mode === 'flights' ? matchedFlights.length : mode === 'photos' ? displayPhotos.length : entries.length;
  const activeCount = Object.entries(filters).filter(([k,v]) => k !== 'sort' && v !== initialFilters[k as keyof Filters]).length;
  const detailFilters = {...initialFilters,...variant,...(detail?.entry?.kind==='aircraft'?{model:detail.entry.name}:detail?.entry?.kind==='airline'?{airline:detail.entry.name}:detail?.entry?.kind==='variant'?{model:detail.entry.displayModel,airline:detail.entry.name}:{})};
  const galleryIds = detail?.ids.filter(id => {
    const p = byId.get(id)!;
    return photoMatches(p,detailFilters,aircraft,airlines);
  }) ?? [];
  const activePhoto = detail ? byId.get(galleryIds[detail.index]) : undefined;
  useEffect(()=>{
    if(!activePhoto||galleryIds.length<2||detail?.entry?.kind==='airline'&&!airlineGallery)return;
    for(const step of [-1,1]){
      const next=byId.get(galleryIds[(detail!.index+step+galleryIds.length)%galleryIds.length])!;
      const image=new Image();const sources=photoImageSources(next,process.env.NEXT_PUBLIC_BASE_PATH);
      image.sizes=photoSizes;image.srcset=sources.srcSet;image.src=sources.src;
    }
  },[activePhoto?.id,airlineGallery]);
  const original = activePhoto ? originalPhoto(activePhoto.id) : undefined;
  const profileEntries = detail?.entry?.kind==='aircraft'||detail?.entry?.kind==='variant' ? [detail.entry] : aircraft.filter(a=>activePhoto?.models.includes(a.name));
  const exactFlights: Flight[] = activePhoto ? flightsForPhoto(activePhoto,flights) : [];
  const entryFlights: Flight[] = detail?.entry ? flightsForEntry(detail.entry,flights) : [];
  const openDetail = (value:NonNullable<typeof detail>) => {airlineReturn.current={scroll:0,label:''};setAirlineGallery(false);setFullscreen(false);setVariant({airline:'all',model:'all',livery:'all'});setDetail(value);};
  const airlineOverview=detail?.entry?.kind==='airline'&&!airlineGallery;
  const openAirlineGallery=({model='all',livery='all',photoId}:AirlineGallery)=>{
    airlineReturn.current={scroll:dialog.current?.scrollTop??0,label:document.activeElement?.getAttribute('aria-label')||''};
    const next={airline:'all',model,livery};setVariant(next);
    setDetail(current=>{
      if(!current)return current;
      const ids=current.ids.filter(id=>photoMatches(byId.get(id)!,{...initialFilters,...next,airline:current.entry!.name},aircraft,airlines));
      return {...current,index:Math.max(0,photoId?ids.indexOf(photoId):0)};
    });
    setAirlineGallery(true);
  };
  const variantPhotos = (detail?.ids??[]).map(id=>byId.get(id)!);
  const variantLiveries = unique(variantPhotos.filter(p=>photoMatches(p,{...detailFilters,livery:'all'},aircraft,airlines)).map(p=>p.livery));
  const setVariantFilter = (key:keyof typeof variant,value:string) => {setVariant(v=>({...v,[key]:value,...(key!=='livery'?{livery:'all'}:{})}));setDetail(d=>d&&({...d,index:0}));};
  const switchMode = (next:Mode,scroll=false) => {
    setMobileHome(false);setMode(next);setLimit(24);setFilters(f => ({...f,status:'all',...(next==='flights'?{airport:'all',livery:'all',category:'all',sort:'latest'}:{flightYear:'all',flightAirport:'all',route:'all'})}));setFlight(f => f+1);
    if(scroll&&window.matchMedia(phoneQuery).matches){requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));return;}
    if(scroll) collection.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const update = (key:keyof Filters,value:string) => {setFilters(f => ({...f,[key]:value,...(key==='route'?{flightAirport:'all'}:key==='flightAirport'?{route:'all'}:{})}));setLimit(24);};
  const reset = () => {setFilters({...initialFilters});setLimit(24);};
  useEffect(()=>{document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='light'?'#f3f7f9':'#0b131c');},[theme]);
  const toggleTheme = () => {
    const next=theme==='dark'?'light':'dark';
    setTheme(next);document.documentElement.dataset.theme=next;
    try {localStorage.setItem('skylog-theme',next);} catch { /* Keep the in-memory choice. */ }
  };
  const openEntry = (entry:Entry) => {
    const selected = entry.photoIds.filter(id => photoMatches(byId.get(id)!,filters,aircraft,airlines));
    openDetail({entry,ids:entry.kind==='airline'?entry.photoIds:selected.length ? selected : entry.photoIds,index:0});
  };
  const exploreAirlineFlights=()=>{
    const airline=detail!.entry!.name;
    setDetail(null);switchMode('flights',true);setFilters({...initialFilters,sort:'latest',airline});
  };
  const exploreFlights = () => {
    detail?.onNavigate?.();
    setDetail(null);switchMode('flights',true);
    setFilters({...initialFilters,sort:'latest',...(exactFlights.length?{query:activePhoto!.registration!.value}:detail?.entry?.kind==='airline'?{airline:detail.entry.name}:detail?.entry?{model:detail.entry.displayModel||detail.entry.name,...(detail.entry.kind==='variant'?{airline:detail.entry.name}:{})}:{})});
  };
  const nextPhoto = (step:number) => setDetail(d => d && ({...d,index:(d.index+step+galleryIds.length)%galleryIds.length}));
  const stageSwipe = usePhotoSwipe(step=>{if(galleryIds.length>1)nextPhoto(step);});
  const unlockedAircraft = aircraft.filter(a => a.unlocked).length;
  const unlockedAirlines = airlines.filter(a => a.unlocked).length;
  const renderFilters=(values:Filters,onUpdate:(key:keyof Filters,value:string)=>void)=>{
    const select=(key:keyof Filters,label:string,options:{value:string;label:string}[])=><label className="select-field"><span>{label}</span><select aria-label={label} value={values[key]} onChange={e=>{onUpdate(key,e.target.value);e.currentTarget.blur();}}><option value="all">{locale==='en'?t("全部"):t("全部{0}",[label])}</option>{options.map(o=><option key={o.value} value={o.value}>{t(o.label)}</option>)}</select></label>;
    return <>          {select('manufacturer',t("生产商"),manufacturers.map(s=>({value:s,label:s})))}
          {select('country',t("航司国家／地区"),unique(airlines.map(a=>a.country)).map(s=>({value:s,label:s})))}
          {select('airline',t("航司"),[...airlines].sort((a,b)=>a.name.localeCompare(b.name)).map(a=>({value:a.name,label:t(a.name)})))}
          {select('model',t("机型"),[...aircraft].sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true})).map(a=>({value:a.name,label:a.name})))}
          {mode==='flights'&&select('flightYear',t("乘坐年份"),unique(flights.map(f=>f.date.slice(0,4))).reverse().map(year=>({value:year,label:year+t(" 年")})))}
          {mode!=='flights'&&select('airport',t("拍摄机场"),[{value:'YYZ',label:t("YYZ · 多伦多")},{value:'YVR',label:t("YVR · 温哥华")}])}
          {mode!=='flights'&&select('livery',t("涂装"),unique(photos.map(p=>p.livery)).map(s=>({value:s,label:s})))}
          <label className="select-field sort-field"><span>{t("排序")}</span><select aria-label={t("排序")} value={values.sort} onChange={e=>{onUpdate('sort',e.target.value);e.currentTarget.blur();}}><option value="curated">{mode==='flights'?t("最近乘坐"):t("精选顺序")}</option><option value="latest">{mode==='flights'?t("日期由近到远"):t("最近拍摄")}</option>{mode!=='photos'&&mode!=='flights'&&<option value="count">{t("照片最多")}</option>}<option value="name">{t("名称排序")}</option></select></label></>;
  };


  return <div className="atlas-app" data-mobile-home={mobileHome}>
    <ScrollExperience enabled={ready} revision={JSON.stringify([ready,mode,photoLayout,filters,limit])}/>
    <a className="skip-link" href="#collection" onClick={e=>{if(window.matchMedia(phoneQuery).matches){e.preventDefault();setMobileHome(false);requestAnimationFrame(()=>collection.current?.scrollIntoView({behavior:'instant'}));}}}>{t("跳到图鉴")}</a>
    <header className="site-header wrap">
      <button className="brand" onClick={() => {if(window.matchMedia(phoneQuery).matches){mobileTab('home');return;}reset();switchMode('aircraft');setMobileHome(true);window.scrollTo({top:0,behavior:'instant'});}} aria-label={t("SKYLOG 返回首页")}><span className="brand-mark"><FlyPlane/></span><span>SKYLOG<span className="brand-sub">A PERSONAL AVIATION ATLAS</span></span></button>
      <nav aria-label={t("主导航")}>{modes.map(m => <button key={m.id} className={mode===m.id?'active':''} aria-current={mode===m.id?'page':undefined} onClick={() => switchMode(m.id,true)}>{t(m.name)}</button>)}</nav>
      <div className="header-actions"><LanguageSwitch/><span className="header-credit"><span className="live-dot"/> YUAN WANG’S COLLECTION <span className="avatar">Y</span></span><button className="theme-toggle" onClick={toggleTheme} aria-label={theme==='dark'?t("切换到浅色模式"):t("切换到深色模式")} title={theme==='dark'?t("浅色模式"):t("深色模式")}><Icon name={theme==='dark'?'sun':'moon'} size={19}/></button></div>
    </header>
    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy"><div className="eyebrow"><span className="dash"/> THE SKY IS THE COLLECTION</div><h1 id="hero-title">{t("每一次抬头，")}<br/>{t("都是")}<span>{t("新的发现。")}</span></h1><p>{t("追逐天空，收藏相遇。")}<br/>{t("一个飞友的机型、摄影与乘机记录。")}</p><button className="explore-button" onClick={() => switchMode(mode,true)}>{t("探索我的图鉴")}<Icon name="arrow" size={19}/></button><div className="hero-location"><Icon name="pin" size={14}/><span>YYZ · TORONTO</span><span className="route-dots">········</span><span>YVR · VANCOUVER</span></div></div>
        <HeroGallery photos={heroPhotos} onPhoto={index=>openDetail({ids:heroIds,index})}/>
        <div className="flyby" key={flight} aria-hidden="true"><div className="flying-plane"><FlyPlane/></div></div>
      </section>
      <div className="stats wrap">
        <button onClick={() => {switchMode('aircraft',true);setFilters({...initialFilters,status:'unlocked'});}}><span className="stat-number">{unlockedAircraft}<small> / {aircraft.length}</small></span><span className="stat-label">{t("已解锁机型")}<span>AIRCRAFT</span></span><span className="stat-progress"><i style={{width:`${unlockedAircraft/aircraft.length*100}%`}}/></span></button>
        <button onClick={() => {switchMode('airlines',true);setFilters({...initialFilters,status:'unlocked'});}}><span className="stat-number">{unlockedAirlines}<small> / {airlines.length}</small></span><span className="stat-label">{t("已解锁航司")}<span>AIRLINES</span></span><span className="stat-progress"><i style={{width:`${unlockedAirlines/airlines.length*100}%`}}/></span></button>
        <button onClick={() => {reset();switchMode('photos',true);}}><span className="stat-number">{photos.length}<small> {t("张")}</small></span><span className="stat-label">{t("天空的切片")}<span>PHOTOGRAPHS</span></span></button>
        <button onClick={()=>{reset();switchMode('flights',true);}}><span className="stat-number">{flights.length}<small> {t("段")}</small></span><span className="stat-label">{t("亲历的飞行")}<span>FLIGHTS FLOWN</span></span></button>
      </div>
      <section className="collection wrap" id="collection" ref={collection} aria-labelledby="collection-title">
        <div className="collection-heading"><div><div className="eyebrow">THE SPOTTING LOG</div><h2 id="collection-title"><span className="desktop-title">{t("我的天空收藏")}</span><span className="mobile-title">{t(modes.find(m=>m.id===mode)!.name)}</span><span> / {modes.find(m=>m.id===mode)?.english}</span></h2></div><span className="updated">{t("更新于")}{data.updatedAt.replaceAll('-','.')} <span className="live-dot"/></span></div>
        <AviationPlayground aircraft={aircraft} airlines={airlines} photos={photos} flights={flights} onPhotos={(ids,index,onNavigate)=>openDetail({ids,index,onNavigate})}/>
        <div className="collection-toolbar"><div className="toolbar-flight" key={flight} aria-hidden="true"><span><FlyPlane/></span></div><div className="view-tabs" aria-label={t("图鉴分类")}>{modes.map(m => <button key={m.id} aria-pressed={mode===m.id} onClick={() => switchMode(m.id)}><Icon name={m.icon} size={17}/>{t(m.name)}<span>{m.id==='aircraft'?aircraft.length:m.id==='airlines'?airlines.length:m.id==='flights'?flights.length:photos.length}</span></button>)}</div><div className="mobile-search-row"><label className="search-field"><Icon name="search" size={18}/><span className="sr-only">{t("搜索机型、航司、航班、注册号或照片编号")}</span><input ref={searchInput} type="search" placeholder={t("搜索机型、航司、注册号…")} value={filters.query} enterKeyHint="search" autoComplete="off" autoCapitalize="none" onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.currentTarget.blur();}}} onChange={e=>update('query',e.target.value)}/>{filters.query&&<button className="search-clear" aria-label={t('清空搜索')} onPointerDown={e=>e.preventDefault()} onClick={()=>{update('query','');searchInput.current?.focus({preventScroll:true});}}><Icon name="close" size={18}/></button>}</label><button className="mobile-filter-button" aria-label={t('打开筛选')} aria-haspopup="dialog" onClick={openFilters}><Icon name="filter" size={22}/>{activeCount>0&&<b>{activeCount}</b>}</button></div></div>
        {mode==='aircraft'&&!filters.query.trim()&&<AircraftFamilies aircraft={aircraft} photos={photos} model={filters.model} onEntry={entry=>openDetail({entry,ids:entry.photoIds,index:Math.max(0,entry.photoIds.indexOf(entry.cover||''))})}/>}
        {mode==='aircraft'&&<div className="comparison-entry"><span>{t('把两款飞机放在一起看。')}</span><button onClick={()=>setComparing(true)}><Icon name="compare" size={17}/>{t('机型对比')}</button></div>}
        <div className="filter-heading"><div className="status-tabs" aria-label={t("解锁状态")}>{mode !== 'photos' && mode !== 'flights' ? [['all',t("全部")],['unlocked',t("已解锁")],['locked',t("待解锁")]].map(([value,label])=><button key={value} aria-pressed={filters.status===value} onClick={()=>update('status',value)}>{label}</button>) : <span className="photo-subtitle">{mode==='flights'?t("拍过，或坐过。每一种相遇都值得记录。"):t("每一张，都是亲眼见过的天空。")}</span>}</div><button className="filter-toggle" aria-expanded={expanded} aria-controls="filters" onClick={openFilters}><Icon name="filter" size={16}/>{t("筛选")}{activeCount>0&&<b>{activeCount}</b>}</button><span className="result-count" aria-live="polite">{count} {mode==='flights'?t("段旅程"):mode==='photos'?t("张照片"):filters.model!=='all'&&mode==='aircraft'?t("个航司 / 涂装组合"):t("个条目")}</span></div>
        <div className={`filters ${mode==='flights'?'flight-filters':''} ${expanded?'expanded':''}`} id="filters">
          {renderFilters(filters,update)}
        </div>
        {activeCount>0&&<div className="active-filter-summary"><span>{t("已应用")}{activeCount} {t("项筛选")}</span><button onClick={reset}>{t("重置筛选")}<Icon name="close" size={13}/></button></div>}
        {mode==='photos'&&<div className="photo-layout-tabs" aria-label={t("摄影集展示方式")}>
          {searchingPhotos
            ? <button aria-pressed={photoLayout!=='timeline'} onClick={()=>{setTimeline(false);setLimit(24);}}>{filters.query.trim()?t("搜索结果"):t("筛选结果")}</button>
            : <><button aria-pressed={photoLayout==='grid'} onClick={()=>{setPhotoGrid('grid');setTimeline(false);setLimit(24);}}><Icon name="camera" size={15}/>{t("作品精选")}</button>
              <button aria-pressed={photoLayout==='representatives'} onClick={()=>{setPhotoGrid('representatives');setTimeline(false);setLimit(24);}}>{t("全部代表照")}</button></>}
          <button aria-pressed={photoLayout==='timeline'} onClick={()=>setTimeline(true)}><Icon name="calendar" size={15}/>{t("按拍摄日回看")}</button>
        </div>}
        {count===0 ? <div className="empty-state"><Icon name="search" size={40}/><h3>{t("这片天空还没有记录")}</h3><p>{t("换一个筛选条件，继续探索已收藏的相遇。")}</p><button className="explore-button" onClick={reset}>{t("查看全部收藏")}<Icon name="arrow"/></button></div> : mode==='flights' ? <FlightLog flights={matchedFlights} mapFlights={mapFlights} allFlights={flights} filters={filters} onFilter={update} limit={limit} photos={photos} total={flights.length} onPhoto={p=>openDetail({ids:[p.id],index:0})} onShare={flight=>setShareCard({kind:'flight',flight})}/> : mode==='photos'&&photoLayout==='timeline' ? <CollectionTimeline photos={matchedPhotos} aircraft={aircraft} airlines={airlines} onPhoto={(ids,index)=>openDetail({ids,index})}/> : <div className="card-grid">
          {mode==='photos' ? displayPhotos.slice(0,limit).map(photo=><button className="catalog-card photo-card" key={photo.id} onClick={()=>openGridPhoto(photo)}><div className="card-image"><img src={asset(photo.thumbnail)} alt={`${photo.airlines.map(name=>t(name)).join(' / ')} ${photo.models.map(name=>t(name)).join(' / ')} · ${photo.id}`} loading="lazy"/><span className="airport-badge">{photo.airport}</span><span className="image-open"><Icon name="diagonal"/></span></div><div className="card-content"><span className="card-overline">{photo.airlines.map(name=>t(name)).join(' / ')||'PRIVATE / BUSINESS'}</span><h3>{photo.models.map(name=>t(name)).join(' / ')||t("机型待确认")}</h3><span className="photo-livery">{t(photo.livery)}</span>{flightsForPhoto(photo,flights).length>0&&<span className="flown-badge">{t("坐过这架")}</span>}<div className="card-meta"><span>{photo.id}</span><span>{photo.date.replaceAll('-','.')}</span></div></div></button>) : entries.slice(0,limit).map(entry=>{
            const matchingIds = entry.photoIds.filter(id=>photoMatches(byId.get(id)!,filters,aircraft,airlines));
            const flown = flightsForEntry(entry,flights).length;
            const cover = byId.get(entry.cover&&matchingIds.includes(entry.cover)?entry.cover:matchingIds[0]||entry.cover||'');
            const model=entry.kind==='aircraft'?entry.name:entry.kind==='variant'?entry.displayModel:undefined;
            return <div className="catalog-item" key={entry.id}><button className={`catalog-card ${entry.unlocked?'':'locked'}`} onClick={()=>openEntry(entry)} aria-label={`${t(entry.name)}${entry.livery?`，${t(entry.livery)}`:''}，${entry.unlocked?t("已解锁，{0} 张照片",[entry.photoIds.length]):t("待解锁")}${flown?t("，坐过 {0} 段",[flown]):''}`}><div className="card-image">{cover?<img src={asset(cover.thumbnail)} alt={`${cover.airlines.map(name=>t(name)).join(' / ')} ${cover.models.map(name=>t(name)).join(' / ')}`} loading="lazy"/>:<div className="locked-image">{entry.kind==='airline'?<div className="locked-airline-mark"><CountryFlags country={entry.country} size={56}/><span className="airline-placeholder-code">{entry.code||'—'}</span></div>:<><span className="blueprint-code">{entry.family}</span><PlaneSilhouette model={entry.kind==='aircraft'?entry.name:entry.displayModel} category={entry.category} family={entry.family}/></>}<span className="locked-grid-label">NEXT ON THE RADAR</span></div>}<span className={`state-badge ${entry.unlocked?'is-unlocked':''}`}><Icon name={entry.unlocked?'check':'lock'} size={12}/>{entry.unlocked?t("已解锁"):t("待解锁")}</span>{entry.unlocked&&<span className="image-open"><Icon name="diagonal"/></span>}</div><div className="card-content"><span className={`card-overline ${entry.kind==='airline'?'airline-overline':''}`}>{entry.kind==='airline'&&entry.unlocked&&<CountryFlags country={entry.country}/>}<span>{entry.kind==='variant'?t(entry.displayModel):mode==='aircraft'?`${t(entry.manufacturer)} · ${t(entry.category)}`:`${entry.code} · ${t(entry.country)}`}</span></span><h3>{t(entry.name)}</h3>{flown>0&&<span className="flown-badge"><Icon name="plane" size={11}/>{entry.kind==='airline'?t("坐过这家航司"):t("坐过此机型")} · {flown} {t("段")}</span>}{entry.kind==='variant'?<p className="airline-cn variant-livery">{t(entry.livery)}</p>:mode==='airlines'?<p className="airline-cn">{locale==='zh'?entry.name:t(entry.country)}</p>:entry.unlocked&&<p className="airline-cn">{unique(entry.photoIds.flatMap(id=>airlinesForModel(byId.get(id)!,entry.name))).length} {t("家航司 · 多角度记录")}</p>}<div className="card-meta"><span>{entry.unlocked?<><Icon name="camera" size={13}/>{matchingIds.length||entry.photoIds.length} {t("张记录")}</>:t("等待下一次相遇")}</span><span>{entry.unlocked?entry.airports.join(' · '):<Icon name="lock" size={13}/>}</span></div></div></button>{model&&<CompareButton model={model} selected={compared.includes(model)} full={compared.length>=3} onClick={()=>toggleCompare(model)}/>}</div>;
          })}
        </div>}
        {count>limit&&!(mode==='photos'&&photoLayout==='timeline')&&<div className="load-more"><button onClick={()=>setLimit(l=>l+24)}>{t("继续探索")}<Icon name="arrow" size={17}/><span>{Math.min(limit,count)} / {count}</span></button></div>}
        {count>0&&(count<=limit||(mode==='photos'&&photoLayout==='timeline'))&&<div className="end-mark"><span/>{t("END OF THIS FLIGHT · 更多相遇，留给下一次")}<span/></div>}
      </section>
    </main>
    <footer className="site-footer wrap"><div className="footer-main"><span className="footer-brand">SKYLOG<span> KEEP LOOKING UP.</span></span></div><p>{t(data.scopeNote)}</p><div className="footer-bottom"><span>{t("摄影 © Yuan Wang · 已解锁照片均为本人拍摄")}</span><VisitCounter/><span>YYZ 43°40′N &nbsp; / &nbsp; YVR 49°12′N</span></div></footer>
    {detail&&<dialog ref={dialog} className={`photo-dialog${detail.entry?.kind==='airline'?' airline-dialog':''}`} aria-labelledby="detail-title" onCancel={()=>setDetail(null)} onClick={e=>{if(e.target===e.currentTarget)setDetail(null);}} onKeyDown={e=>{if(!airlineOverview&&galleryIds.length>1&&['ArrowRight','ArrowLeft'].includes(e.key)&&!(e.target instanceof HTMLInputElement)&&!(e.target instanceof HTMLSelectElement)){e.preventDefault();nextPhoto(e.key==='ArrowRight'?1:-1);}}}>
      <div className="dialog-shell"><div className="dialog-heading"><div>{airlineGallery&&<button className="airline-gallery-back" onClick={()=>setAirlineGallery(false)}><Icon name="chevron" size={16}/>{t("返回航司档案")}</button>}<span className="eyebrow">{detail.entry?.kind==='airline'?'AIRLINE COLLECTION':detail.entry?.unlocked===false?'ON THE WISHLIST':'FROM MY VIEWFINDER'}</span><h2 id="detail-title">{detail.entry?.name?t(detail.entry.name):activePhoto?.models.map(name=>t(name)).join(' / ')||t("飞行记录")}</h2>{detail.entry?.kind==='variant'&&<p className="dialog-subtitle">{t(detail.entry.displayModel)} · {t(detail.entry.livery)}</p>}</div><div className="dialog-actions"><LanguageSwitch/><button className="icon-button" onClick={()=>setDetail(null)} aria-label={detail.entry?.kind==='airline'?t("关闭航司详情"):t("关闭照片")}><Icon name="close" size={24}/></button></div></div>
      {airlineOverview?<AirlineProfile entry={detail.entry!} photos={photos} flights={flights} onGallery={openAirlineGallery} onFlights={exploreAirlineFlights}/>:<>
      {detail.entry?.unlocked&&detail.entry.kind!=='variant'&&<div className="variant-controls">
        <label className="select-field"><span>{detail.entry.kind==='aircraft'?t("查看这款机型的不同航司"):t("查看这家航司的不同机型")}</span><select aria-label={t("详情航司或机型")} value={detail.entry.kind==='aircraft'?variant.airline:variant.model} onChange={e=>{setVariantFilter(detail.entry!.kind==='aircraft'?'airline':'model',e.target.value);e.currentTarget.blur();}}><option value="all">{detail.entry.kind==='aircraft'?t("全部航司"):t("全部机型")}</option>{unique(variantPhotos.flatMap(p=>detail.entry!.kind==='aircraft'?airlinesForModel(p,detail.entry!.name):modelsForAirline(p,detail.entry!.name))).map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>
        <label className="select-field"><span>{t("查看不同涂装 ·")}{galleryIds.length} {t("张")}</span><select aria-label={t("详情涂装")} value={variant.livery} onChange={e=>{setVariantFilter('livery',e.target.value);e.currentTarget.blur();}}><option value="all">{t("全部涂装")}</option>{variantLiveries.map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label>
      </div>}
      {activePhoto?<><div className="photo-stage" {...stageSwipe}><img key={activePhoto.id} {...photoImageSources(activePhoto,process.env.NEXT_PUBLIC_BASE_PATH)} sizes={photoSizes} alt={`${activePhoto.airlines.map(name=>t(name)).join(' / ')} ${activePhoto.models.map(name=>t(name)).join(' / ')} · ${activePhoto.id}`}/>{galleryIds.length>1&&<><button className="gallery-arrow previous" onClick={()=>nextPhoto(-1)} aria-label={t("上一张照片")}><Icon name="chevron"/></button><button className="gallery-arrow next" onClick={()=>nextPhoto(1)} aria-label={t("下一张照片")}><Icon name="chevron"/></button></>}<span className="mobile-swipe-hint">{galleryIds.length>1?t("左右滑动切换照片"):t("摄影 © Yuan Wang")}</span><button className="photo-fullscreen-toggle" onClick={()=>setFullscreen(true)} aria-label={t("全屏查看照片")}><Icon name="diagonal" size={22}/></button><span className="photo-counter">{coverByAlternate.has(activePhoto.id)&&t("补充角度")+" · "}{String(detail.index+1).padStart(2,'0')} / {String(galleryIds.length).padStart(2,'0')}</span></div><div className="photo-info"><div><span className="livery-chip">{t(activePhoto.livery)}</span><br/><span className="photo-airline">{activePhoto.airlines.map(name=>t(name)).join(' / ')||'Private / Business'}</span><p>{activePhoto.models.map(name=>t(name)).join(' / ')||t("机型待确认")}</p><div className="info-tags"><span><Icon name="pin" size={13}/>{activePhoto.airport}</span><span><Icon name="calendar" size={13}/>{activePhoto.date}</span><span>{activePhoto.id}</span></div><PhotoIdentity photo={activePhoto}/>{activePhoto.note&&<p className="photo-note">{t(activePhoto.note)}</p>}</div><div className="photo-actions"><button className="play-secondary" onClick={()=>setShareCard({kind:'photo',photo:activePhoto})}><Icon name="share" size={15}/>{t("生成摄影卡片")}</button><a href={asset(activePhoto.image)} target="_blank" rel="noreferrer" className="open-jpg">{t("打开高清 JPG")}<Icon name="diagonal" size={15}/></a>{original&&<div className="original-download"><a href={original.url} download={`${activePhoto.id}.jpg`} className="open-jpg"><Icon name="download" size={15}/>{t("下载原尺寸 JPG")}</a><span>{original.width} × {original.height} · {(original.bytes/1_000_000).toFixed(1)} MB</span></div>}</div></div>{galleryIds.length>1&&<div className="thumbnail-strip" aria-label={t("选择照片")}>{galleryIds.map((id,index)=><button key={id} aria-label={t("查看 {0}",[id])} aria-pressed={index===detail.index} onClick={()=>setDetail(d=>d&&({...d,index}))}><img src={asset(byId.get(id)!.thumbnail)} alt="" loading="lazy"/></button>)}</div>}</>:<div className="locked-detail"><PlaneSilhouette model={detail.entry?.kind==='aircraft'?detail.entry.name:detail.entry?.displayModel} category={detail.entry?.category} family={detail.entry?.family}/><span className="state-badge"><Icon name="lock" size={13}/>{t("待解锁")}</span><h3>{t("把下一次相遇，留给它。")}</h3><p>{t(detail.entry?.chineseName||detail.entry?.category)} {t("· 尚无拍摄记录")}</p><p className="muted">{t("轮廓仅作示意。收藏目标不代表当前有定期航班。")}</p></div>}
      {activePhoto&&<PhotoSettings photo={activePhoto}/>}
      <FlownDetails flights={exactFlights.length?exactFlights:entryFlights} exact={exactFlights.length>0} onExplore={exploreFlights}/>{profileEntries.map(entry=>{const model=entry.displayModel||entry.name;return <div key={entry.id}><div className="detail-compare"><CompareButton model={model} selected={compared.includes(model)} full={compared.length>=3} onClick={()=>toggleCompare(model)}/><button onClick={()=>setComparing(true)}>{t('查看对比')}<Icon name="arrow" size={16}/></button></div><AircraftProfile entry={entry}/></div>;})}
      </>}
      </div>
    </dialog>}
    {compared.length>0&&<div className="comparison-dock-space" aria-hidden="true"/>}
    {compared.length>0&&!detail&&<ComparisonTray models={compared} onRemove={toggleCompare} onClear={()=>setCompared([])} onOpen={()=>setComparing(true)}/>}
    {fullscreen&&activePhoto&&<PhotoFullscreen photo={activePhoto} onClose={()=>setFullscreen(false)} onPrevious={galleryIds.length>1?()=>nextPhoto(-1):undefined} onNext={galleryIds.length>1?()=>nextPhoto(1):undefined}/>}
    {comparing&&<AircraftComparison models={compared} aircraft={aircraft} photos={photos} flights={flights} onSelect={(index,model)=>setCompared(current=>updateComparison(current,model,index))} onClose={()=>setComparing(false)}/>}
    {shareCard&&<ShareCard source={shareCard} onClose={()=>setShareCard(null)}/>}
    <nav className="mobile-tab-bar" aria-label={t('手机主导航')}>
      {[{id:'home',name:t('首页'),icon:'home'},{id:'aircraft',name:t('机型'),icon:'aircraft'},{id:'airlines',name:t('航司'),icon:'globe'},{id:'photos',name:t('照片'),icon:'camera'},{id:'flights',name:t('航程'),icon:'ticket'}].map(item=><button key={item.id} aria-current={(mobileHome?'home':mode)===item.id?'page':undefined} onClick={()=>mobileTab(item.id as Mode|'home')}><span><Icon name={item.icon} size={23}/></span>{t(item.name)}</button>)}
    </nav>
    {filterSheet&&<dialog ref={sheet} className="mobile-filter-sheet" aria-labelledby="mobile-filter-title" onCancel={()=>setFilterSheet(false)} onClick={e=>{if(e.target===e.currentTarget)setFilterSheet(false);}}>
      <div className="sheet-handle-area" aria-hidden="true" onTouchStart={e=>{if(e.touches.length===1)sheetDrag.current={y:e.touches[0].clientY,distance:0};}} onTouchMove={e=>{if(!sheetDrag.current||e.touches.length!==1)return;const d=Math.max(0,e.touches[0].clientY-sheetDrag.current.y);sheetDrag.current.distance=d;sheet.current!.style.transform=`translateY(${d}px)`;}} onTouchEnd={()=>{const d=sheetDrag.current?.distance??0;sheetDrag.current=null;if(sheet.current)sheet.current.style.transform='';if(d>70)setFilterSheet(false);}} onTouchCancel={()=>{sheetDrag.current=null;if(sheet.current)sheet.current.style.transform='';}}><div className="sheet-handle"/></div>
      <header><h2 id="mobile-filter-title">{t('筛选收藏')}</h2><button className="icon-button" aria-label={t('关闭筛选')} onClick={()=>setFilterSheet(false)}><Icon name="close" size={22}/></button></header>
      <div className="sheet-fields">{renderFilters(draft,(key,value)=>setDraft(f=>({...f,[key]:value})))}</div>
      <footer><button className="sheet-reset" onClick={()=>setDraft({...initialFilters})}>{t('重置筛选')}</button><button className="explore-button" onClick={()=>{setFilters(draft);setLimit(24);setFilterSheet(false);}}>{t('显示结果')}<Icon name="arrow" size={18}/></button></footer>
    </dialog>}
  </div>;
}
