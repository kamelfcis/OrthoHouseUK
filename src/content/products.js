export const productsPage = {
  hero: {
    eyebrow: 'Product Portfolio',
    titleLine1: 'Precision Engineered',
    titleLine2: 'Orthopaedic Solutions',
    subtitle:
      'Explore our curated range of trauma, arthroplasty, foot & ankle, and regenerative technologies — distributed with full MHRA compliance and clinical support.',
  },
  filterTitle: 'Filter by Category',
  clearFilter: 'Clear filter',
  filterInfo: (count, category) =>
    `Showing ${count} product${count !== 1 ? 's' : ''} in ${category}`,
  emptyAll:
    'No products are currently available. Please check back soon or speak with our team.',
  emptyCategory:
    'No products found in this category. Try another category or view the full catalogue.',
  loading: 'Loading products…'
}

export const productDetail = {
  loading: 'Loading product details…',
  notFound: 'Product not found',
  notFoundDefault: 'This product may no longer be available in our UK catalogue.',
  notFoundMessage: 'This product may no longer be available in our UK catalogue.',
  backToProducts: 'Back to Products',
  noImage: 'No product image available',
  speakCta: 'Speak with Our Team',
  specsHeading: 'Product Specifications',
  partnerHeading: 'Manufacturing Partner',
  descriptionHeading: 'Overview',
  seoFallback: (name, category) =>
    `${name} — ${category} orthopaedic solution from OrthoHouse UK.`,
  labels: {
    code: 'Code',
    productCode: 'Product code',
    partner: 'Partner',
    category: 'Category',
    overview: 'Overview',
    specifications: 'Specifications',
    specialNotes: 'Special notes'
  },
  stats: {
    availableIn: (branch) => `Available in ${branch}`,
    imageCount: (count) => `${count} image${count !== 1 ? 's' : ''}`,
    partneredWith: (name) => `Partnered with ${name}`
  }
}
