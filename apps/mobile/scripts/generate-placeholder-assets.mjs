// Generates placeholder sound effects (WAV) and level images (PNG) — "own work", no third-party
// licensing. Replace with final art/audio later. Run: node scripts/generate-placeholder-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// ---------- Sounds ----------
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2),
  );
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Soft sine notes with a quick attack and exponential decay. notes: [freqHz, startSec, durSec] */
function tones(notes, totalSec, volume = 0.35) {
  const out = new Float32Array(Math.ceil(totalSec * RATE));
  for (const [freq, start, dur] of notes) {
    const s0 = Math.floor(start * RATE);
    const n = Math.floor(dur * RATE);
    for (let i = 0; i < n && s0 + i < out.length; i++) {
      const t = i / RATE;
      const env = Math.min(1, t / 0.008) * Math.exp(-t / (dur / 3.5));
      // fundamental + soft octave for a gentle "chime" timbre
      out[s0 + i] +=
        volume * env * (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t));
    }
  }
  return Array.from(out);
}

const sounds = {
  tap: tones([[880, 0, 0.06]], 0.08, 0.2),
  hint: tones(
    [
      [1046.5, 0, 0.25],
      [1318.5, 0.08, 0.3],
    ],
    0.4,
    0.25,
  ),
  correct: tones(
    [
      [523.25, 0, 0.3],
      [659.25, 0.1, 0.3],
      [783.99, 0.2, 0.45],
    ],
    0.7,
  ),
  wrong: tones(
    [
      [392, 0, 0.22],
      [311.13, 0.14, 0.35],
    ],
    0.5,
    0.3,
  ),
};
mkdirSync(join(root, 'sounds'), { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(join(root, 'sounds', `${name}.wav`), wav(samples));
}

// ---------- Placeholder images ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (width * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Must match placeholder keys in src/features/levels/images.ts
const palettes = {
  cream: ['#FFF6EC', '#F3D9BD'],
  peach: ['#FFE3D3', '#F7B394'],
  lavender: ['#EEE6FA', '#C6B1EC'],
  mint: ['#E3F6EC', '#A9DDC3'],
  sky: ['#E4F1FB', '#A9CDEA'],
  rose: ['#FCE6EB', '#EDAFBD'],
};
const W = 480;
const H = 360;
// Paw print: one pad + four toes (ellipses in a 0..1 box centred in the image)
const pads = [
  [0.5, 0.62, 0.17, 0.14],
  [0.3, 0.4, 0.07, 0.09],
  [0.42, 0.3, 0.07, 0.09],
  [0.58, 0.3, 0.07, 0.09],
  [0.7, 0.4, 0.07, 0.09],
];
mkdirSync(join(root, 'levels'), { recursive: true });
for (const [name, [bg, fg]] of Object.entries(palettes)) {
  const bgc = hex(bg);
  const fgc = hex(fg);
  const image = png(W, H, (x, y) => {
    const u = (x - (W - H) / 2) / H;
    const v = y / H;
    const inPaw = pads.some(([cx, cy, rx, ry]) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1);
    // subtle vertical gradient for the background
    return inPaw ? fgc : mix(bgc, fgc, 0.15 * v);
  });
  writeFileSync(join(root, 'levels', `placeholder-${name}.png`), image);
}
// Splash image: paw on the theme's cream background (expo-splash-screen uses the same bg color).
{
  const S = 512;
  const bgc = hex('#FFF6EC');
  const fgc = hex('#F59E7A');
  writeFileSync(
    join(root, 'splash-paw.png'),
    png(S, S, (x, y) => {
      const u = x / S;
      const v = y / S;
      return pads.some(([cx, cy, rx, ry]) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1)
        ? fgc
        : bgc;
    }),
  );
}
console.log('Generated sounds and placeholder images in', root);
