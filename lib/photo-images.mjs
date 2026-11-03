import verification from '../data/photo-verification.json' with {type:'json'};

const byId = new Map(verification.files.map(file => [file.photo, file]));

export function photoImageSources(photo, basePath = '') {
  const file = byId.get(photo.id);
  const candidates = [
    [file.thumbnailWidth, photo.thumbnail],
    [file.mediumWidth, `/photos/medium/${photo.id}.jpg`],
    [file.width, photo.image],
  ];
  // Small edited crops can produce equal widths; advertise each width only once.
  const sources = new Map(candidates.map(([width, url]) => [width, `${basePath}${url}`]));
  return {
    src: `${basePath}${photo.image}`,
    srcSet: [...sources].map(([width, url]) => `${url} ${width}w`).join(', '),
    width: file.width,
    height: file.height,
  };
}

export function originalPhoto(id) {
  return byId.get(id).original;
}
