const RouteLoader = ({ label = 'Loading page…' }) => (
  <div className="ds-route-loader" role="status" aria-live="polite" aria-busy="true">
    <div className="ds-route-loader__spinner" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
)

export default RouteLoader
