export const blogPage = {
  seo: {
    title: 'Blog — Orthopaedic Insights',
    description:
      'News, clinical updates, and orthopaedic industry insights from OrthoHouse UK — supporting surgeons and healthcare professionals across the United Kingdom.',
    keywords:
      'orthopaedic blog, medical device news UK, surgeon education, OrthoHouse UK articles'
  },
  hero: {
    eyebrow: 'Insights & Updates',
    title: ['OrthoHouse UK', 'Blog'],
    titleLine1: 'OrthoHouse UK',
    titleLine2: 'Blog',
    subtitle:
      'Clinical perspectives, product updates, and news from the UK orthopaedic community.'
  },
  searchPlaceholder: 'Search articles…',
  allCategories: 'All',
  filterAll: 'All',
  featured: 'Featured',
  continueReading: 'Continue reading',
  defaultAuthor: 'OrthoHouse UK',
  defaultExcerpt: 'Insights from the OrthoHouse UK team.',
  readTime: (minutes) => `${minutes} min read`,
  empty: 'No articles match your search. Try a different term or browse all categories.',
  loading: 'Loading articles…',
  error: 'Unable to load articles. Please try again later.',
  readMore: 'Read article',
  searchResults: (count, query) =>
    count === 1
      ? `1 article matching “${query}”`
      : `${count} articles matching “${query}”`
}

export const blogDetail = {
  loading: 'Loading article…',
  backToBlog: 'Back to Blog',
  relatedHeading: 'Related Articles',
  shareHeading: 'Share this article',
  notFound: 'Article not found',
  notFoundMessage: 'This article may have been removed or is no longer published.'
}
