import { Link } from 'react-router-dom'
import { toOriginalStorageUrl } from '../../lib/storageUrl'
import './FeaturedCategoryProduct.css'

const FeaturedCategoryProduct = ({ id, name, category, partner, image }) => {
  const handleImageError = (e) => {
    const img = e.currentTarget
    // If the resized rendition failed, retry the original once.
    const original = toOriginalStorageUrl(img.src)
    if (original) {
      img.src = original
      return
    }
    img.onerror = null
    img.style.display = 'none'
    const placeholder = img.parentElement?.querySelector(
      '.featured-category-product__placeholder'
    )
    if (placeholder) placeholder.style.display = 'flex'
  }

  return (
    <article className="featured-category-product">
      <div className="featured-category-product__frame" aria-hidden="true" />
      <div className="featured-category-product__media">
        {image && (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
          />
        )}
        <div
          className="featured-category-product__placeholder"
          aria-hidden="true"
          style={{ display: image ? 'none' : 'flex' }}
        >
          <i className="fas fa-box-medical" />
        </div>
        <span className="featured-category-product__scanline" aria-hidden="true" />
      </div>
      <div className="featured-category-product__body">
        <span className="featured-category-product__label">Featured</span>
        {category && (
          <span className="featured-category-product__category">{category}</span>
        )}
        <h2 className="featured-category-product__name">{name}</h2>
        {partner && (
          <p className="featured-category-product__partner">{partner}</p>
        )}
        <Link to={`/products/${id}`} className="ds-btn ds-btn--primary featured-category-product__cta">
          View product
          <i className="fas fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}

export default FeaturedCategoryProduct
