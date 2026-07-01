import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toPublicStorageUrl } from '../lib/storageUrl'
import HeroBackground from '../components/common/HeroBackground'
import useBranchData from '../hooks/useBranchData'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { partnersPage } from '../content/partners'
import '../components/Home/Capabilities.css'
import './Services.css'

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  const { branchData, loading } = useBranchData('UK')
  const [partners, setPartners] = useState([])
  const [displayedCount, setDisplayedCount] = useState(8)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchPartners = async () => {
      if (!branchData?.branch) return

      try {
        // Fetch partners for UK branch
        const { data, error } = await supabase
          .from('branch_partners')
          .select(`
            *,
            partners (
              partner_id,
              partner_name,
              partner_code,
              logo_url,
              website_url,
              description,
              partnership_type,
              is_active
            )
          `)
          .eq('branch_id', branchData.branch.branch_id)
          .eq('is_active', true)
          .order('partners(partner_name)')

        if (error) throw error

        const partnersList = (data || [])
          .filter(item => item.partners && item.partners.is_active)
          .map(item => ({
            partner_id: item.partners.partner_id,
            partner_name: item.partners.partner_name,
            partner_code: item.partners.partner_code,
            logo_url: item.partners.logo_url,
            website_url: item.partners.website_url,
            description: item.partners.description || '',
            partnership_type: item.partners.partnership_type
          }))

        setPartners(partnersList)
      } catch (error) {
        console.error('Error fetching partners:', error)
      }
    }

    if (branchData) {
      fetchPartners()
    }
  }, [branchData])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const handleLoadMore = useCallback(() => {
    setDisplayedCount(prev => Math.min(prev + 8, partners.length))
  }, [partners.length])

  const displayedPartners = useMemo(() => {
    return partners.slice(0, displayedCount)
  }, [partners, displayedCount])

  const hasMorePartners = useMemo(() => {
    return partners.length > displayedCount
  }, [partners.length, displayedCount])

  return (
    <div className="services-page">
      <SEO
        title={pageSeo.partners.title}
        description={pageSeo.partners.description}
        keywords={pageSeo.partners.keywords}
      />
      <div className="partners-hero">
        <HeroBackground
          className="partners-hero__media"
          image={partnersPage.hero.localImage}
          fallbackSrc={partnersPage.hero.imageFallback}
          alt={partnersPage.hero.imageAlt}
        />
        <div className="partners-hero__overlay" aria-hidden="true" />
        <div className="partners-hero__container container">
          <motion.div
            className="partners-hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="partners-hero__eyebrow">{partnersPage.hero.eyebrow}</div>
            <h1 className="partners-hero__title">
              {partnersPage.hero.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="partners-hero__subtitle">{partnersPage.hero.subtitle}</p>
          </motion.div>
        </div>
      </div>

      <div className="partners-page-main ds-section">
        <div className="container">
          {loading ? (
            <div className="admin-loading">
              <div className="loading-spinner"></div>
              <h2>{partnersPage.loading}</h2>
            </div>
          ) : partners.length === 0 ? (
            <div className="empty-state">
              <p>{partnersPage.empty}</p>
            </div>
          ) : (
            <motion.div
              className="partners-showcase"
              ref={ref}
              variants={containerVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <AnimatePresence mode="popLayout">
                {displayedPartners.map((partner, index) => {
                  const logoSrc = toPublicStorageUrl('partner-logos', partner.logo_url)

                  return (
                    <motion.div
                      key={partner.partner_id}
                      className="partner-logo-tile-wrap"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      layout
                    >
                      <Link
                        to={`/partners/${partner.partner_id}`}
                        className="partner-logo-tile"
                        aria-label={`View ${partner.partner_name} partner profile`}
                        data-partner-name={partner.partner_name}
                      >
                        <span className="partner-logo-tile__surface">
                          {logoSrc ? (
                            <>
                              <img
                                src={logoSrc}
                                alt={`${partner.partner_name} logo`}
                                className="partner-logo-tile__logo"
                                loading={index < 8 ? 'eager' : 'lazy'}
                                decoding="async"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  const fallback = e.target.nextElementSibling
                                  if (fallback) fallback.hidden = false
                                }}
                              />
                              <span className="partner-logo-tile__fallback" hidden aria-hidden="true">
                                <i className="fas fa-handshake" />
                              </span>
                            </>
                          ) : (
                            <span className="partner-logo-tile__fallback" aria-hidden="true">
                              <i className="fas fa-handshake" />
                            </span>
                          )}
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              
              {hasMorePartners && (
                <motion.div
                  className="load-more-container"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <button
                    className="load-more-button"
                    onClick={handleLoadMore}
                    aria-label={partnersPage.loadMoreAria}
                  >
                    <span>{partnersPage.loadMore}</span>
                    <i className="fas fa-chevron-down"></i>
                    <span className="load-more-count">
                      {partnersPage.loadMoreCount(partners.length - displayedCount)}
                    </span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Services
