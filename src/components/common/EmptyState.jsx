const EmptyState = ({
  icon = 'fa-inbox',
  title = 'Nothing here yet',
  message,
  action
}) => (
  <div className="ds-empty-state" role="status">
    {icon && (
      <div className="ds-empty-state__icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </div>
    )}
    <h2 className="ds-empty-state__title">{title}</h2>
    {message && <p className="ds-empty-state__message">{message}</p>}
    {action}
  </div>
)

export default EmptyState
