import { useMemo } from 'react'
import { toPublicStorageUrl } from '../../lib/storageUrl'
import './HeroPartnersCarousel.css'

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
      name: partner.partner_name || 'Partner',
      url
    })
    return logos
  }, [])
}

const HeroPartnersCarousel = ({ branchData }) => {
  const partnerLogos = useMemo(() => buildPartnerLogos(branchData), [branchData])
  const marqueeLogos = useMemo(
    () => (partnerLogos.length > 1 ? [...partnerLogos, ...partnerLogos] : partnerLogos),
    [partnerLogos]
  )

  if (partnerLogos.length === 0) {
    return null
  }

  const duration = Math.max(partnerLogos.length * 4, 24)

  return (
    <section className="hero-partners-section">
      <div className="hero-partners-ambient" aria-hidden="true">
        <span className="ambient-orb orb-left"></span>
        <span className="ambient-orb orb-right"></span>
        <span className="ambient-line line-top"></span>
        <span className="ambient-line line-bottom"></span>
      </div>

      <div className="hero-partners-heading">
        <span className="hero-partners-tag">
          <span className="hero-partners-tag-dot" aria-hidden="true"></span>
          Trusted by innovators
        </span>
        <h3 className="hero-partners-title">
          Global brands that rely on <span className="hero-partners-title-accent">OrthoHouse</span>
        </h3>
        <p className="hero-partners-subtitle">
          Seamless collaborations with world-class manufacturers and medical pioneers.
        </p>
      </div>

      <div className="hero-partners-carousel-wrap">
        <div
          className="hero-partners-marquee"
          style={{ '--marquee-duration': `${duration}s` }}
        >
          <div className="hero-partners-marquee-track">
            {marqueeLogos.map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className="hero-partner-slide"
                aria-hidden={index >= partnerLogos.length}
              >
                <span className="hero-partner-border"></span>
                <div className="hero-partner-glow"></div>
                <img
                  src={logo.url}
                  alt={index < partnerLogos.length ? logo.name : ''}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroPartnersCarousel
