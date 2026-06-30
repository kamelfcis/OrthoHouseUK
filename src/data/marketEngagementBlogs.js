/**
 * Market engagement articles from slide 19 —
 * "OrthoHouse UK Active Market Engagement" (OH recruitment presentation).
 *
 * Merged with Supabase blogs on /blog. Stable IDs in the 91001+ range avoid
 * collisions with database-assigned blog_id values.
 */
import { homeEventImages } from './localAssets'

const AUTHOR = 'OrthoHouse UK'
const CATEGORY = 'Market Engagement'

const imagePath = (img) => img?.src || null

export const MARKET_ENGAGEMENT_BLOGS = [
  {
    blog_id: 91001,
    slug: 'bess-conference-2025',
    title: 'BESS Conference 2025 — Showcasing Our Shoulder & Upper Limb Portfolio',
    excerpt:
      'OrthoHouse UK joined the British Elbow & Shoulder Society (BESS) annual conference to present our shoulder and upper-extremity implant portfolio to leading UK surgeons.',
    content: `OrthoHouse UK was proud to participate in the BESS Conference 2025, the flagship gathering of the British Elbow & Shoulder Society. The event brought together consultant surgeons, trainees, and allied health professionals with a shared focus on shoulder and upper-limb orthopaedics.

Our team showcased a curated portfolio of shoulder and upper-extremity solutions — from trauma fixation to arthroplasty systems — highlighting how OrthoHouse UK supports evidence-based surgical practice across the NHS and independent sector.

Throughout the congress we welcomed surgeons to our exhibition space for product demonstrations, clinical pathway discussions, and introductions to our manufacturing partners. BESS remains a cornerstone of our UK market engagement calendar, reflecting our long-term commitment to the upper-extremity orthopaedic community.

Keywords: BESS, British Elbow and Shoulder Society, shoulder surgery, upper limb, conference 2025, orthopaedic exhibition, OrthoHouse UK.`,
    featured_image: imagePath(homeEventImages['bess-2025']),
    published_at: '2025-03-15T09:00:00.000Z',
    status: 'published',
    is_public: true,
    category: CATEGORY,
    searchKeywords: [
      'BESS',
      'British Elbow and Shoulder Society',
      'shoulder',
      'upper limb',
      'conference',
      '2025',
      'exhibition',
      'market engagement'
    ],
    slideImage: '/assets/optimized/presentation/orthohouse-uk-active-market-engagement-03-672x504-1200.webp',
    imageSource: 'legacy events/blogs (4032×3024); slide photo below 800px'
  },
  {
    blog_id: 91002,
    slug: 'boa-conference-2025',
    title: 'BOA Annual Congress 2025 — Engaging UK Orthopaedic Stakeholders',
    excerpt:
      'At the British Orthopaedic Association (BOA) Annual Congress, OrthoHouse UK connected with key orthopaedic stakeholders across hospitals, procurement, and clinical leadership.',
    content: `The BOA Annual Congress 2025 provided OrthoHouse UK with a national platform to engage directly with the UK's orthopaedic community. As the profession's leading professional body, the British Orthopaedic Association convenes surgeons, trainees, and healthcare leaders to share research, innovation, and best practice.

Our presence at BOA focused on building relationships with key stakeholders — from consultant surgeons and theatre teams to procurement specialists and hospital management. We discussed how OrthoHouse UK delivers reliable implant supply, regulatory compliance, and responsive clinical support across trauma, arthroplasty, and foot & ankle specialities.

BOA remains central to our active market engagement strategy. By participating at this scale, we reinforce OrthoHouse UK's role as a trusted distribution partner for world-class orthopaedic manufacturers serving the United Kingdom.

Keywords: BOA, British Orthopaedic Association, annual congress, orthopaedic stakeholders, UK market, NHS, conference 2025, OrthoHouse UK.`,
    featured_image: imagePath(homeEventImages['boa-2025']),
    published_at: '2025-04-22T09:00:00.000Z',
    status: 'published',
    is_public: true,
    category: CATEGORY,
    searchKeywords: [
      'BOA',
      'British Orthopaedic Association',
      'congress',
      'orthopaedic stakeholders',
      'UK market',
      'conference',
      '2025',
      'NHS'
    ],
    slideImage: '/assets/optimized/presentation/orthohouse-uk-active-market-engagement-04-644x503-1200.webp',
    imageSource: 'legacy events/gallery (8256×5504); slide photo below 800px'
  },
  {
    blog_id: 91003,
    slug: 'kbp-uk-embassy-egypt-2025',
    title: 'KBP at the UK Embassy in Egypt — Strengthening International Partnerships',
    excerpt:
      'OrthoHouse UK participated in the KBP programme at the British Embassy in Egypt, advancing international partnerships and clinical collaboration between the UK and the Middle East.',
    content: `OrthoHouse UK was honoured to take part in the KBP (Knowledge Transfer & Business Partnership) initiative hosted at the UK Embassy in Egypt. This engagement reflects our commitment to strengthening international partnerships and fostering clinical collaboration across borders.

The programme brought together healthcare leaders, industry partners, and diplomatic stakeholders to explore opportunities for knowledge exchange, surgical education, and responsible distribution of orthopaedic technologies. Our team shared insights from the UK market — including regulatory pathways, surgeon education models, and partnership structures that support safe, effective patient care.

International collaboration is a strategic pillar for OrthoHouse. By participating in embassy-led initiatives, we build bridges between UK manufacturing excellence and growing clinical communities in the Middle East and North Africa region.

Keywords: KBP, UK Embassy Egypt, international partnerships, clinical collaboration, Middle East, orthopaedic distribution, OrthoHouse UK, 2025.`,
    featured_image: imagePath(homeEventImages['kbp-2025']),
    published_at: '2025-05-08T09:00:00.000Z',
    status: 'published',
    is_public: true,
    category: CATEGORY,
    searchKeywords: [
      'KBP',
      'UK embassy',
      'Egypt',
      'international partnerships',
      'clinical collaboration',
      'Middle East',
      '2025',
      'diplomatic'
    ],
    slideImage: '/assets/optimized/presentation/orthohouse-uk-active-market-engagement-05-703x468-1200.webp',
    imageSource: 'presentation life-at-orthohouse-03 (838×885); slide photo below 800px'
  },
  {
    blog_id: 91004,
    slug: 'bofas-conference-2025-platinum-sponsor',
    title: 'BOFAS Annual Conference 2025 — Platinum Sponsor for Foot & Ankle',
    excerpt:
      'As a Platinum Sponsor of the British Orthopaedic Foot & Ankle Society (BOFAS) Annual Conference, OrthoHouse UK led a prominent presence in foot and ankle surgery.',
    content: `OrthoHouse UK was delighted to serve as a Platinum Sponsor at the BOFAS Annual Conference 2025. The British Orthopaedic Foot & Ankle Society is the UK's authoritative voice for foot and ankle surgery, and our sponsorship underscored our strategic commitment to this speciality.

Throughout the conference, our team engaged with foot and ankle consultants, fellows, and allied professionals — presenting advanced fixation systems, osteotomy solutions, and arthrodesis platforms from our partner manufacturers. Platinum sponsorship enabled a high-visibility presence, supporting educational sessions and facilitating meaningful dialogue with the surgical community.

Foot & ankle remains one of the fastest-evolving areas of orthopaedic practice. By investing in BOFAS at the highest sponsorship tier, OrthoHouse UK demonstrates leadership in bringing innovative, evidence-based technologies to UK surgeons.

Keywords: BOFAS, British Orthopaedic Foot and Ankle Society, platinum sponsor, foot and ankle, conference 2025, orthopaedic sponsorship, OrthoHouse UK.`,
    featured_image: imagePath(homeEventImages['bofas-2025']),
    published_at: '2025-06-12T09:00:00.000Z',
    status: 'published',
    is_public: true,
    category: CATEGORY,
    searchKeywords: [
      'BOFAS',
      'British Orthopaedic Foot and Ankle Society',
      'platinum sponsor',
      'foot and ankle',
      'conference',
      '2025',
      'sponsorship'
    ],
    slideImage: '/assets/optimized/presentation/orthohouse-uk-active-market-engagement-06-733x489-1200.webp',
    imageSource: 'presentation 1st-cadaver-courses (895×610); slide photo below 800px'
  }
]

/** Lookup static post by blog_id (for BlogDetail). */
export const getMarketEngagementBlogById = (id) =>
  MARKET_ENGAGEMENT_BLOGS.find((post) => post.blog_id === Number(id)) || null

/** True when id belongs to the static market-engagement range. */
export const isMarketEngagementBlogId = (id) => {
  const n = Number(id)
  return Number.isInteger(n) && n >= 91001 && n <= 91099
}

export const MARKET_ENGAGEMENT_AUTHOR = AUTHOR
export const MARKET_ENGAGEMENT_CATEGORY = CATEGORY
