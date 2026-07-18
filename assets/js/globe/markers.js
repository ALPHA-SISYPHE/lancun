import * as THREE from '../vendor/three.module.min.js';
import { CSS3DSprite, CSS3DRenderer } from '../vendor/CSS3DRenderer.js';
import { latLonToVector3 } from './utils/latlon.js';

const _markerPos = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const HEMISPHERE_THRESHOLD = 0.05;

/**
 * CSS3D ocean markers (billboard sprites) + left-panel detail wiring.
 * Markers on the back hemisphere are hidden relative to the camera.
 */
export function createMarkers({
  earthGroup,
  canvasWrap,
  section,
  oceans,
  onSelect,
  onClose,
}) {
  const labelRenderer = new CSS3DRenderer();
  labelRenderer.domElement.className = 'globe-label-layer';
  canvasWrap.appendChild(labelRenderer.domElement);

  const intro = section.querySelector('[data-ocean-intro]');
  const detail = section.querySelector('[data-ocean-detail]');
  const detailTitle = section.querySelector('[data-ocean-detail-title]');
  const detailText = section.querySelector('[data-ocean-detail-text]');
  const detailLink = section.querySelector('[data-ocean-detail-link]');
  const closeBtn = section.querySelector('[data-ocean-close]');

  const markerPins = [];
  let activeId = null;

  const showIntro = () => {
    activeId = null;
    if (intro) intro.hidden = false;
    if (detail) detail.hidden = true;
    markerPins.forEach(({ el }) => el.classList.remove('is-active'));
    onClose?.();
  };

  const showDetail = (ocean) => {
    activeId = ocean.id;
    if (detailTitle) detailTitle.textContent = ocean.title;
    if (detailText) detailText.textContent = ocean.text;
    if (detailLink) {
      detailLink.href = ocean.learnMoreHref || 'pages/ocean.html';
      detailLink.textContent = `继续了解${ocean.name}`;
    }
    if (intro) intro.hidden = true;
    if (detail) detail.hidden = false;
    markerPins.forEach(({ el, ocean: o }) => {
      el.classList.toggle('is-active', o.id === ocean.id);
    });
    closeBtn?.focus();
    onSelect?.(ocean);
  };

  closeBtn?.addEventListener('click', () => showIntro());

  const onKeydown = (event) => {
    if (event.key === 'Escape' && detail && !detail.hidden) {
      showIntro();
      intro?.querySelector('h2')?.focus();
    }
  };
  document.addEventListener('keydown', onKeydown);

  oceans.forEach((ocean) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'globe-pin';
    el.dataset.oceanId = ocean.id;
    el.setAttribute('aria-label', `查看${ocean.name}介绍`);
    el.innerHTML = '<span aria-hidden="true">+</span>';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showDetail(ocean);
    });
    const label = new CSS3DSprite(el);
    label.position.copy(latLonToVector3(ocean.lat, ocean.lon, 1.06));
    // CSS3D maps ~1 world unit ≈ 1 CSS px; unit-sphere pins need ~1/500–1/800 scale.
    label.scale.setScalar(0.0015);
    earthGroup.add(label);
    markerPins.push({ el, ocean, label });
  });

  const updateHemisphereVisibility = (camera) => {
    camera.getWorldPosition(_camPos);

    markerPins.forEach(({ label }) => {
      label.getWorldPosition(_markerPos);
      label.visible = _markerPos.dot(_camPos) > HEMISPHERE_THRESHOLD;
    });
  };

  return {
    labelRenderer,
    showIntro,
    showDetail,
    getActiveId: () => activeId,
    render(scene, camera) {
      updateHemisphereVisibility(camera);
      labelRenderer.render(scene, camera);
    },
    setSize(w, h) {
      labelRenderer.setSize(w, h);
    },
    dispose() {
      document.removeEventListener('keydown', onKeydown);
      labelRenderer.domElement.remove();
    },
  };
}
