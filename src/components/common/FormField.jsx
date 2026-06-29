const FormField = ({
  id,
  label,
  required = false,
  error,
  children,
  className = ''
}) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div
      className={`ds-form-field${error ? ' is-error' : ''} ${className}`.trim()}
    >
      {label && (
        <label className="ds-label" htmlFor={fieldId}>
          {label}
          {required && (
            <span className="sr-only"> (required)</span>
          )}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error && (
        <p id={errorId} className="ds-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
