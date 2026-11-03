import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import catalog from '../data/catalog.json' with { type: 'json' };

const [source, originals, downloadBase] = process.argv.slice(2);
if (!source || !originals || !/^https:\/\/github\.com\/konantian\/skylog\/releases\/download\/[\w.-]+$/.test(downloadBase || '')) {
  throw new Error('Usage: npm run photos:prepare -- /edited-exports /original-jpg-output https://github.com/konantian/skylog/releases/download/TAG');
}
const target = path.resolve('public/photos');
if ([source, originals].some(dir => path.resolve(dir).startsWith(target + path.sep) || path.resolve(dir) === target) || path.resolve(source) === path.resolve(originals)) {
  throw new Error('Keep edited exports, original JPG downloads and public display copies in separate folders.');
}
await mkdir(path.join(target, 'thumbs'), { recursive: true });
await mkdir(path.join(target, 'medium'), { recursive: true });
await mkdir(originals, { recursive: true });
const files = await readdir(source);
// Validate every source before replacing any public file.
const inputs = new Map();
for (const photo of catalog.photos) {
  const matches = files.filter(f => path.parse(f).name === photo.id && /\.(jpe?g|png|tiff?)$/i.test(f));
  if (matches.length !== 1) throw new Error(`Expected one edited export: ${photo.id}, found ${matches.length}`);
  const input = path.join(source, matches[0]);
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Invalid image: ${photo.id}`);
  inputs.set(photo.id, input);
}
const report = [];
for (let offset = 0; offset < catalog.photos.length; offset += 4) {
  const batch = await Promise.all(catalog.photos.slice(offset, offset + 4).map(async photo => {
    const input = inputs.get(photo.id);
    // Derive each size directly from the edited export; never upscale or retain private EXIF.
    const render = (file, size, quality) => {
      let image = sharp(input).rotate().toColourspace('srgb');
      if (size) image = image.resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true });
      return image.jpeg({ quality, mozjpeg: true }).toFile(file);
    };
    const image = await render(path.join(target, `${photo.id}.jpg`), 3200, 94);
    const medium = await render(path.join(target, 'medium', `${photo.id}.jpg`), 1600, 90);
    const thumbnail = await render(path.join(target, 'thumbs', `${photo.id}.jpg`), 800, 84);
    const original = await render(path.join(originals, `${photo.id}.jpg`), 0, 95);
    return {
      photo: photo.id,
      imageBytes: image.size, width: image.width, height: image.height,
      mediumBytes: medium.size, mediumWidth: medium.width,
      thumbnailBytes: thumbnail.size, thumbnailWidth: thumbnail.width,
      original: { url: `${downloadBase}/${photo.id}.jpg`, width: original.width, height: original.height, bytes: original.size },
    };
  }));
  report.push(...batch);
  if (report.length % 40 === 0) console.log(`Prepared ${report.length} / ${catalog.photos.length}`);
}
await writeFile('data/photo-verification.json', JSON.stringify({ count: report.length, files: report }, null, 2));
console.log(`Prepared ${report.length} edited photos: 800 / 1600 / 3200 px, plus full-resolution JPG downloads.`);
