import { Helmet } from 'react-helmet-async'
import { useEffect, useRef, useState, startTransition } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { getMyLibrary, updateMyTopReviews } from '../api/users'
import { updateReview } from '../api/reviews'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import TutorialSpotlight from '../components/common/TutorialSpotlight'
import ReviewCard from '../components/review/ReviewCard'
import TopShelfPanel from '../components/review/TopShelfPanel'
import { CATEGORY_TABS } from '../utils/reviewOptions'
import heroImage from '../assets/hero-library-table.png'
import './Home.css'

const LIBRARY_CLIENT_PAGE_SIZE = 9
const LIBRARY_FETCH_LIMIT = 500
const LIBRARY_SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'rating_desc', label: 'Mejor nota' },
  { value: 'rating_asc', label: 'Menor nota' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'author_asc', label: 'Autor A-Z' },
  { value: 'favorites_first', label: 'Favoritas primero' },
  { value: 'top_rank', label: 'Top 10 primero' },
]
const LIBRARY_SORT_VALUES = LIBRARY_SORT_OPTIONS.map((option) => option.value)

function getSafeSort(value) {
  return LIBRARY_SORT_VALUES.includes(value) ? value : 'newest'
}

function moveReviewInList(reviews, draggedId, targetId) {
  const nextReviews = [...reviews]
  const draggedIndex = nextReviews.findIndex((item) => item.id === draggedId)
  const targetIndex = nextReviews.findIndex((item) => item.id === targetId)

  if (draggedIndex === -1 || targetIndex === -1) {
    return reviews
  }

  const [draggedReview] = nextReviews.splice(draggedIndex, 1)
  nextReviews.splice(targetIndex, 0, draggedReview)
  return nextReviews
}

function scoreReminder(review, salt) {
  const input = `${review.id}-${salt}`
  let hash = 0

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 1000003
  }

  return hash
}

function compareText(firstValue = '', secondValue = '') {
  return firstValue.localeCompare(secondValue, 'es', { sensitivity: 'base' })
}

function compareDateDesc(firstValue, secondValue) {
  return new Date(secondValue).getTime() - new Date(firstValue).getTime()
}

function sortReviews(reviews, sort) {
  const nextReviews = [...reviews]

  return nextReviews.sort((firstReview, secondReview) => {
    if (sort === 'favorites_first') {
      const favoriteDifference = Number(secondReview.is_favorite) - Number(firstReview.is_favorite)

      if (favoriteDifference !== 0) {
        return favoriteDifference
      }

      return compareDateDesc(firstReview.created_at, secondReview.created_at)
    }

    if (sort === 'oldest') {
      return new Date(firstReview.created_at).getTime() - new Date(secondReview.created_at).getTime()
    }

    if (sort === 'rating_desc') {
      return secondReview.rating - firstReview.rating || compareDateDesc(firstReview.created_at, secondReview.created_at)
    }

    if (sort === 'rating_asc') {
      return firstReview.rating - secondReview.rating || compareDateDesc(firstReview.created_at, secondReview.created_at)
    }

    if (sort === 'title_asc') {
      return compareText(firstReview.title, secondReview.title) || compareDateDesc(firstReview.created_at, secondReview.created_at)
    }

    if (sort === 'author_asc') {
      return compareText(firstReview.author, secondReview.author) || compareText(firstReview.title, secondReview.title)
    }

    if (sort === 'top_rank') {
      return (firstReview.top_rank || 999) - (secondReview.top_rank || 999) || secondReview.rating - firstReview.rating
    }

    return compareDateDesc(firstReview.created_at, secondReview.created_at)
  })
}

function FavoriteReminderPanel({ reviews }) {
  return (
    <aside className="home__reminder-panel" aria-label="Favoritos para recordar">
      <div className="home__reminder-header">
        <p>Favoritos</p>
        <h2>Tampoco te olvides de...</h2>
      </div>

      {reviews.length ? (
        <ul className="home__reminder-list">
          {reviews.map((review) => (
            <li key={review.id} className="home__reminder-item">
              <Link to={`/review/${review.id}`}>
                <span className="home__reminder-heart" aria-hidden="true">
                  ♥
                </span>
                <span>{review.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="home__reminder-empty">Marca reseñas con corazón y aparecerán aquí como pequeños recordatorios.</p>
      )}
    </aside>
  )
}

function PublicHome() {
  const user = useAuthStore((state) => state.user)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const isAuthenticated = Boolean(user)

  if (isBootstrapping) {
    return <Spinner label="Recuperando tu sesión" />
  }

  return (
    <section className="home home--public">
      <Helmet>
        <title>Reelshelf | Biblioteca personal de reseñas</title>
      </Helmet>

      <div className="home__cinema" style={{ '--home-hero-image': `url(${heroImage})` }}>
        <div className="home__cinema-image" aria-hidden="true" />
        <div className="home__cinema-overlay" />

        <div className="home__cinema-copy">
          <p>Biblioteca personal de historias</p>
          <h1>Perderse en una gran historia también es una forma de encontrarse.</h1>
          <span>
            Reelshelf es tu archivo íntimo de reseñas: un lugar sereno para recordar qué obras te cambiaron, qué mundos
            te acompañaron y por qué merece la pena volver a ellos.
          </span>

          <div className="home__cinema-actions">
            {isAuthenticated ? (
              <Link className="home__cta home__cta--primary" to="/library">
                Ir a tu biblioteca
              </Link>
            ) : (
              <>
                <Link className="home__cta home__cta--primary" to="/register">
                  Crear mi biblioteca
                </Link>
                <Link className="home__cta home__cta--secondary" to="/login">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LibraryHome() {
  const user = useAuthStore((state) => state.user)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const isAuthenticated = Boolean(user)
  const heroRef = useRef(null)
  const tabsRef = useRef(null)
  const controlsRef = useRef(null)
  const gridRef = useRef(null)
  const topShelfRef = useRef(null)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'game',
    sort: getSafeSort(searchParams.get('sort')),
    page: Number(searchParams.get('page') || 1),
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState(() => window.localStorage.getItem('reelshelf-library-view') || 'cards')
  const [reminderSalt] = useState(() => `${Date.now()}-${Math.random()}`)

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || 'game',
      sort: getSafeSort(searchParams.get('sort')),
      page: Number(searchParams.get('page') || 1),
    })
  }, [searchParams])

  const libraryQuery = useQuery({
    queryKey: ['my-library', filters.category],
    queryFn: () =>
      getMyLibrary({
        category: filters.category,
        page: 1,
        limit: LIBRARY_FETCH_LIMIT,
      }),
    enabled: isAuthenticated,
  })

  const rankingMutation = useMutation({
    mutationFn: ({ category, reviewIds }) => updateMyTopReviews(category, reviewIds),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: (review) => updateReview(review.id, { is_favorite: !review.is_favorite }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-library'] })
      queryClient.invalidateQueries({ queryKey: ['review-detail'] })
    },
  })

  function updateFilters(nextFilters) {
    startTransition(() => {
      const safeFilters = {
        ...nextFilters,
        sort: getSafeSort(nextFilters.sort),
      }

      setFilters(safeFilters)

      const params = new URLSearchParams()
      Object.entries(safeFilters).forEach(([key, value]) => {
        const isDefaultSort = key === 'sort' && value === 'newest'

        if (value && key !== 'page' && !isDefaultSort) {
          params.set(key, String(value))
        }
      })

      if (params.toString() !== searchParams.toString()) {
        setSearchParams(params)
      }
    })
  }

  function handleToggleTopReview(reviewId) {
    const topReviews = (libraryQuery.data?.data.topReviews || []).filter((review) => review.category === filters.category)
    const isAlreadyIncluded = topReviews.some((review) => review.id === reviewId)
    const nextIds = isAlreadyIncluded
      ? topReviews.filter((review) => review.id !== reviewId).map((review) => review.id)
      : [...topReviews.map((review) => review.id), reviewId].slice(0, 10)

    rankingMutation.mutate({ category: filters.category, reviewIds: nextIds })
  }

  function handleMoveTopReview(draggedId, targetId) {
    const topReviews = (libraryQuery.data?.data.topReviews || []).filter((review) => review.category === filters.category)
    const nextOrder = moveReviewInList(topReviews, draggedId, targetId).map((review) => review.id)
    rankingMutation.mutate({ category: filters.category, reviewIds: nextOrder })
  }

  function handleViewModeChange(nextViewMode) {
    setViewMode(nextViewMode)
    window.localStorage.setItem('reelshelf-library-view', nextViewMode)
  }

  if (isBootstrapping) {
    return <Spinner label="Recuperando tu sesión" />
  }

  if (libraryQuery.isLoading) {
    return <Spinner label="Cargando tu biblioteca" />
  }

  if (libraryQuery.isError) {
    return <p className="home__state">Error cargando tu biblioteca: {libraryQuery.error.message}</p>
  }

  const { reviews, topReviews, counts } = libraryQuery.data.data
  const activeCategory = CATEGORY_TABS.find((tab) => tab.value === filters.category)
  const activeTopReviews = topReviews.filter((review) => review.category === filters.category)
  const activeTopReviewIds = new Set(activeTopReviews.map((review) => review.id))
  const reminderReviews = reviews
    .filter((review) => review.is_favorite && !activeTopReviewIds.has(review.id))
    .sort((firstReview, secondReview) => scoreReminder(firstReview, reminderSalt) - scoreReminder(secondReview, reminderSalt))
    .slice(0, 5)
  const favoriteCount = reviews.filter((review) => review.is_favorite).length
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const searchedReviews = normalizedSearchTerm
    ? reviews.filter((review) => {
        const haystack = [review.title, review.author, review.body].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(normalizedSearchTerm)
      })
    : reviews
  const filteredReviews = sortReviews(searchedReviews, filters.sort)
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / LIBRARY_CLIENT_PAGE_SIZE))
  const currentPage = Math.min(filters.page, totalPages)
  const visibleReviews = filteredReviews.slice(
    (currentPage - 1) * LIBRARY_CLIENT_PAGE_SIZE,
    currentPage * LIBRARY_CLIENT_PAGE_SIZE
  )
  const tutorialSteps = [
    {
      targetRef: heroRef,
      title: 'Tu biblioteca empieza aqui',
      description: 'Desde esta cabecera creas reseñas y el navbar te deja activar música ambiente cuando quieras.',
    },
    {
      targetRef: tabsRef,
      title: 'Pestanas por universo',
      description: 'Cada pestana separa videojuegos, peliculas, series y libros.',
    },
    {
      targetRef: controlsRef,
      title: 'Buscar, ordenar y cambiar vista',
      description: 'Filtra por texto, ordena por nota, titulo, favoritas o Top 10, y alterna entre cards o lista compacta.',
    },
    {
      targetRef: gridRef,
      title: 'Cards con acciones rápidas',
      description: 'Desde cada card puedes marcar favoritos y anadir o quitar una obra del Top 10.',
    },
    {
      targetRef: topShelfRef,
      title: 'Ranking y recuerdos',
      description: 'El Top 10 se reordena arrastrando. Debajo aparecen favoritos aleatorios que no esten ya rankeados.',
    },
    {
      targetSelector: '.site-header__music-control',
      title: 'Musica ambiente',
      description: 'El icono musical abre un control con volumen, activar y apagar. La musica siempre empieza pausada.',
    },
  ]

  return (
    <section className="home home--library">
      <Helmet>
        <title>Mi biblioteca | Reelshelf</title>
      </Helmet>

      <TutorialSpotlight enabled={isAuthenticated} force={searchParams.get('tour') === '1'} steps={tutorialSteps} />

      <div ref={heroRef} className="home__hero home__hero--library">
        <h1>Una librería personal</h1>
        <Link className="home__new-review" to={`/review/new?category=${filters.category}`}>
          Nueva reseña
        </Link>
      </div>

      <div ref={tabsRef} className="home__tabs" role="tablist" aria-label="Categorias de biblioteca">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`home__tab ${filters.category === tab.value ? 'home__tab--active' : ''}`}
            onClick={() => {
              setSearchTerm('')
              updateFilters({ ...filters, category: tab.value, page: 1 })
            }}
          >
            <span>{tab.label}</span>
            <strong>{counts[tab.value]}</strong>
          </button>
        ))}
      </div>

      <div className="home__library-layout">
        <div className="home__library-main">
          <section ref={controlsRef} className="home__control-deck" aria-label="Buscador de biblioteca">
            <div className="home__control-copy">
              <h2>{activeCategory?.label}</h2>
              <span>
                {filteredReviews.length} {filteredReviews.length === 1 ? 'resultado' : 'resultados'} · {favoriteCount}{' '}
                {favoriteCount === 1 ? 'favorita' : 'favoritas'}
              </span>
            </div>

            <div className="home__control-grid home__control-grid--with-sort">
              <label className="home__field home__field--search">
                <span>Buscar</span>
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Título, autor o descripción"
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    setFilters((current) => ({ ...current, page: 1 }))
                  }}
                />
              </label>
              <label className="home__field">
                <span>Ordenar</span>
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilters({ ...filters, sort: event.target.value, page: 1 })}
                >
                  {LIBRARY_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="home__view-switch" aria-label="Vista de biblioteca">
                <button
                  type="button"
                  className={viewMode === 'cards' ? 'home__view-switch-button--active' : ''}
                  aria-label="Vista de cards"
                  title="Vista de cards"
                  onClick={() => handleViewModeChange('cards')}
                >
                  <span className="home__view-icon home__view-icon--cards" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'home__view-switch-button--active' : ''}
                  aria-label="Vista de lista"
                  title="Vista de lista"
                  onClick={() => handleViewModeChange('list')}
                >
                  <span className="home__view-icon home__view-icon--list" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              </div>
            </div>
          </section>

          <div ref={gridRef}>
            {visibleReviews.length ? (
              <div className={`home__grid home__grid--${viewMode}`}>
                {visibleReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    variant={viewMode === 'list' ? 'list' : 'card'}
                    showTopControls
                    isTopReview={activeTopReviews.some((item) => item.id === review.id)}
                    onToggleFavorite={favoriteMutation.mutate}
                    onToggleTopReview={handleToggleTopReview}
                  />
                ))}
              </div>
            ) : (
              <div className="home__empty-state">
                <div className="home__empty-illustration" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <h2>{normalizedSearchTerm ? 'No aparece nada en esta estantería' : 'Esta categoría todavía está esperando su primera obra'}</h2>
                <p>
                  {normalizedSearchTerm
                    ? 'Prueba con otro título, autor o fragmento de la reseña.'
                    : 'Empieza con una reseña breve y ya tendrás algo que ordenar, marcar como favorito o subir al Top 10.'}
                </p>
                {!normalizedSearchTerm ? (
                  <Link className="home__new-review" to={`/review/new?category=${filters.category}`}>
                    Crear primera reseña
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <div className="home__pagination">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => updateFilters({ ...filters, page: filters.page - 1 })}
            >
              Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={currentPage >= totalPages}
              onClick={() => updateFilters({ ...filters, page: filters.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div ref={topShelfRef} className="home__side">
          <TopShelfPanel
            title={`Top 10 ${activeCategory?.label || ''}`}
            reviews={activeTopReviews}
            onMove={handleMoveTopReview}
          />
          <FavoriteReminderPanel reviews={reminderReviews} />
        </div>
      </div>
    </section>
  )
}

export default PublicHome
