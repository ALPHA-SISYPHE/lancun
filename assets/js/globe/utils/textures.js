import * as THREE from '../../vendor/three.module.min.js';

const EARTH_LOCAL = 'assets/media/earth.jpg';
const EARTH_REMOTE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_NORMAL_LOCAL = 'assets/media/earth-normal.jpg';
const EARTH_NORMAL_REMOTE = 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg';
const CLOUDS_LOCAL = 'assets/media/earth-clouds.png';
const CLOUDS_REMOTE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';
const SHELVES_LOCAL = 'assets/media/globe/shelves-mask.png';

const CONTINENTS = [
  { lon: -102, lat: 48, rx: 32, ry: 22 },
  { lon: -62, lat: -12, rx: 20, ry: 34 },
  { lon: 18, lat: 22, rx: 22, ry: 38 },
  { lon: 108, lat: 32, rx: 42, ry: 28 },
  { lon: 134, lat: -24, rx: 18, ry: 11 },
  { lon: -18, lat: 66, rx: 14, ry: 8 },
  { lon: 0, lat: -76, rx: 55, ry: 12 },
];

const TEXTURE_TIMEOUT_MS = 8000;
const localAssetExists = new Map();

async function hasLocalAsset(url) {
  if (!url.startsWith('assets/')) return true;
  if (localAssetExists.has(url)) return localAssetExists.get(url);
  let ok = false;
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
    ok = res.ok;
  } catch {
    ok = false;
  }
  localAssetExists.set(url, ok);
  return ok;
}

function loadTexture(url, timeoutMs = TEXTURE_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Texture load timeout: ${url}`));
    }, timeoutMs);

    new THREE.TextureLoader().load(
      url,
      (texture) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(texture);
      },
      undefined,
      (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(`Texture load failed: ${url}`));
      },
    );
  });
}

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

/**
 * Shared procedural shelf mask (matches scripts/generate-shelves-mask.mjs).
 * @param {number} size
 */
export function buildShelvesMaskPixels(size = 1024) {
  const rgba = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const lon = u * 360 - 180;
      const lat = 90 - v * 180;
      const value = shelfValue(lon, lat);
      const byte = Math.round(value * 255);
      const idx = (y * size + x) * 4;
      rgba[idx] = byte;
      rgba[idx + 1] = byte;
      rgba[idx + 2] = byte;
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

function createProceduralShelvesMask(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(new ImageData(buildShelvesMaskPixels(size), size, size), 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export async function loadEarthTexture() {
  if (await hasLocalAsset(EARTH_LOCAL)) {
    try {
      return await loadTexture(EARTH_LOCAL);
    } catch (err) {
      console.warn('Local earth texture unavailable, using remote fallback', err);
    }
  }
  return loadTexture(EARTH_REMOTE);
}

export async function loadCloudTexture() {
  if (await hasLocalAsset(CLOUDS_LOCAL)) {
    try {
      return await loadTexture(CLOUDS_LOCAL);
    } catch (err) {
      console.warn('Local cloud texture unavailable, using remote fallback', err);
    }
  }
  return loadTexture(CLOUDS_REMOTE);
}

export async function loadEarthNormalTexture() {
  if (await hasLocalAsset(EARTH_NORMAL_LOCAL)) {
    try {
      return await loadTexture(EARTH_NORMAL_LOCAL);
    } catch (err) {
      console.warn('Local earth normal map unavailable, trying remote fallback', err);
    }
  }
  try {
    return await loadTexture(EARTH_NORMAL_REMOTE);
  } catch (err) {
    console.warn('Remote earth normal map unavailable, using procedural fallback', err);
    return createProceduralEarthNormal();
  }
}

function createProceduralEarthNormal() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const v = y / height;
      const n =
        Math.sin(u * Math.PI * 8 + v * 4.2) * 0.08 +
        Math.sin(u * Math.PI * 22 + v * 11) * 0.04 +
        hash2(x, y) * 0.03;
      const idx = (y * width + x) * 4;
      imageData.data[idx] = 128 + n * 90;
      imageData.data[idx + 1] = 128 + n * 70;
      imageData.data[idx + 2] = 255;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Continental-shelf mask (R channel). Prefers local PNG; falls back to procedural coastline bands.
 */
export async function loadShelvesMaskTexture() {
  if (await hasLocalAsset(SHELVES_LOCAL)) {
    try {
      const tex = await loadTexture(SHELVES_LOCAL);
      tex.colorSpace = THREE.NoColorSpace;
      return tex;
    } catch (err) {
      console.warn('Local shelves mask unavailable, using procedural fallback', err);
    }
  }
  return createProceduralShelvesMask();
}

/** Soft marine motif for ~15% of bubble instances (iContent). */
export function createBubbleContentTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 4, size * 0.5, size * 0.5, size * 0.48);
  grad.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
  grad.addColorStop(0.45, 'rgba(59, 130, 246, 0.55)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    const cx = size * (0.25 + hash2(i, 1) * 0.5);
    const cy = size * (0.25 + hash2(i, 2) * 0.5);
    ctx.arc(cx, cy, 8 + hash2(i, 3) * 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
