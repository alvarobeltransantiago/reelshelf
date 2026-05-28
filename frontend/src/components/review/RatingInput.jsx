import './RatingInput.css'

function RatingInput({ label = 'Valoracion', value, onChange, error }) {
  return (
    <div className="rating-input">
      <div className="rating-input__header">
        <span>{label}</span>
        <strong>{value}/10</strong>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`Seleccionar valoracion para ${label}`}
      />
      {error ? <span className="rating-input__error">{error}</span> : null}
    </div>
  )
}

export default RatingInput
