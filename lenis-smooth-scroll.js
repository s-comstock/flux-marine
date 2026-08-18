/*--------------------
Lenis Smooth Scroll JS
--------------------*/

gsap.registerPlugin(ScrollTrigger)

function initSmoothScroll() {
  const lenis = new Lenis({
    lerp: 0.6, //Adjust the lerp value to control the smoothness of the scroll
    respectReducedMotion: true // Respect user's reduced motion preference
  })

  // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
  lenis.on("scroll", ScrollTrigger.update)

  // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
  // This ensures Lenis's smooth scroll animation updates on each GSAP tick
  gsap.ticker.add(time => {
    lenis.raf(time * 1000)
  })

  // Disable lag smoothing in GSAP to prevent any delay in scroll animations
  gsap.ticker.lagSmoothing(0)

  return lenis
}
