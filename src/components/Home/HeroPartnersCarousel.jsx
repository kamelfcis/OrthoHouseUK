import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toPublicStorageUrl } from '../../lib/storageUrl'
import { homePartners } from '../../content/home'
import './HeroPartnersCarousel.css'

const getPartnerDetailPath = (partnerId) => {
  const id = Number(partnerId)
  if (Number.isFinite(id) && id > 0) {
    return `/partners/${id}`
  }
  return '/partners'
}

const sortPartners = (partners = []) => {
  return [...partners].sort((a, b) => {
    const orderA = Number(a.display_order ?? a.sort_order ?? Number.POSITIVE_INFINITY)
    const orderB = Number(b.display_order ?? b.sort_order ?? Number.POSITIVE_INFINITY)
    if (orderA !== orderB) return orderA - orderB

    const idA = Number(a.partners?.partner_id ?? 0)
    const idB = Number(b.partners?.partner_id ?? 0)
    if (idA !== idB) return idA - idB

    const nameA = a.partners?.partner_name ?? ''
    const nameB = b.partners?.partner_name ?? ''
    return nameA.localeCompare(nameB)
  })
}

const buildPartnerLogos = (branchData) => {
  if (!branchData?.partners?.length) return []

  const seen = new Set()
  const sortedPartners = sortPartners(branchData.partners)

  return sortedPartners.reduce((logos, branchPartner, index) => {
    const partner = branchPartner.partners
    if (!partner?.logo_url) return logos

    const url = toPublicStorageUrl('partner-logos', partner.logo_url)
    if (!url || seen.has(url)) return logos

    seen.add(url)
    logos.push({
      id: partner.partner_id ?? `partner-${index}`,
      partnerId: partner.partner_id,
      name: partner.partner_name || 'Partner',
      url
    })
    return logos
  }, [])
}

const HeroPartnersCarousel = ({ branchData }) => {
  const partnerLogos = useMemo(() => buildPartnerLogos(branchData), [branchData])

  if (partnerLogos.length === 0) {
    return null
  }

  return (
    <section className="hero-partners-section" aria-labelledby="hero-partners-heading">
      <div className="hero-partners-ambient" aria-hidden="true">
        <span className="ambient-orb orb-left"></span>
        <span className="ambient-orb orb-right"></span>
        <span className="ambient-line line-top"></span>
        <span className="ambient-line line-bottom"></span>
      </div>

      <header className="hero-partners-heading ds-section-head">
        <span className="ds-eyebrow hero-partners-eyebrow">{homePartners.eyebrow}</span>
        <h2 id="hero-partners-heading" className="ds-section-title hero-partners-title">
          {homePartners.title}{' '}
          <span className="ds-text-gradient">{homePartners.titleHighlight}</span>
        </h2>
      </header>

      <div className="hero-partners-carousel-wrap">
        <div className="hero-partners-marquee">
          <div className="hero-partners-marquee-track">
            {partnerLogos.map((logo) => {
              const detailPath = getPartnerDetailPath(logo.partnerId)

              return (
                <Link
                  key={logo.id}
                  to={detailPath}
                  className="hero-partner-slide"
                  aria-label={`View ${logo.name} details`}
                >
                  <span className="hero-partner-border" aria-hidden="true"></span>
                  <div className="hero-partner-glow" aria-hidden="true"></div>
                  <img
                    src={logo.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={240}
                    height={160}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = `https://via.placeholder.com/240x160/1f2a44/ffffff?text=${encodeURIComponent(logo.name)}`
                    }}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroPartnersCarousel
