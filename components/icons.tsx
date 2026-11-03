import type { CSSProperties } from 'react';
export function Icon({name,size=20,className='',style}:{name:string;size?:number;className?:string;style?:CSSProperties}) {
  const paths:Record<string,React.ReactNode>={
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

export function PlaneSilhouette({category='宽体客机',family=''}:{category?:string;family?:string}) {
  const prop=category==='涡桨飞机';
  const rear=category==='公务机'||/^(CRJ|ERJ|Challenger|Global|Citation|G200|Praetor)/.test(family);
  const jumbo=family==='747',doubleDeck=family==='A380',trijet=family==='MD-11';
  const four=['A340','A380','747','An-124'].includes(family);
  const wide=category==='宽体客机'||category==='货机';
  const nose=prop?492:rear?510:wide?552:530;
  const top=doubleDeck?110:wide?122:126,bottom=doubleDeck?162:wide?160:155;
  const middle=(top+bottom)/2;
  const type=prop?'turboprop':rear?'rear-engine':jumbo?'747':doubleDeck?'double-deck':trijet?'trijet':four?'four-engine':wide?'widebody':'narrowbody';
  const engine=(x:number,y:number,scale=1)=><g className="silhouette-engine" transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 5Q15-1 43 2L48 5V19L43 22Q14 24 0 17Z" fill="currentColor"/>
    <path d="M0 13Q21 21 47 16V19L43 22Q14 24 0 17Z" fill="var(--aircraft-shade)"/>
    <ellipse cx="47" cy="12" rx="4" ry="8" fill="var(--aircraft-window)"/>
    <path d="M7 5H39" stroke="var(--aircraft-highlight)" strokeWidth="1.5" fill="none"/>
  </g>;
  const windows=(y:number,start=183,end=nose-62)=>Array.from({length:Math.max(0,Math.floor((end-start)/11))},(_,i)=><rect key={`${y}-${i}`} x={start+i*11} y={y} width="4.5" height="5.5" rx="2"/>);
  return <svg className="plane-silhouette" viewBox="0 0 600 240" aria-hidden="true" data-airframe={type}>
    {/* Family cues stay recognizable without claiming a scale-accurate blueprint. */}
    <path d={prop||rear?'M116 139 76 57Q74 53 80 53H98L151 137Z':'M119 140 64 58Q62 54 68 54H94Q99 54 102 60L164 138Z'} fill="currentColor"/>
    <path d="M121 132 83 63H92L148 134Z" fill="var(--aircraft-highlight)" opacity=".35"/>
    {(prop||rear)&&<path d="M82 57 39 55 48 50 112 52 143 59 132 64Z" fill="var(--aircraft-shade)"/>}
    {trijet&&<>{engine(85,87,.92)}<path d="M111 109v18" stroke="currentColor" strokeWidth="13"/></>}
    <path d={`M79 139Q132 ${top+2} 173 ${top}${jumbo?`H340Q359 ${top} 371 ${top-12}Q378 ${top-18} 393 ${top-18}H${nose-60}Q${nose-34} ${top-18} ${nose-22} ${top+5}`:`H${nose-56}Q${nose-33} ${top} ${nose-23} ${top+7}`}L${nose-7} ${middle-1}Q${nose+7} ${middle+3} ${nose-4} ${middle+7}Q${nose-23} ${bottom} ${nose-58} ${bottom}H174Q130 ${bottom-1} 79 145Z`} fill="currentColor"/>
    <path d={`M94 144Q161 ${bottom-5} 208 ${bottom-5}H${nose-54}Q${nose-17} ${bottom-6} ${nose-3} 146Q${nose-24} ${bottom} ${nose-58} ${bottom}H174Q130 ${bottom-1} 94 145Z`} fill="var(--aircraft-shade)"/>
    <path d={`M173 ${top+2}H${jumbo?335:nose-61}`} stroke="var(--aircraft-highlight)" strokeWidth="2" opacity=".65"/>
    <g fill="var(--aircraft-window)">
      {category!=='货机'&&windows(top+8)}
      {jumbo&&windows(top-10,395,nose-65)}
      {doubleDeck&&windows(top+23)}
      <path d={`M${nose-42} ${jumbo?top-6:top+7}h9l8 7h-15Z M${nose-30} ${jumbo?top-6:top+7}l8 2 8 7h-8Z`}/>
    </g>
    <g fill="none" stroke="var(--aircraft-shade)" strokeWidth="1.4">
      <rect x="163" y={top+5} width="8" height={bottom-top-10} rx="3"/>
      <rect x={nose-63} y={top+5} width="8" height={bottom-top-10} rx="3"/>
      {category==='货机'&&<rect x={nose-129} y={top+4} width="48" height={bottom-top-9} rx="2"/>}
    </g>
    {!(prop||rear)&&<path d="M130 142 74 159 55 158 94 138Z" fill="var(--aircraft-shade)"/>}
    <path d={prop?'M308 126 234 178 213 180 272 127Z':'M350 143 235 180 211 178 292 139Z'} fill="var(--aircraft-shade)"/>
    <path d={prop?'M308 126 234 175 225 175 280 128Z':'M350 143 235 176 224 175 298 139Z'} fill="currentColor"/>
    {prop?<g className="silhouette-propellers">
      <path d="M272 143Q284 139 315 145L325 152 315 158H276Z" fill="currentColor"/>
      <path d="M280 154h35" stroke="var(--aircraft-shade)" strokeWidth="4"/>
      <path d="M322 121 325 149 329 181 324 178 320 154 317 123Z" fill="var(--aircraft-window)"/>
      <path d="m311 133 23 35m-23-3 23-29" stroke="var(--aircraft-window)" strokeWidth="3"/>
      <circle cx="323" cy="151" r="4" fill="currentColor"/>
    </g>:rear?engine(141,143,.82):<>
      <path d="M315 153v12" stroke="var(--aircraft-shade)" strokeWidth="13"/>
      {engine(four?280:295,160,four?.87:wide?1.13:.95)}
      {four&&engine(229,170,.72)}
    </>}
  </svg>;
}
