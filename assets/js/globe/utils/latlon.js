import * as THREE from '../../vendor/three.module.min.js';

export const LON_OFFSET = 0;
export const LON_SIGN = 1;
/** @deprecated Alias for spec compatibility */
export const lonOffset = LON_OFFSET;
/** @deprecated Alias for spec compatibility */
export const lonSign = LON_SIGN;
export const EARTH_HOTSPOT_RADIUS_SCALE = 1.02;

/**
 * Convert WGS84 lat/lng (degrees) to a point on a sphere.
 * @param {number} lat -90..90
 * @param {number} lng -180..180
 * @param {number} radius
 * @returns {THREE.Vector3}
 */
export function latLngToVector3(lat, lng, radius) {
  const adjustedLng = LON_SIGN * lng + LON_OFFSET;
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(adjustedLng + 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/** @deprecated Use latLngToVector3 */
export const latLonToVector3 = latLngToVector3;
