import { OrbitControls } from '../vendor/OrbitControls.js';

const IDLE_MS = 3000;
const AUTO_SPIN_SPEED = 0.08;
const YAW_SENS = 0.005;

/**
 * Polar-axis globe controls: earthGroup.rotation.y for spin/yaw; OrbitControls zoom only.
 *
 * @param {import('../vendor/three.module.min.js').PerspectiveCamera} camera
 * @param {HTMLCanvasElement} canvas
 * @param {import('../vendor/three.module.min.js').Group} earthGroup
 * @param {{ motionReduced: () => boolean }} options
 */
export function createGlobeControls(camera, canvas, earthGroup, { motionReduced }) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.8;
  controls.maxDistance = 4.5;

  let autoSpin = !motionReduced();
  let dragging = false;
  let lastPointerX = 0;
  let idleTimer = null;

  const syncTarget = () => {
    controls.target.copy(earthGroup.position);
  };

  syncTarget();

  const scheduleResumeAutoSpin = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!motionReduced() && !dragging) autoSpin = true;
    }, IDLE_MS);
  };

  const pauseAutoSpin = () => {
    autoSpin = false;
    clearTimeout(idleTimer);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    dragging = true;
    lastPointerX = event.clientX;
    pauseAutoSpin();
    canvas.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    earthGroup.rotation.y -= dx * YAW_SENS;
  };

  const onPointerUp = (event) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    scheduleResumeAutoSpin();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  controls.addEventListener('start', pauseAutoSpin);
  controls.addEventListener('end', scheduleResumeAutoSpin);

  const updateAutoSpin = (dt) => {
    if (!autoSpin || motionReduced() || dragging) return;
    earthGroup.rotation.y += AUTO_SPIN_SPEED * dt;
  };

  const applyMotion = () => {
    if (motionReduced()) {
      autoSpin = false;
      clearTimeout(idleTimer);
    } else if (!dragging) {
      autoSpin = true;
    }
  };

  const dispose = () => {
    clearTimeout(idleTimer);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
  };

  return { controls, syncTarget, updateAutoSpin, applyMotion, dispose };
}
