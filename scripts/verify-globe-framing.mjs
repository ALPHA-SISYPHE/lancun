/**
 * Sanity check: earth at world origin projects to canvas center (0.5, 0.5).
 * Canvas is confined to the right 0.618 column; no projection offset solver needed.
 */
import * as THREE from '../assets/js/vendor/three.module.min.js';
import { getProjectedFraction } from '../assets/js/globe/utils/framing.js';

function makeCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 0.12, 2.75);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

function check(label, aspect) {
  const camera = makeCamera(aspect);
  const projected = getProjectedFraction(camera, new THREE.Vector3(0, 0, 0));
  const dx = Math.abs(projected.x - 0.5);
  const dy = Math.abs(projected.y - 0.5);
  const pass = dx <= 0.02 && dy <= 0.02;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${label}: projected=(${projected.x.toFixed(3)}, ${projected.y.toFixed(3)}) ` +
      `delta=(${dx.toFixed(3)}, ${dy.toFixed(3)})`,
  );
  return pass;
}

const results = [
  check('stage-desktop-16:9', 16 / 9),
  check('stage-desktop-4:3', 4 / 3),
  check('stage-narrow-9:16', 9 / 16),
];

process.exit(results.every(Boolean) ? 0 : 1);
