/**
 * #ocean-explore background video — separate from hero.js / hero.mp4
 * Loop + muted; play only when section is in view; respect lancun.prefs / reduced-motion.
 */
(function () {
  const VIDEO_SRC = 'assets/media/ocean-explore-bg.mp4';

  function getPrefs() {
    if (typeof window.LANCUN_getPrefs === 'function') return window.LANCUN_getPrefs();
    return { videoBackground: true, reduceMotion: false };
  }

  function shouldReduceMotion() {
    const prefs = getPrefs();
    if (prefs.reduceMotion) return true;
    if (document.documentElement.dataset.reducedMotion === 'true') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function shouldShowVideo() {
    const prefs = getPrefs();
    if (prefs.videoBackground === false) return false;
    if (shouldReduceMotion()) return false;
    return true;
  }

  function applyOceanExploreVideo() {
    if (document.body?.dataset?.page !== 'home') return;

    const section = document.querySelector('[data-ocean-explore]');
    const video = document.querySelector('[data-ocean-explore-video]');
    if (!section || !video) return;

    section.classList.add('ocean-explore--video-bg');

    if (!shouldShowVideo()) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.hidden = true;
      section.classList.add('ocean-explore--no-video');
      return;
    }

    section.classList.remove('ocean-explore--no-video');
    video.hidden = false;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (video.getAttribute('src') !== VIDEO_SRC) {
      video.src = VIDEO_SRC;
    }
  }

  function bindViewportPlayback() {
    const section = document.querySelector('[data-ocean-explore]');
    const video = document.querySelector('[data-ocean-explore-video]');
    if (!section || !video || typeof IntersectionObserver === 'undefined') return;

    const syncPlayback = (shouldPlay) => {
      if (!shouldShowVideo() || video.hidden || document.hidden) {
        video.pause();
        return;
      }
      if (shouldPlay) {
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      } else {
        video.pause();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => syncPlayback(entry.isIntersecting));
      },
      { root: null, threshold: 0.08 },
    );
    io.observe(section);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        video.pause();
        return;
      }
      const rect = section.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      syncPlayback(inView);
    });
  }

  function boot() {
    applyOceanExploreVideo();
    bindViewportPlayback();

    window.LANCUN_applyOceanExploreVideo = applyOceanExploreVideo;

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      applyOceanExploreVideo();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
