import * as THREE from '../../vendor/three.module.min.js';

/**
 * Convert latitude/longitude (degrees) to a point on a sphere.
 * @param {number} lat
 * @param {number} lon
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

export function vector3ToLatLon(vec, radius = 1) {
  const n = vec.clone().normalize();
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(n.y));
  const lon = THREE.MathUtils.radToDeg(Math.atan2(n.z, -n.x)) - 180;
  return { lat, lon };
}
