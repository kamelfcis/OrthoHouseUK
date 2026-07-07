import { useEffect, useMemo, Suspense, lazy } from 'react'
import useBranchData from '../hooks/useBranchData'
import { getHomeSectionVisibilityFromRows } from '../lib/navLinkSettings'
import Hero from '../components/Home/Hero'

import SEO from '../components/SEO/SEO'
import SectionSkeleton from '../components/common/SectionSkeleton'
import { pageSeo } from '../content/seo'
import { generateOrganizationSchema, generateWebsiteSchema, generateLocalBusinessSchema } from '../utils/seoData'
import './Home.css'

const HeroPartnersCarousel = lazy(() => import('../components/Home/HeroPartnersCarousel'))
const HomeFeaturedProducts = lazy(() => import('../components/Home/HomeFeaturedProducts'))
const HomeSpecialties = lazy(() => import('../components/Home/HomeSpecialties'))
const HomeHowItWorks = lazy(() => import('../components/Home/HomeHowItWorks'))
const Stats = lazy(() => import('../components/Home/Stats'))
const HomeTestimonials = lazy(() => import('../components/Home/HomeTestimonials'))
const HomeAccreditations = lazy(() => import('../components/Home/HomeAccreditations'))
const HomeResources = lazy(() => import('../components/Home/HomeResources'))

const Home = () => {
  const { branchData } = useBranchData('UK')

  const {
    showSpecialties,
    showFeaturedProducts,
    showResources,
    showStats
  } = useMemo(() => {
    const visibility = getHomeSectionVisibilityFromRows(branchData?.navLinkSettings)
    return {
      showSpecialties: Boolean(visibility.home_specialties),
      showFeaturedProducts: Boolean(visibility.home_featured_products),
      showResources: Boolean(visibility.home_resources),
      showStats: Boolean(visibility.home_stats)
    }
  }, [branchData?.navLinkSettings])

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

      {/* 1. Full-width hero */}
      <Hero branchData={branchData} />

      {/* Partner trust strip */}
      <Suspense fallback={<SectionSkeleton minHeight={120} />}>
        <HeroPartnersCarousel branchData={branchData} />
      </Suspense>

      {/* Service categories */}
      {showSpecialties && (
        <Suspense fallback={<SectionSkeleton minHeight={360} />}>
          <HomeSpecialties />
        </Suspense>
      )}

      {/* Featured products carousel */}
      {showFeaturedProducts && (
        <Suspense fallback={<SectionSkeleton minHeight={420} blocks={3} />}>
          <HomeFeaturedProducts branchData={branchData} />
        </Suspense>
      )}

      {/* 4. How it works */}
      <Suspense fallback={<SectionSkeleton minHeight={280} />}>
        <HomeHowItWorks />
      </Suspense>

      {/* 7. Statistics & measurable outcomes */}
      {showStats && (
        <Suspense fallback={<SectionSkeleton minHeight={300} />}>
          <Stats />
        </Suspense>
      )}

      {/* 8. Testimonials */}
      <Suspense fallback={<SectionSkeleton minHeight={260} />}>
        <HomeTestimonials />
      </Suspense>

      {/* 10. Trust & compliance */}
      <Suspense fallback={<SectionSkeleton minHeight={240} />}>
        <HomeAccreditations />
      </Suspense>

      {/* 12. Latest insights / blog */}
      {showResources && (
        <Suspense fallback={<SectionSkeleton minHeight={280} />}>
          <HomeResources branchData={branchData} />
        </Suspense>
      )}
    </div>
  )
}

export default Home
