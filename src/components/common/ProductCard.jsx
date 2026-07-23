import { Link } from 'react-router-dom'
import { toOriginalStorageUrl } from '../../lib/storageUrl'
import './ProductCard.css'

const ProductCard = ({ id, name, category, partner, image, className = '' }) => {
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
      '.home-product-card__placeholder'
    )
    if (placeholder) placeholder.style.display = 'flex'
  }

  return (
    <Link
      to={`/products/${id}`}
      className={`home-product-card ds-card ds-card--interactive ${className}`.trim()}
      role="listitem"
    >
      <div className="home-product-card__media">
        {image && (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            width={320}
            height={240}
            onError={handleImageError}
          />
        )}
        <div
          className="home-product-card__placeholder"
          aria-hidden="true"
          style={{ display: image ? 'none' : 'flex' }}
        >
          <i className="fas fa-box-medical" />
        </div>
        {partner && (
          <span className="home-product-card__badge">{partner}</span>
        )}
      </div>
      <div className="home-product-card__body">
        {category && (
          <span className="home-product-card__category">{category}</span>
        )}
        <h3 className="home-product-card__name">{name}</h3>
      </div>
    </Link>
  )
}

export default ProductCard
