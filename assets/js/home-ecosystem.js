/**
 * 首页 P6 · 探索生态与微交互
 */
(function initHomeEcosystem() {
  if (document.body?.dataset?.page !== 'home') return;

  const hero = document.querySelector('.hero-ocean-intro');
  const globeSection = document.querySelector('[data-ocean-explore]');
  const hint = document.querySelector('[data-globe-scene-hint]');
  const sectionIndicator = document.querySelector('[data-home-section-indicator]');

  function motionReduced() {
    return document.documentElement.dataset.reducedMotion === 'true'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function dismissGlobeHint() {
    if (!hint || hint.classList.contains('is-dismissed')) return;
    hint.classList.add('is-dismissed');
    if (!motionReduced()) {
      hint.addEventListener(
        'transitionend',
        () => {
          hint.hidden = true;
        },
        { once: true },
      );
    } else {
      hint.hidden = true;
    }
  }

  window.addEventListener('lancun-globe-hint-dismiss', dismissGlobeHint);
  window.addEventListener('lancun-ocean-pin-select', dismissGlobeHint);

  function initSectionIndicator() {
    if (!sectionIndicator || !hero || !globeSection) return;

    const items = [...sectionIndicator.querySelectorAll('[data-section-indicator]')];
    const map = {
      intro: hero,
      globe: globeSection,
    };

    items.forEach((item) => {
      item.addEventListener('click', (event) => {
        const key = item.dataset.sectionIndicator;
        const target = map[key];
        if (!target) return;
        event.preventDefault();
        if (key === 'globe' && typeof window.LANCUN_scrollToHomeGlobeSection === 'function') {
          window.LANCUN_scrollToHomeGlobeSection({
            behavior: motionReduced() ? 'auto' : 'smooth',
          });
          return;
        }
        target.scrollIntoView({
          behavior: motionReduced() ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    });

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = entry.target === hero ? 'intro' : entry.target === globeSection ? 'globe' : null;
          if (!key) return;
          items.forEach((item) => {
            item.classList.toggle('is-current', item.dataset.sectionIndicator === key);
          });
        });
      },
      { threshold: 0.45 },
    );

    observer.observe(hero);
    observer.observe(globeSection);
  }

  initSectionIndicator();
})();
