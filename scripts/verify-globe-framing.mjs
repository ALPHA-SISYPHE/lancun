/**
 * Sanity check: earth at world origin projects to canvas center (0.5, 0.5)
 * and fills 90% of the canvas short side.
 */
import * as THREE from '../assets/js/vendor/three.module.min.js';
import {
  EARTH_SCREEN_FILL,
  EARTH_VISUAL_RADIUS,
  getProjectedFraction,
  getProjectedSphereFill,
  solveCameraDistanceForFill,
} from '../assets/js/globe/utils/framing.js';

const CAMERA_Y = 0.12;

function makeCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
  camera.aspect = aspect;
  const z = solveCameraDistanceForFill(
    camera,
    EARTH_VISUAL_RADIUS,
    EARTH_SCREEN_FILL,
    aspect,
    CAMERA_Y,
  );
  camera.position.set(0, CAMERA_Y, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

function checkCenter(label, aspect) {
  const camera = makeCamera(aspect);
  const projected = getProjectedFraction(camera, new THREE.Vector3(0, 0, 0));
  const dx = Math.abs(projected.x - 0.5);
  const dy = Math.abs(projected.y - 0.5);
  const pass = dx <= 0.02 && dy <= 0.02;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${label} center: projected=(${projected.x.toFixed(3)}, ${projected.y.toFixed(3)}) ` +
      `delta=(${dx.toFixed(3)}, ${dy.toFixed(3)})`,
  );
  return pass;
}

function checkFill(label, aspect) {
  const camera = makeCamera(aspect);
  const fill = getProjectedSphereFill(camera, EARTH_VISUAL_RADIUS, aspect);
  const delta = Math.abs(fill - EARTH_SCREEN_FILL);
  const pass = delta <= 0.02;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${label} fill: ${fill.toFixed(3)} target=${EARTH_SCREEN_FILL} delta=${delta.toFixed(3)}`,
  );
  return pass;
}

const aspects = [
  ['stage-desktop-16:9', 16 / 9],
  ['stage-desktop-4:3', 4 / 3],
  ['stage-narrow-9:16', 9 / 16],
];

const results = aspects.flatMap(([label, aspect]) => [
  checkCenter(label, aspect),
  checkFill(label, aspect),
]);

process.exit(results.every(Boolean) ? 0 : 1);
