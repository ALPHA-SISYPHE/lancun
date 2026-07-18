import * as THREE from '../../vendor/three.module.min.js';

const EARTH_LOCAL = 'assets/media/earth.jpg';
const EARTH_REMOTE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const CLOUDS_LOCAL = 'assets/media/earth-clouds.png';
const CLOUDS_REMOTE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';
const SHELVES_LOCAL = 'assets/media/globe/shelves-mask.png';

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

export async function loadEarthTexture() {
  try {
    return await loadTexture(EARTH_LOCAL);
  } catch {
    return loadTexture(EARTH_REMOTE);
  }
}

export async function loadCloudTexture() {
  try {
    return await loadTexture(CLOUDS_LOCAL);
  } catch {
    return loadTexture(CLOUDS_REMOTE);
  }
}

/**
 * Procedural continental-shelf placeholder mask (radial bands + noise).
 * Falls back to local PNG if present.
 */
export async function loadShelvesMaskTexture() {
  try {
    const tex = await loadTexture(SHELVES_LOCAL);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  } catch {
    return createProceduralShelvesMask();
  }
}

function createProceduralShelvesMask() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      const lon = u * Math.PI * 2;
      const lat = (v - 0.5) * Math.PI;
      const shelf =
        0.35 * Math.max(0, Math.cos(lat * 2.1) * 0.6 + 0.4) +
        0.25 * Math.max(0, Math.sin(lon * 3 + lat * 1.7) * 0.5 + 0.5) +
        0.15 * Math.max(0, Math.sin(lon * 5.3 + 1.2) * 0.5 + 0.5);
      const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const value = Math.min(1, Math.max(0, shelf + (n - 0.5) * 0.08));
      const idx = (y * size + x) * 4;
      const byte = Math.floor(value * 255);
      imageData.data[idx] = byte;
      imageData.data[idx + 1] = byte;
      imageData.data[idx + 2] = byte;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
