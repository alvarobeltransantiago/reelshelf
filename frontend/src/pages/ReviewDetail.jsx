import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

import { deleteReview, getReview, updateReview } from '../api/reviews'
import useAuthStore from '../store/authStore'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import { formatDate } from '../utils/formatDate'
import { formatAspectLabel, getCategoryLabel } from '../utils/reviewOptions'
import './ReviewDetail.css'

function ReviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['review-detail', id],
    queryFn: () => getReview(id),
  })

  const favoriteMutation = useMutation({
    mutationFn: (nextFavorite) => updateReview(id, { is_favorite: nextFavorite }),
    onSuccess(updatedReview) {
      queryClient.setQueryData(['review-detail', id], updatedReview)
      queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteReview(id),
    onSuccess() {
      navigate('/library')
    },
  })

  if (isLoading) {
    return <Spinner label="Cargando reseña" />
  }

  if (isError) {
    return <p className="review-detail__state">Error cargando la reseña: {error.message}</p>
  }

  const isOwner = currentUser?.id === data.user_id
  const isFavorite = favoriteMutation.data?.is_favorite ?? data.is_favorite

  return (
    <article className="review-detail">
      <Helmet>
        <title>{data.title} | Reelshelf</title>
      </Helmet>

      <section className="review-detail__layout">
        <aside className="review-detail__media">
          {data.cover_url ? (
            <img src={data.cover_url} alt={`Portada de ${data.title}`} loading="lazy" />
          ) : (
            <div className="review-detail__fallback">{getCategoryLabel(data.category)}</div>
          )}
        </aside>

        <div className="review-detail__content">
          <header className="review-detail__header-copy">
            <div className="review-detail__meta">
              <Badge tone="accent">{getCategoryLabel(data.category)}</Badge>
              <span>{data.rating}/10</span>
              {isFavorite ? (
                <Badge tone="favorite" aria-label="Favorita" title="Favorita">
                  ♥
                </Badge>
              ) : null}
              {data.top_rank ? <Badge>Top {data.top_rank}</Badge> : null}
              {data.status === 'draft' ? <Badge>Borrador</Badge> : null}
            </div>

            <h1>{data.title}</h1>
            <p className="review-detail__author">{data.author}</p>
            <p className="review-detail__saved-by">
              Guardada por <Link to={`/u/${data.username}`}>{data.username}</Link> · {formatDate(data.created_at)}
            </p>

            {isOwner ? (
              <div className="review-detail__actions">
                <Button variant="secondary" onClick={() => navigate(`/review/${id}/edit`)}>
                  Editar
                </Button>
                <Button variant="secondary" loading={favoriteMutation.isPending} onClick={() => favoriteMutation.mutate(!isFavorite)}>
                  {isFavorite ? 'Quitar favorita' : 'Marcar favorita'}
                </Button>
                <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                  Eliminar
                </Button>
              </div>
            ) : null}
          </header>

          {data.aspect_ratings && Object.keys(data.aspect_ratings).length ? (
            <section className="review-detail__aspects">
              {Object.entries(data.aspect_ratings).map(([key, value]) => (
                <div key={key} className="review-detail__aspect">
                  <span>{formatAspectLabel(key)}</span>
                  <strong>{value}/10</strong>
                </div>
              ))}
            </section>
          ) : null}

          {data.tags?.length ? (
            <div className="review-detail__tags">
              {data.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}

          <div className="review-detail__body">
            <ReactMarkdown>{data.body}</ReactMarkdown>
          </div>
        </div>
      </section>

      <Modal open={isDeleteOpen} title="Eliminar reseña" onClose={() => setIsDeleteOpen(false)}>
        <p>Esta acción no se puede deshacer.</p>
        <div className="review-detail__modal-actions">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Confirmar eliminación
          </Button>
        </div>
      </Modal>
    </article>
  )
}

export default ReviewDetail
