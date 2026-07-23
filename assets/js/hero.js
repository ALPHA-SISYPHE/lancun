const LANCUN_PREFS_KEY = 'lancun.prefs';
const LANCUN_HERO_POSTER_REMOTE = 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1920';
const LANCUN_HERO_POSTER_LOCAL = 'assets/media/hero-poster.jpg';
const LANCUN_HERO_VIDEO_LOCAL = 'assets/media/hero.mp4';

const defaultPrefs = () => ({ videoBackground: true, reduceMotion: false, backgroundAudio: true });

function getLancunPrefs() {
  try {
    return { ...defaultPrefs(), ...JSON.parse(localStorage.getItem(LANCUN_PREFS_KEY)) };
  } catch {
    return defaultPrefs();
  }
}

function setLancunPrefs(partial) {
  const next = { ...getLancunPrefs(), ...partial };
  localStorage.setItem(LANCUN_PREFS_KEY, JSON.stringify(next));
  return next;
}

function shouldReduceMotion() {
  const prefs = getLancunPrefs();
  if (prefs.reduceMotion) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyMotionPref() {
  document.documentElement.dataset.reducedMotion = shouldReduceMotion() ? 'true' : 'false';
}

function resolveMediaPath(relativeFromRoot) {
  if (document.body.dataset.page === 'home') return relativeFromRoot;
  return relativeFromRoot.replace(/^assets\//, '../assets/');
}

async function probeMedia(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function applyHeroMedia() {
  const hero = document.querySelector('.hero-ocean-intro, .video-hero');
  if (!hero) return;

  const prefs = getLancunPrefs();
  const video = hero.querySelector('.hero-video');
  const posterImg = hero.querySelector('.hero-poster');
  const fallback = hero.querySelector('.video-fallback');

  // Local hero-poster.jpg is optional; remote avoids 404 when the file is not deployed.
  const posterSrc = LANCUN_HERO_POSTER_REMOTE;

  if (posterImg) {
    posterImg.src = posterSrc;
    posterImg.alt = '';
    posterImg.decoding = 'async';
  }

  const showVideo = prefs.videoBackground && video && !shouldReduceMotion();

  if (!showVideo) {
    if (video) {
      video.removeAttribute('src');
      video.hidden = true;
    }
    hero.classList.add('is-poster-only');
    if (fallback) fallback.hidden = true;
    return;
  }

  hero.classList.remove('is-poster-only');
  const videoLocal = resolveMediaPath(LANCUN_HERO_VIDEO_LOCAL);
  if (video) {
    video.hidden = false;
    video.src = videoLocal;
    video.poster = posterSrc;
    video.playbackRate = 0.6;
    video.defaultPlaybackRate = 0.6;
    video.addEventListener('loadedmetadata', () => { video.playbackRate = 0.6; }, { once: true });
    video.addEventListener('ratechange', () => {
      if (Math.abs(video.playbackRate - 0.6) > 0.01) video.playbackRate = 0.6;
    });
    video.addEventListener('error', () => {
      video.hidden = true;
      hero.classList.add('is-poster-only');
    }, { once: true });
  }
  if (fallback) fallback.hidden = true;
}

function initHeroKenBurns() {
  const hero = document.querySelector('.hero-ocean-intro, .video-hero');
  if (!hero) return;
  hero.classList.toggle('has-ken-burns', !shouldReduceMotion());
}

function syncHomeScreenHeight() {
  if (document.body?.dataset?.page !== 'home') return;
  document.documentElement.style.setProperty('--home-screen', `${window.innerHeight}px`);
}

function isHomeHeroPinned() {
  const section = document.querySelector('[data-ocean-explore]');
  if (!section) return window.scrollY < window.innerHeight * 0.5;
  return window.scrollY < section.offsetTop - 1;
}

function syncHeroPinState() {
  if (document.body.dataset.page !== 'home') return;
  const pinned = isHomeHeroPinned();
  document.body.classList.toggle('hero-media-unpinned', !pinned);
  document.body.classList.toggle('is-hero-media-pinned', pinned);
}

function syncHeroVideoPlayback(hero, video, inView) {
  if (!video || video.hidden || !video.getAttribute('src')) return;
  if (!inView || document.hidden) {
    video.pause();
    return;
  }
  const play = video.play();
  if (play && typeof play.catch === 'function') play.catch(() => {});
}

function getHomeGlobeScrollTop() {
  const doc = document.documentElement;
  const section = document.querySelector('[data-ocean-explore]');
  syncHomeScreenHeight();
  const maxScroll = Math.max(0, doc.scrollHeight - doc.clientHeight);
  const sectionTop = section?.offsetTop ?? window.innerHeight;
  return Math.max(sectionTop, maxScroll);
}

function scrollToHomeGlobeSection({ behavior = 'smooth' } = {}) {
  const section = document.querySelector('[data-ocean-explore]');
  if (!section) return;

  document.body.classList.add('hero-media-unpinned');
  document.body.classList.remove('is-hero-media-pinned');

  syncHomeScreenHeight();
  const top = getHomeGlobeScrollTop();
  window.scrollTo({ top, behavior });

  const snap = () => {
    syncHomeScreenHeight();
    window.scrollTo({ top: getHomeGlobeScrollTop(), behavior: 'auto' });
    syncHeroPinState();
  };

  if (behavior === 'smooth') {
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', snap, { once: true });
    } else {
      window.setTimeout(snap, 700);
    }
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(snap);
    });
  }
}

function initHeroScroll() {
  document.querySelectorAll('[data-scroll-target]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const reduced = shouldReduceMotion();
      scrollToHomeGlobeSection({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });
}

function initHomeGlobeHashScroll() {
  if (document.body?.dataset?.page !== 'home') return;
  if (location.hash !== '#ocean-explore') return;
  syncHomeScreenHeight();
  requestAnimationFrame(() => scrollToHomeGlobeSection({ behavior: 'auto' }));
}

function syncHeroOnScroll(hero, video) {
  syncHeroPinState();
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const inView = rect.bottom > 0 && rect.top < window.innerHeight;
  syncHeroVideoPlayback(hero, video, inView);
}

function initHeroVideoViewport() {
  const hero = document.querySelector('#hero-intro, .hero-ocean-intro, .video-hero');
  const video = hero?.querySelector('.hero-video');
  if (!hero) return;

  syncHeroOnScroll(hero, video);
  window.addEventListener('scroll', () => syncHeroOnScroll(hero, video), { passive: true });
  window.addEventListener('resize', () => {
    syncHomeScreenHeight();
    syncHeroOnScroll(hero, video);
  });

  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncHeroVideoPlayback(hero, video, entry.isIntersecting);
    },
    { threshold: 0 },
  );
  observer.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video?.pause();
      return;
    }
    syncHeroOnScroll(hero, video);
  });
}

window.LANCUN_getPrefs = getLancunPrefs;
window.LANCUN_setPrefs = setLancunPrefs;
window.LANCUN_scrollToHomeGlobeSection = scrollToHomeGlobeSection;
window.LANCUN_applyHeroPrefs = () => {
  applyMotionPref();
  applyHeroMedia();
  initHeroKenBurns();
};

document.addEventListener('DOMContentLoaded', () => {
  applyMotionPref();
  syncHomeScreenHeight();
  applyHeroMedia();
  initHeroKenBurns();
  initHeroScroll();
  initHomeGlobeHashScroll();
  initHeroVideoViewport();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    applyMotionPref();
    applyHeroMedia();
    initHeroKenBurns();
  });
});
