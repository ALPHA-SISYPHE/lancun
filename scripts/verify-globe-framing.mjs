/**
 * Quick sanity check for globe framing solver (run with local server + node 20+).
 */
import * as THREE from '../assets/js/vendor/three.module.min.js';
import {
  GOLDEN_RIGHT_CENTER_X,
  getTargetScreenFraction,
  getProjectedFraction,
  solveEarthPosition,
} from '../assets/js/globe/utils/framing.js';

function makeCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.position.set(0, 0.12, 2.75);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

function check(label, aspect, isNarrow) {
  const camera = makeCamera(aspect);
  const target = getTargetScreenFraction(isNarrow);
  const seat = solveEarthPosition(camera, target);
  const projected = getProjectedFraction(camera, new THREE.Vector3(seat.x, seat.y, seat.z));
  const dx = Math.abs(projected.x - target.x);
  const dy = Math.abs(projected.y - target.y);
  const pass = dx <= 0.02 && dy <= 0.02;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${label}: target=(${target.x.toFixed(3)}, ${target.y.toFixed(3)}) ` +
      `projected=(${projected.x.toFixed(3)}, ${projected.y.toFixed(3)}) pos=(${seat.x.toFixed(3)}, ${seat.y.toFixed(3)})`,
  );
  return pass;
}

const results = [
  check('desktop-16:9', 16 / 9, false),
  check('desktop-4:3', 4 / 3, false),
  check('narrow-9:16', 9 / 16, true),
];

console.log(`GOLDEN_RIGHT_CENTER_X=${GOLDEN_RIGHT_CENTER_X.toFixed(3)}`);
process.exit(results.every(Boolean) ? 0 : 1);
