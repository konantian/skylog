import type { CSSProperties } from 'react';
export function Icon({name,size=20,className='',style}:{name:string;size?:number;className?:string;style?:CSSProperties}) {
  const paths:Record<string,React.ReactNode>={
    compare:<><path d="M9 4H3v16h6M15 4h6v16h-6M12 2v20M6 8h3m6 8h3"/></>,
    ticket:<><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4Z"/><path d="M16 5v3m0 3v2m0 3v3"/></>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    share:<><path d="M12 15V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2"/></>,
    quiz:<><circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.5"/></>,
    radar:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M12 3v2M3 12h2M12 19v2M19 12h2"/><circle cx="8" cy="15" r="1" fill="currentColor"/></>,
    award:<><circle cx="12" cy="9" r="6"/><path d="m8 14-2 8 6-3 6 3-2-8m-7-5 2 2 4-4"/></>,
    play:<path d="m8 4 12 8-12 8Z"/>,
    pause:<><path d="M8 4v16M16 4v16"/></>,
    aircraft:<g transform="translate(12 12) scale(.55)" fill="currentColor" stroke="none"><path d="M0-16c2 0 3 4 3 7v4L18 5v3L3 3v9l5 4v2l-8-3-8 3v-2l5-4V3L-18 8V5L-3-5v-4c0-3 1-7 3-7Z"/></g>,
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

export { PlaneSilhouette } from './plane-silhouette';
