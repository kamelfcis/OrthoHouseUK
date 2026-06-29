export const chatUi = {
  welcome:
    'Hello! I\'m the OrthoHouse UK assistant.\nAsk me about our pages, product categories, specific products, blog posts, or how to contact our team.',
  title: 'OrthoHouse Assistant',
  typing: 'Typing…',
  online: 'Online',
  closeAria: 'Close chat assistant',
  inputPlaceholder: 'Ask about pages, products, blogs, or contacts…',
  inputAria: 'Message to OrthoHouse assistant',
  sendAria: 'Send message',
  toggleOpen: 'Ask OrthoHouse',
  toggleClose: 'Close'
}

export const chatContact = `Reach the OrthoHouse UK team here:
- Address: 2 Kingdom St, London W2 6BD, United Kingdom
- Phone: +44 20 3368 3036 (Mon–Fri, 9 a.m.–5 p.m.)
- Email: infoUK@ortho-house.com
- Contact form: /contact`

export const chatBlog = `Explore clinical insights, product updates, and industry news on our Blog page:
- Latest articles: /blog
- Individual posts: open /blog and select a topic that interests you.`

export const chatKnowledgeBase = [
  {
    keywords: ['page', 'pages', 'site', 'navigate', 'navigation', 'menu', 'where to find'],
    response: `You can explore these OrthoHouse UK pages:
- **Home** (/): Overview of our orthopaedic distribution services
- **About** (/about): Our story, mission, and values
- **Products** (/products): Browse our complete product catalogue
- **Partners** (/partners): Meet our manufacturing partners
- **Gallery** (/gallery): Conference highlights and showcases
- **Blog** (/blog): Clinical insights and updates
- **Contact** (/contact): Reach our UK team`
  },
  {
    keywords: ['category', 'categories', 'filter', 'type', 'types'],
    response: `Product categories help you focus on what you need. Visit /products and use the category filter cards to browse by:
- Trauma fixation systems
- Arthroplasty and joint replacement
- Foot & ankle solutions
- Bone graft and regenerative technologies
- And more specialised categories

Each category shows relevant products with detailed information.`
  },
  {
    keywords: ['product', 'products', 'item', 'items', 'catalog', 'catalogue', 'inventory'],
    response: `Head to /products to browse our complete catalogue. You can:
- Filter by category
- Search for specific products
- View detailed product information
- See partner information
- Learn about clinical applications and features

What type of orthopaedic product are you looking for?`
  },
  {
    keywords: ['blog', 'blogs', 'article', 'news', 'insight', 'post', 'posts', 'stories'],
    response: `Our Blog page at /blog highlights:
- Clinical insights and research
- Product updates and launches
- Partner success stories
- Industry news and trends

Click any post to read the full article.`
  },
  {
    keywords: ['contact', 'contacts', 'support', 'email', 'phone', 'visit', 'location', 'address', 'reach'],
    response: null // uses chatContact
  },
  {
    keywords: ['partner', 'partners', 'collaborat', 'manufacturer', 'supplier'],
    response: `The Partners page at /partners showcases the manufacturers we represent. Each partner profile includes:
- Company information
- Associated products
- Partnership details

Visit /partners to explore our network of trusted orthopaedic manufacturers.`
  },
  {
    keywords: ['service', 'services', 'treatment', 'solution', 'solutions', 'what do you offer'],
    response: `OrthoHouse UK distributes orthopaedic medical devices including:
- Trauma fixation and implant systems
- Arthroplasty and joint replacement solutions
- Foot & ankle surgical systems
- Bone graft and regenerative technologies
- Clinical education and theatre support

Visit /about to learn more, or /contact to discuss your specific requirements.`
  },
  {
    keywords: ['appointment', 'book', 'schedule', 'consultation', 'meeting'],
    response: `Ready to connect? You can:
- Use the Contact page form at /contact
- Call us at +44 20 3368 3036 (Mon–Fri, 9 a.m.–5 p.m.)
- Email us at infoUK@ortho-house.com
- Visit our London office at 2 Kingdom St, London W2 6BD

Our team will follow up promptly to arrange a consultation.`
  },
  {
    keywords: ['team', 'staff', 'specialist', 'specialists', 'doctor', 'doctors'],
    response: `Learn about our UK team on the Team page at /team. Our commercial and clinical specialists support surgeons and hospitals with product expertise, education, and responsive service.`
  },
  {
    keywords: ['gallery', 'photos', 'images', 'pictures', 'showcase'],
    response: `Visit our Gallery at /gallery to see conference highlights, product showcases, and events from the UK orthopaedic community.`
  },
  {
    keywords: ['testimonial', 'testimonials', 'review', 'reviews', 'feedback'],
    response: `Read testimonials from surgeons and hospital leaders at /testimonials. Hear how OrthoHouse UK supports clinical teams with reliable products and dedicated service.`
  },
  {
    keywords: ['mhra', 'nhs', 'accreditation', 'framework', 'regulatory', 'ukrp'],
    response: `OrthoHouse UK holds key accreditations:
- **MHRA Registered** — distributor and UK Responsible Person (UKRP)
- **NHS Scotland Approved** — Orthopaedic Trauma & Extremity framework supplier
- **UK Responsible Person** — full UKRP services for our partners

Learn more on our homepage or contact us at /contact.`
  }
]

export const chatDynamic = {
  loadingProducts: 'I\'m gathering the latest product list right now — please give me a moment and ask again.',
  browseProducts: `You can explore all our products at /products. You can:
- Browse by category using the filter cards
- Search for specific products
- Click any product to see detailed information

What type of orthopaedic product are you looking for?`,
  loadingCategories: 'I\'m still loading the category catalogue — ask me again in a few seconds.',
  browseCategories: 'Visit /products and tap on any category card to filter the catalogue instantly. You can browse products by specialty, application, or clinical area.',
  partnersFallback: 'The Partners page showcases the manufacturers we represent. Each partner profile links products connected to them. Visit /partners to explore our network.',
  servicesFallback: 'OrthoHouse UK distributes orthopaedic implants and surgical systems to surgeons and hospitals. Learn about our product portfolio at /products or our partners at /partners.',
  appointmentFallback: 'Ready to connect? Use the Contact page form to request a consultation. Our team will follow up promptly. Visit /contact or call +44 20 3368 3036 (Mon–Fri, 9 a.m.–5 p.m.).',
  aboutOrthoHouse: 'OrthoHouse UK is a leading distributor of orthopaedic implants, trauma systems, foot & ankle, arthroplasty, and bone graft solutions — serving surgeons, hospitals, and NHS trusts. Learn more on the About page at /about.',
  questionFallback: `I understand you have a question. Could you be more specific? For example:
- "What trauma products do you supply?"
- "How do I contact OrthoHouse UK?"
- "Where can I find product information?"

I can help with products, categories, contact details, blog posts, and navigating our website.`,
  generalFallback: `I can help you with:

🔍 **Finding Information**: Products, categories, blog posts
📞 **Contact Details**: Phone, email, address
🧭 **Navigation**: Guide you to any page
🤝 **Partners**: Learn about our manufacturers

Try asking:
- "Show me products for trauma fixation"
- "How do I contact you?"
- "What categories are available?"
- "Tell me about your partners"

What would you like to know?`
}
