/*--------------------
Accordion Card JS
--------------------*/

function accordionCardInit() {
  const fluxCurve = CustomEase.create("custom",
    "M0,0 C0,0.415 0.105,0.625 0.249,0.788 0.455,1.021 0.818,1.001 1,1 "
  );
  const reverseCurve = fluxCurve;

  const cards = document.querySelectorAll('[data-accordion-card-component]');

  cards.forEach((card, index) => {
    const button = card.querySelector('button');
    const buttonIcon = card.querySelector('[data-accordion-icon]');
    const hiddenContent = card.querySelector('[data-accordion-hidden]');

    if (!button || !hiddenContent) return;

    // Setup ARIA attributes
    const contentId = `accordion-content-${index}`;
    hiddenContent.id = contentId;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', contentId);

    // Forward timeline
    const tlOpen = gsap.timeline({ paused: true });
    gsap.set(hiddenContent, { autoAlpha: 0, height: 0 });

    tlOpen
      .to(buttonIcon, { rotation: 765, duration: 0.8, ease: fluxCurve }, 0)
      .to(hiddenContent, { autoAlpha: 1, height: 'auto', duration: 0.8, ease: fluxCurve }, 0);

    // Reverse timeline
    const tlClose = gsap.timeline({ paused: true });
    tlClose
      .to(buttonIcon, { rotation: 0, duration: 0.4, ease: reverseCurve }, 0)
      .to(hiddenContent, { autoAlpha: 0, height: 0, duration: 0.4, ease: reverseCurve }, 0);

    let isOpen = false;

    function toggleAccordion() {
      if (isOpen) {
        tlOpen.pause();
        tlClose.restart();
      } else {
        tlClose.pause();
        tlOpen.restart();
      }
      isOpen = !isOpen;
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    // Click on the card (anywhere)
    card.addEventListener('click', toggleAccordion);

    // Keyboard on the button (Space/Enter)
    button.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggleAccordion();
      }
    });
  });
}
