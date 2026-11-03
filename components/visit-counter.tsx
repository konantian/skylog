'use client';
import {useLocale} from './locale-provider';


import {useEffect,useState} from 'react';
import {loadPageViews} from '@/lib/page-views.mjs';

const endpoint=process.env.NEXT_PUBLIC_VISITS_URL;

export function VisitCounter(){
  const {t,locale}=useLocale();
  const [count,setCount]=useState<number|null>(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(!endpoint)return;
    let active=true;
    loadPageViews(endpoint).then(value=>{if(active)setCount(value);}).catch(()=>{if(active)setFailed(true);});
    return()=>{active=false;};
  },[]);
  if(!endpoint)return null;
  return <span className="visit-counter" role="status" aria-atomic="true" title={t("累计页面浏览次数，刷新页面会计数；筛选和切换照片不重复计数。")}>
    {t("累计浏览")}<strong>{count===null?'—':count.toLocaleString(locale==='en'?'en-CA':'zh-CN')}</strong> {t("次")}{count===null&&<span className="sr-only">{failed?t("，统计暂时不可用"):t("，正在读取统计")}</span>}
  </span>;
}
