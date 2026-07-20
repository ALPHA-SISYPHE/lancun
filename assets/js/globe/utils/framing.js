/**
 * Screen projection helpers for globe debug.
 * Earth sits at world origin; canvas is confined to the right 0.618 column,
 * so the visual center target is (0.5, 0.5) relative to the stage canvas.
 */
import * as THREE from '../../vendor/three.module.min.js';

/** @deprecated Legacy golden-zone constant; canvas layout now handles horizontal placement. */
export const GOLDEN_RIGHT_CENTER_X = 0.382 + 0.618 / 2;

const probe = new THREE.Vector3();

export function getTargetScreenFraction(isNarrow) {
  return isNarrow
    ? { x: 0.5, y: 0.5 }
    : { x: GOLDEN_RIGHT_CENTER_X, y: 0.5 };
}

/** Earth mesh radius (earth.js); atmosphere excluded from fill math. */
export const EARTH_VISUAL_RADIUS = 1;

/** Target diameter as a fraction of the canvas shorter side. */
export const EARTH_SCREEN_FILL = 0.9;

const probeA = new THREE.Vector3();
const probeB = new THREE.Vector3();

export function getProjectedSphereFill(camera, radius, aspect) {
  camera.updateMatrixWorld(true);

  probeA.set(-radius, 0, 0);
  probeB.set(radius, 0, 0);
  probeA.project(camera);
  probeB.project(camera);
  const horizontalSpan = Math.abs((probeB.x + 1) * 0.5 - (probeA.x + 1) * 0.5);

  probeA.set(0, -radius, 0);
  probeB.set(0, radius, 0);
  probeA.project(camera);
  probeB.project(camera);
  const verticalSpan = Math.abs((1 - probeB.y) * 0.5 - (1 - probeA.y) * 0.5);

  return aspect >= 1 ? verticalSpan : horizontalSpan;
}

/**
 * Binary-search camera Z so the earth sphere fill matches the target on the canvas short side.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} radius
 * @param {number} fill
 * @param {number} aspect
 * @param {number} [cameraY=0.12]
 */
export function solveCameraDistanceForFill(camera, radius, fill, aspect, cameraY = 0.12) {
  let lo = 0.5;
  let hi = 24;

  for (let i = 0; i < 32; i += 1) {
    const z = (lo + hi) * 0.5;
    camera.position.set(0, cameraY, z);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const currentFill = getProjectedSphereFill(camera, radius, aspect);
    if (currentFill < fill) hi = z;
    else lo = z;
  }

  return (lo + hi) * 0.5;
}

export function getProjectedFraction(camera, position) {
  probe.copy(position);
  probe.project(camera);
  return {
    x: (probe.x + 1) * 0.5,
    y: (1 - probe.y) * 0.5,
  };
}

/**
 * Binary search world X so the point (x, y, z) projects to targetFracX.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} targetFracX
 * @param {{ y?: number, z?: number }} options
 */
export function solveEarthPositionX(camera, targetFracX, { y = 0, z = 0 } = {}) {
  let lo = -4;
  let hi = 4;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) * 0.5;
    probe.set(mid, y, z);
    probe.project(camera);
    const fracX = (probe.x + 1) * 0.5;
    if (fracX < targetFracX) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

/**
 * Binary search world Y so the point (x, y, z) projects to targetFracY.
 * @param {THREE.PerspectiveCamera} camera
 * @param {number} targetFracY
 * @param {{ x?: number, z?: number }} options
 */
export function solveEarthPositionY(camera, targetFracY, { x = 0, z = 0 } = {}) {
  let lo = -2;
  let hi = 2;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) * 0.5;
    probe.set(x, mid, z);
    probe.project(camera);
    const fracY = (1 - probe.y) * 0.5;
    if (fracY < targetFracY) lo = mid;
    else hi = mid;
  }
  return (lo + hi) * 0.5;
}

/**
 * Solve earth group position for target screen anchor (X via projection; Y fixed at 0).
 * @param {THREE.PerspectiveCamera} camera
 * @param {{ x: number, y: number }} target
 */
export function solveEarthPosition(camera, target) {
  const x = solveEarthPositionX(camera, target.x, { y: 0, z: 0 });
  return { x, y: 0, z: 0 };
}
