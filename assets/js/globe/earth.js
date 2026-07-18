import * as THREE from '../vendor/three.module.min.js';
import { loadEarthTexture, loadCloudTexture } from './utils/textures.js';

/** Asia–Pacific facing camera (Convex-like landmass framing). */
const INITIAL_ROTATION_Y = THREE.MathUtils.degToRad(48);

/**
 * @param {{ scene: THREE.Scene, renderer?: THREE.WebGLRenderer }} options
 */
export async function createEarth({ scene, renderer }) {
  const group = new THREE.Group();
  group.rotation.y = INITIAL_ROTATION_Y;

  const setupLights = (targetScene) => {
    const hemi = new THREE.HemisphereLight(0xf0f8ff, 0x5a7a98, 1.45);
    targetScene.add(hemi);

    const ambient = new THREE.AmbientLight(0xd0e8f8, 1.05);
    targetScene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
    keyLight.position.set(-2.4, 3.6, 4.5);
    targetScene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc8e8ff, 0.72);
    fillLight.position.set(3.4, 1.0, 2.6);
    targetScene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa5d0ff, 0.48);
    rimLight.position.set(0.2, -1.0, -3.8);
    targetScene.add(rimLight);
  };

  setupLights(scene);

  const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0xe8f2fc,
    shininess: 14,
    specular: 0x444444,
    emissive: 0x1a4060,
    emissiveIntensity: 0.35,
  });
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthMesh.layers.set(0);
  group.add(earthMesh);

  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.045, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  atmosphereMesh.layers.set(0);
  group.add(atmosphereMesh);

  let cloudsMesh = null;

  try {
    const earthMap = await loadEarthTexture();
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = earthMap;
    // Lift ocean/land multiply so dark blue maps read on light mist bg
    earthMaterial.color.set(0xdceeff);
    earthMaterial.needsUpdate = true;
  } catch (err) {
    console.warn('Earth texture unavailable, using procedural fallback', err);
    earthMaterial.color.set(0x60a5fa);
    earthMaterial.needsUpdate = true;
  }

  try {
    const cloudMap = await loadCloudTexture();
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.015, 64, 64),
      new THREE.MeshPhongMaterial({
        map: cloudMap,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    cloudsMesh.layers.set(0);
    group.add(cloudsMesh);
  } catch (err) {
    console.warn('Cloud texture unavailable', err);
  }

  scene.add(group);

  const disposeExtras = () => {};

  return { group, earthMesh, cloudsMesh, atmosphereMesh, setupLights, disposeExtras };
}

export function configureRendererToneMapping(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Modest lift for ocean readability on light mist bg (avoid wash-out).
  renderer.toneMappingExposure = 1.48;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export { INITIAL_ROTATION_Y };
