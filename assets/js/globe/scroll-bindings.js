/**
 * ScrollTrigger subtle camera dolly for #ocean-explore.
 * Does NOT touch earthGroup.rotation.y — constitution v1.3 owns independent Y spin.
 */
export function bindGlobeScroll({ section, camera, earthGroup, reduceMotion }) {
  const noop = { apply: () => {}, dispose: () => {} };

  if (!section || !camera || !earthGroup) return noop;
  if (typeof reduceMotion === 'function' && reduceMotion()) return noop;
  if (!window.gsap?.registerPlugin || !window.ScrollTrigger) return noop;

  window.gsap.registerPlugin(window.ScrollTrigger);

  const state = { dolly: 1 };
  const homeZ = () => camera.userData.homeZ ?? camera.position.z;

  const trigger = window.ScrollTrigger.create({
    trigger: section,
    start: 'top 88%',
    end: 'bottom 12%',
    scrub: 0.55,
    onUpdate: (self) => {
      state.dolly = 1 - self.progress * 0.04;
    },
  });

  const apply = () => {
    // Keep X/Y fixed; only scale Z from resize-fitted home distance.
    camera.position.z = homeZ() * state.dolly;
  };

  return {
    apply,
    dispose: () => {
      trigger.kill();
      camera.position.z = homeZ();
    },
  };
}
