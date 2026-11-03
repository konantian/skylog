import type { CSSProperties } from 'react';
export function Icon({name,size=20,className='',style}:{name:string;size?:number;className?:string;style?:CSSProperties}) {
  const paths:Record<string,React.ReactNode>={
    play:<path d="m8 4 12 8-12 8Z"/>,
    pause:<><path d="M8 4v16M16 4v16"/></>,
    sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    moon:<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>,
    plane:<><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    arrow:<><path d="M5 12h14m-5-5 5 5-5 5"/></>,
    diagonal:<><path d="M6 18 18 6M6 6h12v12"/></>,
    close:<path d="m6 6 12 12M6 18 18 6"/>,
    chevron:<path d="m9 5 7 7-7 7"/>,
    check:<path d="m5 12 4 4 10-10"/>,
    lock:<><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 3v3"/></>,
    camera:<><path d="M8 5h8l2 3h3v12H3V8h3z"/><circle cx="12" cy="13" r="3"/></>,
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    globe:<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
    filter:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></>,
    pin:<><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    calendar:<><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 11h16"/></>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>{paths[name]??paths.plane}</svg>;
}

export function PlaneSilhouette({category='宽体客机',family=''}:{category?:string;family?:string}) {
  const four = /A340|A380|747|An-124/.test(family);
  return <svg className="plane-silhouette" viewBox="0 0 400 180" aria-hidden="true">
    <g fill="currentColor" stroke="currentColor" strokeLinejoin="round">
      <path d="M32 106 85 102 108 96 319 96Q345 97 365 109Q374 115 359 117L108 118 62 113Z"/>
      <path d="m78 103-35-65h29l47 61ZM173 103l46-65 15 1-21 64ZM180 113l54 35-21 1-67-33ZM75 109l-39 20h21l55-17Z"/>
      <rect x="208" y="115" width="28" height="13" rx="6"/>
      {four && <rect x="246" y="120" width="24" height="11" rx="5"/>}
      {category==='涡桨飞机' && <path d="M235 104v41m-5-35 10 28" fill="none" strokeWidth="4"/>}
      {family==='A380' && <path d="M115 96v-7h194q18 0 33 15Z"/>}
      {family==='747' && <path d="M234 97v-8h63q18 0 35 14Z"/>}
    </g>
    <path d="M325 102h12m-19 0h-4" stroke="var(--locked-bg)" strokeWidth="3"/>
  </svg>;
}
