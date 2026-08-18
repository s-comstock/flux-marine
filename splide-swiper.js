/*--------------------
Splide Swiper JS
--------------------*/

function splideSwiperInit() {
  document.querySelectorAll('.splide').forEach((el) => {
    /* initialize Splide slider */
    const splide = new Splide(el, { // ← Pass 'el' not '.splide'
      type: 'slide',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      autowidth: true,
      gap: '1.25rem',
      perPage: 1,
      trimSpace: true,
      pagination: false,
      arrows: true,
      start: 0,
      accessibility: true,
      keyboard: 'global',
      breakpoints: {
        568: {}
      }
    });

    // Add your arrow disable logic here for each instance
    function updateArrowState() {
      const slides = splide.Components.Slides.getLength();
      const currentIndex = splide.index;
      const nextArrow = el.querySelector('.splide__arrow--next');
      const prevArrow = el.querySelector('.splide__arrow--prev');

      const minVisibleSlides = 2;
      const slidesAfterCurrent = slides - currentIndex - 1;

      if (slidesAfterCurrent < minVisibleSlides) {
        nextArrow.setAttribute('disabled', '');
      } else {
        nextArrow.removeAttribute('disabled');
      }

      if (currentIndex === 0) {
        prevArrow.setAttribute('disabled', '');
      } else {
        prevArrow.removeAttribute('disabled');
      }
    }

    splide.on('moved', updateArrowState);
    splide.mount();
    updateArrowState();
  });
}
