import * as THREE from '../vendor/three.module.min.js';
import { latLngToVector3, EARTH_HOTSPOT_RADIUS_SCALE } from './utils/latlon.js';
import { EARTH_VISUAL_RADIUS } from './utils/framing.js';

const FACING_THRESHOLD = 0;

const _center = new THREE.Vector3();
const _world = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _cameraDir = new THREE.Vector3();
const _ndc = new THREE.Vector3();

/** @param {string} name */
function formatEnglishName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * @param {object} ocean
 * @param {number} index
 */
export function normalizeOceanHotspot(ocean, index, radius) {
  const lng = ocean.lng ?? ocean.lon;
  const normalized = {
    id: ocean.id,
    index: ocean.index ?? index,
    name: ocean.name,
    englishName: ocean.englishName ?? ocean.name,
    lat: ocean.lat,
    lng,
    localPosition: null,
    shortDescription: ocean.shortDescription ?? ocean.text ?? ocean.description ?? '',
    targetTab: ocean.targetTab ?? ocean.id,
  };
  if (typeof radius === 'number') {
    normalized.localPosition = latLngToVector3(normalized.lat, normalized.lng, radius);
  }
  return normalized;
}

/**
 * DOM overlay hotspots projected each frame via earthGroup.matrixWorld + camera.project.
 *
 * @param {THREE.Group} earthGroup
 * @param {Array<object>} oceans
 * @param {HTMLElement} hotspotLayer
 */
export function createOceanMarkers(earthGroup, oceans, hotspotLayer) {
  /** @type {Array<{ el: HTMLButtonElement, ocean: ReturnType<typeof normalizeOceanHotspot>, localPosition: THREE.Vector3 }>} */
  const markers = [];
  let activeId = null;
  const hotspotRadius = EARTH_VISUAL_RADIUS * EARTH_HOTSPOT_RADIUS_SCALE;

  const applyActiveState = () => {
    markers.forEach(({ el, ocean }) => {
      const isActive = ocean.id === activeId;
      el.classList.toggle('is-active', isActive);
      el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  const triggerPulse = (el) => {
    el.classList.remove('is-pulse');
    void el.offsetWidth;
    el.classList.add('is-pulse');
    el.addEventListener('animationend', () => el.classList.remove('is-pulse'), { once: true });
  };

  const selectPin = (ocean, el) => {
    if (el.classList.contains('is-backface') || el.style.pointerEvents === 'none') return;

    activeId = ocean.id;
    window.selectedOcean = ocean.id;
    applyActiveState();
    triggerPulse(el);
    window.dispatchEvent(
      new CustomEvent('lancun-ocean-pin-select', {
        bubbles: true,
        detail: { ocean, id: ocean.id },
      }),
    );
  };

  oceans.forEach((raw, index) => {
    const ocean = normalizeOceanHotspot(raw, index, hotspotRadius);
    const localPosition = ocean.localPosition.clone();

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ocean-hotspot globe-pin';
    el.dataset.oceanId = ocean.id;
    el.tabIndex = 0;
    el.setAttribute('aria-pressed', 'false');
    el.setAttribute('aria-label', `查看${ocean.name}档案`);

    const tooltipEnglish = formatEnglishName(ocean.englishName);

    el.innerHTML = `
      <span class="globe-pin__ring" aria-hidden="true"></span>
      <span class="globe-pin__plus" aria-hidden="true">+</span>
      <span class="globe-pin__tooltip ocean-hotspot-tooltip" role="tooltip">
        <span class="globe-pin__tooltip-title">${ocean.name} ${tooltipEnglish}</span>
        <span class="globe-pin__tooltip-hint">点击查看档案</span>
      </span>`;

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('lancun-globe-hint-dismiss'));
      selectPin(ocean, el);
    });

    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        selectPin(ocean, el);
      }
    });

    hotspotLayer.appendChild(el);
    markers.push({ el, ocean, localPosition });
  });

  /**
   * localPosition → matrixWorld → camera.project → DOM transform + backface cull.
   * @param {THREE.PerspectiveCamera} camera
   * @param {THREE.Group} earthGroup
   * @param {HTMLElement} container
   */
  const updateHotspotPositions = (camera, earthGroup, container) => {
    if (!container?.clientWidth || !container?.clientHeight) return;

    earthGroup.updateMatrixWorld(true);
    earthGroup.getWorldPosition(_center);
    _cameraDir.subVectors(camera.position, _center).normalize();
    camera.updateMatrixWorld(true);

    const w = container.clientWidth;
    const h = container.clientHeight;

    markers.forEach(({ el, localPosition }) => {
      _world.copy(localPosition).applyMatrix4(earthGroup.matrixWorld);

      _normal.subVectors(_world, _center).normalize();
      const isFrontFacing = _normal.dot(_cameraDir) > FACING_THRESHOLD;

      _ndc.copy(_world).project(camera);
      const isInsideView =
        _ndc.x >= -1 &&
        _ndc.x <= 1 &&
        _ndc.y >= -1 &&
        _ndc.y <= 1 &&
        _ndc.z >= -1 &&
        _ndc.z <= 1;

      const visible = isFrontFacing && isInsideView;
      const x = (_ndc.x * 0.5 + 0.5) * w;
      const y = (-_ndc.y * 0.5 + 0.5) * h;

      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.classList.toggle('is-backface', !visible);
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
      el.style.visibility = visible ? 'visible' : 'hidden';
      el.tabIndex = visible ? 0 : -1;

      if (!visible && document.activeElement === el) {
        el.blur();
      }
    });
  };

  const dispose = () => {
    markers.forEach(({ el }) => el.remove());
    markers.length = 0;
  };

  return {
    markers,
    updateHotspotPositions,
    updateHotspotVisibility: updateHotspotPositions,
    /** @deprecated alias */
    updateVisibility: updateHotspotPositions,
    setActive(id) {
      activeId = id || null;
      window.selectedOcean = activeId;
      applyActiveState();
    },
    getActiveId() {
      return activeId;
    },
    dispose,
  };
}
