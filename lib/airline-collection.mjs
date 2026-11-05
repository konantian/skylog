import {modelsForAirline} from './filter.mjs';

const registrationKey = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// A multi-aircraft photograph only contributes the subjects belonging to this airline.
export function airlineRegistrations(photo, airline) {
  const registrations = photo.subjects
    ? photo.subjects.filter(s => s.airline === airline).map(s => s.registration)
    : photo.airlines.length === 1 && photo.airlines[0] === airline ? [photo.registration] : [];
  return registrations.filter(r => r?.status === 'confirmed' && r.value);
}

export function airlineCollection(entry, photos, flights, preferredIds = []) {
  const ids = new Set(entry.photoIds);
  const captures = photos.filter(p => ids.has(p.id) && p.airlines.includes(entry.name));
  const rank = new Map(preferredIds.map((id, i) => [id, i]));
  const entryRank = new Map(entry.photoIds.map((id, i) => [id, i]));
  const photoRank = p => rank.get(p.id) ?? preferredIds.length + (entryRank.get(p.id) ?? photos.length);
  const best = [...captures].sort((a, b) => photoRank(a) - photoRank(b));
  const groups = new Map();
  const registrations = new Map();
  for (const photo of best) {
    for (const model of modelsForAirline(photo, entry.name)) {
      const key = JSON.stringify([model, photo.livery]);
      if (!groups.has(key)) groups.set(key, {model, livery: photo.livery, photoIds: [], cover: photo});
      groups.get(key).photoIds.push(photo.id);
    }
    for (const registration of airlineRegistrations(photo, entry.name)) {
      const key = registrationKey(registration.value);
      if (!registrations.has(key)) registrations.set(key, {registration: registration.value, photoIds: []});
      const match = registrations.get(key);
      if (!match.photoIds.includes(photo.id)) match.photoIds.push(photo.id);
    }
  }
  const journeys = flights.filter(f => f.airline === entry.name).sort((a, b) => b.date.localeCompare(a.date));
  const flownRegistrations = new Set(journeys.map(f => registrationKey(f.registration)).filter(Boolean));
  const both = [...registrations].filter(([key]) => flownRegistrations.has(key)).map(([, match]) => match);
  const dates = captures.map(p => p.date).sort();
  const firstSeen = dates[0] || null;
  return {
    cover: captures.find(p => p.id === entry.cover) || best[0] || null,
    photoCount: captures.length,
    modelCount: new Set([...groups.values()].map(g => g.model)).size,
    registrationCount: registrations.size,
    firstSeen,
    lastSeen: dates.at(-1) || null,
    firstAirports: [...new Set(captures.filter(p => p.date === firstSeen).map(p => p.airport))].sort(),
    airports: [...new Set(captures.map(p => p.airport))].sort(),
    groups: [...groups.values()],
    flights: journeys,
    flownModels: [...new Set(journeys.map(f => f.model).filter(Boolean))].sort(),
    unknownFlightModels: journeys.filter(f => !f.model).length,
    both,
  };
}
