export const initialFilters = { query: '', status: 'all', airport: 'all', manufacturer: 'all', airline: 'all', model: 'all', category: 'all', livery: 'all', sort: 'curated' };
const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export function photoMatches(photo, filters, aircraft) {
  if (filters.airport !== 'all' && photo.airport !== filters.airport) return false;
  if (filters.airline !== 'all' && !photo.airlines.includes(filters.airline)) return false;
  if (photo.subjects && filters.airline !== 'all' && filters.model !== 'all' && !photo.subjects.some(s => s.airline === filters.airline && s.model === filters.model)) return false;
  if (filters.livery !== 'all' && photo.livery !== filters.livery) return false;
  if (filters.model !== 'all' && !photo.models.includes(filters.model)) return false;
  if (filters.manufacturer === 'all' && filters.category === 'all') return true;
  return photo.models.some(model => {
    if (filters.model !== 'all' && model !== filters.model) return false;
    const entry = aircraft.find(a => a.name === model);
    return (filters.manufacturer === 'all' || entry?.manufacturer === filters.manufacturer) &&
      (filters.category === 'all' || entry?.category === filters.category);
  });
}
const photoText = (p, airlines) => [p.id,p.date,p.livery,...p.models,...p.flights,...p.airlines.flatMap(name => [name,airlines.find(a => a.name === name)?.chineseName])].join(' ');
export function filterCatalog(entries, photos, filters, mode, aircraft = entries, airlines = []) {
  const byId = new Map(photos.map(photo => [photo.id, photo]));
  const query = normalize(filters.query);
  const relatedFilter = ['airport','manufacturer','airline','model','category','livery'].some(key => filters[key] !== 'all');
  const results = entries.filter(entry => {
    if (filters.status === 'unlocked' && !entry.unlocked) return false;
    if (filters.status === 'locked' && entry.unlocked) return false;
    if (mode === 'aircraft' && ((filters.manufacturer !== 'all' && entry.manufacturer !== filters.manufacturer) || (filters.model !== 'all' && entry.name !== filters.model) || (filters.category !== 'all' && entry.category !== filters.category))) return false;
    if (mode === 'airlines' && filters.airline !== 'all' && entry.name !== filters.airline) return false;
    const matches = entry.photoIds.map(id => byId.get(id)).filter(Boolean).filter(p => photoMatches(p,filters,aircraft));
    // Relational filters must match the same photograph; do not invent routes for locked entries.
    if (relatedFilter && !matches.length) {
      const selfOnly = mode === 'aircraft' ? filters.airport === 'all' && filters.airline === 'all' && filters.livery === 'all' : ['airport','manufacturer','model','category','livery'].every(key => filters[key] === 'all');
      if (entry.unlocked || !selfOnly) return false;
    }
    return !query || normalize([entry.name,entry.chineseName,entry.code,entry.family,entry.category,entry.manufacturer,entry.country,...matches.map(p => photoText(p,airlines))].join(' ')).includes(query);
  });
  if (filters.sort === 'name') results.sort((a,b) => a.name.localeCompare(b.name,'en',{numeric:true}));
  if (filters.sort === 'latest') results.sort((a,b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''));
  if (filters.sort === 'count') results.sort((a,b) => b.photoIds.length-a.photoIds.length);
  return results;
}
export function filterPhotos(photos, filters, aircraft, airlines = []) {
  const query = normalize(filters.query);
  const results = photos.filter(p => photoMatches(p, filters, aircraft) && (!query || normalize(photoText(p,airlines)).includes(query)));
  if (filters.sort === 'name') results.sort((a,b) => a.id.localeCompare(b.id));
  if (filters.sort === 'latest') results.sort((a,b) => b.date.localeCompare(a.date));
  return results;
}

export function groupModelVariants(model, photos, airlines) {
  const groups = new Map();
  for (const photo of photos) {
    const names = photo.subjects ? photo.subjects.filter(s=>s.model===model.name).map(s=>s.airline) : photo.airlines;
    for (const name of names.length ? names : ['Private / Business']) {
      const livery = photo.livery;
      const key = `${model.id}:${name}:${livery}`;
      if (!groups.has(key)) {
        const airline = airlines.find(a=>a.name===name);
        groups.set(key,{...model,id:key,name,kind:'variant',displayModel:model.name,chineseName:airline?.chineseName,code:airline?.code,livery,photoIds:[],airports:[],cover:photo.id,unlocked:true,firstSeen:photo.date,lastSeen:photo.date});
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
