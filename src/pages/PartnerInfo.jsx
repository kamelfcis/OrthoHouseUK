import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { partnerDetail } from '../content/partners'
import PortfolioRequestModal from '../components/partners/PortfolioRequestModal'
import './PartnerInfo.css'

const PartnerInfo = () => {
  const { id } = useParams()
  const [partner, setPartner] = useState(null)
  const [partnerImage, setPartnerImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)

  useEffect(() => {
    // Check if we should scroll to details section (from URL hash or query param)
    const scrollToDetails = () => {
      const detailsSection = document.querySelector('.partner-details-section')
      if (detailsSection) {
        setTimeout(() => {
          const headerOffset = 100 // Account for fixed navbar
          const elementPosition = detailsSection.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }, 100) // Small delay to ensure DOM is ready
      } else {
        // If section not found, scroll to top
        window.scrollTo(0, 0)
      }
    }

    // Always scroll to details section when component mounts
    scrollToDetails()
  }, [partner])

  useEffect(() => {
    const fetchPartnerDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const partnerId = parseInt(id)
        if (isNaN(partnerId)) {
          setError('Invalid partner ID')
          setLoading(false)
          return
        }
        
        // Fetch partner details
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('*')
          .eq('partner_id', partnerId)
          .eq('is_active', true)
          .single()

        if (partnerError) {
          console.error('Supabase error:', partnerError)
          throw partnerError
        }

        if (!partnerData) {
          setError('Partner not found')
          setLoading(false)
          return
        }

        setPartner(partnerData)

        // Fetch partner logo from storage
        if (partnerData.logo_url) {
          try {
            const { data: imageData } = await supabase.storage
              .from('partner-logos')
              .getPublicUrl(partnerData.logo_url)
            
            if (imageData?.publicUrl) {
              setPartnerImage(imageData.publicUrl)
            } else {
              setPartnerImage(partnerData.logo_url)
            }
          } catch (err) {
            console.error('Error fetching logo:', err)
            setPartnerImage(partnerData.logo_url)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching partner details:', err)
        setError(err.message || 'Failed to load partner information')
        setLoading(false)
      }
    }

    if (id) {
      fetchPartnerDetails()
    } else {
      setError('No partner ID provided')
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="partner-detail-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <h2>{partnerDetail.loading ?? 'Loading partner profile…'}</h2>
        </div>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="partner-detail-page">
        <div className="error-state">
          <h2>{partnerDetail.notFound}</h2>
          <p>{error || partnerDetail.notFoundDefault || partnerDetail.notFoundMessage}</p>
          <Link to="/partners" className="lte-btn">
            <span className="lte-btn-inner">
              <span>{partnerDetail.backToPartners ?? 'Back to partners'}</span>
            </span>
          </Link>
        </div>
      </div>
    )
  }

  const trimmedSummary = partner.description
    ? (partner.description.length > 280 ? `${partner.description.slice(0, 280)}…` : partner.description)
    : ''

  const partnerName = partner.partner_name?.trim() || 'Partner'
  const partnerShortName = partnerName.split(' ')[0] || partnerName

  const labels = partnerDetail.labels ?? {}

  const contactItems = [
    partner?.website_url
      ? {
          icon: 'fas fa-globe',
          label: labels.website ?? 'Website',
          value: partner.website_url,
          href: partner.website_url,
          external: true
        }
      : null,
    partner?.contact_email
      ? {
          icon: 'fas fa-envelope',
          label: labels.email ?? 'Email',
          value: partner.contact_email,
          href: `mailto:${partner.contact_email}`
        }
      : null,
    partner?.contact_phone
      ? {
          icon: 'fas fa-phone',
          label: labels.phone ?? 'Phone',
          value: partner.contact_phone,
          href: `tel:${partner.contact_phone}`
        }
      : null
  ].filter(Boolean)

  return (
    <div className="partner-detail-page">
      <div className="partner-detail-hero">
        <div className="container">
          <Link to="/partners" className="partner-back-link">
            <i className="fas fa-arrow-left"></i>
            <span>{partnerDetail.backToPartners ?? 'Back to partners'}</span>
          </Link>

          {partner.website_url && (
            <div className="partner-hero-tags">
              <span className="partner-tag tag-online">{partnerDetail.trustedPartner ?? 'Trusted partner'}</span>
            </div>
          )}

          <h1 className="partner-hero-title">{partnerName}</h1>

          {trimmedSummary && (
            <p className="partner-hero-summary">{trimmedSummary}</p>
          )}

          <button
            type="button"
            className="ds-btn ds-btn--primary partner-portfolio-cta"
            onClick={() => setPortfolioModalOpen(true)}
          >
            <i className="fas fa-file-alt" aria-hidden="true"></i>
            <span>{partnerDetail.requestPortfolio ?? 'Request portfolio'}</span>
          </button>

          <div className="partner-hero-stats">
            {partner.website_url && (
              <div className="hero-stat">
                <i className="fas fa-globe"></i>
                <span>{partnerDetail.officialWebsite ?? 'Official website'}</span>
              </div>
            )}
            {partner.contact_email && (
              <div className="hero-stat">
                <i className="fas fa-envelope-open-text"></i>
                <span>{partner.contact_email}</span>
              </div>
            )}
            {partner.contact_phone && (
              <div className="hero-stat">
                <i className="fas fa-phone"></i>
                <span>{partner.contact_phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="details" className="partner-detail-section partner-details-section">
        <div className="container">
          <div className="partner-detail-layout">
            <aside className="partner-sidebar">
              <div className="partner-profile-card">
                <div className="partner-logo-frame">
                  {partnerImage ? (
                    <img
                      src={partnerImage}
                      alt={partner.partner_name}
                      className="partner-logo-image"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling
                        if (fallback) {
                          fallback.setAttribute('data-visible', 'true')
                        }
                      }}
                    />
                  ) : null}
                  <div className="partner-logo-fallback" data-visible={!partnerImage}>
                    <i className="fas fa-handshake"></i>
                  </div>
                </div>

                <button
                  type="button"
                  className="ds-btn ds-btn--primary partner-portfolio-cta partner-portfolio-cta--sidebar"
                  onClick={() => setPortfolioModalOpen(true)}
                >
                  <i className="fas fa-file-alt" aria-hidden="true"></i>
                  <span>{partnerDetail.requestPortfolio ?? 'Request portfolio'}</span>
                </button>
              </div>

              {(partner.website_url || partner.contact_email || partner.contact_phone) && (
                <div className="partner-contact-card">
                  <h3>{partnerDetail.connectWith?.(partnerShortName) ?? `Connect with ${partnerShortName}`}</h3>
                  <ul className="partner-contact-list">
                    {partner.website_url && (
                      <li>
                        <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                          <i className="fas fa-globe"></i>
                          <span>{partnerDetail.visitWebsite ?? partnerDetail.websiteCta ?? 'Visit website'}</span>
                        </a>
                      </li>
                    )}
                    {partner.contact_email && (
                      <li>
                        <a href={`mailto:${partner.contact_email}`}>
                          <i className="fas fa-envelope"></i>
                          <span>{partnerDetail.emailPartner ?? 'Email partner'}</span>
                        </a>
                      </li>
                    )}
                    {partner.contact_phone && (
                      <li>
                        <a href={`tel:${partner.contact_phone}`}>
                          <i className="fas fa-phone-alt"></i>
                          <span>{partnerDetail.callPartner ?? 'Call partner'}</span>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Link to="/partners" className="partner-sidebar-back">
                <i className="fas fa-arrow-left"></i>
                <span>{partnerDetail.browseAll ?? 'Browse all partners'}</span>
              </Link>
            </aside>

            <div className="partner-main">
              {partner.description && (
                <section className="partner-content-block">
                  <h2 className="partner-content-title">
                    <i className="fas fa-info-circle"></i>
                    {partnerDetail.about?.(partnerName) ?? `About ${partnerName}`}
                  </h2>
                  <p className="partner-content-text">{partner.description}</p>
                </section>
              )}

              {contactItems.length > 0 && (
                <section className="partner-content-block">
                  <h2 className="partner-content-title">
                    <i className="fas fa-address-card"></i>
                    {partnerDetail.keyDetails ?? 'Key details'}
                  </h2>
                  <div className="partner-info-grid">
                    {contactItems.map((item, index) => (
                      <div className="partner-info-item" key={`${item.label}-${index}`}>
                        <div className="partner-info-icon">
                          <i className={item.icon}></i>
                        </div>
                        <div className="partner-info-body">
                          <span className="partner-info-label">{item.label}</span>
                          {item.href ? (
                            <a
                              href={item.href}
                              target={item.external ? '_blank' : undefined}
                              rel={item.external ? 'noopener noreferrer' : undefined}
                              className="partner-info-link"
                            >
                              {item.value}
                              {item.external && <i className="fas fa-external-link-alt"></i>}
                            </a>
                          ) : (
                            <span className="partner-info-text">{item.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      <PortfolioRequestModal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        partnerId={partner.partner_id}
        partnerName={partnerName}
      />
    </div>
  )
}

export default PartnerInfo

