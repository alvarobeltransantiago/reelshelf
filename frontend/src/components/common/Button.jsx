import './Button.css'

function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${fullWidth ? 'button--full-width' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className="button__content">{children}</span>
      {loading ? <span className="button__loader" aria-hidden="true" /> : null}
    </button>
  )
}

export default Button
