import {useEffect,useRef} from 'react';
import {Icon} from './icons';
import {observeReveals} from '@/lib/scroll-motion.mjs';

export function ScrollExperience({revision,enabled}:{revision:string;enabled:boolean}) {
  const progress=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!enabled)return;
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    let stopReveals=()=>{};
    const configure=()=>{
      stopReveals();
      if(!preference.matches)stopReveals=observeReveals(document.querySelector('main')!);
    };
    configure();preference.addEventListener('change',configure);
    return()=>{stopReveals();preference.removeEventListener('change',configure);};
  },[revision,enabled]);

  useEffect(()=>{
    const root=document.documentElement;
    let frame=0;
    const paint=()=>{
      frame=0;
      const available=root.scrollHeight-window.innerHeight;
      const fraction=available>0?Math.max(0,Math.min(1,window.scrollY/available)):0;
      progress.current?.style.setProperty('--journey',String(fraction));
      progress.current?.setAttribute('data-started',String(window.scrollY>24));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    const resize=new ResizeObserver(schedule);resize.observe(document.body);
    paint();
    return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[]);

  return <div className="journey-progress" ref={progress} aria-hidden="true"><span className="journey-trail"/><span className="journey-plane"><Icon name="plane" size={19}/></span></div>;
}
