const PageHero = ({
  eyebrow,
  title,
  subtitle,
  className = ''
}) => {
  const titleLines = Array.isArray(title) ? title : [title]

  return (
    <header className={`ds-page-hero ${className}`.trim()}>
      <div className="container">
        {eyebrow && <span className="ds-page-hero__eyebrow">{eyebrow}</span>}
        <h1>
          {titleLines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </h1>
        {subtitle && <p className="ds-page-hero__subtitle">{subtitle}</p>}
      </div>
    </header>
  )
}

export default PageHero
