import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchPageHeroImage } from '../lib/unsplash'
import useBranchData from '../hooks/useBranchData'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { partnersPage } from '../content/partners'
import '../components/Home/Capabilities.css'
import './Services.css'

const Services = () => {
  const navigate = useNavigate()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })
  const { branchData, loading } = useBranchData('UK')
  const [partners, setPartners] = useState([])
  const [partnerImages, setPartnerImages] = useState({})
  const [displayedCount, setDisplayedCount] = useState(5) // Show first 5 partners initially
  const [heroImage, setHeroImage] = useState({
    src: partnersPage.hero.imageFallback,
    alt: partnersPage.hero.imageAlt
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchPageHeroImage(partnersPage.hero.imageQuery, {
      src: partnersPage.hero.imageFallback,
      alt: partnersPage.hero.imageAlt
    }).then((image) => {
      if (!cancelled) setHeroImage(image)
    })

    return () => {
      cancelled = true
    }
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

        // Fetch partner logos from storage
        const imagePromises = partnersList.map(async (partner) => {
          if (partner.logo_url) {
            try {
              const { data: imageData } = await supabase.storage
                .from('partner-logos')
                .getPublicUrl(partner.logo_url)
              
              return {
                partnerId: partner.partner_id,
                imageUrl: imageData?.publicUrl || partner.logo_url
              }
            } catch (err) {
              console.error(`Error fetching logo for partner ${partner.partner_id}:`, err)
              return {
                partnerId: partner.partner_id,
                imageUrl: partner.logo_url
              }
            }
          }
          return null
        })

        const imageResults = await Promise.all(imagePromises)
        const imagesMap = {}
        imageResults.forEach(result => {
          if (result) {
            imagesMap[result.partnerId] = result.imageUrl
          }
        })
        setPartnerImages(imagesMap)
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

  const getShortDescription = (description) => {
    if (!description) return partnersPage.noDescription
    // Let CSS handle the truncation, just return the full description
    return description
  }

  const handleLoadMore = useCallback(() => {
    setDisplayedCount(prev => Math.min(prev + 5, partners.length))
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
        <div
          className="partners-hero__media"
          style={{ backgroundImage: `url(${heroImage.src})` }}
          role="presentation"
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
              <span>{partnersPage.hero.titleLine1}</span>
              <span>{partnersPage.hero.titleLine2}</span>
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
                {displayedPartners.map((partner, index) => (
                  <motion.div
                    key={partner.partner_id}
                    className="partner-card-modern"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                  >
                    <div className="partner-card-modern-inner">
                      <div className="partner-logo-wrapper">
                        {partnerImages[partner.partner_id] ? (
                          <>
                            <img 
                              src={partnerImages[partner.partner_id]} 
                              alt={`${partner.partner_name} logo`}
                              className="partner-logo-modern"
                              loading={index < 5 ? "eager" : "lazy"}
                              decoding="async"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div className="partner-icon-fallback-modern" style={{ display: 'none' }}>
                              <i className="fas fa-handshake"></i>
                            </div>
                          </>
                        ) : (
                          <div className="partner-icon-fallback-modern">
                            <i className="fas fa-handshake"></i>
                          </div>
                        )}
                      </div>
                      
                      <div className="partner-info-modern">
                        <h3 className="partner-name-modern">{partner.partner_name}</h3>
                        {partner.description && (
                          <p className="partner-description-modern">
                            {getShortDescription(partner.description)}
                          </p>
                        )}
                      </div>
                      
                      <div className="partner-action-modern">
                        <button
                          type="button"
                          className="partner-more-info-btn-modern"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const partnerId = partner.partner_id
                            if (partnerId) {
                              window.location.href = `/partners/${partnerId}`
                            }
                          }}
                        >
                          <i className="fas fa-info-circle"></i>
                          <span>{partnersPage.moreInfo}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
