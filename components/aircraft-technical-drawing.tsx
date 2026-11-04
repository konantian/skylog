import {aircraftDrawing} from '@/lib/aircraft-drawings.mjs';
import {useLocale} from './locale-provider';

export function AircraftTechnicalDrawing({model}:{model:string}){
  const {t}=useLocale();
  const drawing=aircraftDrawing(model);
  if(!drawing)return null;
  if(drawing.status!=='reference')return <p className="technical-pending">{t('此型号的官方技术图尚待核验，预览保留比例示意。')}</p>;
  const {length,span,height,x,width,scale}=drawing;
  const rulerMetres=length<25?5:10,rulerWidth=rulerMetres*scale;
  const reference=drawing.status==='reference';
  const basePath=process.env.NEXT_PUBLIC_BASE_PATH||'';
  const margin=width*.003;
  return <figure className="aircraft-technical" data-reference={reference}>
    <div className="technical-heading"><span>{t('外形与尺寸')}</span><span>{t('referenceLabel' in drawing?drawing.referenceLabel:'官方资料参考图')}</span></div>
    <svg className="technical-canvas" viewBox="0 0 600 295" role="img" aria-label={t('{0}，机长 {1} 米，翼展 {2} 米，机高 {3} 米',[model,length,span,height])}>
      <path className="technical-baseline" d="M35 205H565"/>
      {'asset' in drawing&&<image className="technical-aircraft" href={`${basePath}${drawing.asset}`} x={x-margin} y={drawing.y-margin} width={width+margin*2} height={drawing.drawnHeight+margin*2}/>}
      <g className="technical-dimensions" fill="none" stroke="currentColor">
        <path d={`M${x} 214V246M${x+width} 214V246M${x} 237H${x+width}`}/>
        <path d={`M${x+6} 234L${x} 237L${x+6} 240M${x+width-6} 234L${x+width} 237L${x+width-6} 240`}/>
      </g>
      <rect className="technical-label-bg" x="255" y="225" width="90" height="24" rx="3"/>
      <text className="technical-length" x="300" y="242" textAnchor="middle">{length} m</text>
      <path className="technical-ruler" d={`M40 270v6h${rulerWidth/2}v-6h${rulerWidth/2}v6h${-rulerWidth/2}v-6Z`}/>
      <text className="technical-scale" x={40+rulerWidth+10} y="277">{rulerMetres} m</text>
      <text className="technical-scale" x="560" y="277" textAnchor="end">{t('家族内同比例')}</text>
    </svg>
    <dl className="technical-specs">
      <div><dt>{t('机长')}</dt><dd>{length}<small>m</small></dd></div>
      <div><dt>{t('翼展')}</dt><dd>{span}<small>m</small></dd></div>
      <div><dt>{t('机高')}</dt><dd>{height}<small>m</small></dd></div>
    </dl>
    <figcaption>
      <p>{t('代表构型的图鉴示意；尺寸会随翼尖、起落架姿态及改装变化。')}</p>
      {'note' in drawing&&<p>{t(drawing.note)}</p>}
      <a href={`${drawing.source.url}${'page' in drawing.source?`#page=${drawing.source.page}`:''}`} target="_blank" rel="noreferrer">{t('图纸与尺寸来源')} · {drawing.source.title} ↗</a>
      {'additionalSources' in drawing&&drawing.additionalSources.map((source:{title:string;url:string;page?:number})=><p key={source.url}><a href={`${source.url}${source.page?`#page=${source.page}`:''}`} target="_blank" rel="noreferrer">{t('补充资料')} · {source.title} ↗</a></p>)}
    </figcaption>
  </figure>;
}
