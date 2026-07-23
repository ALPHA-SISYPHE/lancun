const LANCUN_PREFS_KEY = 'lancun.prefs';
const LANCUN_AMBIENT_SRC = 'assets/media/ocean-ambient.mp3';
const LANCUN_USER_PREFS_KEY = 'ocean-user-preferences';
const LANCUN_CURRENT_USER_KEY = 'ocean-auth-current-user';
const AMBIENT_VOLUME = 0.3;

/** @type {HTMLAudioElement | null} */
let audio = null;
let gestureBound = false;
let pendingGestureResume = false;

function resolveMediaPath(relativeFromRoot) {
  if (document.body?.dataset?.page === 'home') return relativeFromRoot;
  return relativeFromRoot.replace(/^assets\//, '../assets/');
}

function getCurrentUsername() {
  try {
    const raw = localStorage.getItem(LANCUN_CURRENT_USER_KEY);
    if (!raw) return '';
    const user = JSON.parse(raw);
    return String(user?.username || '').trim();
  } catch {
    return '';
  }
}

function getGlobalPrefs() {
  try {
    return JSON.parse(localStorage.getItem(LANCUN_PREFS_KEY)) || {};
  } catch {
    return {};
  }
}

function isAmbientEnabled() {
  const username = getCurrentUsername();
  if (username) {
    try {
      const map = JSON.parse(localStorage.getItem(LANCUN_USER_PREFS_KEY)) || {};
      const stored = map[username];
      if (stored && typeof stored.backgroundAudio === 'boolean') {
        return stored.backgroundAudio;
      }
    } catch {
      /* fall through to global prefs */
    }
  }
  const legacy = getGlobalPrefs();
  if (typeof legacy.backgroundAudio === 'boolean') return legacy.backgroundAudio;
  return true;
}

function ensureAudio() {
  if (audio) return audio;
  audio = document.createElement('audio');
  audio.id = 'lancun-ambient-audio';
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = AMBIENT_VOLUME;
  audio.setAttribute('aria-hidden', 'true');
  audio.hidden = true;
  document.body.appendChild(audio);
  audio.addEventListener('error', () => {
    audio?.pause();
    audio?.removeAttribute('src');
  }, { once: true });
  return audio;
}

function removeGestureListeners() {
  if (!gestureBound) return;
  document.removeEventListener('click', onUserGesture, true);
  document.removeEventListener('touchstart', onUserGesture, true);
  document.removeEventListener('keydown', onUserGesture, true);
  gestureBound = false;
}

function onUserGesture() {
  removeGestureListeners();
  if (!isAmbientEnabled()) return;
  pendingGestureResume = false;
  attemptPlay();
}

function bindGestureFallback() {
  if (gestureBound) return;
  gestureBound = true;
  pendingGestureResume = true;
  document.addEventListener('click', onUserGesture, true);
  document.addEventListener('touchstart', onUserGesture, true);
  document.addEventListener('keydown', onUserGesture, true);
}

function attemptPlay() {
  if (!isAmbientEnabled()) return;
  const el = ensureAudio();
  const src = resolveMediaPath(LANCUN_AMBIENT_SRC);
  if (el.getAttribute('src') !== src) {
    el.src = src;
    el.load();
  }
  const playPromise = el.play();
  if (playPromise?.catch) {
    playPromise.catch(() => bindGestureFallback());
  }
}

function stopAmbient() {
  removeGestureListeners();
  pendingGestureResume = false;
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

function applyAmbientPreference() {
  if (isAmbientEnabled()) attemptPlay();
  else stopAmbient();
}

function setAmbientEnabled(enabled) {
  const next = Boolean(enabled);
  localStorage.setItem(LANCUN_PREFS_KEY, JSON.stringify({ ...getGlobalPrefs(), backgroundAudio: next }));
  applyAmbientPreference();
  return next;
}

window.LANCUN_getAmbientAudioEnabled = isAmbientEnabled;
window.LANCUN_setAmbientAudioEnabled = setAmbientEnabled;
window.LANCUN_applyAmbientAudio = applyAmbientPreference;

document.addEventListener('visibilitychange', () => {
  if (!audio || !isAmbientEnabled()) return;
  if (document.hidden) audio.pause();
  else if (!pendingGestureResume) attemptPlay();
});

document.addEventListener('DOMContentLoaded', () => {
  applyAmbientPreference();
});
