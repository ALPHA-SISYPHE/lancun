import * as THREE from '../../vendor/three.module.min.js';
import { loadEarthTexture, loadCloudTexture } from './utils/textures.js';

const INITIAL_ROTATION_Y = THREE.MathUtils.degToRad(-25);

/**
 * @param {{ scene: THREE.Scene }} options
 * @returns {Promise<{ group: THREE.Group, earthMesh: THREE.Mesh, cloudsMesh: THREE.Mesh | null, atmosphereMesh: THREE.Mesh, setupLights: (scene: THREE.Scene) => void }>}
 */
export async function createEarth({ scene }) {
  const group = new THREE.Group();
  group.rotation.y = INITIAL_ROTATION_Y;

  const setupLights = (targetScene) => {
    const hemi = new THREE.HemisphereLight(0xb8dcff, 0x1a2840, 1.15);
    targetScene.add(hemi);

    const ambient = new THREE.AmbientLight(0x8ab4d4, 0.72);
    targetScene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(-4.5, 2.8, 5);
    targetScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6ec8ff, 0.55);
    rimLight.position.set(3.5, -0.5, -3);
    targetScene.add(rimLight);
  };

  setupLights(scene);

  const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.08,
    emissive: new THREE.Color(0x1a3a52),
    emissiveIntensity: 0.22,
  });
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  group.add(earthMesh);

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    }),
  );
  group.add(atmosphereMesh);

  let cloudsMesh = null;

  try {
    const earthMap = await loadEarthTexture();
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = earthMap;
    earthMaterial.needsUpdate = true;
  } catch (err) {
    console.warn('Earth texture unavailable', err);
  }

  try {
    const cloudMap = await loadCloudTexture();
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.015, 64, 64),
      new THREE.MeshPhongMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    group.add(cloudsMesh);
  } catch (err) {
    console.warn('Cloud texture unavailable', err);
  }

  scene.add(group);

  return { group, earthMesh, cloudsMesh, atmosphereMesh, setupLights };
}

export function configureRendererToneMapping(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export { INITIAL_ROTATION_Y };
