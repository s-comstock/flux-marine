/*--------------------
Flux Marine Custom JavaScript Compile
--------------------*/

/* Register GSAP Plugins */
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

/* Import components and functions */
slater_import('/project/20739/page/63312.js') // Import accordion-card.js
slater_import('/project/20739/page/63318.js') // Import splide-swiper.js
slater_import('/project/20739/page/63564.js') // Import bunny-player-simple.js
slater_import('/project/20739/page/63266.js') // Import bunny-background.js
slater_import('/project/20739/page/63680.js') // Import metric-converter.js
slater_import('/project/20739/page/63910.js') // Import lenis-smooth-scroll.js
slater_import('/project/20739/page/63533.js') // Import modal.js
slater_import('/project/20739/page/63568.js') // Import tab-scroll.js
slater_import('/project/20739/page/63270.js') // Import nav.js
slater_import('/project/20739/page/63506.js') // Import scroll-text.js
slater_import('/project/20739/page/64092.js') // Import accordion.js
slater_import('/project/20739/page/64120.js') // Import range-finder.js

/* Initialize after Webflow finishes loading */
window.Webflow ||= [];
window.Webflow.push(() => {

  initAccordionCard()
  initAccordion()
  initSplideSwiper()
  initBunnyPlayerBasic()
  initBunnyPlayerBackground()
  initMetricConverter()
  initModal()
  initTabScrollReveal()
  initNav()
  initScrollText()
  initSmoothScroll()
  initRangeFinder();

})
