import type {MetadataRoute} from 'next';

export const dynamic='force-static';

export default function manifest():MetadataRoute.Manifest{
  const base=process.env.NEXT_PUBLIC_BASE_PATH||'';
  return {
    id:`${base}/`,
    name:'SKYLOG · Yuan 的飞机图鉴',
    short_name:'SKYLOG',
    description:'追逐天空，收藏相遇。Yuan Wang 的飞机摄影与乘机记录。',
    lang:'zh-CN',
    start_url:`${base}/`,
    scope:`${base}/`,
    display:'standalone',
    background_color:'#0b151e',
    theme_color:'#0b151e',
    icons:[
      {src:`${base}/icons/skylog-192.png`,sizes:'192x192',type:'image/png',purpose:'any'},
      {src:`${base}/icons/skylog-512.png`,sizes:'512x512',type:'image/png',purpose:'any'},
      {src:`${base}/icons/skylog-512.png`,sizes:'512x512',type:'image/png',purpose:'maskable'},
    ],
  };
}
