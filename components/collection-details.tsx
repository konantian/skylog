import profiles from '@/data/aircraft-profiles.json';
import liveries from '@/data/liveries.json';
import type { Entry, Flight, Photo } from '@/lib/types';
import { Icon } from './icons';

type Profile = {description:string;configuration:string;source:string};
type Livery = {name:string;description:string;source?:string};

export function AircraftProfile({entry}:{entry:Entry}) {
  const name = entry.displayModel || entry.name;
  const key = /A31[89]|A32[01]/.test(name) ? 'A320 family' : name.includes('737 MAX') ? '737 MAX' : /737-(700|800|900)/.test(name) ? '737 NG' : name.includes('Dash 8-400') ? 'Dash 8-400' : entry.family || '';
  const profile = (profiles.families as Record<string,Profile>)[key];
  const spec = (profiles.specs as Record<string,{length?:string;span?:string}>)[name];
  return <details className="aircraft-profile" open>
    <summary><span><Icon name="info" size={16}/>机型小档案</span><span>{name}</span></summary>
    <dl className="profile-facts"><div><dt>生产商</dt><dd>{entry.manufacturer}</dd></div><div><dt>家族</dt><dd>{entry.family}</dd></div><div><dt>类别</dt><dd>{entry.category}</dd></div>{spec?.length&&<div><dt>机长</dt><dd>{spec.length}</dd></div>}{spec?.span&&<div><dt>翼展</dt><dd>{spec.span}</dd></div>}</dl>
    {profile&&<><p className="profile-configuration">{entry.category==='货机'?profile.configuration.replace('双通道','货运布局'):profile.configuration}</p><p>{profile.description}</p><a href={profile.source} target="_blank" rel="noreferrer">制造商资料 <Icon name="diagonal" size={12}/></a></>}
  </details>;
}

export function PhotoIdentity({photo}:{photo:Photo}) {
  const livery = (liveries as Record<string,Livery>)[photo.livery];
  return <div className="photo-identity">
    <div><span className="identity-label">REGISTRATION / 注册号</span><strong>{photo.registration?.value || '待确认'}</strong>{photo.registration&&<span className="identity-basis">{photo.registration.status==='confirmed'?'已确认':'推测 · 待确认'} · {photo.registration.basis}{photo.registration.sourceUrl&&<> · <a href={photo.registration.sourceUrl} target="_blank" rel="noreferrer">核对来源 ↗</a></>}</span>}</div>
    <div><span className="identity-label">LIVERY / 涂装</span><strong>{livery?.name || (photo.livery==='标准涂装'?`${photo.airlines.join(' / ')} · 标准涂装`:photo.livery)}</strong>{livery&&<p>{livery.description}{livery.source&&<> <a href={livery.source} target="_blank" rel="noreferrer">了解涂装 ↗</a></>}</p>}</div>
  </div>;
}

export function FlownDetails({flights,exact,onExplore}:{flights:Flight[];exact?:boolean;onExplore:()=>void}) {
  if(!flights.length) return null;
  return <section className="flown-details"><div className="flown-heading"><span><Icon name="plane" size={16}/>{exact?'这架飞机，我也坐过':'我的乘机记录'}</span><button onClick={onExplore}>查看记录 <Icon name="arrow" size={14}/></button></div>
    <p>{exact?'同一注册号，连接旅途与拍摄。照片展示拍摄时的涂装。':`已记录 ${flights.length} 段旅程；乘坐经历与拍摄解锁分开统计。`}</p>
    {flights.slice(0,3).map(f=><div className="flown-detail-row" key={f.id}><time>{f.date}</time><strong>{f.origin} → {f.destination}</strong><span>{f.flight} · {f.registration || '注册号待确认'}</span></div>)}
  </section>;
}
