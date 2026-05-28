import './Badge.css'

function Badge({ children, tone = 'default' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export default Badge
