import highlights from '../data/photo-highlights.json' with { type: 'json' };
import covers from '../data/cover-selections.json' with { type: 'json' };

const reviewed = [...highlights.representatives, ...highlights.alternateViews];
const reviewOrder = new Map([...new Set([...reviewed, ...covers.preferredPhotos])].map((id, i) => [id, i]));
const featured = new Set(reviewed);

// Keep private aircraft and multi-subject frames, including a distinct livery on the same model.
export function photoGroups(photo) {
  const pairs = photo.subjects?.length
    ? photo.subjects.map(({airline, model}) => [airline, model])
    : (photo.airlines.length ? photo.airlines : ['']).flatMap(airline =>
        (photo.models.length ? photo.models : ['']).map(model => [airline, model]));
  return pairs.map(([airline, model]) => JSON.stringify([airline, model, photo.livery]));
}

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
