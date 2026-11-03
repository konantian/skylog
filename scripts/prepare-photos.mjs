import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import catalog from '../data/catalog.json' with { type: 'json' };

const source = process.argv[2];
if (!source) throw new Error('Usage: npm run photos:prepare -- /path/to/edited-photo-exports');
const target = path.resolve('public/photos');
await mkdir(path.join(target, 'thumbs'), { recursive: true });
const files = await readdir(source);
const report = [];
for (const photo of catalog.photos) {
  const file = files.find(f => path.parse(f).name === photo.id && /\.(jpe?g|png|tiff?)$/i.test(f));
  if (!file) throw new Error(`Missing edited export: ${photo.id}`);
  const input = path.join(source, file);
  const image = path.join(target, `${photo.id}.jpg`);
  const thumb = path.join(target, 'thumbs', `${photo.id}.jpg`);
  // Use the final rendered photo. Resize only; preserve its composition and tone.
  await sharp(input).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb').jpeg({ quality: 91, mozjpeg: true }).toFile(image);
  await sharp(image).resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(thumb);
  report.push({ photo: photo.id, imageBytes: (await stat(image)).size, thumbnailBytes: (await stat(thumb)).size });
  if (report.length % 30 === 0) console.log(`Prepared ${report.length} / ${catalog.photos.length}`);
}
await writeFile('data/photo-verification.json', JSON.stringify({ count: report.length, files: report }, null, 2));
console.log(`Verified ${report.length} final JPGs and thumbnails in public/photos.`);
