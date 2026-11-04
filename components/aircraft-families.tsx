import {useLocale} from './locale-provider';
import {useEffect,useMemo,useState} from 'react';
import {aircraftFamilies} from '@/lib/insights.mjs';
import type {Entry,Photo} from '@/lib/types';
import {Icon,PlaneSilhouette} from './icons';

type Family={key:string;name:string;manufacturer:string;family:string;entries:Entry[];unlocked:number};
const asset=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}${path}`;

export function AircraftFamilies({aircraft,photos,model,onEntry}:{aircraft:Entry[];photos:Photo[];model:string;onEntry:(entry:Entry)=>void}) {
  const {t}=useLocale();
  const families=useMemo(()=>aircraftFamilies(aircraft) as Family[],[aircraft]);
  const [selected,setSelected]=useState('Boeing:777');
  const byId=useMemo(()=>new Map(photos.map(p=>[p.id,p])),[photos]);
  useEffect(()=>{
    const match=families.find(g=>g.entries.some(e=>e.name===model));
    if(match)setSelected(match.key);
  },[model,families]);
  const group=families.find(g=>g.key===selected)||families[0];
  if(!group)return null;
  return <details className="family-collection" open>
    <summary><span><Icon name="aircraft" size={18}/>{t("机型家族收集进度")}</span><span>{families.length} {t("个家族")}<Icon name="chevron" size={13}/></span></summary>
    <div className="family-body">
      <div className="family-heading"><div><span className="eyebrow">THE FAMILY COLLECTION</span><h3>{group.name}</h3><p>{t("按全部拍摄收藏统计，仅含本图鉴收录的型号。")}</p></div><label className="select-field"><span>{t("切换机型家族")}</span><select aria-label={t("机型家族")} value={group.key} onChange={e=>{setSelected(e.target.value);e.currentTarget.blur();}}>{families.map(g=><option key={g.key} value={g.key}>{g.name} · {g.unlocked} / {g.entries.length}</option>)}</select></label></div>
      <div className="family-progress-label"><span><strong>{group.unlocked}</strong> / {group.entries.length} {t("已解锁")}</span><span>{group.unlocked===group.entries.length?t("图鉴内型号已集齐"):t("还差 {0} 款",[group.entries.length-group.unlocked])}</span></div>
      <progress className="family-progress" value={group.unlocked} max={group.entries.length} aria-label={t("{0} 已解锁 {1} 款，共 {2} 款",[group.name,group.unlocked,group.entries.length])}/>
      <div className="family-model-grid">{group.entries.map(entry=>{
        const cover=entry.unlocked&&entry.cover?byId.get(entry.cover):undefined;
        return <button className={`family-model ${entry.unlocked?'is-unlocked':'is-locked'}`} key={entry.id} onClick={()=>onEntry(entry)} aria-label={`${entry.name}，${entry.unlocked?t("查看已拍照片"):t("待解锁，查看机型档案")}`}>
          <span className="family-model-image">{cover?<img src={asset(cover.thumbnail)} alt={`${entry.name} · ${cover.airlines.join(' / ')}`} loading="lazy"/>:<PlaneSilhouette model={entry.name} category={entry.category} family={entry.family}/>}<span className="family-model-state"><Icon name={entry.unlocked?'check':'lock'} size={12}/>{entry.unlocked?t("已拍到"):t("待解锁")}</span></span>
          <span className="family-model-info"><strong>{entry.shortName||entry.name}</strong><span>{entry.unlocked?t("{0} 张照片",[entry.photoIds.length]):t("等待下一次相遇")}<Icon name="diagonal" size={13}/></span></span>
        </button>;
      })}</div>
    </div>
  </details>;
}
