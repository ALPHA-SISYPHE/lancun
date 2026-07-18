const LANCUN_PREFS_KEY = 'lancun.prefs';
const LANCUN_HERO_POSTER_REMOTE = 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1920';
const LANCUN_HERO_POSTER_LOCAL = 'assets/media/hero-poster.jpg';
const LANCUN_HERO_VIDEO_LOCAL = 'assets/media/hero.mp4';

const defaultPrefs = () => ({ videoBackground: true, reduceMotion: false });

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
  const hero = document.querySelector('.video-hero');
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
  const hero = document.querySelector('.video-hero');
  if (!hero) return;
  hero.classList.toggle('has-ken-burns', !shouldReduceMotion());
}

window.LANCUN_getPrefs = getLancunPrefs;
window.LANCUN_setPrefs = setLancunPrefs;
window.LANCUN_applyHeroPrefs = () => {
  applyMotionPref();
  applyHeroMedia();
  initHeroKenBurns();
};

document.addEventListener('DOMContentLoaded', () => {
  applyMotionPref();
  applyHeroMedia();
  initHeroKenBurns();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    applyMotionPref();
    applyHeroMedia();
    initHeroKenBurns();
  });
});
