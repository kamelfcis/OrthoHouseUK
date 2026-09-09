import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parseFaqAnswer } from '../../utils/parseFaqAnswer'

const CONTACT_PAGE_PATTERN = /Contact page/i

const labelFromImageUrl = (url) => {
  if (!url) return 'View illustration'
  try {
    const path = url.includes('://') ? new URL(url).pathname : url.split('?')[0]
    const base = path.split('/').filter(Boolean).pop() || ''
    const withoutExt = base.replace(/\.[a-z0-9]+$/i, '')
    const words = withoutExt
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
    if (!words) return 'View illustration'
    return words.charAt(0).toUpperCase() + words.slice(1)
  } catch {
    return 'View illustration'
  }
}

const renderInlineText = (text) => {
  if (!text) return null
  if (CONTACT_PAGE_PATTERN.test(text)) {
    const parts = text.split(CONTACT_PAGE_PATTERN)
    return (
      <>
        {parts[0]}
        <Link to="/contact" className="faqs-answer__link">
          Contact page
        </Link>
        {parts[1] || ''}
      </>
    )
  }
  return text
}

const FaqAnswerContent = ({ answer, imageUrl, imageTitle }) => {
  const blocks = useMemo(() => parseFaqAnswer(answer), [answer])
  const mediaLabel = useMemo(() => labelFromImageUrl(imageUrl), [imageUrl])

  return (
    <div className="faqs-answer">
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p key={index} className="faqs-answer__paragraph">
              {renderInlineText(block.text)}
            </p>
          )
        }

        if (block.type === 'note') {
          return (
            <p key={index} className="faqs-answer__note">
              {renderInlineText(block.text)}
            </p>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="faqs-answer__list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {item.label ? (
                    <>
                      <strong>{item.label}</strong>
                      {': '}
                      {renderInlineText(item.text)}
                    </>
                  ) : (
                    renderInlineText(item.text)
                  )}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'sources') {
          return (
            <aside key={index} className="faqs-answer__sources" aria-label="References">
              <span className="faqs-answer__sources-label">{block.heading}</span>
              <ul>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </aside>
          )
        }

        return null
      })}

      {imageUrl ? (
        <a
          className="faqs-answer__media-link"
          href={`/faqs/media?src=${encodeURIComponent(imageUrl)}&title=${encodeURIComponent(imageTitle || '')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fas fa-up-right-from-square" aria-hidden="true" />
          <span>{mediaLabel}</span>
        </a>
      ) : null}
    </div>
  )
}

export default FaqAnswerContent
