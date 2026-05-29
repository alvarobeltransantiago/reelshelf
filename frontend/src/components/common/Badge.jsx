import './Badge.css'

function Badge({ children, tone = 'default', className = '', ...props }) {
  return (
    <span className={`badge badge--${tone} ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge
