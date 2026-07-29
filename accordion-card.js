function accordionInit() {
  const fluxCurve = CustomEase.create("custom",
    "M0,0 C0,0.415 0.105,0.625 0.249,0.788 0.455,1.021 0.818,1.001 1,1 "
  );

  // For reverse, same ease (not reversed)
  const reverseCurve = fluxCurve; // or a different ease entirely

  const cards = document.querySelectorAll('[data-accordion-card-component]');

  cards.forEach((card) => {
    const buttonIcon = card.querySelector('[data-accordion-icon]');
    const hiddenContent = card.querySelector('[data-accordion-hidden]');
    const bgImg = card.querySelector('[data-background-img]');

    // Forward timeline
    const tlOpen = gsap.timeline({ paused: true });
    gsap.set(hiddenContent, { autoAlpha: 0, height: 0 });

    tlOpen
      .to(buttonIcon, { rotation: 765, duration: 0.8, ease: fluxCurve }, 0)
      .to(hiddenContent, { autoAlpha: 1, height: 'auto', duration: 0.8, ease: fluxCurve }, 0)
      .to(bgImg, { scale: 1.1, duration: 1.2, ease: fluxCurve }, 0);

    // Reverse timeline (separate, with different settings)
    const tlClose = gsap.timeline({ paused: true });

    tlClose
      .to(buttonIcon, { rotation: 0, duration: 0.4, ease: reverseCurve }, 0)
      .to(hiddenContent, { autoAlpha: 0, height: 0, duration: 0.4, ease: reverseCurve }, 0)
      .to(bgImg, { scale: 1, duration: .6, ease: fluxCurve }, 0);

    let isOpen = false;

    card.addEventListener('click', () => {
      if (isOpen) {
        tlOpen.pause();
        tlClose.restart(); // Kill and replay from start
      } else {
        tlClose.pause();
        tlOpen.restart();
      }
      isOpen = !isOpen;
    });
  });
}

accordionInit();
