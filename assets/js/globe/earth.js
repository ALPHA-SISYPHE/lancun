import * as THREE from '../../vendor/three.module.min.js';
import { loadEarthTexture, loadCloudTexture, loadEarthNormalTexture } from './utils/textures.js';

const INITIAL_ROTATION_Y = THREE.MathUtils.degToRad(-25);

function createOceanEnvEquirectTexture() {
  const width = 256;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#b8dcff');
  gradient.addColorStop(0.42, '#3b82f6');
  gradient.addColorStop(0.72, '#1e3a8a');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function applyEarthEnvMap(material, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const equirect = createOceanEnvEquirectTexture();
  const envMap = pmrem.fromEquirectangular(equirect).texture;
  equirect.dispose();
  pmrem.dispose();

  material.envMap = envMap;
  material.envMapIntensity = 0.28;
  material.needsUpdate = true;
  return envMap;
}

/**
 * @param {{ scene: THREE.Scene, renderer?: THREE.WebGLRenderer }} options
 * @returns {Promise<{ group: THREE.Group, earthMesh: THREE.Mesh, cloudsMesh: THREE.Mesh | null, atmosphereMesh: THREE.Mesh, setupLights: (scene: THREE.Scene) => void, disposeExtras: () => void }>}
 */
export async function createEarth({ scene, renderer }) {
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
    roughness: 0.58,
    metalness: 0.06,
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
  let envMap = null;

  if (renderer) {
    envMap = applyEarthEnvMap(earthMaterial, renderer);
  }

  try {
    const earthMap = await loadEarthTexture();
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = earthMap;
    earthMaterial.needsUpdate = true;
  } catch (err) {
    console.warn('Earth texture unavailable', err);
  }

  try {
    const normalMap = await loadEarthNormalTexture();
    earthMaterial.normalMap = normalMap;
    earthMaterial.normalScale = new THREE.Vector2(0.75, 0.75);
    earthMaterial.needsUpdate = true;
  } catch (err) {
    console.warn('Earth normal map unavailable', err);
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

  const disposeExtras = () => {
    envMap?.dispose?.();
  };

  return { group, earthMesh, cloudsMesh, atmosphereMesh, setupLights, disposeExtras };
}

export function configureRendererToneMapping(renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export { INITIAL_ROTATION_Y };
