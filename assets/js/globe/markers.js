import { CSS2DObject } from '../vendor/CSS2DRenderer.js';
import { latLonToVector3 } from './utils/latlon.js';

const MARKER_RADIUS = 1.06;

/**
 * @param {THREE.Group} earthGroup
 * @param {Array<{ id: string, name: string, lat: number, lon: number }>} oceans
 */
export function createOceanMarkers(earthGroup, oceans) {
  const markers = [];

  oceans.forEach((ocean) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'globe-pin';
    el.dataset.oceanId = ocean.id;
    el.setAttribute('aria-label', `探索${ocean.name}`);
    el.innerHTML = `
      <span class="globe-pin__plus" aria-hidden="true">+</span>
      <span class="globe-pin__label">${ocean.name}</span>
      <span class="globe-pin__cta">Explore</span>`;

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      window.location.href = `pages/ocean.html?ocean=${encodeURIComponent(ocean.id)}#five-oceans`;
    });

    const label = new CSS2DObject(el);
    label.position.copy(latLonToVector3(ocean.lat, ocean.lon, MARKER_RADIUS));
    earthGroup.add(label);
    markers.push({ el, ocean, label });
  });

  return markers;
}
