const SectionSkeleton = ({ minHeight = 260, blocks = 2 }) => (
  <div
    className="section-skeleton"
    style={{ minHeight }}
    role="status"
    aria-busy="true"
    aria-label="Loading section"
  >
    <div className="ds-skeleton-row">
      <div className="ds-skeleton-row__line ds-skeleton-row__line--short" />
      <div className="ds-skeleton-row__line ds-skeleton-row__line--title" />
      <div className="ds-skeleton-row__line ds-skeleton-row__line--medium" />
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className="ds-skeleton-row__block" />
      ))}
    </div>
    <span className="sr-only">Loading…</span>
  </div>
)

export default SectionSkeleton
