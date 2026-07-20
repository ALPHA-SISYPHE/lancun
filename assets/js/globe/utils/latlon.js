import * as THREE from '../../vendor/three.module.min.js';

/**
 * Convert WGS84 lat/lon (degrees) to a point on a sphere.
 * @param {number} lat -90..90
 * @param {number} lon -180..180
 * @param {number} radius
 * @returns {THREE.Vector3}
 */
export function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
