import { useState } from 'react'

import './TopShelfPanel.css'

function TopShelfPanel({ title = 'Favoritos', reviews, onMove }) {
  const [liveMessage, setLiveMessage] = useState('')

  function moveReview(review, targetReview) {
    if (!review || !targetReview || review.id === targetReview.id) {
      return
    }

    const targetIndex = reviews.findIndex((item) => item.id === targetReview.id)

    if (targetIndex >= 0) {
      setLiveMessage(`${review.title} movido a posición ${targetIndex + 1}.`)
    }

    onMove(review.id, targetReview.id)
  }

  return (
    <aside className="top-shelf">
      <div className="top-shelf__header">
        <p>Top 10</p>
        <h2>{title}</h2>
      </div>

      {reviews.length ? (
        <ol className="top-shelf__list" aria-describedby="top-shelf-help">
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
                const draggedReview = reviews.find((item) => item.id === draggedId)
                moveReview(draggedReview, review)
              }}
            >
              <div className="top-shelf__rank">{index + 1}</div>
              <div className="top-shelf__thumb">
                {review.cover_url ? (
                  <img src={review.cover_url} alt={`Portada de ${review.title}`} loading="lazy" decoding="async" />
                ) : (
                  <span>{review.rating}/10</span>
                )}
              </div>
              <div className="top-shelf__copy">
                <strong>{review.title}</strong>
                <span>{review.rating}/10</span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="top-shelf__empty">Tu Top 10 está vacío. Añade títulos desde la biblioteca.</p>
      )}

      <p id="top-shelf-help" className="top-shelf__assistive">
        Puedes reordenar el Top 10 arrastrando una obra sobre otra.
      </p>
      <p className="top-shelf__assistive" aria-live="polite">
        {liveMessage}
      </p>
    </aside>
  )
}

export default TopShelfPanel
