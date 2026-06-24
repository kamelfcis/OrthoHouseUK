const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  titleId,
  className = ''
}) => {
  const headClass = [
    'ds-section-head',
    align === 'left' ? 'is-left' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <header className={headClass}>
      {eyebrow && <span className="ds-eyebrow">{eyebrow}</span>}
      {title && (
        <h2 id={titleId} className="ds-section-title">
          {title}
        </h2>
      )}
      {subtitle && <p className="ds-section-subtitle">{subtitle}</p>}
    </header>
  )
}

export default SectionHeading
