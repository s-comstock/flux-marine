/*--------------------
Scroll Text Section JS
--------------------*/

function initScrollText() {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Scroll distance for the expand animation, in viewport height units. 80 = 80vh.
  const EXPAND_VH = 60;

  // Scroll distance for each main animation step. 160 = 160vh.
  const STEP_VH = 80;

  // Scroll distance for the final animation step. 60 = 60vh.
  const FINAL_STEP_VH = 40;

  // Target scale for the parallax/zoom effect. 1.05 = 105% of original size.
  const PARALLAX_SCALE_TO = 1.05;

  // Delay between each character animation, in seconds.
  const CHAR_STAGGER = 0.02;

  // Vertical offset for character animations, usually in pixels. 20 = starts 20px away from final position.
  const CHAR_Y_OFFSET = 20;

  const scrollText = {
    startInset: (100 * (1 - 1 / 3)) / 2,
    startRadius: '0.75rem',
    endRadius: '0rem'
  };
  const CROSSFADE_EASE = 'power1.inOut';
  const EXPAND_EASE = 'power2.out';

  const components = document.querySelectorAll('[data-scroll-text-component]');
  if (!components.length) return;

  components.forEach((component) => {
    // This is now purely the element GSAP will pin -- no CSS position/top needed on it anymore.
    const pinTarget = component.querySelector('[data-scroll-sticky]');
    const mask = component.querySelector('[data-scroll-panel-mask]');
    const panels = mask ? Array.from(mask.querySelectorAll('[data-scroll-panel]')) : [];
    if (!pinTarget || !mask || !panels.length) return;

    const panelData = panels.map((panel) => {
      const text = panel.querySelector('[data-scroll-text]');
      const img = panel.querySelector('[data-background-img]');
      const split = text ? new SplitText(text, { type: 'chars' }) : null;
      return { img, chars: split ? split.chars : [] };
    });

    const animationVH = EXPAND_VH + (panels.length - 1) * STEP_VH + FINAL_STEP_VH;

    const clipFrom = `inset(${scrollText.startInset}% round ${scrollText.startRadius})`;
    const clipTo = `inset(0% round ${scrollText.endRadius})`;

    const expandDuration = EXPAND_VH / 100;
    const stepDuration = STEP_VH / 100;
    const finalStepDuration = FINAL_STEP_VH / 100;
    const swapDuration = stepDuration * 0.4;

    let cursor = 0;
    const windows = panelData.map((_, i) => {
      const isLast = i === panelData.length - 1;
      const duration = i === 0 ?
        expandDuration + stepDuration :
        (isLast ? finalStepDuration : stepDuration);
      const start = cursor;
      const end = start + duration;
      cursor = end;
      return { start, end };
    });
    const totalDuration = windows[windows.length - 1].end;

    gsap.set(mask, { clipPath: clipFrom });
    panelData.forEach(({ img, chars }, i) => {
      if (img) gsap.set(img, {
        opacity: i === 0 ? 1 : 0,
        scale: 1,
        transformOrigin: '50% 50%'
      });
      if (chars.length) gsap.set(chars, {
        opacity: i === 0 ? 1 : 0,
        y: i === 0 ? 0 : CHAR_Y_OFFSET
      });
    });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: component,
        pin: pinTarget,
        pinSpacing: true,
        start: 'top top',
        end: '+=' + animationVH + '%',
        scrub: true,
        invalidateOnRefresh: true,
        refreshPriority: 1
      }
    });

    tl.to(mask, { clipPath: clipTo, duration: expandDuration, ease: EXPAND_EASE }, 0);

    for (let i = 0; i < panelData.length - 1; i++) {
      const current = panelData[i];
      const next = panelData[i + 1];
      const windowEnd = windows[i].end;
      const stepStart = windowEnd - swapDuration;

      if (current.img) tl.to(current.img, {
        opacity: 0,
        duration: swapDuration,
        ease: CROSSFADE_EASE
      }, stepStart);
      if (next.img) tl.to(next.img, {
        opacity: 1,
        duration: swapDuration,
        ease: CROSSFADE_EASE
      }, stepStart);

      if (current.chars.length) {
        tl.to(current.chars, {
          opacity: 0,
          y: -CHAR_Y_OFFSET,
          duration: swapDuration,
          stagger: CHAR_STAGGER,
          ease: CROSSFADE_EASE
        }, stepStart);
      }
      if (next.chars.length) {
        tl.to(next.chars, {
          opacity: 1,
          y: 0,
          duration: swapDuration,
          stagger: CHAR_STAGGER,
          ease: CROSSFADE_EASE
        }, stepStart);
      }
    }

    panelData.forEach(({ img }, i) => {
      if (!img) return;
      const { start, end } = windows[i];
      tl.fromTo(img, { scale: 1 }, { scale: PARALLAX_SCALE_TO, duration: end - start },
        start);
    });

    tl.set({}, {}, totalDuration);
  });

  // Initial refresh, same as before
  if (window.lenis) window.lenis.resize();
  ScrollTrigger.refresh();

}
