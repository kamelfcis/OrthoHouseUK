import { useState, useMemo, useRef, useEffect, useId } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import './ChatAssistant.css'

const initialMessages = [
  {
    id: 'bot-welcome',
    author: 'bot',
    text: `Hello! I'm the OrthoHouse assistant.\nAsk me about our pages, product categories, specific products, blog posts, or how to contact us.`
  }
]

const STOP_WORDS = new Set([
  'what',
  'is',
  'the',
  'a',
  'an',
  'and',
  'for',
  'about',
  'show',
  'me',
  'list',
  'of',
  'do',
  'you',
  'have',
  'any',
  'tell',
  'on',
  'in',
  'to',
  'please',
  'give',
  'with',
  'info',
  'information',
  'products',
  'product',
  'category',
  'categories',
  'page',
  'pages',
  'blog',
  'contact',
  'contacts'
])

const CONTACT_RESPONSE = `Reach the OrthoHouse UK team here:
- Address: 2 Kingdom St, London W2 6BD, United Kingdom
- Phone: +44 20 3368 3036 (Mon–Fri, 9am–5pm)
- Email: infoUK@ortho-house.com
- Contact form: /contact`

const BLOG_RESPONSE = `Explore clinical insights, updates, and stories on our Blog page:
- Latest articles: /blog
- Individual posts: open /blog and select a topic that interests you.`

const BotIcon = ({ size = 48, className = '' }) => {
  const gradientId = useId()
  const glowId = useId()

  return (
    <svg
      className={`chat-bot-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="6" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2dadd5" />
          <stop offset="50%" stopColor="#2478b5" />
          <stop offset="100%" stopColor="#005f9a" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 10) rotate(90) scale(28)">
          <stop stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#glowId)" opacity="0.5" />
      <path
        d="M14 29C14 21.268 20.268 15 28 15H36C43.732 15 50 21.268 50 29V34C50 41.732 43.732 48 36 48H28C20.268 48 14 41.732 14 34V29Z"
        fill="url(#gradientId)"
      />
      <path
        d="M23 26C21.343 26 20 27.343 20 29C20 30.657 21.343 32 23 32C24.657 32 26 30.657 26 29C26 27.343 24.657 26 23 26Z"
        fill="white"
        opacity="0.92"
      />
      <path
        d="M41 26C39.343 26 38 27.343 38 29C38 30.657 39.343 32 41 32C42.657 32 44 30.657 44 29C44 27.343 42.657 26 41 26Z"
        fill="white"
        opacity="0.92"
      />
      <path
        d="M24.5 38C26.0676 40.0266 28.8976 42 32.0305 42C35.1635 42 38.0119 40.0266 39.5 38"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <path
        d="M32 12V8"
        stroke="url(#gradientId)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M17 50L13 54"
        stroke="url(#gradientId)"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M51 50L55 54"
        stroke="url(#gradientId)"
        strokeWidth="3.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  )
}

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const replyTimeoutRef = useRef(null)
  const hasFetchedRef = useRef(false)
  const [referenceData, setReferenceData] = useState({ products: [], categories: [] })
  const [isLoadingData, setIsLoadingData] = useState(false)

  const knowledgeBase = useMemo(() => ([
    {
      keywords: ['page', 'pages', 'site', 'navigate', 'navigation', 'menu', 'where to find'],
      response: `You can explore these OrthoHouse pages:\n- **Home** (/): Overview of OrthoHouse and our services\n- **About** (/about): Our story, mission, and values\n- **Products** (/products): Browse our complete product catalog\n- **Partners** (/partners): Meet our innovation partners\n- **Team** (/team): Learn about our specialists\n- **Gallery** (/gallery): Real-world highlights and showcases\n- **Testimonials** (/testimonials): Hear from our clients\n- **Blog** (/blog): Clinical insights and updates\n- **Contact** (/contact): Reach out to our support team`
    },
    {
      keywords: ['category', 'categories', 'filter', 'type', 'types'],
      response: `Product categories help you focus on what you need. Visit /products and use the category filter cards to browse by:\n- Orthopaedic solutions\n- Diagnostic tools\n- Patient care items\n- And more specialized categories\n\nEach category shows relevant products with detailed information.`
    },
    {
      keywords: ['product', 'products', 'item', 'items', 'catalog', 'catalogue', 'inventory'],
      response: `Head to /products to browse our complete catalog. You can:\n- Filter by category\n- Search for specific products\n- View detailed product information\n- See partner information\n- Learn about applications and features\n\nWhat type of product are you looking for?`
    },
    {
      keywords: ['blog', 'blogs', 'article', 'news', 'insight', 'post', 'posts', 'stories'],
      response: `Our Blog page at /blog highlights:\n- Clinical insights and research\n- Product updates and launches\n- Partner success stories\n- Industry news and trends\n\nClick any post to read the full article. Use the search feature to find specific topics.`
    },
    {
      keywords: ['contact', 'contacts', 'support', 'email', 'phone', 'visit', 'location', 'address', 'reach'],
      response: CONTACT_RESPONSE
    },
    {
      keywords: ['partner', 'partners', 'collaborat', 'manufacturer', 'supplier'],
      response: `The Partners page at /partners showcases the innovators we collaborate with. Each partner profile includes:\n- Company information\n- Associated products\n- Success stories\n- Contact details\n\nVisit /partners to explore our network of trusted manufacturers and medical pioneers.`
    },
    {
      keywords: ['service', 'services', 'treatment', 'solution', 'solutions', 'what do you offer'],
      response: `OrthoHouse offers comprehensive solutions including:\n- Prosthetic limbs and devices\n- Orthotic solutions\n- Biomedical devices\n- Rehabilitation services\n- Expert consultations\n- Personalized patient care\n\nVisit /about to learn more about our services, or /contact to discuss your specific needs.`
    },
    {
      keywords: ['appointment', 'book', 'schedule', 'consultation', 'meeting'],
      response: `Ready to connect? You can:\n- Use the Contact page form at /contact\n- Call us at +44 20 3368 3036 (Mon–Fri, 9am–5pm)\n- Email us at infoUK@ortho-house.com\n- Visit us at 2 Kingdom St, London W2 6BD\n\nOur team will follow up quickly to schedule your consultation.`
    },
    {
      keywords: ['team', 'staff', 'specialist', 'specialists', 'doctor', 'doctors'],
      response: `Learn about our team of specialists on the Team page at /team. Our experts are dedicated to providing personalized care and innovative solutions for our patients.`
    },
    {
      keywords: ['gallery', 'photos', 'images', 'pictures', 'showcase'],
      response: `Visit our Gallery at /gallery to see real-world highlights, product showcases, and success stories from our work with patients and partners.`
    },
    {
      keywords: ['testimonial', 'testimonials', 'review', 'reviews', 'feedback', 'patient story'],
      response: `Read testimonials from our patients at /testimonials. Hear firsthand accounts of how OrthoHouse has helped improve lives through our prosthetic and orthotic solutions.`
    }
  ]), [])

  const suggestions = useMemo(() => ([]), [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
    }
  }, [messages, isOpen])

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        clearTimeout(replyTimeoutRef.current)
      }
    }
  }, [])

  // Only fetch reference data when the chat is opened for the first time
  useEffect(() => {
    if (!isOpen || hasFetchedRef.current) return
    hasFetchedRef.current = true

    let isMounted = true

    const fetchReferenceData = async () => {
      setIsLoadingData(true)

      try {
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('branch_code', 'UK')
          .eq('is_active', true)
          .single()

        if (branchError || !branch?.branch_id) {
          throw branchError || new Error('UK branch not found')
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('product_categories')
          .select('category_id, category_name')
          .eq('is_active', true)
          .order('category_name')

        if (categoriesError) {
          throw categoriesError
        }

        const { data: branchProducts, error: productsError } = await supabase
          .from('branch_products')
          .select(`
            *,
            products (
              product_id,
              product_name,
              product_code,
              description,
              product_categories (
                category_name
              )
            )
          `)
          .eq('branch_id', branch.branch_id)
          .eq('is_available', true)
          .eq('is_public', true)

        if (productsError) {
          throw productsError
        }

        const products = (branchProducts || [])
          .map((item) => {
            const product = item.products
            if (!product) return null

            const description = item.local_description || product.description || item.special_notes || ''

            return {
              id: product.product_id,
              name: product.product_name,
              category: product.product_categories?.category_name || '',
              description: description,
              code: product.product_code || '',
              link: `/products/${product.product_id}`
            }
          })
          .filter(Boolean)

        let productList = products
        try {
          if (products.length) {
            const productIds = products.map((product) => product.id)

            const { data: productImages, error: imagesError } = await supabase
              .from('product_images')
              .select('*')
              .eq('branch_id', branch.branch_id)
              .in('product_id', productIds)
              .order('is_primary', { ascending: false })
              .order('image_order', { ascending: true })

            if (imagesError) {
              throw imagesError
            }

            const productImagesMap = {}
            productImages?.forEach((image) => {
              if (!productImagesMap[image.product_id]) {
                productImagesMap[image.product_id] = getProductImageUrl(image.image_url)
              }
            })

            productList = products.map((product) => ({
              ...product,
              image: productImagesMap[product.id] || `/assets/images/product-${product.id % 6 + 1}.jpg`
            }))
          }
        } catch (imageError) {
          console.error('ChatAssistant: failed to fetch product images', imageError)
          productList = products.map((product) => ({
            ...product,
            image: `/assets/images/product-${product.id % 6 + 1}.jpg`
          }))
        }

        if (isMounted) {
          setReferenceData({
            categories: (categoriesData || []).map((category) => ({
              id: category.category_id,
              name: category.category_name
            })),
            products: productList.sort((a, b) => a.name.localeCompare(b.name))
          })
        }
      } catch (error) {
        console.error('ChatAssistant: failed to fetch UK branch data', error)
        if (isMounted) {
          setReferenceData({
            categories: [],
            products: []
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }

    fetchReferenceData()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const getProductImageUrl = (imagePath) => {
    if (!imagePath) return null
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co'
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
    return `https://${projectRef}.supabase.co/storage/v1/render/image/public/product-images/${imagePath}?width=160&quality=75`
  }

  const tokenizeMessage = (value) => {
    return value
      .replace(/[^a-z0-9\s]/gi, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token && !STOP_WORDS.has(token))
  }

  const findProductMatches = (normalizedMessage) => {
    if (!referenceData.products.length) return []

    const tokens = tokenizeMessage(normalizedMessage)

    if (!tokens.length && !normalizedMessage.includes('product')) {
      return []
    }

    const combinedMatches = referenceData.products.filter((product) => {
      const haystack = `${product.name} ${product.category}`.toLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })

    if (combinedMatches.length) {
      return combinedMatches
    }

    if (tokens.length) {
      return referenceData.products.filter((product) => {
        const haystack = `${product.name} ${product.category}`.toLowerCase()
        return tokens.some((token) => haystack.includes(token))
      })
    }

    return referenceData.products.slice(0, 6)
  }

  const findCategoryMatches = (normalizedMessage) => {
    if (!referenceData.categories.length) return []

    const tokens = tokenizeMessage(normalizedMessage)

    if (!tokens.length && !normalizedMessage.includes('category')) {
      return []
    }

    const strictMatches = referenceData.categories.filter((category) => {
      const haystack = category.name.toLowerCase()
      return tokens.every((token) => haystack.includes(token))
    })

    if (strictMatches.length) {
      return strictMatches
    }

    if (tokens.length) {
      return referenceData.categories.filter((category) => {
        const haystack = category.name.toLowerCase()
        return tokens.some((token) => haystack.includes(token))
      })
    }

    return referenceData.categories.slice(0, 6)
  }

  const formatProductMatches = (matches) => {
    if (!matches.length) return null

    const items = matches.slice(0, 3)
    const extraCount = matches.length - items.length

    return {
      type: 'product-list',
      text: `Here ${matches.length === 1 ? 'is' : 'are'} the product${matches.length === 1 ? '' : 's'} that match your request:`,
      products: items,
      extra: extraCount > 0
        ? `Plus ${extraCount} more waiting in /products.`
        : `Browse the full catalogue at /products for additional options.`
    }
  }

  const formatCategoryMatches = (matches) => {
    if (!matches.length) return null

    const lines = matches.slice(0, 6).map(
      (category) => `- ${category.name} → /products`
    )

    const extraCount = matches.length - lines.length
    const extraLine = extraCount > 0 ? `\n...and ${extraCount} additional categories. Open /products to browse them all.` : '\nOpen /products and use the category cards to filter instantly.'

    return `These categories seem relevant:\n${lines.join('\n')}${extraLine}`
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    if (!isOpen) {
      setInputValue('')
    }
  }

  const buildMessage = (author, text, extra = {}) => ({
    id: `${author}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author,
    text,
    ...extra
  })

  const getBotResponse = (rawMessage) => {
    const normalized = rawMessage.toLowerCase().trim()
    const words = normalized.split(/\s+/).filter(w => w.length > 0)

    // Handle greetings first
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'hi there', 'hey there']
    const isGreeting = greetings.some(greeting => {
      const greetingWords = greeting.split(/\s+/)
      if (greetingWords.length === 1) {
        return words.includes(greeting) || normalized.startsWith(greeting + ' ') || normalized.endsWith(' ' + greeting) || normalized === greeting
      } else {
        return normalized.includes(greeting)
      }
    })

    if (isGreeting) {
      return `Hello! How can I help you today? I can assist you with:\n- Finding products and categories\n- Navigating our website pages\n- Contact information\n- Blog articles\n- Partner information\n\nWhat would you like to know?`
    }

    // Handle questions about capabilities
    if (normalized.includes('what can you do') || normalized.includes('what do you do') || normalized.includes('help me') || normalized.includes('what are you')) {
      return `I'm the OrthoHouse Assistant! I can help you with:\n\n📦 **Products & Categories**: Find specific products or browse by category\n🌐 **Navigation**: Guide you to different pages on our website\n📞 **Contact Info**: Provide phone numbers, emails, and addresses\n📝 **Blog Posts**: Help you find articles and insights\n🤝 **Partners**: Information about our partner companies\n\nJust ask me anything! For example:\n- "Show me knee products"\n- "How do I contact you?"\n- "What categories do you have?"`
    }

    // Handle thank you
    if (normalized.includes('thank') || normalized.includes('thanks')) {
      return `You're welcome! Is there anything else I can help you with?`
    }

    // Handle contact-related queries
    if (['contact', 'phone', 'email', 'number', 'address', 'reach', 'call', 'support', 'location', 'where', 'how to contact'].some((keyword) => normalized.includes(keyword))) {
      return CONTACT_RESPONSE
    }

    // Handle blog-related queries
    if (['blog', 'article', 'news', 'post', 'posts', 'stories', 'insights', 'updates'].some((keyword) => normalized.includes(keyword))) {
      return BLOG_RESPONSE
    }

    // Handle product queries with better matching
    if (referenceData.products.length || isLoadingData) {
      const productMatches = findProductMatches(normalized)
      if (productMatches.length) {
        return formatProductMatches(productMatches)
      }

      // More intelligent product queries
      if (normalized.includes('product') || normalized.includes('item') || normalized.includes('catalog') || normalized.includes('what products') || normalized.includes('show products')) {
        if (isLoadingData) {
          return `I'm gathering the latest product list right now—please give me a moment and ask again.`
        }
        return `You can explore all our products at /products. You can:\n- Browse by category using the filter cards\n- Search for specific products\n- Click any product to see detailed information\n\nWhat type of product are you looking for?`
      }
    }

    // Handle category queries
    if (referenceData.categories.length || isLoadingData) {
      const categoryMatches = findCategoryMatches(normalized)
      if (categoryMatches.length) {
        return formatCategoryMatches(categoryMatches)
      }

      if (normalized.includes('category') || normalized.includes('categories') || normalized.includes('what categories')) {
        if (isLoadingData) {
          return `I'm still loading the category catalogue—ask me again in a few seconds.`
        }
        return `Visit /products and tap on any category card to filter the catalogue instantly. You can browse products by type, application, or specialty area.`
      }
    }

    // Handle partner queries
    if (normalized.includes('partner') || normalized.includes('partners') || normalized.includes('collaborat')) {
      return `The Partners page showcases the innovators we collaborate with. Each partner profile links products and success stories connected to them. Visit /partners to explore our network of trusted manufacturers and medical pioneers.`
    }

    // Handle service queries
    if (normalized.includes('service') || normalized.includes('services') || normalized.includes('treatment') || normalized.includes('what services')) {
      return `Visit the Services page to review clinical programs, digital planning, and ongoing support packages tailored for orthodontic teams. You can also learn about our comprehensive solutions at /partners.`
    }

    // Handle appointment/booking queries
    if (normalized.includes('appointment') || normalized.includes('book') || normalized.includes('schedule') || normalized.includes('consultation')) {
      return `Ready to connect? Use the Contact page's form to request a call or booking. Our team will follow up quickly. Visit /contact or call us at +44 20 3368 3036 (Mon–Fri, 9am–5pm).`
    }

    // Handle "who" or "what is" questions about OrthoHouse
    if ((normalized.includes('who') || normalized.includes('what is')) && (normalized.includes('orthohouse') || normalized.includes('ortho house') || normalized.includes('company'))) {
      return `OrthoHouse is a leading provider of prosthetic limbs, orthotic solutions, biomedical devices, and rehabilitation services. We offer expert consultations and personalized care for patients worldwide. Learn more about us on the About page at /about.`
    }

    // Check knowledge base with better matching
    const matchedResponses = knowledgeBase
      .filter((entry) => entry.keywords.some((keyword) => normalized.includes(keyword)))
      .map((entry) => entry.response)

    if (matchedResponses.length > 0) {
      const uniqueResponses = [...new Set(matchedResponses)]
      return uniqueResponses.join('\n\n')
    }

    // Smarter fallback response
    const hasQuestionWords = ['what', 'where', 'how', 'when', 'why', 'who', 'which'].some(word => normalized.includes(word))
    if (hasQuestionWords) {
      return `I understand you're asking a question. Let me help you better—could you be more specific? For example:\n- "What products do you have for [specific need]?"\n- "How do I contact OrthoHouse?"\n- "Where can I find [specific information]?"\n\nI can help with products, categories, contact info, blog posts, and navigating our website.`
    }

    return `I can help you with:\n\n🔍 **Finding Information**: Products, categories, blog posts\n📞 **Contact Details**: Phone, email, address\n🧭 **Navigation**: Guide you to any page\n🤝 **Partners**: Learn about our collaborators\n\nTry asking:\n- "Show me products for [specific need]"\n- "How do I contact you?"\n- "What categories are available?"\n- "Tell me about your partners"\n\nWhat would you like to know?`
  }

  const handleSendMessage = (message) => {
    const trimmed = message.trim()
    if (!trimmed) return

    const userMessage = buildMessage('user', trimmed)
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    const botReply = getBotResponse(trimmed)
    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current)
    }

    replyTimeoutRef.current = setTimeout(() => {
      if (typeof botReply === 'string') {
        setMessages((prev) => [...prev, buildMessage('bot', botReply)])
      } else if (botReply && typeof botReply === 'object') {
        setMessages((prev) => [...prev, buildMessage('bot', botReply.text || '', { richContent: botReply })])
      } else {
        setMessages((prev) => [...prev, buildMessage('bot', `I'm still learning how to answer that. Try asking about a product, category, blog, or contact info.`)])
      }
      setIsTyping(false)
      replyTimeoutRef.current = null
    }, 600)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleSendMessage(inputValue)
  }

  const renderMessageContent = (message) => {
    if (message.richContent?.type === 'product-list') {
      const { products = [], extra } = message.richContent
      return (
        <>
          {message.text && (
            <p className="chat-text">
              {message.text}
            </p>
          )}
          <ul className="chat-product-list">
            {products.map((product) => (
              <li key={`product-${product.id}`} className="chat-product-card">
                <div className="chat-product-image">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src = `https://via.placeholder.com/160x160/64d9b9/ffffff?text=${encodeURIComponent(product.name || 'Product')}`
                    }}
                  />
                </div>
                <div className="chat-product-details">
                  <h4 className="chat-product-name">{product.name}</h4>
                  {product.category && (
                    <span className="chat-product-category">
                      {product.category}
                    </span>
                  )}
                  {product.description && (
                    <p className="chat-product-description">
                      {product.description.length > 180
                        ? `${product.description.slice(0, 180)}…`
                        : product.description}
                    </p>
                  )}
                  <a href={product.link} className="chat-product-link">
                    View product
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {extra && (
            <p className="chat-product-extra">
              {extra}
            </p>
          )}
        </>
      )
    }

    if (message.text) {
      return message.text.split('\n').map((line, index, arr) => (
        <span key={`${message.id}-line-${index}`}>
          {line}
          {index !== arr.length - 1 && <br />}
        </span>
      ))
    }

    return null
  }

  const chatWindowVariants = {
    hidden: {
      opacity: 0,
      x: -40,
      y: 20,
      scale: 0.9,
      rotate: -2,
      filter: 'blur(8px)'
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 220,
        damping: 22
      }
    },
    exit: {
      opacity: 0,
      x: -80,
      y: 60,
      scale: 0.65,
      rotate: -8,
      filter: 'blur(14px)',
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  }

  const toggleVariants = {
    closed: {
      scale: 1,
      y: 0,
      boxShadow: '0 22px 38px rgba(0, 95, 154, 0.34)',
      transition: { type: 'spring', stiffness: 260, damping: 18 }
    },
    open: {
      scale: 1.05,
      y: -2,
      boxShadow: '0 18px 32px rgba(0, 0, 0, 0.14)',
      transition: { type: 'spring', stiffness: 200, damping: 20 }
    }
  }

  return (
    <div className="chat-assistant">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            className="chat-window"
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="chat-header">
              <div className="chat-header-info">
                <span className="chat-avatar" aria-hidden>
                  <BotIcon size={46} />
                </span>
                <div className="chat-header-text">
                  <p className="chat-title">OrthoHouse Assistant</p>
                  <p className="chat-status">{isTyping ? 'Typing...' : 'Online'}</p>
                </div>
              </div>
              <button
                type="button"
                className="chat-close"
                onClick={toggleChat}
                aria-label="Close chat assistant"
              >
                ×
              </button>
            </div>

            <div className="chat-messages" ref={messagesEndRef}>
              {messages.map((message) => (
                <div key={message.id} className={`chat-message ${message.author}`}>
                  <div className="chat-bubble">
                    {renderMessageContent(message)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="chat-message bot typing"
                >
                  <div className="chat-bubble typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.div>
              )}
            </div>

            <form className="chat-input" onSubmit={handleSubmit}>
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask about pages, products, blogs, or contacts..."
                aria-label="Message to OrthoHouse assistant"
              />
              <button type="submit" aria-label="Send message">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L5.5 12.5L19 18L21 5L4 12Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 12.5L10.6464 17.6464C10.8417 17.8417 11.1583 17.8417 11.3536 17.6464L13.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        whileTap={{ scale: 0.92 }}
        variants={toggleVariants}
        animate={isOpen ? 'open' : 'closed'}
      >
        <span className="chat-toggle-icon" aria-hidden>
          <BotIcon size={28} className="chat-toggle-icon-svg" />
        </span>
        <span className="chat-toggle-text">{isOpen ? 'Close' : 'Ask OrthoHouse'}</span>
      </motion.button>
    </div>
  )
}

export default ChatAssistant

