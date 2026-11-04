import {useLocale} from './locale-provider';
import profiles from '@/data/aircraft-profiles.json';
import liveries from '@/data/liveries.json';
import type { Entry, Flight, Photo, Registration } from '@/lib/types';
import { Icon } from './icons';
import {AircraftTechnicalDrawing} from './aircraft-technical-drawing';

type Profile = {description:string;configuration:string;source:string};
type Livery = {name:string;description:string;source?:string};

export function AircraftProfile({entry}:{entry:Entry}) {
  const {t}=useLocale();
  const name = entry.displayModel || entry.name;
  const key = /A31[89]|A32[01]/.test(name) ? 'A320 family' : name.includes('737 MAX') ? '737 MAX' : /737-(700|800|900)/.test(name) ? '737 NG' : name.includes('Dash 8-400') ? 'Dash 8-400' : entry.family || '';
  const profile = (profiles.families as Record<string,Profile>)[key];
  return <details className="aircraft-profile" open>
    <summary><span><Icon name="info" size={16}/>{t("机型小档案")}</span><span>{name}</span></summary>
    <dl className="profile-facts"><div><dt>{t("生产商")}</dt><dd>{entry.manufacturer}</dd></div><div><dt>{t("家族")}</dt><dd>{entry.family}</dd></div><div><dt>{t("类别")}</dt><dd>{t(entry.category)}</dd></div></dl>
    <AircraftTechnicalDrawing model={name}/>
    {profile&&<><p className="profile-configuration">{t(entry.category==='货机'?profile.configuration.replace('双通道','货运布局'):profile.configuration)}</p><p>{t(profile.description)}</p><a href={profile.source} target="_blank" rel="noreferrer">{t("制造商资料")}<Icon name="diagonal" size={12}/></a></>}
  </details>;
}

export function PhotoIdentity({photo}:{photo:Photo}) {
  const {t}=useLocale();
  const livery = (liveries as Record<string,Livery>)[photo.livery];
  const identification=photo.flightIdentification;
  const registrations=photo.registration
    ? [{label:'',registration:photo.registration}]
    : (photo.subjects||[]).filter((s):s is typeof s & {registration:Registration}=>!!s.registration).map(s=>({label:s.airline,registration:s.registration}));
  return <div className="photo-identity">
    <div><span className="identity-label">{t("REGISTRATION / 注册号")}</span>{registrations.length?registrations.map(({label,registration})=><div key={registration.value}><strong>{label&&`${label} · `}{registration.value}</strong><span className="identity-basis">{registration.status==='confirmed'?t("已确认"):t("推测 · 待确认")} · {t(registration.basis)}{registration.sourceUrl&&<> · <a href={registration.sourceUrl} target="_blank" rel="noreferrer">{t("核对来源 ↗")}</a></>}</span></div>):<strong>{t("待确认")}</strong>}</div>
    <div><span className="identity-label">{t("LIVERY / 涂装")}</span><strong>{livery?t(livery.name):(photo.livery==='标准涂装'?t("{0} · 标准涂装",[photo.airlines.join(' / ')]):t(photo.livery))}</strong>{livery&&<p>{t(livery.description)}{livery.source&&<> <a href={livery.source} target="_blank" rel="noreferrer">{t("了解涂装 ↗")}</a></>}</p>}</div>
    {identification&&<div className="identity-flight"><span className="identity-label">{t("FLIGHT / 航班记录")}</span>
      <strong>{photo.flights.length?photo.flights.map(f=>t(f)).join(' / '):identification.callsign?t("呼号 {0}",[identification.callsign]):identification.status==='not-applicable'?t("停场 / 停机坪"):t("航班号待确认")}</strong>
      {photo.flights.length>0&&identification.callsign&&<span className="identity-basis">{t("呼号 {0}",[identification.callsign])}</span>}
      <span className="identity-basis">{identification.status==='confirmed'?t("已确认"):identification.status==='inferred'?t("推测 · 待确认"):t("未匹配航班")} · {t(identification.basis)}{identification.sourceUrl&&<> · <a href={identification.sourceUrl} target="_blank" rel="noreferrer">{t("核对来源 ↗")}</a></>}</span>
      {photo.capturedAt&&<span className="identity-basis">{t("拍摄时间（机场当地）")} · <time dateTime={photo.capturedAt}>{photo.capturedAt.slice(0,19).replace('T',' ')}</time> · {t("保留相机时间，未校正时钟偏差")}</span>}
    </div>}
  </div>;
}

export function FlownDetails({flights,exact,onExplore}:{flights:Flight[];exact?:boolean;onExplore:()=>void}) {
  const {t}=useLocale();
  if(!flights.length) return null;
  return <section className="flown-details"><div className="flown-heading"><span><Icon name="plane" size={16}/>{exact?t("这架飞机，我也坐过"):t("我的乘机记录")}</span><button onClick={onExplore}>{t("查看记录")}<Icon name="arrow" size={14}/></button></div>
    <p>{exact?t("同一注册号，连接旅途与拍摄。照片展示拍摄时的涂装。"):t("已记录 {0} 段旅程；乘坐经历与拍摄解锁分开统计。",[flights.length])}</p>
    {flights.slice(0,3).map(f=><div className="flown-detail-row" key={f.id}><time>{f.date}</time><strong>{f.origin} → {f.destination}</strong><span>{f.flight} · {f.registration || t("注册号待确认")}</span></div>)}
  </section>;
}
