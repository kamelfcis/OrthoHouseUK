import { useEffect, Suspense, lazy } from 'react'
import useBranchData from '../hooks/useBranchData'
import Hero from '../components/Home/Hero'

import SEO from '../components/SEO/SEO'
import SectionSkeleton from '../components/common/SectionSkeleton'
import { pageSeo } from '../content/seo'
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
        title={pageSeo.home.title}
        description={pageSeo.home.description}
        keywords={pageSeo.home.keywords}
        structuredData={structuredData}
      />
      <Hero branchData={branchData} />
      <Suspense fallback={<SectionSkeleton minHeight={260} />}>
        <HeroPartnersCarousel branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={320} />}>
        <HomeProducts branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={240} />}>
        <HomeMission />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={260} />}>
        <Stats branchData={branchData} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={300} />}>
        <HomeUkJourney />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={260} />}>
        <HomeAccreditations />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={260} />}>
        <HomeEvents />
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight={280} />}>
        <HomeJoinCta />
      </Suspense>
    </div>
  )
}

export default Home
