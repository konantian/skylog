import {photoUrl} from '@/lib/photo-images.mjs';
import {useLocale} from './locale-provider';
import {shootingDays} from '@/lib/insights.mjs';
import type {Entry,Photo,LiverySighting} from '@/lib/types';
import {Icon} from './icons';

type Moment={date:string;photos:Photo[];airports:string[];newModels:string[];newAirlines:string[];newLiveries:LiverySighting[];cumulativeModels:number;cumulativeAirlines:number;cumulativeLiveries:number};

export function CollectionTimeline({photos,allPhotos,aircraft,airlines,onPhoto}:{photos:Photo[];allPhotos:Photo[];aircraft:Entry[];airlines:Entry[];onPhoto:(ids:string[],index:number)=>void}) {
  const {t}=useLocale();
  const moments=shootingDays(photos,aircraft,airlines,[],allPhotos) as Moment[];
  return <div className="collection-timeline"><div className="timeline-intro"><div className="eyebrow">ONE ENCOUNTER AT A TIME</div><h3>{t("我的天空，慢慢变得丰富。")}</h3><p>{t("按当前图鉴的拍摄日期记录首次相遇。尚未收录的旧照片不计入首次记录；累计数量以整个图鉴为准。")}</p><p>{t("新涂装仅统计特殊彩绘、纪念涂装及明确的新旧或配色版本；普通标准与常规品牌涂装不计入，同款跨机型只计一次。")}</p></div>
    {moments.map(moment=><article className="timeline-moment" key={moment.date}>
      <div className="moment-date"><time dateTime={moment.date}><span>{moment.date.slice(0,4)}</span><strong>{moment.date.slice(5).replace('-',' / ')}</strong></time><span><Icon name="pin" size={12}/>{moment.airports.join(' · ')}</span></div>
      <div className="moment-content"><div className="moment-heading"><h4>{moment.newModels.length||moment.newAirlines.length||moment.newLiveries.length?t("收藏的新一页"):t("再次相遇，新的角度")}</h4><span>{moment.photos.length} {t("张照片")}</span></div>
        <div className="moment-summary"><span><strong>+{moment.newModels.length}</strong> {t("新机型")}</span><span><strong>+{moment.newAirlines.length}</strong> {t("新航司")}</span><span><strong>+{moment.newLiveries.length}</strong> {t("新涂装")}</span><span>{t("累计 {0} 机型 · {1} 航司 · {2} 涂装",[moment.cumulativeModels,moment.cumulativeAirlines,moment.cumulativeLiveries])}</span></div>
        <div className="moment-photos">{moment.photos.slice(0,3).map((photo,index)=><button key={photo.id} onClick={()=>onPhoto(moment.photos.map(p=>p.id),index)} aria-label={t("查看 {0}，{1} {2}",[photo.id,photo.airlines.map(name=>t(name)).join(' / '),photo.models.map(name=>t(name)).join(' / ')])}><img src={photoUrl(photo.thumbnail)} alt={`${photo.airlines.map(name=>t(name)).join(' / ')} ${photo.models.map(name=>t(name)).join(' / ')}`} loading="lazy"/><span>{photo.airlines.map(name=>t(name)).join(' / ')||photo.models.map(name=>t(name)).join(' / ')}</span></button>)}</div>
        {(moment.newModels.length>0||moment.newAirlines.length>0||moment.newLiveries.length>0)&&<details className="moment-unlocks"><summary>{t("查看这一天解锁的机型、航司与涂装")}<Icon name="chevron" size={13}/></summary><div>{moment.newModels.length>0&&<div><h5>{t("首次拍到的机型")}</h5><p>{moment.newModels.map(name=>t(name)).join(' · ')}</p></div>}{moment.newAirlines.length>0&&<div><h5>{t("首次拍到的航司")}</h5><p>{moment.newAirlines.map(name=>t(name)).join(' · ')}</p></div>}{moment.newLiveries.length>0&&<div className="moment-liveries"><h5>{t("首次拍到的涂装")}</h5>{moment.newLiveries.map(livery=><p key={JSON.stringify([livery.airline,livery.livery])}>{t(livery.airline)} · {t(livery.livery)}</p>)}</div>}</div></details>}
      </div>
    </article>)}
  </div>;
}
