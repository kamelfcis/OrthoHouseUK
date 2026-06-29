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
  speakCta: 'Speak with Our Team',
  specsHeading: 'Product Specifications',
  partnerHeading: 'Manufacturing Partner',
  descriptionHeading: 'Overview',
  notFound: 'Product not found',
  notFoundMessage: 'This product may no longer be available in our UK catalogue.'
}
