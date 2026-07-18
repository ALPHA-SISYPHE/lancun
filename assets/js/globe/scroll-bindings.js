/**
 * ScrollTrigger camera dolly — ABOLISHED by constitution v1.7.
 * Framing is locked via GlobeScene._resolveEarthFraming; scroll must not change camera.z.
 */
export function bindGlobeScroll() {
  return { apply: () => {}, dispose: () => {} };
}
