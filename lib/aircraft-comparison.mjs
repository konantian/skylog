import {aircraftDrawing} from './aircraft-drawings.mjs';
import {aircraftFamilies,aircraftModels} from './aircraft-silhouettes.mjs';

export function comparisonCues(entry){
  const spec={...aircraftFamilies[entry.family],...aircraftModels[entry.name]};
  return {engines:spec.engines||2,features:[spec.prop?'涡桨动力':'喷气动力',...(spec.rear?['尾部发动机']:[]),...(spec.highWing?['上单翼']:[]),...(spec.deck==='double'?['全长双层客舱']:spec.deck==='hump'?['前部上层客舱']:[])]};
}

/** @param {string[]} selected @param {string} model @param {number} [index] */
export function updateComparison(selected, model, index=selected.length){
  if(!model)return selected.filter((_,i)=>i!==index);
  if(index<0||index>selected.length||index>=3||selected.some((name,i)=>name===model&&i!==index))return selected;
  const next=[...selected];next[index]=model;
  return next;
}

/** @param {string[]} models */
export function comparisonDrawings(models){
  const drawings=models.map(model=>({model,drawing:aircraftDrawing(model)}));
  const verified=drawings.flatMap(({drawing})=>drawing?.status==='reference'?[drawing]:[]);
  if(!verified.length)return [];
  // One metre has the same rendered width, including across unrelated families.
  const scale=Math.min(...verified.map(d=>Math.min(500/d.length,174/Math.max(d.height,'artHeight' in d?d.artHeight*d.length/1000:d.height))));
  return drawings.map(({model,drawing})=>{
    if(!drawing||drawing.status!=='reference')return {model,drawing:null};
    const width=drawing.length*scale;
    const drawnHeight=('artHeight' in drawing?drawing.artHeight*drawing.length/1000:drawing.height)*scale;
    return {model,drawing:{...drawing,scale,width,drawnHeight,x:550-width,y:205-drawnHeight}};
  });
}
