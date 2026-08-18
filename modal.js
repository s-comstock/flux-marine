/*--------------------
Modal JS
--------------------*/

let lenis;

function initModal() {
  const modals = document.querySelectorAll('[data-modal]');
  if (!modals.length) return;

  lenis = new Lenis();

  const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const isVisible = (el) =>
    el.checkVisibility ?
    el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true }) :
    !!el.getClientRects().length;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const registry = new Map(); // key -> { modal, dialog, scroller, buttonsWrap }
  let active = null; // { key, trigger }
  let anim = null;
  let backdropDown = false;

  // --- build registry ---
  modals.forEach((modal) => {
    const key = modal.getAttribute('data-modal');
    const dialog = modal.querySelector('[data-modal-content]');
    const scroller = modal.querySelector('[data-modal-scroller]') || dialog;
    const title = modal.querySelector('[data-modal-title]');
    const buttonsWrap = modal.querySelector('[data-modal-buttons-wrap]');

    if (!key) return console.warn('[modal] missing data-modal value', modal);
    if (!dialog) return console.warn('[modal] missing [data-modal-content]', modal);
    if (!buttonsWrap) console.warn('[modal] missing [data-modal-buttons-wrap]', modal);
    if (!scroller.hasAttribute('tabindex')) scroller.setAttribute('tabindex', '0');
    if (registry.has(key)) return console.warn('[modal] duplicate key:', key, modal);

    modal.id = modal.id || `modal-${key}`;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    if (!dialog.hasAttribute('role')) dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');

    if (title) {
      title.id = title.id || `${modal.id}-title`;
      dialog.setAttribute('aria-labelledby', title.id);
    }

    registry.set(key, { modal, dialog, scroller, buttonsWrap });
  });

  // Warn about triggers pointing at nothing
  document.querySelectorAll('[data-modal-open]').forEach((t) => {
    const key = t.getAttribute('data-modal-open');
    if (!registry.has(key)) {
      console.warn('[modal] trigger has no matching modal:', key, t);
      return;
    }
    t.setAttribute('aria-controls', registry.get(key).modal.id);
    t.setAttribute('aria-expanded', 'false');
  });

  // --- helpers ---
  function getItems(dialog) {
    return [...dialog.querySelectorAll(FOCUSABLE)].filter(isVisible);
  }

  function onFocusIn(e) {
    if (!active) return;
    const { dialog } = registry.get(active.key);
    if (dialog.contains(e.target)) return;
    (getItems(dialog)[0] || dialog).focus({ preventScroll: true });
  }

  function onKeydown(e) {
    if (!active) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;

    const { dialog } = registry.get(active.key);
    const items = getItems(dialog);
    if (!items.length) {
      e.preventDefault();
      dialog.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const cur = document.activeElement;

    if (e.shiftKey && (cur === first || cur === dialog)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && cur === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Modal Scroll Interaction
  function onScroll(e) {
    if (!active) return;
    const { buttonsWrap } = registry.get(active.key);
    if (!buttonsWrap) return;
    const isScrolled = e.target.scrollTop > 25;
    buttonsWrap.toggleAttribute('is-scrolled', isScrolled);
  }

  // --- open / close ---
  function open(key, trigger) {
    if (active) return;
    const entry = registry.get(key);
    if (!entry) return;
    const { modal, dialog, scroller, buttonsWrap } = entry;

    if (anim) anim.kill();
    active = { key, trigger };

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    lenis.stop();

    anim = gsap.timeline({ onComplete: () => { anim = null; } })
      .fromTo(modal, {
        opacity: 0
      }, {
        opacity: 1,
        duration: reduce ? 0 : 0.3,
        ease: 'power2.out'
      })
      .fromTo(dialog, {
          y: reduce ? 0 : 16,
          opacity: 0

        }, {
          y: 0,
          opacity: 1,
          duration: reduce ? 0 : 0.4,
          ease: 'power2.out'
        },
        reduce ? 0 : 0.05);

    // --- Guards --- //

    requestAnimationFrame(() => {
      const auto = dialog.querySelector('[data-modal-autofocus]');
      const target = auto || scroller;
      target.focus({ preventScroll: true });
      if (document.activeElement !== target) {
        console.warn('[modal] focus failed — target not focusable yet', target);
      }
      document.addEventListener('focusin', onFocusIn);

      if (buttonsWrap) {
        scroller.addEventListener('scroll', onScroll, { passive: true });
        onScroll
          ({ target: scroller }); // set correct initial state in case it opens already scrolled
      }
    });
  }

  function close() {
    if (!active) return;
    const { modal, dialog, scroller, buttonsWrap } = registry.get(active.key);
    const trigger = active.trigger;

    if (anim) anim.kill();

    // Detach the trap before restoring focus, or the restore snaps back in
    document.removeEventListener('focusin', onFocusIn);
    scroller.removeEventListener('scroll', onScroll);
    if (buttonsWrap) buttonsWrap.removeAttribute('is-scrolled');
    active = null;

    modal.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    lenis.start();
    if (document.body.contains(trigger)) trigger.focus({ preventScroll: true });

    anim = gsap.to(modal, {
      opacity: 0,
      duration: reduce ? 0 : 0.25,
      ease: 'power2.in',
      onComplete: () => {
        modal.style.display = 'none';
        scroller.scrollTop = 0; // was dialog.scrollTop
        gsap.set(dialog, { clearProps: 'all' });
        gsap.set(modal, { clearProps: 'opacity,visibility' });
        anim = null;
      }
    });
  }

  // --- delegated events (3 total, regardless of modal count) ---
  document.addEventListener('pointerdown', (e) => {
    backdropDown = !!active && e.target.hasAttribute?.('data-modal');
  });

  document.addEventListener('click', (e) => {
    const wasBackdrop = backdropDown;
    backdropDown = false;

    const trigger = e.target.closest('[data-modal-open]');
    if (trigger) {
      const key = trigger.getAttribute('data-modal-open');
      if (!registry.has(key)) return;
      e.preventDefault();
      open(key, trigger);
      return;
    }

    if (!active) return;
    if (e.target.closest('[data-modal-close]')) { close(); return; }
    if (e.target === registry.get(active.key).modal && wasBackdrop) close();
  });

  document.addEventListener('keydown', onKeydown);
}
