import * as THREE from '../../vendor/three.module.min.js';

const EARTH_LOCAL = 'assets/media/globe/earth.jpg';
const EARTH_REMOTE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const CLOUDS_LOCAL = 'assets/media/globe/earth-clouds.png';
const CLOUDS_REMOTE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

async function loadWithFallback(localUrl, remoteUrl) {
  try {
    return await loadTexture(localUrl);
  } catch {
    return loadTexture(remoteUrl);
  }
}

export async function loadEarthTexture() {
  const texture = await loadWithFallback(EARTH_LOCAL, EARTH_REMOTE);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function loadCloudTexture() {
  const texture = await loadWithFallback(CLOUDS_LOCAL, CLOUDS_REMOTE);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
