import {useEffect,useRef} from 'react';

const liveLayers=new Set<string>();
let returning=false;
// One history entry per mobile modal lets system Back dismiss the topmost layer.
export function useMobileLayer(open:boolean,onClose:()=>void,allScreens=false) {
  const close=useRef(onClose);close.current=onClose;
  const owned=useRef<string|null>(null);
  useEffect(()=>{
    if(!open||!allScreens&&!window.matchMedia('(max-width: 760px), (max-height: 500px) and (pointer: coarse)').matches)return;
    const id=owned.current??crypto.randomUUID();owned.current=id;
    liveLayers.add(id);
    if(!history.state?.skylogLayers?.includes(id))history.pushState({...history.state,skylogLayers:[...(history.state?.skylogLayers||[]),id]},'');
    const back=()=>{returning=false;if(!history.state?.skylogLayers?.includes(id))close.current();};
    window.addEventListener('popstate',back);
    return()=>{
      liveLayers.delete(id);window.removeEventListener('popstate',back);
      // Defer past Strict Mode's setup/cleanup replay; collapse concurrently closed nested layers together.
      queueMicrotask(()=>{
        if(returning)return;
        const layers:string[]=history.state?.skylogLayers||[];
        let count=0;
        for(let i=layers.length-1;i>=0&&!liveLayers.has(layers[i]);i--)count++;
        if(count){returning=true;window.addEventListener('popstate',()=>{returning=false;},{once:true});history.go(-count);}
      });
    };
  },[open,allScreens]);
}
