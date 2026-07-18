/**
 * ScrollTrigger scrub for #ocean-explore — subtle earth rotation + camera dolly.
 * Skipped when prefers-reduced-motion / lancun prefs.
 */
export function bindGlobeScroll({ section, camera, earthGroup, reduceMotion }) {
  const noop = { apply: () => {}, dispose: () => {} };

  if (!section || !camera || !earthGroup) return noop;
  if (typeof reduceMotion === 'function' && reduceMotion()) return noop;
  if (!window.gsap?.registerPlugin || !window.ScrollTrigger) return noop;

  window.gsap.registerPlugin(window.ScrollTrigger);

  const baseRotY = earthGroup.rotation.y;
  const state = { rot: 0, dolly: 1 };

  const trigger = window.ScrollTrigger.create({
    trigger: section,
    start: 'top 88%',
    end: 'bottom 12%',
    scrub: 0.55,
    onUpdate: (self) => {
      const p = self.progress;
      state.rot = p * 0.32;
      state.dolly = 1 - p * 0.045;
    },
  });

  const apply = () => {
    earthGroup.rotation.y = baseRotY + state.rot;
    if (state.dolly !== 1) camera.position.multiplyScalar(state.dolly);
  };

  return {
    apply,
    dispose: () => {
      trigger.kill();
      earthGroup.rotation.y = baseRotY;
    },
  };
}
