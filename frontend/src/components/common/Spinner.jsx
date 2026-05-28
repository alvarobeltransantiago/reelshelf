import './Spinner.css'

function Spinner({ label = 'Cargando contenido' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__circle" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  )
}

export default Spinner
