import {useMobileLayer} from './use-mobile-layer';
import {useEffect,useRef,type CSSProperties} from 'react';
import {comparisonDrawings,comparisonCues} from '@/lib/aircraft-comparison.mjs';
import {photoImageSources} from '@/lib/photo-images.mjs';
import {flightsForEntry,airlinesForModel} from '@/lib/filter.mjs';
import type {Entry,Flight,Photo} from '@/lib/types';
import {aircraftProfileFor} from './collection-details';
import {Icon} from './icons';
import {LanguageSwitch,useLocale} from './locale-provider';

export function CompareButton({model,selected,full,onClick}:{model:string;selected:boolean;full:boolean;onClick:()=>void}){
  const {t}=useLocale();
  return <button className="compare-toggle" aria-pressed={selected} disabled={full&&!selected} onClick={onClick} aria-label={`${model} · ${selected?t('已选对比'):t('加入对比')}`}>
    <Icon name={selected?'check':'compare'} size={16}/>{selected?t('已选对比'):full?t('已选满 3 款'):t('加入对比')}
  </button>;
}

export function ComparisonTray({models,onRemove,onClear,onOpen}:{models:string[];onRemove:(model:string)=>void;onClear:()=>void;onOpen:()=>void}){
  const {t}=useLocale();
  return <aside className="comparison-tray" aria-label={t('已选对比机型')}>
    <div className="comparison-tray-title"><Icon name="compare" size={20}/><strong>{t('机型对比')}</strong><span role="status">{models.length} / 3</span><button onClick={onClear}>{t('清空')}</button></div>
    <div className="comparison-chips">{models.map(model=><button key={model} onClick={()=>onRemove(model)} aria-label={t('移除 {0}',[model])}>{model}<Icon name="close" size={15}/></button>)}</div>
    <button className="explore-button" onClick={onOpen}>{models.length<2?t('再选一款'):t('开始对比')}<Icon name="arrow" size={18}/></button>
  </aside>;
}

export function AircraftComparison({models,aircraft,photos,flights,onSelect,onClose}:{models:string[];aircraft:Entry[];photos:Photo[];flights:Flight[];onSelect:(index:number,model:string)=>void;onClose:()=>void}){
  useMobileLayer(true,onClose);
  const {t}=useLocale();
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const el=dialog.current!;el.showModal();
    return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  const drawings=comparisonDrawings(models);
  const sorted=[...aircraft].sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}));
  const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
  return <dialog ref={dialog} className="photo-dialog comparison-dialog" aria-labelledby="compare-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="dialog-heading"><div><span className="eyebrow">AIRCRAFT / SIDE BY SIDE</span><h2 id="compare-title">{t('机型对比')}</h2></div><div className="dialog-actions"><LanguageSwitch/><button autoFocus className="icon-button" onClick={onClose} aria-label={t('关闭对比')}><Icon name="close" size={24}/></button></div></div>
    <div className="comparison-body">
      <p className="comparison-intro">{t('选 2–3 款，看看它们真正的大小差别。')}</p>
      <div className="comparison-selectors">{[0,1,2].map(index=><label key={index} className="select-field"><span>{t('机型 {0}',[String(index+1).padStart(2,'0')])}{index===2&&` · ${t('可选')}`}</span><select aria-label={t('对比机型 {0}',[index+1])} value={models[index]||''} disabled={index>models.length} onChange={e=>{onSelect(index,e.target.value);e.currentTarget.blur();}}><option value="">{t('选择机型')}</option>{sorted.map(entry=><option value={entry.name} key={entry.id} disabled={models.some((model,i)=>model===entry.name&&i!==index)}>{entry.name}</option>)}</select></label>)}</div>
      {models.length<2?<div className="comparison-empty"><Icon name="compare" size={36}/><p>{t('至少选择两款，开始对比。')}</p></div>:<>
        <div className="comparison-scale-note"><Icon name="compare" size={16}/><span>{t('统一比例 · 机头与地面对齐')}</span><small>{t('侧视图比较机长与轮廓，翼展见下方尺寸。')}</small></div>
        <div className="comparison-columns" style={{'--compare-count':models.length} as CSSProperties}>
          {drawings.map(({model,drawing})=>{
            const entry=aircraft.find(a=>a.name===model)!;
            const margin=drawing?drawing.width*.003:0;
            return <article className="comparison-model" key={model}>
              <header><span className="eyebrow">{entry.manufacturer} · {t(entry.category)}</span><h3>{model}</h3><span className="comparison-state"><Icon name={entry.unlocked?'check':'lock'} size={13}/>{entry.unlocked?t('已解锁'):t('待解锁')}</span></header>
              {drawing?<>
                <svg className="technical-canvas comparison-canvas" viewBox="0 0 600 275" role="img" aria-label={t('{0}，机长 {1} 米，翼展 {2} 米，机高 {3} 米',[model,drawing.length,drawing.span,drawing.height])}>
                  <path className="technical-baseline" d="M35 205H565M550 25V215"/>
                  {'asset' in drawing&&<image className="technical-aircraft" href={`${basePath}${drawing.asset}`} x={drawing.x-margin} y={drawing.y-margin} width={drawing.width+2*margin} height={drawing.drawnHeight+2*margin}/>}
                  <path className="technical-dimensions" fill="none" stroke="currentColor" d={`M${drawing.x} 219v16m0-8H550m0-8v16`}/>
                  <text className="technical-length" x={(drawing.x+550)/2} y="255" textAnchor="middle">{drawing.length} m</text>
                  <path className="technical-ruler" d={`M40 251v6h${drawing.scale*5}v-6h${drawing.scale*5}v6h${-drawing.scale*5}v-6Z`}/>
                  <text className="technical-scale" x="40" y="242">10 m</text>
                </svg>
                <dl className="technical-specs comparison-specs">{(['length','span','height'] as const).map((key,i)=><div key={key}><dt>{[t('机长'),t('翼展'),t('机高')][i]}</dt><dd>{drawing[key]}<small>m</small></dd></div>)}</dl>
              </>:<p>{t('此型号的官方技术图尚待核验，预览保留比例示意。')}</p>}
            </article>;
          })}
        </div>
        <div className="comparison-records" style={{'--compare-count':models.length} as CSSProperties}>
          {drawings.map(({model,drawing})=>{
            const entry=aircraft.find(a=>a.name===model)!;
            const profile=aircraftProfileFor(entry);
            const cues=comparisonCues(entry);
            const cover=photos.find(p=>p.id===entry.cover);
            const modelPhotos=photos.filter(p=>entry.photoIds.includes(p.id));
            const airlines=[...new Set(modelPhotos.flatMap(p=>airlinesForModel(p,model)))].sort();
            const flown=flightsForEntry(entry,flights).length;
            return <article className="comparison-record" key={model}>
              <h3>{model}</h3>
              <div className="comparison-features"><h4>{t('辨认要点')}</h4><strong>{[t('{0} 台发动机',[cues.engines]),...cues.features.map((feature:string)=>t(feature))].join(' · ')}</strong>{profile&&<p>{t(profile.description)}</p>}</div>
              <section className="comparison-collection"><h4>{t('我的收藏')}</h4>{cover?<><img {...photoImageSources(cover,basePath)} sizes="(max-width: 760px) 100vw, (max-width: 1200px) 45vw, 600px" alt={`${cover.airlines.join(' / ')} · ${model} · ${cover.id}`} loading="lazy"/><span className="comparison-photo-caption">{cover.airlines.join(' / ')} · {cover.id}</span></>:<div className="comparison-unseen"><Icon name="camera" size={24}/>{t('等待下一次相遇')}</div>}
                <p>{t('{0} 张照片 · {1} 家航司',[entry.photoIds.length,airlines.length])}</p>{airlines.length>0&&<p className="comparison-airlines">{airlines.join(' · ')}</p>}
                <span className="comparison-flown"><Icon name="aircraft" size={16}/>{flown?t('坐过此机型 · {0} 段',[flown]):t('暂无已确认的乘坐记录')}</span>
              </section>
              {drawing&&<details className="comparison-sources"><summary>{t('图纸与尺寸来源')}</summary><p>{t('referenceLabel' in drawing?drawing.referenceLabel:'官方资料参考图')}</p>{'note' in drawing&&<p>{t(drawing.note)}</p>}<a href={`${drawing.source.url}${'page' in drawing.source?`#page=${drawing.source.page}`:''}`} target="_blank" rel="noreferrer">{drawing.source.title} ↗</a>{'additionalSources' in drawing&&drawing.additionalSources.map((source:{url:string;title:string;page?:number})=><a key={source.url} href={`${source.url}${source.page?`#page=${source.page}`:''}`} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</details>}
            </article>;
          })}
        </div>
        <p className="comparison-footnote">{t('代表构型的图鉴示意；尺寸会随翼尖、起落架姿态及改装变化。')}</p>
      </>}
    </div>
  </dialog>;
}
