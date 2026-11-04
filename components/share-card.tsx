import {useMobileLayer} from './use-mobile-layer';
import {LanguageSwitch,useLocale} from './locale-provider';
import {useEffect,useRef,useState} from 'react';
import airports from '@/data/airports.json';
import {renderShareCard,shareCardDetails} from '@/lib/share-card.mjs';
import type {Flight,Photo} from '@/lib/types';
import {Icon} from './icons';

export type ShareCardSource={kind:'photo';photo:Photo}|{kind:'flight';flight:Flight};
type Orientation='landscape'|'portrait';

export function ShareCard({source,onClose}:{source:ShareCardSource;onClose:()=>void}) {
  useMobileLayer(true,onClose);
  const {t,locale}=useLocale();
  const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const [card,setCard]=useState<{url:string;file:File}|null>(null);
  const [orientation,setOrientation]=useState<Orientation>(()=>{
    try{return localStorage.getItem(`skylog-share-orientation-${source.kind}`)==='portrait'?'portrait':'landscape';}catch{return 'landscape';}
  });
  const [error,setError]=useState(''),[attempt,setAttempt]=useState(0),[shareStatus,setShareStatus]=useState(''),[sharing,setSharing]=useState(false);
  const details=shareCardDetails(source,airports,orientation,locale);
  const title=source.kind==='photo'?t("摄影分享卡"):t("我的登机牌");
  useEffect(()=>{
    const el=dialog.current!,previous=document.activeElement as HTMLElement|null;
    el.showModal();heading.current?.focus({preventScroll:true});
    return()=>{el.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  useEffect(()=>{
    let cancelled=false,url='';setCard(null);setError('');setShareStatus('');
    const next=shareCardDetails(source,airports,orientation,locale);
    renderShareCard(next,process.env.NEXT_PUBLIC_BASE_PATH||'').then(result=>{
      if(cancelled)return;
      const blob=result as Blob;url=URL.createObjectURL(blob);
      setCard({url,file:new File([blob],next.filename,{type:'image/png'})});
    }).catch(()=>{if(!cancelled)setError(t("图片生成失败，请重试。"));});
    return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
  },[source,orientation,attempt,locale]);
  const changeOrientation=(next:Orientation)=>{
    if(next===orientation)return;
    setCard(null);setError('');setShareStatus('');setOrientation(next);
    try{localStorage.setItem(`skylog-share-orientation-${source.kind}`,next);}catch{/* Browsers may block preference storage. */}
  };
  const share=async()=>{
    if(!card||sharing)return;setSharing(true);setShareStatus('');
    try{await navigator.share({files:[card.file],title});setShareStatus(t("已完成系统分享。"));}
    catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setShareStatus(t("系统分享未完成，可以使用“下载 PNG”。"));}
    finally{setSharing(false);}
  };
  const canShare=card&&typeof navigator!=='undefined'&&navigator.canShare?.({files:[card.file]});
  return <dialog ref={dialog} className="play-dialog share-card-dialog" aria-labelledby="share-card-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header className="play-dialog-head"><div><span className="eyebrow">MADE TO KEEP · MADE TO SHARE</span><h2 id="share-card-title" ref={heading} tabIndex={-1}>{title}</h2></div><div className="dialog-actions"><LanguageSwitch/><button className="icon-button" aria-label={t("关闭分享卡")} onClick={onClose}><Icon name="close" size={23}/></button></div></header>
    <div className="share-card-body"><div className="photo-layout-tabs share-card-orientation" role="group" aria-label={t("分享卡方向")}>
      <button aria-pressed={orientation==='landscape'} disabled={sharing} onClick={()=>changeOrientation('landscape')}><span aria-hidden="true" className="orientation-icon landscape"/>{t("横版")}</button>
      <button aria-pressed={orientation==='portrait'} disabled={sharing} onClick={()=>changeOrientation('portrait')}><span aria-hidden="true" className="orientation-icon portrait"/>{t("竖版")}</button>
    </div><div className={`share-card-preview ${source.kind} ${orientation}`} aria-busy={!card&&!error}>
      {card?<img src={card.url} width={details.width} height={details.height} alt={'image' in details?t("{0} · {1} · {2} · {3} · 摄影 Yuan Wang",[details.airline,details.model,details.airport,details.date]):t("{0} · {1} · {2} {3} 至 {4} {5} · {6} · Yuan Wang 飞行纪念卡",[details.date,details.flight,details.origin,details.originCity,details.destination,details.destinationCity,details.model])}/>:error?<div role="alert"><p>{error}</p><button className="play-secondary" onClick={()=>setAttempt(n=>n+1)}>{t("重新生成")}</button></div>:<p role="status">{t("正在生成高清分享卡…")}</p>}
    </div><div className="share-card-actions"><div><strong>{orientation==='landscape'?t("横版"):t("竖版")} PNG · {details.width} × {details.height}</strong><p>{source.kind==='photo'?t("保留完整构图 · 摄影 Yuan Wang"):t("保留原乘机记录 · 飞行纪念卡")}</p></div><div>{canShare&&<button className="play-secondary" disabled={sharing} onClick={share}><Icon name="share" size={16}/>{t("系统分享")}</button>}{card?<a className="play-primary" href={card.url} download={details.filename}><Icon name="download" size={16}/>{t("下载 PNG")}</a>:<button className="play-primary" disabled><Icon name="download" size={16}/>{t("下载 PNG")}</button>}</div></div>
    <p className="play-note">{canShare?t("可直接使用系统分享，或下载后发到朋友圈。"):t("下载后可保存到相册，再分享到朋友圈。")} {t("图片仅在当前浏览器生成。")}</p>{shareStatus&&<p className="play-note" role="status">{shareStatus}</p>}</div>
  </dialog>;
}
