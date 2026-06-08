import { useEffect, Suspense, lazy } from 'react'
import useBranchData from '../hooks/useBranchData'

import SEO from '../components/SEO/SEO'
import { generateOrganizationSchema, generateWebsiteSchema, generateLocalBusinessSchema } from '../utils/seoData'
import './Home.css'

const Hero = lazy(() => import('../components/Home/Hero'))

const HomeGallery = lazy(() => import('../components/Home/HomeGallery'))
const HeroPartnersCarousel = lazy(() => import('../components/Home/HeroPartnersCarousel'))
const Stats = lazy(() => import('../components/Home/Stats'))
const Capabilities = lazy(() => import('../components/Home/Capabilities'))
const Newsletter = lazy(() => import('../components/Home/Newsletter'))

const SectionFallback = ({ height = 260 }) => (
  <div className="section-fallback" style={{ minHeight: height }}>
    <div className="section-fallback__spinner" />
  </div>
)

const Home = () => {
  const { branchData } = useBranchData('UK')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = previousScrollBehavior
    }
  }, [])

  const structuredData = branchData ? {
    '@context': 'https://schema.org',
    '@graph': [
      generateOrganizationSchema(branchData),
      generateWebsiteSchema(),
      generateLocalBusinessSchema(branchData)
    ]
  } : generateWebsiteSchema()

  return (
    <div className="home-page">
      <SEO
        title="Home"
        description="OrthoHouse UK - Leading provider of prosthetic limbs, orthotic solutions, biomedical devices, and rehabilitation services. Expert consultations and personalized care for patients worldwide."
        keywords="orthohouseuk, orthohouse uk, prosthetics, orthotics, biomedical engineering, prosthetic limbs, orthotic devices, rehabilitation, medical devices, custom prosthetics, patient care, healthcare technology, UK prosthetics"
        structuredData={structuredData}
      />
      <Suspense fallback={<SectionFallback height={520} />}>
        <Hero branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HeroPartnersCarousel branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Stats branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Capabilities branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HomeGallery branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback height={220} />}>
        <Newsletter branchData={branchData} />
      </Suspense>
    </div>
  )
}

export default Home
