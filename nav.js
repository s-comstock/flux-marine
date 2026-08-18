/*--------------------
Tab Scroll JS
--------------------*/

function initNav() {

  const fluxCurve = CustomEase.create("custom",
    "M0,0 C0,0.5 0.098,1 1,1 "
  );

  const navbarComponent = document.querySelector('[data-nav-component]');

  if (navbarComponent) {

    const navBar = navbarComponent.querySelector('[data-nav-bar]');
    const toggleButton = navbarComponent.querySelector('[data-nav-toggle]');
    const toggleBar = navbarComponent.querySelectorAll('[data-nav-toggle-bar]');
    const navMenu = navbarComponent.querySelector('[data-nav-menu]');
    const navTexts = navbarComponent.querySelectorAll('[data-nav-text]');
    const navHr = navbarComponent.querySelectorAll('[data-nav-hr]');
    const navButtons = navbarComponent.querySelectorAll('[data-nav-button');

    // Navbar Scroll Interaction
    function updateScrollState() {
      const isScrolled = window.scrollY > 25;
      navbarComponent.toggleAttribute('is-scrolled', isScrolled);
    }

    // Split each item's text into lines, and auto-wrap in a mask div
    const splits = Array.from(navTexts).map((item) => {
      return new SplitText(item, {
        type: "lines",
        linesClass: "nav-line",
        mask: "lines",
      });
    });

    const navTextSplit = splits.map(s => s.lines).flat();

    // Timeline on Enter
    const tlEnter = gsap.timeline({
      paused: true,
      defaults: {
        ease: fluxCurve
      }
    });

    // Set Navbar Initial States
    tlEnter.set(navMenu, {
        display: 'none',
        height: 0,
      })
      .set(navTextSplit, {
        yPercent: -100,
      })
      .set(navHr, {
        width: '0%',
      })
      .set(navButtons, {
        //autoAlpha: 0,
        yPercent: -100
      })
      .to(navbarComponent, {
        background: 'rgba(0, 0, 0, 0.5)',
        duration: .2,
        ease: 'none',
        easeReverse: 'power1.inOut'
      })
      .to(navMenu, {
        display: 'block',
        duration: 0,
      }, '>')
      .to(navMenu, {
        height: 'calc(100svh - 1rem)',
        duration: .8,
      }, '<')
      .to(navHr, { width: '100%', stagger: 0.08, duration: .8 }, '-=0.8')
      .to(toggleBar[0], { y: '+=5', rotation: 45, duration: .8 }, '<')
      .to(toggleBar[1], { y: '-=5', rotation: -45, duration: .8 }, '<')
      .to(navTextSplit, {
        yPercent: 0,
        duration: .6,
        stagger: 0.08,
      }, '<')
      .to(navButtons, {
        //autoAlpha: 1,
        yPercent: 0,
        duration: .6,
        stagger: 0.08,
      }, '<')

    // Timeline on Leave
    const tlLeave = gsap.timeline({
      paused: true,
      defaults: {
        ease: fluxCurve
      }
    });

    tlLeave
      .to(navHr, { width: 0, duration: .3, stagger: 0.04 })
      .to(navTextSplit, { yPercent: -100, duration: .4, stagger: 0.04 }, '<')
      .to(toggleBar[0], { y: 0, rotation: 0, duration: .5 }, '<')
      .to(toggleBar[1], { y: 0, rotation: 0, duration: .5 }, '<')
      .to(navMenu, { height: 0, duration: .6 }, '<')
      .to(navbarComponent, { background: 'rgba(0, 0, 0, 0)', duration: .3 }, '<')
      .set(navMenu, { display: 'none' }); // <-- this one you DO need

    let isOpen = false;
    // Mobile Menu Toggle Interaction

    // Collect all focusable elements inside the nav component
    function getFocusableElements() {
      const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(navbarComponent.querySelectorAll(selector))
        .filter(el => el.offsetParent !== null); // only currently-visible elements
    }

    let removeFocusTrap = null;

    function trapFocus() {
      const focusable = getFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      function handleKeydown(e) {
        if (e.key !== "Tab") return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      navbarComponent.addEventListener("keydown", handleKeydown);

      // Return a cleanup function to remove the listener later
      return () => navbarComponent.removeEventListener("keydown", handleKeydown);
    }

    function toggle() {
      isOpen = !isOpen;
      toggleButton.setAttribute("aria-expanded", String(isOpen));
      toggleButton.setAttribute("aria-label", isOpen ? "close menu" : "open menu");
      navbarComponent.setAttribute("data-menu-status", isOpen ? "Open" : "Close");

      if (isOpen) {
        tlLeave.pause();
        tlEnter.restart();
        tlEnter.eventCallback("onComplete", () => {
          const focusable = getFocusableElements();
          if (focusable.length) focusable[0].focus();
          removeFocusTrap = trapFocus();
        });
      } else {
        tlEnter.pause();
        tlLeave.restart();
        if (removeFocusTrap) {
          removeFocusTrap();
          removeFocusTrap = null;
        }
        toggleButton.focus();
      }
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        toggle();
        toggleButton.focus();
      }
    });

    window.addEventListener('scroll', updateScrollState);
    updateScrollState();

    toggleButton.addEventListener('click', toggle);

  }
}
