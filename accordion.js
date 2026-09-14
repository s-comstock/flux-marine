/*--------------------
FAQ Accordion JS
--------------------*/

const EASE = "cubic-bezier(.01,.83,.18,.99)"

let uid = 0

function ensureId(el, prefix) {
  if (!el.id) el.id = `${prefix}-${++uid}`
  return el.id
}

function initAccordion() {
  const accordions = document.querySelectorAll("[data-faq-accordion]")
  if (!accordions.length) return

  accordions.forEach(accordion => {
    const question = accordion.querySelector("[data-faq-question]")
    const answer = accordion.querySelector("[data-faq-answer]")
    const icon = accordion.querySelector("[data-faq-icon]")
    if (!question || !answer) return

    const questionId = ensureId(question, "faq-question")
    const answerId = ensureId(answer, "faq-answer")

    question.setAttribute("aria-expanded", "false")
    question.setAttribute("aria-controls", answerId)

    answer.setAttribute("role", "region")
    answer.setAttribute("aria-labelledby", questionId)
    answer.inert = true

    gsap.set(answer, { height: 0, alpha: 0, overflow: "hidden" })

    const tlOpen = gsap.timeline({ paused: true })
    tlOpen.to(answer, { height: "auto", alpha: 1, duration: 0.4, ease: EASE }, 0)
    if (icon) tlOpen.to(icon, { rotate: 180, duration: 0.4, ease: EASE }, 0)

    const tlClose = gsap.timeline({ paused: true })
    tlClose.to(answer, { height: 0, alpha: 0, duration: 0.4, ease: EASE }, 0)
    if (icon) tlClose.to(icon, { rotate: 0, duration: 0.4, ease: EASE }, 0)

    let isOpen = false

    question.addEventListener("click", () => {
      isOpen = !isOpen

      question.setAttribute("aria-expanded", String(isOpen))
      answer.inert = !isOpen

      if (isOpen) {
        tlClose.pause()
        tlOpen.restart()
      } else {
        tlOpen.pause()
        tlClose.restart()
      }
    })
  })
}
