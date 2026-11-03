/** @type {Promise<number>|undefined} */
let pageView;

// Keep one request per document, including React Strict Mode and component remounts.
export function loadPageViews(endpoint){
  if(!pageView){
    const {origin,pathname}=window.location;
    const live=origin==='https://konantian.github.io'&&(pathname==='/skylog'||pathname.startsWith('/skylog/'));
    pageView=fetch(endpoint,{
      method:live?'POST':'GET',
      credentials:'omit',
      cache:'no-store',
      signal:AbortSignal.timeout(8000),
    }).then(async response=>{
      if(!response.ok)throw new Error('Page-view counter unavailable');
      const {count}=await response.json();
      if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid page-view count');
      return count;
    });
  }
  return pageView;
}
