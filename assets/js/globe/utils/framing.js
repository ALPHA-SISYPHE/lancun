import * as THREE from '../../vendor/three.module.min.js';

/** Right golden zone center: 0.382 + 0.618 / 2 */
export const GOLDEN_RIGHT_CENTER_X = 0.382 + 0.618 / 2;

const probe = new THREE.Vector3();

export function getTargetScreenFraction(isNarrow) {
  return isNarrow
    ? { x: 0.5, y: 0.5 }
    : { x: GOLDEN_RIGHT_CENTER_X, y: 0.5 };
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
