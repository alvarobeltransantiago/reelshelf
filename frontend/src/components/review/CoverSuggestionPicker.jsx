import Button from '../common/Button'
import Spinner from '../common/Spinner'
import './CoverSuggestionPicker.css'

function CoverSuggestionPicker({ suggestions, selectedUrl, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <div className="cover-suggestions">
        <Spinner label="Buscando portadas" />
      </div>
    )
  }

  if (!suggestions.length) {
    return (
      <div className="cover-suggestions">
        <p>No he encontrado portadas todavía. Puedes pegar una URL manual.</p>
      </div>
    )
  }

  return (
    <div className="cover-suggestions">
      <div className="cover-suggestions__header">
        <h2>Portadas sugeridas</h2>
        <p>Selecciona una o deja tu URL personalizada.</p>
      </div>

      <div className="cover-suggestions__grid">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className={`cover-suggestions__item ${selectedUrl === suggestion.coverUrl ? 'cover-suggestions__item--selected' : ''}`}
            onClick={() => onSelect(suggestion.coverUrl)}
          >
            <img src={suggestion.coverUrl} alt={`Sugerencia para ${suggestion.title}`} loading="lazy" />
            <div>
              <strong>{suggestion.title}</strong>
              {suggestion.subtitle ? <span>{suggestion.subtitle}</span> : null}
            </div>
          </button>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={() => onSelect('')}>
        Limpiar portada elegida
      </Button>
    </div>
  )
}

export default CoverSuggestionPicker
