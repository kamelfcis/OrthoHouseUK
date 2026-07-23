import { useCallback, useEffect, useRef, useState } from 'react'
import useNearViewport from '../../hooks/useNearViewport'
import SectionHeading from '../common/SectionHeading'
import { aboutPage } from '../../content/about'
import './AboutUkJourney.css'

const { ukJourney } = aboutPage

/* Stagger between steps that enter the viewport in the same observer batch —
   solo steps reveal immediately as the user scrolls to them. */
const REVEAL_BATCH_STAGGER_S = 0.12

/* Activation line: fraction of viewport height a step must cross before it
   counts as "current" and the spine fill reaches it. */
const ACTIVATION_LINE = 0.55

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const AboutUkJourney = () => {
  const [ref, inView] = useNearViewport()
  const spineRef = useRef(null)
  const spineLineRef = useRef(null)
  const stepRefs = useRef([])
  // index -> reveal delay (seconds); presence means the step has been revealed
  const [revealed, setRevealed] = useState(() => new Map())
  const [activeStep, setActiveStep] = useState(-1)

  const setStepRef = useCallback((el, index) => {
    stepRefs.current[index] = el
  }, [])

  // Sequential per-step reveal: each li reveals once, when it enters the
  // viewport. Steps arriving in the same observer batch cascade in order.
  useEffect(() => {
    const steps = stepRefs.current.filter(Boolean)
    if (!steps.length) return undefined

    const revealAll = () =>
      setRevealed(
        new Map(steps.map((el) => [Number(el.dataset.stepIndex), 0]))
      )

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      revealAll()
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const incoming = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.dataset.stepIndex))
          .sort((a, b) => a - b)
        if (!incoming.length) return

        setRevealed((prev) => {
          const next = new Map(prev)
          let batchPosition = 0
          incoming.forEach((index) => {
            if (!next.has(index)) {
              next.set(index, batchPosition * REVEAL_BATCH_STAGGER_S)
              batchPosition += 1
            }
          })
          return next
        })

        entries.forEach((entry) => {
          if (entry.isIntersecting) observer.unobserve(entry.target)
        })
      },
      { threshold: 0.3, rootMargin: '0px 0px -12% 0px' }
    )

    steps.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Scroll-linked spine fill + current-step highlight. The fill's leading edge
  // tracks the activation line, so it stays in sync with the step reveals.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined

    let rafId = 0

    const update = () => {
      rafId = 0
      const spine = spineRef.current
      const line = spineLineRef.current
      if (!spine || !line) return

      const rect = spine.getBoundingClientRect()
      if (!rect.height) return

      const marker = window.innerHeight * ACTIVATION_LINE
      const progress = Math.min(1, Math.max(0, (marker - rect.top) / rect.height))
      line.style.transform = `scaleY(${progress})`

      let current = -1
      stepRefs.current.forEach((el, index) => {
        if (!el) return
        const stepRect = el.getBoundingClientRect()
        if (stepRect.top + stepRect.height / 2 <= marker) current = index
      })
      setActiveStep((prev) => (prev === current ? prev : current))
    }

    const requestUpdate = () => {
      if (!rafId) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [])

  return (
    <section
      className="about-uk-journey ds-section"
      ref={ref}
      aria-labelledby="about-uk-journey-heading"
    >
      <div className="about-uk-journey__backdrop" aria-hidden="true">
        <div className="about-uk-journey__grid" />
        <div className="about-uk-journey__glow about-uk-journey__glow--left" />
        <div className="about-uk-journey__glow about-uk-journey__glow--right" />
      </div>

      <div className="container about-uk-journey__inner">
        <SectionHeading
          className="about-uk-journey__head"
          eyebrow={ukJourney.eyebrow}
          title={ukJourney.title}
          subtitle={ukJourney.subtitle}
          titleId="about-uk-journey-heading"
        />

        <div className="about-uk-journey__timeline-wrap">
          <div
            ref={spineRef}
            className={`about-uk-journey__spine about-uk-journey__spine--progress${
              inView ? ' is-active' : ''
            }`}
            aria-hidden="true"
          >
            <span className="about-uk-journey__spine-glow" />
            <span ref={spineLineRef} className="about-uk-journey__spine-line" />
          </div>

          <ol className="about-uk-journey__timeline reveal-stagger">
            {ukJourney.milestones.map((milestone, index) => (
              <li
                key={milestone.dateTime + milestone.title}
                ref={(el) => setStepRef(el, index)}
                data-step-index={index}
                className={`about-uk-journey__step reveal-item${
                  index % 2 === 1 ? ' is-alt' : ''
                }${revealed.has(index) ? ' is-revealed' : ''}${
                  activeStep === index ? ' is-active-step' : ''
                }`}
                style={{
                  '--reveal-delay': `${revealed.get(index) ?? 0}s`,
                  '--step-index': index
                }}
              >
                <div className="about-uk-journey__node" aria-hidden="true">
                  <span className="about-uk-journey__node-ring" />
                  <span className="about-uk-journey__node-core" />
                </div>

                <article className="about-uk-journey__card">
                  <time
                    className="about-uk-journey__date"
                    dateTime={milestone.dateTime}
                  >
                    {milestone.date}
                  </time>
                  <h3 className="about-uk-journey__step-title">{milestone.title}</h3>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default AboutUkJourney
