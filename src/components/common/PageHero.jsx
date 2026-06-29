const PageHero = ({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
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
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="ds-page-hero__breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, i) => (
                <li key={i}>
                  {crumb.href ? (
                    <a href={crumb.href}>{crumb.label}</a>
                  ) : (
                    <span aria-current="page">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </header>
  )
}

export default PageHero
