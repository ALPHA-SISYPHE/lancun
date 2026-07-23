/**
 * 澜存 · 小海龟自定义光标 v3
 * 俯视海绿龟 · 固定左上 45° · idle 划水
 */
(function turtleCursorModule() {
  const PAGE_WHITELIST = ['home', 'ocean', 'rescue', 'species', 'action', 'profile'];

  /** @type {Readonly<{ lerp: number; sizeRem: number; idleThresholdPx: number; idleDelayMs: number }>} */
  const CONFIG = Object.freeze({
    lerp: 0.2,
    sizeRem: 2.25,
    idleThresholdPx: 2,
    idleDelayMs: 120,
  });

  const TEXT_INPUT_TYPES = new Set([
    'text', 'email', 'password', 'search', 'url', 'tel', 'number',
  ]);

  const INTERACTIVE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'summary',
    'label[for]',
    'select:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]:not([aria-disabled="true"])',
    '[role="menuitem"]:not([aria-disabled="true"])',
    '[role="tab"]:not([aria-disabled="true"])',
    '.filter-button',
    '.auth-tab',
    '.account-menu__link',
    '.account-menu__action',
    '.globe-pin',
  ].join(',');

  function canUseTurtleCursor() {
    const page = document.body?.dataset?.page;
    if (!page || !PAGE_WHITELIST.includes(page)) return false;
    if (!window.matchMedia('(pointer: fine)').matches) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia('(max-width: 48rem)').matches) return false;
    return true;
  }

  function getTurtleMarkup() {
    return `
      <div class="turtle-orient">
        <div class="turtle-sway">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" class="turtle-svg">
            <defs>
              <linearGradient id="turtleShellGradTop" x1="30%" y1="0%" x2="70%" y2="100%">
                <stop offset="0%" stop-color="#52B788"/>
                <stop offset="45%" stop-color="#40916C"/>
                <stop offset="100%" stop-color="#2D6A4F"/>
              </linearGradient>
              <radialGradient id="turtleShellSheen" cx="40%" cy="30%" r="55%">
                <stop offset="0%" stop-color="#95D5B2" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#2D6A4F" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <g class="turtle-body">
              <g class="turtle-bubbles" aria-hidden="true">
                <circle class="turtle-bubble turtle-bubble-1" cx="50" cy="46" r="1.5" fill="#B7E4C7" opacity="0"/>
                <circle class="turtle-bubble turtle-bubble-2" cx="54" cy="40" r="1.1" fill="#D8F3DC" opacity="0"/>
                <circle class="turtle-bubble turtle-bubble-3" cx="47" cy="52" r="0.9" fill="#B7E4C7" opacity="0"/>
              </g>
              <g class="turtle-fin turtle-fin-back-right">
                <path d="M46 48c5 2 8 5 9 9 0 2-1 3-3 3-2 0-4-2-6-5-2-3-3-6-2-7Z" fill="#40916C"/>
                <path d="M48 50l4 3M49 54l5 1" stroke="#2D6A4F" stroke-width="0.7" stroke-linecap="round" fill="none" opacity="0.6"/>
              </g>
              <g class="turtle-fin turtle-fin-back-left">
                <path d="M18 48c-5 2-8 5-9 9 0 2 1 3 3 3 2 0 4-2 6-5 2-3 3-6 2-7Z" fill="#40916C"/>
                <path d="M16 50l-4 3M15 54l-5 1" stroke="#2D6A4F" stroke-width="0.7" stroke-linecap="round" fill="none" opacity="0.6"/>
              </g>
              <path class="turtle-tail" d="M32 54c-2 2-2 5 0 7 2-1 4-1 6 0 2-2 3-4 2-2-1-4-3-4-5 0-2 1-4 2-4Z" fill="#52B788"/>
              <ellipse class="turtle-shell-back" cx="32" cy="36" rx="19" ry="21" fill="url(#turtleShellGradTop)"/>
              <ellipse cx="32" cy="36" rx="19" ry="21" fill="url(#turtleShellSheen)"/>
              <g class="turtle-scutes">
                <path d="M32 18c-4 0-7 2-8 5 2-1 4-1 6 0 2-1 4-1 6 0-1-3-4-5-8-5Z" fill="#52B788" opacity="0.92"/>
                <path d="M32 24c-6 0-10 2-12 6 3-1 6-2 9-2s6 1 9 2c-2-4-6-6-12-6Z" fill="#40916C" opacity="0.88"/>
                <path d="M20 34c-1 3 0 7 2 10 3-2 6-3 10-3s7 1 10 3c2-3 3-7 2-10-4 2-8 3-12 3s-8-1-12-3Z" fill="#52B788" opacity="0.82"/>
                <path d="M24 44c1 2 4 3 8 3s7-1 8-3c-2 1-5 1-8 1s-6 0-8-1Z" fill="#40916C" opacity="0.78"/>
                <path d="M32 20v28" stroke="#1B4332" stroke-width="0.65" opacity="0.32"/>
                <path d="M24 28h16M22 36h20M24 44h16" stroke="#1B4332" stroke-width="0.45" opacity="0.25"/>
                <path d="M26 24l6 4 6-4M24 34l8 5 8-5M26 42l6 3 6-3" stroke="#1B4332" stroke-width="0.4" opacity="0.22" fill="none"/>
                <ellipse class="turtle-shell-rim" cx="32" cy="36" rx="18" ry="20" fill="none" stroke="#74C69D" stroke-width="1.3" opacity="0.62"/>
              </g>
              <g class="turtle-fin turtle-fin-front-left">
                <path d="M14 26c-4 3-7 7-7 11 1 2 3 3 5 2 3-1 5-4 6-8 1-3 0-5-4-5Z" fill="#52B788"/>
                <path d="M12 30l5 2M11 35l6 0" stroke="#2D6A4F" stroke-width="0.75" stroke-linecap="round" fill="none" opacity="0.6"/>
              </g>
              <g class="turtle-fin turtle-fin-front-right">
                <path d="M50 26c4 3 7 7 7 11-1 2-3 3-5 2-3-1-5-4-6-8-1-3 0-5 4-5Z" fill="#52B788"/>
                <path d="M52 30l-5 2M53 35l-6 0" stroke="#2D6A4F" stroke-width="0.75" stroke-linecap="round" fill="none" opacity="0.6"/>
              </g>
              <g class="turtle-head">
                <ellipse cx="32" cy="13" rx="9" ry="7.5" fill="#74C69D"/>
                <ellipse cx="32" cy="13.5" rx="7.5" ry="6" fill="#95D5B2" opacity="0.5"/>
              </g>
            </g>
          </svg>
        </div>
      </div>
    `.trim();
  }

  function isDisabled(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.disabled) return true;
    if (node.getAttribute('aria-disabled') === 'true') return true;
    return false;
  }

  function isTextTarget(node) {
    if (!node || node.nodeType !== 1) return false;
    const tag = node.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (node.isContentEditable) return true;
    if (tag === 'input') {
      const type = (node.getAttribute('type') || 'text').toLowerCase();
      return TEXT_INPUT_TYPES.has(type);
    }
    return false;
  }

  function hasGrabCursor(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.classList?.contains('globe-core')) return true;
    const cursor = window.getComputedStyle(node).cursor;
    return cursor === 'grab' || cursor === 'grabbing';
  }

  function resolveInteractiveTarget(node) {
    let current = node;
    while (current && current !== document.documentElement) {
      if (current.matches?.(INTERACTIVE_SELECTOR)) return current;
      if (isTextTarget(current)) return current;
      if (hasGrabCursor(current)) return current;
      if (isDisabled(current)) return current;
      const cursor = window.getComputedStyle(current).cursor;
      if (cursor === 'not-allowed') return current;
      if (cursor === 'pointer') return current;
      current = current.parentElement;
    }
    return null;
  }

  function resolveCursorState(x, y, isPressed) {
    const hit = document.elementFromPoint(x, y);
    if (!hit || hit.id === 'lancun-turtle-cursor' || hit.closest('#lancun-turtle-cursor')) {
      return isPressed ? 'press' : 'swim';
    }

    const target = resolveInteractiveTarget(hit);
    if (!target) return isPressed ? 'press' : 'swim';

    if (isDisabled(target)) return 'not-allowed';

    const cursor = window.getComputedStyle(target).cursor;
    if (cursor === 'not-allowed') return 'not-allowed';

    if (hasGrabCursor(target)) {
      return isPressed ? 'grabbing' : 'grab';
    }

    if (isTextTarget(target)) return 'text';

    if (isPressed) return 'press';

    if (target.matches(INTERACTIVE_SELECTOR) || cursor === 'pointer') {
      return 'pointer';
    }

    return 'swim';
  }

  function supportsPopover() {
    return typeof HTMLElement.prototype.showPopover === 'function';
  }

  function initTurtleCursor() {
    if (!canUseTurtleCursor()) return;

    document.documentElement.classList.add('turtle-cursor-active');
    document.documentElement.style.setProperty('--turtle-cursor-size', `${CONFIG.sizeRem}rem`);

    const root = document.createElement('div');
    root.id = 'lancun-turtle-cursor';
    root.setAttribute('aria-hidden', 'true');
    if (supportsPopover()) {
      root.setAttribute('popover', 'manual');
    }
    root.dataset.cursorState = 'swim';
    root.dataset.cursorIdle = 'false';
    root.dataset.cursorMoving = 'false';
    root.innerHTML = getTurtleMarkup();
    document.body.appendChild(root);

    const canLift = supportsPopover();

    const liftCursorToTop = () => {
      if (!canLift) return;
      try {
        if (root.matches(':popover-open')) {
          root.hidePopover();
        }
        root.showPopover();
      } catch {
        /* popover lift best-effort */
      }
    };

    const shouldLiftForOverlay = () => {
      if (document.querySelector('dialog[open]')) return true;
      if (document.querySelector('.species-drawer.is-open')) return true;
      if (document.querySelector('.auth-modal-overlay:not([hidden])')) return true;
      return false;
    };

    const onDialogToggle = (event) => {
      if (!(event.target instanceof HTMLDialogElement)) return;
      if (event.newState === 'open') {
        liftCursorToTop();
      }
    };

    const overlayObserver = new MutationObserver(() => {
      if (shouldLiftForOverlay()) {
        liftCursorToTop();
      }
    });

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let posX = mouseX;
    let posY = mouseY;
    let isPressed = false;
    let isVisible = false;
    let isIdle = false;
    let isMoving = false;
    let rafId = 0;
    let currentState = 'swim';
    let lastMoveTime = performance.now();

    const applyState = (nextState) => {
      if (nextState === currentState) return;
      currentState = nextState;
      root.dataset.cursorState = nextState;
    };

    const setIdle = (idle) => {
      if (idle === isIdle) return;
      isIdle = idle;
      root.dataset.cursorIdle = idle ? 'true' : 'false';
    };

    const setMoving = (moving) => {
      if (moving === isMoving) return;
      isMoving = moving;
      root.dataset.cursorMoving = moving ? 'true' : 'false';
    };

    const tick = (now) => {
      posX += (mouseX - posX) * CONFIG.lerp;
      posY += (mouseY - posY) * CONFIG.lerp;
      root.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

      const idleFor = now - lastMoveTime;
      setIdle(idleFor >= CONFIG.idleDelayMs);
      setMoving(!isIdle && idleFor < CONFIG.idleDelayMs);

      rafId = window.requestAnimationFrame(tick);
    };

    const onMove = (event) => {
      const dx = event.clientX - prevMouseX;
      const dy = event.clientY - prevMouseY;
      const speed = Math.hypot(dx, dy);

      mouseX = event.clientX;
      mouseY = event.clientY;

      if (speed >= CONFIG.idleThresholdPx) {
        lastMoveTime = performance.now();
      }

      prevMouseX = mouseX;
      prevMouseY = mouseY;

      if (!isVisible) {
        isVisible = true;
        root.classList.add('is-visible');
        posX = mouseX;
        posY = mouseY;
        if (!rafId) rafId = window.requestAnimationFrame(tick);
      }

      applyState(resolveCursorState(mouseX, mouseY, isPressed));
    };

    const onDown = () => {
      isPressed = true;
      applyState(resolveCursorState(mouseX, mouseY, true));
    };

    const onUp = () => {
      isPressed = false;
      applyState(resolveCursorState(mouseX, mouseY, false));
    };

    const onLeave = () => {
      isVisible = false;
      root.classList.remove('is-visible');
    };

    const onEnter = () => {
      if (Number.isFinite(mouseX)) root.classList.add('is-visible');
    };

    const teardown = () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('toggle', onDialogToggle, true);
      overlayObserver.disconnect();
      if (canLift && root.matches(':popover-open')) {
        try {
          root.hidePopover();
        } catch {
          /* ignore */
        }
      }
      document.documentElement.classList.remove('turtle-cursor-active');
      root.remove();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      motionQuery.removeEventListener('change', onMotionChange);
      pointerQuery.removeEventListener('change', onPointerChange);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    const onMotionChange = (event) => {
      if (event.matches) teardown();
    };

    const onPointerChange = (event) => {
      if (!event.matches) teardown();
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    document.addEventListener('toggle', onDialogToggle, true);
    overlayObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'open'],
    });
    motionQuery.addEventListener('change', onMotionChange);
    pointerQuery.addEventListener('change', onPointerChange);

    root.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
    liftCursorToTop();
    rafId = window.requestAnimationFrame(tick);
  }

  window.initTurtleCursor = initTurtleCursor;
})();
