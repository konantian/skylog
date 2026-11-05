'use client';

import {useEffect,useRef,useState} from 'react';
import type {Photo} from '@/lib/types';
import {originalPhoto,photoImageSources} from '@/lib/photo-images.mjs';
import {useMobileLayer} from './use-mobile-layer';
import {useLocale} from './locale-provider';
import {Icon} from './icons';

export function PhotoFullscreen({photo,onClose,onPrevious,onNext}:{photo:Photo;onClose:()=>void;onPrevious?:()=>void;onNext?:()=>void}) {
  const {t}=useLocale();
  const dialog=useRef<HTMLDialogElement>(null);
  const [loaded,setLoaded]=useState('');
  const [failed,setFailed]=useState('');
  useMobileLayer(true,onClose);
  useEffect(()=>{
    const el=dialog.current!;
    const previous=document.activeElement as HTMLElement|null;
    el.showModal();
    return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  const original=originalPhoto(photo.id);
  const fallback=photoImageSources(photo,process.env.NEXT_PUBLIC_BASE_PATH);
  return <dialog ref={dialog} className="immersive-photo" aria-label={t('全屏查看照片')} onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{
    if(e.key==='ArrowLeft'&&onPrevious){e.preventDefault();onPrevious();}
    if(e.key==='ArrowRight'&&onNext){e.preventDefault();onNext();}
    e.stopPropagation();
  }}>
    <img key={photo.id} {...(original?{src:original.url}:fallback)} sizes="100vw" onLoad={()=>{setLoaded(photo.id);setFailed('');}} onError={e=>{
      const image=e.currentTarget;
      if(original&&!image.dataset.fallback){image.dataset.fallback='true';image.srcset=fallback.srcSet;image.src=fallback.src;}
      else setFailed(photo.id);
    }} alt={`${photo.airlines.map(name=>t(name)).join(' / ')} · ${photo.models.map(name=>t(name)).join(' / ')} · ${photo.id}`}/>
    {failed===photo.id?<p className="immersive-status" role="alert">{t('照片加载失败，请关闭后重试。')}</p>:loaded!==photo.id&&<p className="immersive-status" role="status">{t('正在加载照片…')}</p>}
    <button autoFocus className="immersive-close" onClick={onClose} aria-label={t('关闭全屏')}><Icon name="close" size={24}/></button>
    {onPrevious&&<button className="immersive-previous" onClick={onPrevious} aria-label={t('上一张照片')}><Icon name="chevron" size={24}/></button>}
    {onNext&&<button className="immersive-next" onClick={onNext} aria-label={t('下一张照片')}><Icon name="chevron" size={24}/></button>}
  </dialog>;
}
