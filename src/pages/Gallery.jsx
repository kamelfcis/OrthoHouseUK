import { useState, useEffect, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getBranchDataSnapshot } from '../lib/branchDataCache'
import SEO from '../components/SEO/SEO'
import { pageSeo } from '../content/seo'
import { galleryPage } from '../content/gallery'
import './Gallery.css'

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchGalleryImages()
  }, [])

  const fetchGalleryImages = async () => {
    try {
      setLoading(true)
      setError(null)

      let branch = getBranchDataSnapshot('UK').data?.branch
      if (!branch) {
        const { data, error: branchError } = await supabase
          .from('branches')
          .select('branch_id, branch_code, is_active')
          .eq('branch_code', 'UK')
          .eq('is_active', true)
          .single()

        if (branchError) throw branchError
        if (!data) throw new Error('UK branch not found')
        branch = data
      }

      const [categoriesRes, categoryImagesRes, productImagesRes] = await Promise.all([
        supabase
          .from('product_categories')
          .select('category_id, category_name')
          .eq('is_active', true)
          .order('category_name', { ascending: true }),
        supabase
          .from('category_images')
          .select('image_id, image_url, image_alt_text, image_order, is_primary, category_id')
          .eq('branch_id', branch.branch_id)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true }),
        supabase
          .from('product_images')
          .select(`
            image_id,
            image_url,
            image_alt_text,
            image_order,
            is_primary,
            product_id,
            products (
              product_name,
              category_id,
              product_categories (category_name)
            )
          `)
          .eq('branch_id', branch.branch_id)
          .order('is_primary', { ascending: false })
          .order('image_order', { ascending: true })
      ])

      if (categoriesRes.error) throw categoriesRes.error
      if (categoryImagesRes.error) throw categoryImagesRes.error
      if (productImagesRes.error) throw productImagesRes.error

      const categoryList = categoriesRes.data || []
      setCategories(categoryList)

      const categoryMap = new Map()
      categoryList.forEach((category) => {
        categoryMap.set(category.category_id, category.category_name)
      })

      const toStorageUrl = (bucket, path) => {
        if (!path) return null
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ljfkmtuxqaznnmmxeydf.supabase.co').replace(/\/$/, '')
        let cleanPath = path.trim().replace(/^\/+/, '')
        if (cleanPath.toLowerCase().startsWith(`${bucket.toLowerCase()}/`)) {
          cleanPath = cleanPath.substring(bucket.length + 1)
        }
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
      }

      const categoryImages = (categoryImagesRes.data || []).map((img, index) => ({
        id: `category-${img.image_id}`,
        src: toStorageUrl('category-images', img.image_url),
        alt: img.image_alt_text || categoryMap.get(img.category_id) || 'Category image',
        title: categoryMap.get(img.category_id)
          ? `${categoryMap.get(img.category_id)} Category`
          : 'Category Image',
        type: 'category',
        categoryId: img.category_id,
        order: img.is_primary ? index : index + 1000
      })).filter((img) => img.src)

      const productImages = (productImagesRes.data || []).map((img, index) => {
        const categoryId = img.products?.category_id || null
        const categoryName = img.products?.product_categories?.category_name
        return {
          id: `product-${img.image_id}`,
          src: toStorageUrl('product-images', img.image_url),
          alt: img.image_alt_text || img.products?.product_name || 'Product image',
          title: img.products?.product_name ? `Product: ${img.products.product_name}` : 'Product Image',
          type: 'product',
          categoryId,
          categoryName,
          order: img.is_primary ? index : index + 2000
        }
      }).filter((img) => img.src)

      const combinedImages = [...categoryImages, ...productImages]
        .sort((a, b) => a.order - b.order)

      setGalleryImages(combinedImages)
    } catch (err) {
      console.error('Error fetching gallery images:', err)
      setError(err.message || 'Failed to load gallery images')
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return galleryImages
    return galleryImages.filter((image) => image.categoryId === activeCategory)
  }, [activeCategory, galleryImages])

  const openLightbox = (image, index) => {
    if (!image) return
    setSelectedImage(image)
    setCurrentIndex(index)
  }

  const handleNext = () => {
    if (!filteredImages.length) return
    const nextIndex = (currentIndex + 1) % filteredImages.length
    setCurrentIndex(nextIndex)
    setSelectedImage(filteredImages[nextIndex])
  }

  const handlePrev = () => {
    if (!filteredImages.length) return
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length
    setCurrentIndex(prevIndex)
    setSelectedImage(filteredImages[prevIndex])
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedImage) return

      if (e.key === 'Escape') {
        setSelectedImage(null)
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedImage, currentIndex, filteredImages])

  useEffect(() => {
    setCurrentIndex(0)
    if (selectedImage && !filteredImages.some((img) => img.id === selectedImage.id)) {
      setSelectedImage(null)
    }
  }, [activeCategory, filteredImages, selectedImage])

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.25
  })

  const heroContainerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  }

  const heroChildVariants = {
    hidden: { opacity: 0, y: 24, skewY: 4 },
    visible: {
      opacity: 1,
      y: 0,
      skewY: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const heroLineVariants = {
    hidden: { opacity: 0, x: -36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <div className="gallery-page">
      <SEO
        title={pageSeo.gallery.title}
        description={pageSeo.gallery.description}
        keywords={pageSeo.gallery.keywords}
      />
      <div className="gallery-hero">
        <div className="gallery-hero__media" role="presentation" />
        <div className="gallery-hero__overlay" aria-hidden="true" />
        <div className="gallery-hero__container container">
          <motion.div
            className="gallery-hero__content"
            ref={heroRef}
            variants={heroContainerVariants}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
          >
            <motion.div className="gallery-hero__eyebrow" variants={heroChildVariants}>
              {galleryPage.hero.eyebrow}
            </motion.div>
            <motion.h1 className="gallery-hero__title" variants={heroChildVariants}>
              <motion.span variants={heroLineVariants}>{galleryPage.hero.titleLine1}</motion.span>
              <motion.span variants={heroLineVariants}>{galleryPage.hero.titleLine2}</motion.span>
            </motion.h1>
            <motion.p className="gallery-hero__subtitle" variants={heroChildVariants}>
              {galleryPage.hero.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="gallery-content">
        <div className="container">
          {loading ? (
            <div className="gallery-loading">
              <div className="gallery-spinner"></div>
              <p>{galleryPage.loading}</p>
            </div>
          ) : error ? (
            <div className="gallery-error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="gallery-empty">
              <i className="fas fa-images"></i>
              <p>{galleryPage.empty}</p>
            </div>
          ) : (
            <>
              <div className="gallery-filters" role="tablist" aria-label="Gallery categories">
                <button
                  type="button"
                  className={`gallery-filter ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                >
                  {galleryPage.filterAll}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.category_id}
                    type="button"
                    className={`gallery-filter ${activeCategory === category.category_id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category.category_id)}
                    role="tab"
                    aria-selected={activeCategory === category.category_id}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>

              <div className="gallery-grid" ref={ref}>
                <AnimatePresence>
                  {filteredImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      className="gallery-item"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => openLightbox(image, index)}
                    >
                      <div className="gallery-image">
                        <img src={image.src} alt={image.alt} loading="lazy" />
                        <div className="gallery-overlay">
                          <i className="fas fa-search-plus"></i>
                          <p>{image.title}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                <i className="fas fa-times"></i>
              </button>
              <button className="lightbox-nav lightbox-prev" onClick={handlePrev}>
                <i className="fas fa-chevron-left"></i>
              </button>
              <button className="lightbox-nav lightbox-next" onClick={handleNext}>
                <i className="fas fa-chevron-right"></i>
              </button>
              <img src={selectedImage.src} alt={selectedImage.alt} />
              <p className="lightbox-title">
                {selectedImage.title} ({currentIndex + 1} / {filteredImages.length})
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Gallery
