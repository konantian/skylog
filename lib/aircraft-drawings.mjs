import drawings from '../data/aircraft-drawings.json' with {type:'json'};

// Only verified reference profiles receive a dimensioned diagram.
// The existing card illustrations keep their independent rendering and scale.
const scales={};
for(const spec of Object.values(drawings)){
  if(spec.status!=='reference')continue;
  const artHeight='artHeight' in spec?spec.artHeight*spec.length/1000:spec.height;
  const scale=Math.min(500/spec.length,174/Math.max(spec.height,artHeight));
  scales[spec.group]=Math.min(scales[spec.group]??Infinity,scale);
}

export function aircraftDrawing(model){
  const spec=drawings[model];
  if(!spec)return null;
  if(spec.status!=='reference')return spec;
  const scale=scales[spec.group],width=spec.length*scale;
  const height=('artHeight' in spec?spec.artHeight/1000*spec.length:spec.height)*scale;
  return {...spec,scale,width,drawnHeight:height,x:(600-width)/2,y:205-height};
}
