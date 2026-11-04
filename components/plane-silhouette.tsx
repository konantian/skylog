import { aircraftShape } from '../lib/aircraft-silhouettes.mjs';

const paints:Record<string,string>={body:'currentColor',shade:'var(--aircraft-shade)',window:'var(--aircraft-window)',highlight:'var(--aircraft-highlight)',none:'none'};

export function PlaneSilhouette({model='',family='',category='宽体客机'}:{model?:string;family?:string;category?:string}) {
  const shape=aircraftShape({model,family,category});
  return <svg className="plane-silhouette" viewBox="0 0 600 240" aria-hidden="true" data-airframe={shape.family} data-model={shape.model} data-length-m={shape.known?shape.length:undefined}>
    <g transform={`translate(${shape.offset} 145) scale(${shape.scale})`}>
      {shape.paths.map((part,index)=><path key={index} data-feature={part.feature} d={part.d} fill={paints[part.fill]} stroke={paints[part.stroke]||undefined} strokeWidth={part.strokeWidth||undefined} strokeLinejoin="round"/>)}
    </g>
  </svg>;
}
