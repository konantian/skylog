const targets='.stats>button,.collection-heading,.catalog-card,.flight-log-intro,.flight-records,.family-collection,.route-map,.flight-statistics,.flight-row,.timeline-intro,.timeline-moment,.end-mark';

// Enhance visible HTML; no observer support or reduced motion leaves every item readable.
export function observeReveals(root) {
  if(typeof IntersectionObserver==='undefined')return()=>{};
  const pending=new Set();
  const enter=element=>{element.dataset.motion='entered';pending.delete(element);};
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){enter(entry.target);observer.unobserve(entry.target);}
  },{threshold:0,rootMargin:'0px 0px -32px 0px'});
  const elements=[...root.querySelectorAll(targets)];
  elements.forEach((element,index)=>{
    if(element.dataset.motion==='entered')return;
    element.style.setProperty('--reveal-delay',`${index%3*65}ms`);
    if(element.getBoundingClientRect().bottom<0){enter(element);return;}
    element.dataset.motion='pending';pending.add(element);observer.observe(element);
  });
  // A keyboard user can focus an item before it intersects the viewport.
  const focus=event=>{const element=event.target.closest('[data-motion="pending"]');if(element){enter(element);observer.unobserve(element);}};
  root.addEventListener('focusin',focus);
  return()=>{observer.disconnect();root.removeEventListener('focusin',focus);for(const element of pending)enter(element);};
}
