import { Link } from 'react-router-dom'

import Badge from '../common/Badge'
import Button from '../common/Button'
import { formatDate } from '../../utils/formatDate'
import { truncate } from '../../utils/truncate'
import { getCategoryLabel } from '../../utils/reviewOptions'
import './ReviewCard.css'

function ReviewCard({ review, onToggleTopReview, isTopReview = false, showTopControls = false }) {
  function handleImageError(event) {
    event.currentTarget.style.display = 'none'
    event.currentTarget.nextElementSibling.hidden = false
  }

  return (
    <article className="review-card">
      <Link to={`/review/${review.id}`} className="review-card__cover-wrapper" aria-label={`Abrir ${review.title}`}>
        {review.cover_url ? (
          <img
            className="review-card__cover"
            src={review.cover_url}
            alt={`Portada de ${review.title}`}
            loading="lazy"
            onError={handleImageError}
          />
        ) : null}
        <div className="review-card__fallback" hidden={Boolean(review.cover_url)}>
          {getCategoryLabel(review.category)}
        </div>
      </Link>

      <div className="review-card__content">
        <div className="review-card__meta">
          <Badge tone="accent">{getCategoryLabel(review.category)}</Badge>
          <span>{review.rating}/10</span>
        </div>

        <div className="review-card__heading">
          <div className="review-card__title-row">
            <h3>
              <Link to={`/review/${review.id}`}>{review.title}</Link>
            </h3>
            {review.top_rank ? <Badge>Top {review.top_rank}</Badge> : null}
          </div>
          <strong className="review-card__author">{review.author}</strong>
          <p>{truncate(review.body, 120)}</p>
        </div>

        <div className="review-card__footer">
          <time dateTime={review.created_at}>{formatDate(review.created_at)}</time>

          <div className="review-card__actions">
            <Link className="review-card__link" to={`/review/${review.id}`}>
              Ver reseña
            </Link>
            {showTopControls && !isTopReview ? (
              <Button type="button" variant="ghost" onClick={() => onToggleTopReview?.(review.id)}>
                Top 10
              </Button>
            ) : null}
            {showTopControls && isTopReview ? <span className="review-card__top-state">En Top 10</span> : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default ReviewCard
