import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';

const IDLE_MS = 2000;
const AUTO_SPIN_SPEED = 0.28;
const YAW_SENS = 0.005;
const PITCH_SENS = 0.003;
const PITCH_MIN = -0.45;
const PITCH_MAX = 0.45;
const EARTH_BASE_YAW = THREE.MathUtils.degToRad(-25);

/**
 * Drag + auto-spin on earthGroup (not individual meshes).
 * Hotspots as CSS2DObject children follow earthGroup.rotation naturally.
 *
 * @param {import('../vendor/three.module.min.js').PerspectiveCamera} camera
 * @param {HTMLCanvasElement} canvas
 * @param {import('../vendor/three.module.min.js').Group} earthGroup
 * @param {{ motionReduced: () => boolean, onEarthRotationChange?: () => void }} options
 */
export function createGlobeControls(camera, canvas, earthGroup, { motionReduced, onEarthRotationChange }) {
  const controls = new OrbitControls(camera, canvas);
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.8;
  controls.maxDistance = 4.5;

  let autoSpin = !motionReduced();
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let idleTimer = null;
  let targetYaw = null;
  let hintDispatched = false;

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';

  const syncTarget = () => {
    controls.target.copy(earthGroup.position);
  };

  syncTarget();

  const syncEarthTransform = () => {
    earthGroup.updateMatrixWorld(true);
    onEarthRotationChange?.();
  };

  const dispatchHintDismiss = () => {
    if (hintDispatched) return;
    hintDispatched = true;
    window.dispatchEvent(new CustomEvent('lancun-globe-hint-dismiss'));
  };

  const scheduleResumeAutoSpin = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!motionReduced() && !isDragging && targetYaw == null) autoSpin = true;
    }, IDLE_MS);
  };

  const pauseAutoSpin = () => {
    autoSpin = false;
    clearTimeout(idleTimer);
  };

  const applyDragRotation = (dx, dy) => {
    earthGroup.rotation.y += dx * YAW_SENS;
    earthGroup.rotation.x += dy * PITCH_SENS;
    earthGroup.rotation.x = THREE.MathUtils.clamp(earthGroup.rotation.x, PITCH_MIN, PITCH_MAX);
    syncEarthTransform();
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    isDragging = true;
    targetYaw = null;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    pauseAutoSpin();
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(event.pointerId);
    dispatchHintDismiss();
    window.dispatchEvent(new CustomEvent('lancun-globe-interact', { detail: { type: 'drag-start' } }));
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dispatchHintDismiss();
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    applyDragRotation(dx, dy);
  };

  const onPointerUp = (event) => {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    scheduleResumeAutoSpin();
    window.dispatchEvent(new CustomEvent('lancun-globe-interact', { detail: { type: 'drag-end' } }));
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  controls.addEventListener('start', pauseAutoSpin);
  controls.addEventListener('end', scheduleResumeAutoSpin);

  const rotateToLng = (lng) => {
    targetYaw = EARTH_BASE_YAW - THREE.MathUtils.degToRad(lng);
    pauseAutoSpin();
  };

  const updateYawAnimation = (dt) => {
    if (targetYaw == null) return false;

    let diff = targetYaw - earthGroup.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) < 0.008) {
      earthGroup.rotation.y = targetYaw;
      targetYaw = null;
      syncEarthTransform();
      scheduleResumeAutoSpin();
      return false;
    }

    earthGroup.rotation.y += diff * Math.min(1, dt * 3.5);
    syncEarthTransform();
    return true;
  };

  const updateAutoSpin = (dt) => {
    if (updateYawAnimation(dt)) return;
    if (isDragging || !autoSpin || motionReduced()) return;
    earthGroup.rotation.y += AUTO_SPIN_SPEED * dt;
    syncEarthTransform();
  };

  const applyMotion = () => {
    if (motionReduced()) {
      autoSpin = false;
      clearTimeout(idleTimer);
      targetYaw = null;
    } else if (!isDragging && targetYaw == null) {
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

  return {
    controls,
    syncTarget,
    updateAutoSpin,
    applyMotion,
    dispose,
    rotateToLng,
    isDragging: () => isDragging,
    isAutoSpinning: () => autoSpin,
  };
}
