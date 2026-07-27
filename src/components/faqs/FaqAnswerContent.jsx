import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { parseFaqAnswer } from '../../utils/parseFaqAnswer'

const TEAM_PAGE_PATTERN = /Meet the Team page/i

const renderInlineText = (text) => {
  if (!text) return null
  if (TEAM_PAGE_PATTERN.test(text)) {
    const parts = text.split(TEAM_PAGE_PATTERN)
    return (
      <>
        {parts[0]}
        <Link to="/team" className="faqs-answer__link">
          Meet the Team page
        </Link>
        {parts[1] || ''}
      </>
    )
  }
  return text
}

const FaqAnswerContent = ({ answer, imageUrl }) => {
  const blocks = useMemo(() => parseFaqAnswer(answer), [answer])

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
        <figure className="faqs-answer__figure">
          <img src={imageUrl} alt="" loading="lazy" decoding="async" />
        </figure>
      ) : null}
    </div>
  )
}

export default FaqAnswerContent
