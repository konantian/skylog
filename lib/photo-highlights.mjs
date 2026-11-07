import catalog from '../data/catalog.json' with { type: 'json' };
import highlights from '../data/photo-highlights.json' with { type: 'json' };
import covers from '../data/cover-selections.json' with { type: 'json' };

export function photoGroups(photo) {
  const pairs = photo.subjects?.length
    ? photo.subjects.map(({airline, model}) => [airline, model])
    : (photo.airlines.length ? photo.airlines : ['']).flatMap(airline =>
        (photo.models.length ? photo.models : ['']).map(model => [airline, model]));
  return pairs.map(([airline, model]) => JSON.stringify([airline, model, photo.livery]));
}

const rank = ids => new Map(ids.map((id, index) => [id, index]));
const portfolio = rank(highlights.portfolio);
const representatives = rank(highlights.representatives);
const byId = new Map(catalog.photos.map(photo => [photo.id, photo]));
const covered = new Set(catalog.photos.filter(photo => representatives.has(photo.id)).flatMap(photoGroups));
// New combinations get a cover until the next editorial review.
for (const id of [...covers.preferredPhotos, ...byId.keys()]) {
  const photo = byId.get(id);
  if (!photo) continue;
  const groups = photoGroups(photo);
  if (groups.some(group => !covered.has(group))) {
    representatives.set(id, representatives.size);
    for (const group of groups) covered.add(group);
  }
}

const alternateByCover = new Map(Object.entries(highlights.alternateViews));
export const coverByAlternate = new Map([...alternateByCover].map(([cover, alternate]) => [alternate, cover]));

export function photoBrowseMode(filters, preferred = 'portfolio') {
  const query = filters.query.trim();
  // Keep direct links to individual archive photos working.
  if (/^DSC\d{5}$/i.test(query)) return 'lookup';
  if (query || ['airport','airline','model','manufacturer','country','category','livery'].some(key => filters[key] !== 'all')) {
    return 'filtered';
  }
  return preferred;
}

export function photoGridCards(matched, mode, sort = 'curated') {
  if (mode === 'lookup') return matched;
  const order = mode === 'portfolio' ? portfolio : representatives;
  const cards = matched.filter(photo => order.has(photo.id));
  if (sort === 'curated') cards.sort((a,b) => order.get(a.id) - order.get(b.id));
  return cards;
}

// The grid counts covers. The viewer inserts an eligible alternate immediately after its cover.
export function photoGalleryIds(cards, matched) {
  const eligible = new Set(matched.map(photo => photo.id));
  return cards.flatMap(({id}) => {
    const alternate = alternateByCover.get(id);
    return alternate && eligible.has(alternate) ? [id, alternate] : [id];
  });
}

// The released native collection still uses the two-argument gallery selector.
const reviewed = [...highlights.representatives, ...Object.values(highlights.alternateViews)];
const reviewOrder = rank([...new Set([...reviewed, ...covers.preferredPhotos])]);
const featured = new Set(reviewed);

export function photoHighlights(eligible, sort = 'curated') {
  const rank = photo => reviewOrder.get(photo.id) ?? Infinity;
  const ordered = [...eligible].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
  const seen = new Set();
  const selected = new Set();
  for (const photo of ordered) {
    const groups = photoGroups(photo);
    if (featured.has(photo.id) || groups.some(group => !seen.has(group))) {
      selected.add(photo.id);
      for (const group of groups) seen.add(group);
    }
  }
  return (sort === 'curated' ? ordered : eligible).filter(photo => selected.has(photo.id));
}
