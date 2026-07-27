import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, LayoutGroup } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot } from '../lib/branchDataCache'
import { CONTACT_HERO_FALLBACK } from '../data/contactHero'
import HeroBackground from '../components/common/HeroBackground'
import FaqAnswerContent from '../components/faqs/FaqAnswerContent'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import {
  FAQ_CATEGORIES,
  faqsPage,
  faqsFallbackItems
} from '../content/faqs'
import './Faqs.css'

const ease = [0.22, 1, 0.36, 1]

const FaqAccordionItem = ({ item, index, isOpen, onToggle, prefersReducedMotion }) => {
  const answerId = `faq-answer-${item.id}`
  const number = String(index + 1).padStart(2, '0')

  return (
    <div className={`faqs-item${isOpen ? ' is-open' : ''}`}>
      <dt>
        <button
          type="button"
          className="faqs-item__question"
          onClick={() => onToggle(item.id)}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span className="faqs-item__index" aria-hidden="true">
            {number}
          </span>
          <span className="faqs-item__question-text">{item.question}</span>
          <span className="faqs-item__toggle" aria-hidden="true">
            <i className={`fas fa-plus faqs-item__icon${isOpen ? ' is-open' : ''}`} />
          </span>
        </button>
      </dt>
      <dd id={answerId}>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              className="faqs-item__answer-wrap"
              initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease }}
            >
              <div className="faqs-item__answer">
                <FaqAnswerContent
                  answer={item.answer}
                  imageUrl={item.answer_image_url}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </dd>
    </div>
  )
}

const Faqs = () => {
  const [items, setItems] = useState(faqsFallbackItems)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].slug)
  const [openId, setOpenId] = useState(null)
  const prefersReducedMotion = useReducedMotion()
  const [listRef, listInView] = useInView({ triggerOnce: true, threshold: 0.08 })
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.2 })
  const tabsRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    loadFaqs()
  }, [])

  const resolveUkBranchId = async () => {
    const cached = getBranchDataSnapshot('UK').data?.branch
    if (cached?.branch_id) return cached.branch_id

    const { data, error } = await supabase
      .from('branches')
      .select('branch_id')
      .eq('branch_code', 'UK')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return data?.branch_id ?? 2
  }

  const loadFaqs = async () => {
    try {
      setLoading(true)
      const branchId = await resolveUkBranchId()
      const { data, error } = await supabase
        .from('faqs')
        .select('faq_id, category, question, answer, answer_image_url, display_order')
        .eq('branch_id', branchId)
        .eq('is_published', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      if (data?.length) {
        setItems(
          data.map((row) => ({
            id: String(row.faq_id),
            category: row.category,
            question: row.question,
            answer: row.answer,
            answer_image_url: row.answer_image_url || null,
            display_order: row.display_order
          }))
        )
      } else {
        setItems(faqsFallbackItems)
      }
    } catch {
      setItems(faqsFallbackItems)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const handleCategoryChange = (slug) => {
    if (slug === activeCategory) return
    setActiveCategory(slug)
    setOpenId(null)
  }

  const visibleItems = items
    .filter((item) => item.category === activeCategory)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const activeMeta = FAQ_CATEGORIES.find((c) => c.slug === activeCategory)
  const activeTabIndex = FAQ_CATEGORIES.findIndex((c) => c.slug === activeCategory)

  return (
    <div className="faqs-page">
      <SEO
        title={pageSeo.faqs.title}
        description={pageSeo.faqs.description}
        keywords={pageSeo.faqs.keywords}
      />

      <header className="faqs-hero" aria-labelledby="faqs-hero-heading">
        <HeroBackground
          className="faqs-hero__media"
          image={CONTACT_HERO_FALLBACK}
          alt={CONTACT_HERO_FALLBACK.alt}
        />
        <div className="faqs-hero__overlay" />
        <div className="faqs-hero__grain" aria-hidden="true" />
        <div className="container faqs-hero__content">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <span className="faqs-hero__eyebrow">{faqsPage.hero.eyebrow}</span>
            <h1 id="faqs-hero-heading">{faqsPage.hero.headline}</h1>
            <p className="faqs-hero__intro">{faqsPage.hero.intro}</p>
          </motion.div>
        </div>
      </header>

      <section className="faqs-main ds-section" aria-label="FAQ categories and answers">
        <div className="faqs-main__backdrop" aria-hidden="true" />
        <div className="container faqs-main__container">
          <LayoutGroup id="faqs-tabs">
            <div
              className="faqs-tabs"
              role="tablist"
              aria-label="FAQ categories"
              ref={tabsRef}
            >
              {FAQ_CATEGORIES.map((cat) => {
                const selected = cat.slug === activeCategory
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    role="tab"
                    id={`faq-tab-${cat.slug}`}
                    className={`faqs-tabs__btn${selected ? ' is-active' : ''}`}
                    aria-selected={selected}
                    aria-controls={`faq-panel-${cat.slug}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => handleCategoryChange(cat.slug)}
                  >
                    {selected && !prefersReducedMotion ? (
                      <motion.span
                        layoutId="faqs-tab-indicator"
                        className="faqs-tabs__indicator"
                        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      />
                    ) : selected ? (
                      <span className="faqs-tabs__indicator" />
                    ) : null}
                    <span className="faqs-tabs__label">{cat.shortTitle}</span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>

          <div
            className="faqs-panel"
            role="tabpanel"
            id={`faq-panel-${activeCategory}`}
            aria-labelledby={`faq-tab-${activeCategory}`}
            ref={listRef}
          >
            <header className="faqs-panel__header">
              <div className="faqs-panel__meta">
                <span className="faqs-panel__badge">
                  {String(activeTabIndex + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="faqs-panel__title">{activeMeta?.title}</h2>
                  <p className="faqs-panel__desc">{activeMeta?.description}</p>
                </div>
              </div>
              {!loading && visibleItems.length > 0 ? (
                <p className="faqs-panel__count">
                  {visibleItems.length} {visibleItems.length === 1 ? 'question' : 'questions'}
                </p>
              ) : null}
            </header>

            {loading ? (
              <div className="faqs-loading" aria-live="polite">
                <span className="faqs-loading__pulse" aria-hidden="true" />
                Loading questions…
              </div>
            ) : visibleItems.length === 0 ? (
              <p className="faqs-empty">No published questions in this section yet.</p>
            ) : (
              <motion.dl
                className="faqs-list"
                key={activeCategory}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  prefersReducedMotion || listInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.48, ease }}
              >
                {visibleItems.map((item, index) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    index={index}
                    isOpen={openId === item.id}
                    onToggle={toggle}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </motion.dl>
            )}
          </div>
        </div>
      </section>

      <section className="faqs-cta ds-section" aria-labelledby="faqs-cta-heading" ref={ctaRef}>
        <div className="container">
          <motion.div
            className="faqs-cta__inner"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={
              prefersReducedMotion || ctaInView
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 24 }
            }
            transition={{ duration: 0.5, ease }}
          >
            <span className="faqs-cta__eyebrow">{faqsPage.cta.eyebrow}</span>
            <h2 id="faqs-cta-heading">{faqsPage.cta.title}</h2>
            <p>{faqsPage.cta.body}</p>
            <Link to={faqsPage.cta.path} className="ds-btn ds-btn--primary faqs-cta__btn">
              {faqsPage.cta.button}
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Faqs
