function initScrollText() {
  gsap.registerPlugin(ScrollTrigger);

  const EXPAND_VH = 100;
  const STEP_VH = 100;

  const scrollText = {
    startInset: (100 * (1 - 1 / 3)) / 2,
    startRadius: '0.75rem',
    endRadius: '0rem'
  };

  const components = document.querySelectorAll('[data-scroll-text-component]');
  if (!components.length) return;

  const setups = [];

  components.forEach((component) => {
    const sticky = component.querySelector('[data-scroll-sticky]');
    const mask = component.querySelector('[data-scroll-panel-mask]');
    const panels = mask ? Array.from(mask.querySelectorAll('[data-scroll-panel]')) : [];
    if (!sticky || !mask || !panels.length) return;

    const panelData = panels.map((panel) => ({
      text: panel.querySelector('[data-scroll-text]'),
      img: panel.querySelector('[data-background-img]')
    }));

    // Measure the sticky's actual height as %vh, so this stays correct if that class ever changes
    const stickyVH = (sticky.getBoundingClientRect().height / window.innerHeight) * 100;

    const animationVH = EXPAND_VH + panels.length *
      STEP_VH; // scroll distance needed WHILE pinned
    const totalVH = stickyVH +
      animationVH; // section height = sticky's own height + the pinned distance

    component.style.height = `${totalVH}vh`;

    setups.push({ component, mask, panelData, animationVH });
  });

  if (!setups.length) return;

  if (window.lenis) window.lenis.resize();
  ScrollTrigger.refresh();

  setups.forEach(({ component, mask, panelData, animationVH }) => {
    const clipFrom = `inset(${scrollText.startInset}% round ${scrollText.startRadius})`;
    const clipTo = `inset(0% round ${scrollText.endRadius})`;

    gsap.set(mask, { clipPath: clipFrom });
    panelData.forEach(({ img, text }, i) => {
      if (img) gsap.set(img, { opacity: i === 0 ? 1 : 0 });
      if (text) gsap.set(text, { yPercent: i === 0 ? 0 : 100 });
    });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: component,
        start: 'top top',
        end: '+=' + animationVH +
          '%', // the pinned distance ONLY -- not the full section height
        scrub: true,
        invalidateOnRefresh: true,
        markers: true
      }
    });

    const expandDuration = EXPAND_VH / 100;
    const stepDuration = STEP_VH / 100;
    const swapDuration = stepDuration * 0.4;

    // PART 1: clip expand
    tl.to(mask, { clipPath: clipTo, duration: expandDuration }, 0);

    // PART 2: each panel gets a full stepDuration window; crossfade happens in its final 40%
    for (let i = 0; i < panelData.length - 1; i++) {
      const current = panelData[i];
      const next = panelData[i + 1];
      const windowEnd = expandDuration + (i + 1) * stepDuration;
      const stepStart = windowEnd - swapDuration;

      if (current.img) tl.to(current.img, { opacity: 0, duration: swapDuration }, stepStart);
      if (next.img) tl.to(next.img, { opacity: 1, duration: swapDuration }, stepStart);
      if (current.text) tl.to(current.text, { yPercent: -100, duration: swapDuration },
        stepStart);
      if (next.text) tl.to(next.text, { yPercent: 0, duration: swapDuration }, stepStart);
    }

    // Pad the timeline through the LAST panel's full window --
    // without this, tl.duration() ends at the final crossfade and everything before it gets compressed.
    const finalWindowEnd = expandDuration + panelData.length * stepDuration;
    tl.set({}, {}, finalWindowEnd);
  });
}

if (document.readyState !== 'loading') initScrollText();
else initScrollText();
