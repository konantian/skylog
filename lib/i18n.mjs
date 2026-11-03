import english from '../data/locale-en.json' with {type:'json'};

/** @param {string} locale @param {string|null|undefined} key @param {unknown[]} values */
export function translate(locale,key,values=[]) {
  const source=String(key??'');
  const message=locale==='en'&&Object.hasOwn(english,source)?english[source]:source;
  return message.replace(/\{(\d+)\}/g,(match,index)=>index<values.length?String(values[index]??''):match);
}

/** @param {{search?:string,stored?:string|null,languages?:readonly string[]}} options */
export function resolveLocale({search='',stored=null,languages=[]}={}) {
  const requested=new URLSearchParams(search).get('lang');
  if(requested==='en'||requested==='zh')return requested;
  if(stored==='en'||stored==='zh')return stored;
  return languages.length?(languages[0].toLowerCase().startsWith('zh')?'zh':'en'):'zh';
}

export function localeUrl(url,locale) {
  const next=new URL(url);
  next.searchParams.set('lang',locale==='en'?'en':'zh');
  return `${next.pathname}${next.search}${next.hash}`;
}
