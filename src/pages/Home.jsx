import { useEffect, Suspense, lazy } from 'react'
import useBranchData from '../hooks/useBranchData'
import Hero from '../components/Home/Hero'

import SEO from '../components/SEO/SEO'
import { generateOrganizationSchema, generateWebsiteSchema, generateLocalBusinessSchema } from '../utils/seoData'
import './Home.css'

const HeroPartnersCarousel = lazy(() => import('../components/Home/HeroPartnersCarousel'))
const HomeProducts = lazy(() => import('../components/Home/HomeProducts'))
const HomeMission = lazy(() => import('../components/Home/HomeMission'))
const Stats = lazy(() => import('../components/Home/Stats'))
const HomeUkJourney = lazy(() => import('../components/Home/HomeUkJourney'))
const HomeAccreditations = lazy(() => import('../components/Home/HomeAccreditations'))
const HomeEvents = lazy(() => import('../components/Home/HomeEvents'))
const HomeJoinCta = lazy(() => import('../components/Home/HomeJoinCta'))

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
      <Hero branchData={branchData} />
      <Suspense fallback={<SectionFallback />}>
        <HeroPartnersCarousel branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback height={320} />}>
        <HomeProducts branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback height={240} />}>
        <HomeMission />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Stats branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionFallback height={300} />}>
        <HomeUkJourney />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HomeAccreditations />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HomeEvents />
      </Suspense>
      <Suspense fallback={<SectionFallback height={280} />}>
        <HomeJoinCta />
      </Suspense>
    </div>
  )
}

export default Home
