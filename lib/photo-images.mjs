import verification from '../data/photo-verification.json' with {type:'json'};

const byId = new Map(verification.files.map(file => [file.photo, file]));

// A re-edited photograph keeps its filename. Give every rendition a new cache key.
export function photoUrl(path, basePath = process.env.NEXT_PUBLIC_BASE_PATH || '') {
  const match = path.match(/\/(DSC\d+)\.jpg(?:\?|$)/);
  const revision = match && byId.get(match[1])?.revision;
  const url = basePath + path;
  if (!revision) return url;
  return url + (path.includes('?') ? '&' : '?') + 'v=' + revision;
}

export function photoImageSources(photo, basePath = '') {
  const file = byId.get(photo.id);
  const candidates = [
    [file.thumbnailWidth, photo.thumbnail],
    [file.mediumWidth, `/photos/medium/${photo.id}.jpg`],
    [file.width, photo.image],
  ];
  // Small edited crops can produce equal widths; advertise each width only once.
  const sources = new Map(candidates.map(([width, url]) => [width, photoUrl(url, basePath)]));
  return {
    src: photoUrl(photo.image, basePath),
    srcSet: [...sources].map(([width, url]) => `${url} ${width}w`).join(', '),
    width: file.width,
    height: file.height,
  };
}

export function originalPhoto(id) {
  return byId.get(id).original;
}
