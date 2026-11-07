import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import splashColors from '../assets/splash-colors.json' with {type: 'json'};

const assets = new URL('../assets/', import.meta.url);
await mkdir(assets, {recursive: true});
const plane = `<g transform="translate(263 244) rotate(39) scale(1.06)">
  <g fill="url(#airframe)">
    <rect x="-75" y="-27" width="22" height="66" rx="11"/>
    <rect x="53" y="-27" width="22" height="66" rx="11"/>
    <path d="M0-148c11 0 15 29 15 50v64L126 36q6 4 6 11v10L16 21l-4 74 42 29v11L0 120l-54 15v-11l42-29-4-74-116 36V47q0-7 6-11L-15-34v-64c0-21 4-50 15-50Z"/>
  </g>
  <path d="M-7-112q7-8 14 0l2 9q-9-5-18 0Z" fill="CURRENT_COCKPIT" opacity="0.6"/>
</g>`;

function icon({bg, airframe, line, trail, cockpit}, transparent = false, compact = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
    <linearGradient id="airframe" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${airframe[0]}"/><stop offset="1" stop-color="${airframe[1]}"/></linearGradient>
  </defs>
  ${transparent ? '' : '<path fill="url(#sky)" d="M0 0h512v512H0z"/>'}
  <g${compact ? ' transform="translate(256 256) scale(.74) translate(-256 -256)"' : ''}>
    <circle cx="256" cy="256" r="181" fill="none" stroke="${line}" stroke-width="5"/>
    <path d="M105 354a181 181 0 0 0 267 38" fill="none" stroke="${trail}" stroke-width="12" stroke-linecap="round"/>
    <circle cx="105" cy="354" r="9" fill="${trail}"/>
    ${plane.replace('CURRENT_COCKPIT', cockpit)}
  </g>
</svg>`;
}
const light = {bg:['#f5fbff','#cfe9fa'], airframe:['#2387b9','#153f63'], line:'#a5cee6', trail:'#358fc0', cockpit:'#e1f5ff'};
const dark = {bg:['#18384e','#08141f'], airframe:['#ffffff','#a4ddff'], line:'#345b74', trail:'#77cbfc', cockpit:'#285874'};
const tinted = {bg:['#202020','#080808'], airframe:['#ffffff','#dddddd'], line:'#555555', trail:'#aaaaaa', cockpit:'#444444'};
for (const [name, palette] of Object.entries({light, dark, tinted})) {
  const svg = icon(palette);
  await writeFile(new URL(`icon-${name}.svg`, assets), svg);
  await sharp(Buffer.from(svg)).resize(1024,1024).removeAlpha().png().toFile(new URL(`icon-${name}.png`,assets).pathname);
}
await sharp(new URL('icon-light.png', assets).pathname).toFile(new URL('icon.png',assets).pathname);
await sharp(Buffer.from(icon(dark, true, true))).resize(1024,1024).png().toFile(new URL('adaptive-foreground.png',assets).pathname);
await sharp(Buffer.from(icon({...tinted, line:'#ffffff', trail:'#ffffff', airframe:['#ffffff','#ffffff'], cockpit:'#ffffff'}, true, true)))
  .resize(1024,1024).png().toFile(new URL('adaptive-monochrome.png',assets).pathname);
// Match the intro's first frame, including its reserved text/bottom spacing.
function splashImage({line, text}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="374" viewBox="0 0 320 374">
  <g stroke="${line}" fill="none">
    <circle cx="160" cy="135" r="104"/>
    <circle cx="160" cy="135" r="80" stroke-dasharray="2 9"/>
    <path d="M160 23v14m0 196v14M48 135h14m196 0h14" stroke-width="2"/>
    <path d="M50 195Q152 200 260 45" stroke-width="1.5" stroke-dasharray="4 6"/>
  </g>
  <g transform="translate(50 195) rotate(${Math.atan2(10,204)*180/Math.PI+90}) scale(${60/52})" fill="${text}">
    <rect x="-12" y="-2" width="3.5" height="11" rx="1.5"/>
    <rect x="8.5" y="-2" width="3.5" height="11" rx="1.5"/>
    <path d="M0-23c2 0 3 4 3 7v9L20 6v4L3 3v12l6 5v2l-9-3-9 3v-2l6-5V3L-20 10V6L-3-7v-9c0-3 1-7 3-7Z"/>
  </g>
</svg>`;
}
for (const [file, colors] of [['splash-flight', splashColors.dark], ['splash-flight-light', splashColors.light]]) {
  const svg = splashImage(colors);
  await writeFile(new URL(`${file}.svg`, assets), svg);
  await sharp(Buffer.from(svg)).resize(1280,1496).png().toFile(new URL(`${file}.png`,assets).pathname);
}
console.log('Generated SKYLOG icon variants and the matching flight-path splash.');
