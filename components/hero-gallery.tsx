import {useLocale} from './locale-provider';
import {useEffect,useRef,useState} from 'react';
import type {Photo} from '@/lib/types';
import {Icon} from './icons';
const asset=(path:string)=>`${process.env.NEXT_PUBLIC_BASE_PATH||''}${path}`;

export function HeroGallery({photos,onPhoto}:{photos:Photo[];onPhoto:(index:number)=>void}) {
  const {t}=useLocale();
  const reel=useRef<HTMLDivElement>(null);
  const gallery=useRef<HTMLElement>(null);
  const currentIndex=useRef(0);
  const [index,setIndex]=useState(0);
  const [paused,setPaused]=useState(false);
  const [hovered,setHovered]=useState(false);
  const [visible,setVisible]=useState(false);
  const [reduced,setReduced]=useState(true);
  const [hidden,setHidden]=useState(false);
  const move=(next:number,manual=true)=>{
    if(manual)setPaused(true);
    const node=reel.current;if(!node)return;
    if(manual&&node.contains(document.activeElement))node.focus({preventScroll:true});
    const target=(next+photos.length)%photos.length;
    node.scrollTo({left:target*node.clientWidth,behavior:reduced||Math.abs(target-index)>1?'instant':'smooth'});
  };
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>setReduced(motion.matches);
    const updateVisibility=()=>setHidden(document.hidden);
    updateMotion();updateVisibility();
    motion.addEventListener('change',updateMotion);document.addEventListener('visibilitychange',updateVisibility);
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.25});observer.observe(gallery.current!);
    return()=>{observer.disconnect();motion.removeEventListener('change',updateMotion);document.removeEventListener('visibilitychange',updateVisibility);};
  },[]);
  useEffect(()=>{
    if(paused||hovered||!visible||reduced||hidden)return;
    const timer=window.setTimeout(()=>move(index+1,false),6000);
    return()=>window.clearTimeout(timer);
  },[index,paused,hovered,visible,reduced,hidden]);
  useEffect(()=>{
    const node=reel.current!;
    let width=node.clientWidth;
    const resize=new ResizeObserver(()=>{if(node.clientWidth!==width){width=node.clientWidth;node.scrollTo({left:currentIndex.current*width,behavior:'instant'});}});resize.observe(node);
    return()=>resize.disconnect();
  },[]);

  return <section className="hero-gallery" ref={gallery} aria-label={t("十张精选摄影轮播")} aria-roledescription={t("轮播")} onFocusCapture={e=>{if(e.target instanceof HTMLElement&&e.target.matches(':focus-visible'))setPaused(true);}} onPointerEnter={e=>{if(e.pointerType==='mouse')setHovered(true);}} onPointerLeave={()=>setHovered(false)}>
    <div className="hero-reel" ref={reel} tabIndex={0} role="group" aria-label={t("精选照片，左右方向键切换")} onScroll={e=>{const node=e.currentTarget;const next=Math.max(0,Math.min(photos.length-1,Math.round(node.scrollLeft/node.clientWidth)));currentIndex.current=next;setIndex(next);}} onPointerDown={()=>setPaused(true)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(index+(e.key==='ArrowRight'?1:-1));}}}>
      {photos.map((photo,i)=><button className="hero-photo" key={photo.id} tabIndex={i===index?0:-1} aria-hidden={i!==index} onFocus={()=>setPaused(true)} onClick={()=>onPhoto(i)} aria-label={t("查看精选照片 {0}，{1} {2}",[i+1,photo.airlines.join(' / '),photo.models.join(' / ')])}>
        <img src={asset(photo.image)} alt={`${photo.airlines.join(' / ')} ${photo.models.join(' / ')}`} loading={i===0?'eager':'lazy'} fetchPriority={i===0?'high':'auto'}/><span className="photo-corner">{String(i+1).padStart(2,'0')} / FROM MY VIEWFINDER</span><span className="hero-caption"><span><small>SELECTED CAPTURES</small><strong>{photo.models.join(' / ')}</strong><span>{photo.airlines.join(' / ')} <i/> {photo.airport}</span></span><span className="round-arrow"><Icon name="diagonal"/></span></span>
      </button>)}
    </div>
    <div className="hero-gallery-controls"><span className="hero-slide-count" aria-live={paused?'polite':'off'}>{String(index+1).padStart(2,'0')}<span> / {String(photos.length).padStart(2,'0')}</span></span><div className="hero-slide-steps" aria-hidden="true">{photos.map((photo,i)=><i key={photo.id} className={i===index?'current':''}/>)}</div><div className="hero-slide-buttons"><button aria-label={t("上一张精选")} onClick={()=>move(index-1)}><Icon name="arrow" size={16}/></button><button disabled={reduced} aria-label={reduced?t("自动轮播已关闭（减少动态效果）"):paused?t("播放精选轮播"):t("暂停精选轮播")} aria-pressed={!paused&&!reduced} onClick={()=>setPaused(!paused)}>{paused||reduced?<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="m6 3 11 7-11 7Z" fill="currentColor"/></svg>:<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M5 4h3v12H5zm7 0h3v12h-3z" fill="currentColor"/></svg>}</button><button aria-label={t("下一张精选")} onClick={()=>move(index+1)}><Icon name="arrow" size={16}/></button></div></div>
  </section>;
}
