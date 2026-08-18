/*--------------------
Flux Marine Custom JavaScript Compile
--------------------*/

slater_import('/project/20739/page/63312.js') // Import accordion-card.js)
slater_import('/project/20739/page/63318.js') // Import splide-swiper.js
slater_import('/project/20739/page/63564.js') // Import bunny-player-simple.js
slater_import('/project/20739/page/63265.js') // Import bunny-background.js
slater_import('/project/20739/page/63680.js') // Import metric-converter.js')
slater_import('/project/20739/page/43742.js') // Import lenis-smooth-scroll.js
slater_import('/project/20739/page/63533.js') // Import modal.js
slater_import('/project/20739/page/63568.js') // Import tab-scroll.js
slater_import('/project/20739/page/63270.js') // Import nav.js
slater_import('/project/20739/page/63506.js') // Import scroll-text.js

/* Webflow Starter */
window.Webflow ||= [];
window.Webflow.push(() => {

  accordionCardInit();
  splideSwiperInit();
  initBunnyPlayerBasic();
  initBunnyPlayerBackground();
  initMetricConverter();
  initModal();
  initTabScrollReveal();
  initNav();
  initScrollText();
  initSmoothScroll();

})

/*
if ('ResizeObserver' in window) {
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 150);
  });
  resizeObserver.observe(document.body);
}
*/
