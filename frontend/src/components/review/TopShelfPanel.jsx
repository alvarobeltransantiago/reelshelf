import './TopShelfPanel.css'

function TopShelfPanel({ title = 'Favoritos', reviews, isSaving, onMove, onRemove }) {
  return (
    <aside className="top-shelf">
      <div className="top-shelf__header">
        <p>Top 10</p>
        <h2>{title}</h2>
      </div>

      {reviews.length ? (
        <ol className="top-shelf__list">
          {reviews.map((review, index) => (
            <li
              key={review.id}
              className="top-shelf__item"
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', review.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const draggedId = event.dataTransfer.getData('text/plain')
                if (draggedId && draggedId !== review.id) {
                  onMove(draggedId, review.id)
                }
              }}
            >
              <div className="top-shelf__rank">{index + 1}</div>
              <div className="top-shelf__thumb">
                {review.cover_url ? <img src={review.cover_url} alt={`Portada de ${review.title}`} loading="lazy" /> : <span>{review.rating}/10</span>}
              </div>
              <div className="top-shelf__copy">
                <strong>{review.title}</strong>
                <span>{review.rating}/10</span>
              </div>
              <div className="top-shelf__controls">
                <button type="button" aria-label="Subir" disabled={index === 0 || isSaving} onClick={() => onMove(review.id, reviews[index - 1]?.id)}>
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Bajar"
                  disabled={index === reviews.length - 1 || isSaving}
                  onClick={() => onMove(review.id, reviews[index + 1]?.id)}
                >
                  ↓
                </button>
                <button type="button" aria-label="Quitar del Top 10" disabled={isSaving} onClick={() => onRemove(review.id)}>
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="top-shelf__empty">Tu Top 10 esta vacio. Anade titulos desde la biblioteca.</p>
      )}
    </aside>
  )
}

export default TopShelfPanel
