import {translate} from './i18n.mjs';
import {routeKey} from './insights.mjs';
export const initialFilters = { query: '', status: 'all', airport: 'all', manufacturer: 'all', airline: 'all', country: 'all', model: 'all', category: 'all', livery: 'all', sort: 'curated', flightYear:'all', flightAirport:'all', route:'all' };
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export function airlinesForModel(photo, model) {
  return photo.subjects ? [...new Set(photo.subjects.filter(s=>s.model===model).map(s=>s.airline))] : photo.models.includes(model) ? photo.airlines : [];
}
export function modelsForAirline(photo, airline) {
  return photo.subjects ? [...new Set(photo.subjects.filter(s=>s.airline===airline).map(s=>s.model))] : photo.airlines.includes(airline) ? photo.models : [];
}

export function photoMatches(photo, filters, aircraft, airlines = []) {
  if (filters.airport !== 'all' && photo.airport !== filters.airport) return false;
  if (filters.livery !== 'all' && photo.livery !== filters.livery) return false;
  const carrierFilter = filters.airline !== 'all' || filters.country !== 'all';
  const carriers = photo.airlines.filter(name => (filters.airline === 'all' || name === filters.airline) &&
    (filters.country === 'all' || airlines.find(a => a.name === name)?.country === filters.country));
  if (carrierFilter && !carriers.length) return false;
  const modelFilter = ['model','manufacturer','category'].some(key => filters[key] !== 'all');
  const models = photo.models.filter(model => {
    const entry = aircraft.find(a => a.name === model);
    return (filters.model === 'all' || model === filters.model) &&
      (filters.manufacturer === 'all' || entry?.manufacturer === filters.manufacturer) &&
      (filters.category === 'all' || entry?.category === filters.category);
  });
  if (modelFilter && !models.length) return false;
  if (photo.subjects && carrierFilter && modelFilter) return photo.subjects.some(s => carriers.includes(s.airline) && models.includes(s.model));
  return true;
}
const photoText = (p, airlines) => [p.id,p.date,p.livery,translate('en',p.livery),p.registration?.value,...(p.subjects||[]).map(s=>s.registration?.value),p.flightIdentification?.callsign,...p.models,...p.flights,...p.airlines.flatMap(name => [name,airlines.find(a => a.name === name)?.chineseName])].join(' ');
export function filterCatalog(entries, photos, filters, mode, aircraft = entries, airlines = []) {
  const byId = new Map(photos.map(photo => [photo.id, photo]));
  const query = normalize(filters.query);
  const relatedFilter = ['airport','manufacturer','airline','country','model','category','livery'].some(key => filters[key] !== 'all');
  const results = entries.filter(entry => {
    if (filters.status === 'unlocked' && !entry.unlocked) return false;
    if (filters.status === 'locked' && entry.unlocked) return false;
    if (mode === 'aircraft' && ((filters.manufacturer !== 'all' && entry.manufacturer !== filters.manufacturer) || (filters.model !== 'all' && entry.name !== filters.model) || (filters.category !== 'all' && entry.category !== filters.category))) return false;
    if (mode === 'airlines' && filters.airline !== 'all' && entry.name !== filters.airline) return false;
    if (mode === 'airlines' && filters.country !== 'all' && entry.country !== filters.country) return false;
    const scoped = {...filters,...(mode === 'aircraft' ? {model:entry.name} : {airline:entry.name})};
    const matches = entry.photoIds.map(id => byId.get(id)).filter(Boolean).filter(p => photoMatches(p,scoped,aircraft,airlines));
    // Relational filters must match the same photograph; do not invent routes for locked entries.
    if (relatedFilter && !matches.length) {
      const selfOnly = mode === 'aircraft' ? ['airport','airline','country','livery'].every(key => filters[key] === 'all') : ['airport','manufacturer','model','category','livery'].every(key => filters[key] === 'all');
      if (entry.unlocked || !selfOnly) return false;
    }
    return !query || normalize([entry.name,entry.chineseName,entry.code,entry.family,entry.category,translate('en',entry.category),entry.manufacturer,entry.country,translate('en',entry.country),...matches.map(p => photoText(p,airlines))].join(' ')).includes(query);
  });
  if (filters.sort === 'name') results.sort((a,b) => a.name.localeCompare(b.name,'en',{numeric:true}));
  if (filters.sort === 'latest') results.sort((a,b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
  if (filters.sort === 'count') results.sort((a,b) => b.photoIds.length-a.photoIds.length);
  return results;
}
export function filterPhotos(photos, filters, aircraft, airlines = []) {
  const query = normalize(filters.query);
  const results = photos.filter(p => photoMatches(p, filters, aircraft, airlines) && (!query || normalize(photoText(p,airlines)).includes(query)));
  if (filters.sort === 'name') results.sort((a,b) => a.id.localeCompare(b.id));
  if (filters.sort === 'latest') results.sort((a,b) => b.date.localeCompare(a.date));
  return results;
}

export function groupModelVariants(model, photos, airlines) {
  const groups = new Map();
  for (const photo of photos) {
    const names = airlinesForModel(photo,model.name);
    for (const name of names.length ? names : ['Private / Business']) {
      const livery = photo.livery;
      const key = `${model.id}:${name}:${livery}`;
      if (!groups.has(key)) {
        const airline = airlines.find(a=>a.name===name);
        groups.set(key,{...model,id:key,name,kind:'variant',displayModel:model.name,chineseName:airline?.chineseName,code:airline?.code,country:airline?.country,livery,photoIds:[],airports:[],cover:photo.id,unlocked:true,firstSeen:photo.date,lastSeen:photo.date});
      }
      const group=groups.get(key);
      group.photoIds.push(photo.id);
      if(!group.airports.includes(photo.airport)) group.airports.push(photo.airport);
      if(photo.date<group.firstSeen) group.firstSeen=photo.date;
      if(photo.date>group.lastSeen) group.lastSeen=photo.date;
    }
  }
  return [...groups.values()];
}

export function filterFlights(flights, filters, aircraft, airlines) {
  const query = normalize(filters.query);
  return flights.filter(f => {
    if (filters.flightYear !== 'all' && f.date.slice(0,4) !== filters.flightYear) return false;
    if (filters.flightAirport !== 'all' && ![f.origin,f.destination].includes(filters.flightAirport)) return false;
    if (filters.route !== 'all' && routeKey(f) !== filters.route) return false;
    if (filters.airline !== 'all' && f.airline !== filters.airline) return false;
    if (filters.country !== 'all' && airlines.find(a=>a.name===f.airline)?.country !== filters.country) return false;
    if (filters.model !== 'all' && f.model !== filters.model) return false;
    if (filters.manufacturer !== 'all' && !(f.model || f.modelLabel).startsWith(filters.manufacturer + ' ')) return false;
    return !query || normalize([f.flight,f.date,f.airline,airlines.find(a=>a.name===f.airline)?.chineseName,f.modelLabel,f.registration,f.origin,f.destination].join(' ')).includes(query);
  }).sort((a,b)=>filters.sort==='name'?a.modelLabel.localeCompare(b.modelLabel):b.date.localeCompare(a.date));
}

export function flightsForEntry(entry, flights) {
  if (entry.kind === 'airline') return flights.filter(f=>f.airline===entry.name);
  return flights.filter(f=>f.model===(entry.displayModel||entry.name) && (entry.kind!=='variant'||f.airline===entry.name));
}

export function flightsForPhoto(photo, flights) {
  if (photo.registration?.status !== 'confirmed') return [];
  return flights.filter(f=>f.registration===photo.registration.value);
}
