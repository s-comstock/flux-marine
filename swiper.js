function splideSwiperInit() {

  document.querySelectorAll('.splide').forEach((el) => {

    /* initialize Splide slider */
    const splide = new Splide('.splide', {
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
        568: {

        }
      }
    });

    splide.mount();

  });
}

splideSwiperInit();
