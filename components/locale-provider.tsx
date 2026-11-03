'use client';

import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {localeUrl,resolveLocale,translate} from '@/lib/i18n.mjs';

type Locale='zh'|'en';
type Translator=(key:string|null|undefined,values?:unknown[])=>string;
type LocaleContextValue={locale:Locale;setLocale:(locale:Locale)=>void;t:Translator};
const LocaleContext=createContext<LocaleContextValue>({locale:'zh',setLocale:()=>{},t:(key,values)=>translate('zh',key,values)});

export function LocaleProvider({children}:{children:ReactNode}) {
  const [locale,setLocale]=useState<Locale>('zh');
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let stored=null;
    try{stored=localStorage.getItem('skylog-locale');}catch{/* The switch also works without storage. */}
    setLocale(resolveLocale({search:location.search,stored,languages:navigator.languages}));
    setReady(true);
  },[]);
  useEffect(()=>{
    if(!ready)return;
    document.documentElement.lang=locale==='en'?'en':'zh-CN';
    document.title=translate(locale,'SKYLOG · Yuan 的飞机图鉴');
    document.querySelector('meta[name="description"]')?.setAttribute('content',translate(locale,'每一架飞机，都是亲眼见过的天空。用真实摄影解锁机型和航司，探索 YYZ 与 YVR 的个人航空收藏。'));
    history.replaceState(history.state,'',localeUrl(location.href,locale));
    try{localStorage.setItem('skylog-locale',locale);}catch{/* Keep the in-memory choice. */}
  },[locale,ready]);
  const t=useCallback<Translator>((key,values=[])=>translate(locale,key,values),[locale]);
  const value=useMemo(()=>({locale,setLocale,t}),[locale,t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale=()=>useContext(LocaleContext);

export function LanguageSwitch(){
  const {locale,setLocale,t}=useLocale();
  return <div className="language-switch" role="group" aria-label={t('界面语言')}>
    <button lang="zh-CN" aria-pressed={locale==='zh'} onClick={()=>setLocale('zh')}>中文</button>
    <button lang="en" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>EN</button>
  </div>;
}
