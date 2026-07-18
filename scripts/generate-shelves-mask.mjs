/**
 * Procedural continental-shelf mask (equirectangular, R channel).
 * Run: node scripts/generate-shelves-mask.mjs
 * Output: assets/media/globe/shelves-mask.png
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../assets/media/globe/shelves-mask.png');
const SIZE = 1024;

const CONTINENTS = [
  { lon: -102, lat: 48, rx: 32, ry: 22 },
  { lon: -62, lat: -12, rx: 20, ry: 34 },
  { lon: 18, lat: 22, rx: 22, ry: 38 },
  { lon: 108, lat: 32, rx: 42, ry: 28 },
  { lon: 134, lat: -24, rx: 18, ry: 11 },
  { lon: -18, lat: 66, rx: 14, ry: 8 },
  { lon: 0, lat: -76, rx: 55, ry: 12 },
];

function wrapLon(lon) {
  return ((lon + 180) % 360) - 180;
}

function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function landAt(lonDeg, latDeg) {
  let land = 0;
  for (const c of CONTINENTS) {
    const dLon = wrapLon(lonDeg - c.lon);
    const dLat = latDeg - c.lat;
    const nx = dLon / c.rx;
    const ny = dLat / c.ry;
    const d = Math.sqrt(nx * nx + ny * ny);
    const n = hash2(lonDeg * 0.07, latDeg * 0.09) * 0.18 - 0.09;
    land = Math.max(land, smoothstep(1.05 + n, 0.55 + n, d));
  }
  return land;
}

function shelfValue(lonDeg, latDeg) {
  const land = landAt(lonDeg, latDeg);
  const coastBand = smoothstep(0.28, 0.52, land) * (1 - smoothstep(0.52, 0.82, land));
  const shallow = smoothstep(0.08, 0.35, land) * (1 - smoothstep(0.35, 0.55, land));
  const n = hash2(lonDeg * 2.3, latDeg * 1.9) * 0.12;
  return Math.min(1, Math.max(0, coastBand * 0.82 + shallow * 0.55 + n * coastBand));
}

function buildPixels() {
  const rgba = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const u = (x + 0.5) / SIZE;
      const v = (y + 0.5) / SIZE;
      const lon = u * 360 - 180;
      const lat = 90 - v * 180;
      const value = shelfValue(lon, lat);
      const byte = Math.round(value * 255);
      const idx = (y * SIZE + x) * 4;
      rgba[idx] = byte;
      rgba[idx + 1] = byte;
      rgba[idx + 2] = byte;
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(rgba, width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  const buf = Buffer.from(rgba);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    buf.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pixels = buildPixels();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, encodePng(pixels, SIZE, SIZE));
console.log(`Wrote ${OUT} (${SIZE}x${SIZE})`);
