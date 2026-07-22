import * as THREE from '../vendor/three.module.min.js';
import { loadEarthTexture, loadCloudTexture } from './utils/textures.js';

const EARTH_RADIUS = 1;
const CLOUD_RADIUS = 1.015;
const ATMOSPHERE_RADIUS = 1.08;

/**
 * Unified earthGroup: mesh, atmosphere, clouds, and CSS2D hotspots share one transform.
 * User drag + auto-spin must only rotate this group — never individual child meshes.
 *
 * @returns {Promise<{ group: THREE.Group, clouds: THREE.Mesh | null, update: (dt: number) => void }>}
 */
export async function createEarthGroup() {
  const earthGroup = new THREE.Group();
  earthGroup.rotation.y = THREE.MathUtils.degToRad(-25);

  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a6b82,
    specular: new THREE.Color(0x556688),
    shininess: 22,
  });
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earthMesh);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    }),
  );
  earthGroup.add(atmosphere);

  let clouds = null;

  try {
    const earthMap = await loadEarthTexture();
    earthMaterial.map = earthMap;
    earthMaterial.color.setHex(0xffffff);
    earthMaterial.needsUpdate = true;
  } catch (err) {
    console.error('Earth texture failed to load', err);
  }

  try {
    const cloudMap = await loadCloudTexture();
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(CLOUD_RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    earthGroup.add(clouds);
  } catch {
    /* clouds optional */
  }

  const update = () => {
    /* clouds / atmosphere follow earthGroup rotation only */
  };

  return { group: earthGroup, clouds, update };
}
