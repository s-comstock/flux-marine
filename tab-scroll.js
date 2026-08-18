/*--------------------
Tab Scroll JS
--------------------*/
function initTabScrollReveal() {
  const components = document.querySelectorAll('[data-tab-scroll-component]');
  if (!components.length) return;

  const REVEAL_VH = 100;
  const PER_TAB_VH = 60;
  const REVEAL_INSET_START = 25;

  components.forEach((component) => {
    const tabControls = component.querySelectorAll('[data-tab-control]');
    const tabPanes = component.querySelectorAll('[data-tab-pane]');
    const stickyEl = component.querySelector('[data-tab-scroll-sticky]');
    const imageWrap = component.querySelector('[data-tab-img-wrap="0"]');

    function constructScrollWindow() {
      return (tabPanes.length * PER_TAB_VH) + REVEAL_VH;
    }
    component.style.height = `${constructScrollWindow()}vh`;

    if (!tabControls.length || !tabPanes.length) return;

    if (imageWrap) {
      gsap.fromTo(
        imageWrap, { clipPath: `inset(${REVEAL_INSET_START}% round .75rem` },
        {
          clipPath: 'inset(0% round .75rem)',
          ease: 'none',
          scrollTrigger: {
            trigger: component,
            start: 'top bottom',
            end: () => '+=' + (window.innerHeight * (REVEAL_VH / 100)),
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }

    // lastScrollZone tracks which vh-zone the scroll position was in as of
    // the last check — this is what onUpdate compares against, NOT activeIndex.
    // That decoupling is what lets a manual tab click stick without being
    // immediately overridden by the passive scroll sync.
    let lastScrollZone = 0;

    // activeIndex just tracks which pane is currently showing, for click sync below.
    let activeIndex = 0;

    ScrollTrigger.create({
      trigger: component,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: (self) => {
        const totalVh = constructScrollWindow();
        const scrolledVh = self.progress * totalVh;

        let zone;
        if (scrolledVh < REVEAL_VH) {
          zone = 0;
        } else {
          zone = Math.floor((scrolledVh - REVEAL_VH) / PER_TAB_VH);
          zone = Math.min(Math.max(zone, 0), tabControls.length - 1);
        }

        // Only act on an actual zone transition, not a disagreement with
        // whatever tab a user click may have set.
        if (zone !== lastScrollZone) {
          lastScrollZone = zone;
          activeIndex = zone;
          tabControls[zone].click();
        }
      },
    });

    // Manual clicks just update our bookkeeping — no scroll jump, no flag
    // needed, since onUpdate no longer reacts to this being "out of sync."
    tabControls.forEach((control, index) => {
      control.addEventListener('click', () => {
        activeIndex = index;
      });
    });
  })

  if (window.lenis) window.lenis.resize();
  ScrollTrigger.refresh();
}
