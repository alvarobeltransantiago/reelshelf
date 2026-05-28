import { Helmet } from 'react-helmet-async'
import { useDeferredValue, useEffect, useRef, useState, startTransition } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'

import { getMyLibrary, updateMyTopReviews } from '../api/users'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import TutorialSpotlight from '../components/common/TutorialSpotlight'
import ReviewCard from '../components/review/ReviewCard'
import TopShelfPanel from '../components/review/TopShelfPanel'
import { CATEGORY_TABS } from '../utils/reviewOptions'
import heroImage from '../assets/hero-library-table.png'
import './Home.css'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguas' },
  { value: 'rating_desc', label: 'Mejor nota' },
  { value: 'rating_asc', label: 'Menor nota' },
  { value: 'title_asc', label: 'Título A-Z' },
  { value: 'author_asc', label: 'Autor A-Z' },
  { value: 'top_rank', label: 'Top 10 primero' },
]

const SEARCH_FIELD_OPTIONS = [
  { value: 'all', label: 'Todo' },
  { value: 'title', label: 'Título' },
  { value: 'author', label: 'Autor' },
  { value: 'rating', label: 'Nota' },
]

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
  const gridRef = useRef(null)
  const topShelfRef = useRef(null)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'game',
    q: searchParams.get('q') || '',
    searchField: searchParams.get('searchField') || 'all',
    sort: searchParams.get('sort') || 'newest',
    minRating: searchParams.get('minRating') || '',
    page: Number(searchParams.get('page') || 1),
  })
  const deferredFilters = useDeferredValue(filters)

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || 'game',
      q: searchParams.get('q') || '',
      searchField: searchParams.get('searchField') || 'all',
      sort: searchParams.get('sort') || 'newest',
      minRating: searchParams.get('minRating') || '',
      page: Number(searchParams.get('page') || 1),
    })
  }, [searchParams])

  const libraryQuery = useQuery({
    queryKey: ['my-library', deferredFilters],
    queryFn: () => getMyLibrary(deferredFilters),
    enabled: isAuthenticated,
  })

  const rankingMutation = useMutation({
    mutationFn: updateMyTopReviews,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-library'] })
    },
  })

  function updateFilters(nextFilters) {
    startTransition(() => {
      setFilters(nextFilters)

      const params = new URLSearchParams()
      Object.entries(nextFilters).forEach(([key, value]) => {
        const isDefaultSearchField = key === 'searchField' && value === 'all'
        const isDefaultSort = key === 'sort' && value === 'newest'

        if (value && !(key === 'page' && value === 1) && !isDefaultSearchField && !isDefaultSort) {
          params.set(key, String(value))
        }
      })

      setSearchParams(params)
    })
  }

  function handleToggleTopReview(reviewId) {
    const topReviews = libraryQuery.data?.data.topReviews || []
    const isAlreadyIncluded = topReviews.some((review) => review.id === reviewId)
    const nextIds = isAlreadyIncluded
      ? topReviews.filter((review) => review.id !== reviewId).map((review) => review.id)
      : [...topReviews.map((review) => review.id), reviewId].slice(0, 10)

    rankingMutation.mutate(nextIds)
  }

  function handleMoveTopReview(draggedId, targetId) {
    const topReviews = libraryQuery.data?.data.topReviews || []
    const nextOrder = moveReviewInList(topReviews, draggedId, targetId).map((review) => review.id)
    rankingMutation.mutate(nextOrder)
  }

  function handleRemoveTopReview(reviewId) {
    const topReviews = libraryQuery.data?.data.topReviews || []
    rankingMutation.mutate(topReviews.filter((review) => review.id !== reviewId).map((review) => review.id))
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
  const activeFilterCount = [filters.q, filters.minRating, filters.sort !== 'newest', filters.searchField !== 'all'].filter(Boolean).length
  const tutorialSteps = [
    {
      targetRef: heroRef,
      title: 'Tu biblioteca empieza aquí',
      description: 'Desde esta cabecera entiendes el tono general de tu archivo personal.',
    },
    {
      targetRef: tabsRef,
      title: 'Pestañas por universo',
      description: 'Cada pestaña separa videojuegos, películas, series y libros.',
    },
    {
      targetRef: gridRef,
      title: 'Reseñas compactas',
      description: 'Aquí ves tus fichas más recientes con acceso directo a la reseña completa y al Top 10.',
    },
    {
      targetRef: topShelfRef,
      title: 'Top 10 editable',
      description: 'Mueve, reordena y limpia tus favoritos hasta que el ranking se sienta verdaderamente tuyo.',
    },
  ]

  return (
    <section className="home home--library">
      <Helmet>
        <title>Mi biblioteca | Reelshelf</title>
      </Helmet>

      <TutorialSpotlight enabled={isAuthenticated} steps={tutorialSteps} />

      <div ref={heroRef} className="home__hero home__hero--library">
        <h1>Una estantería personal</h1>
      </div>

      <div ref={tabsRef} className="home__tabs" role="tablist" aria-label="Categorías de biblioteca">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`home__tab ${filters.category === tab.value ? 'home__tab--active' : ''}`}
            onClick={() => updateFilters({ ...filters, category: tab.value, page: 1 })}
          >
            <span>{tab.label}</span>
            <strong>{counts[tab.value]}</strong>
          </button>
        ))}
      </div>

      <div className="home__library-layout">
        <div className="home__library-main">
          <section className="home__control-deck" aria-label="Filtros de biblioteca">
            <div className="home__control-copy">
              <h2>{activeCategory?.label}</h2>
              <span>{libraryQuery.data.meta.total} {libraryQuery.data.meta.total === 1 ? 'resultado' : 'resultados'}</span>
            </div>

            <div className="home__control-grid">
              <label className="home__field home__field--search">
                <span>Buscar</span>
                <input
                  type="search"
                  value={filters.q}
                  placeholder="Título, autor o nota"
                  onChange={(event) => updateFilters({ ...filters, q: event.target.value, page: 1 })}
                />
              </label>

              <label className="home__field">
                <span>Campo</span>
                <select
                  value={filters.searchField}
                  onChange={(event) => updateFilters({ ...filters, searchField: event.target.value, page: 1 })}
                >
                  {SEARCH_FIELD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="home__field">
                <span>Orden</span>
                <select value={filters.sort} onChange={(event) => updateFilters({ ...filters, sort: event.target.value, page: 1 })}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="home__field">
                <span>Nota</span>
                <select
                  value={filters.minRating}
                  onChange={(event) => updateFilters({ ...filters, minRating: event.target.value, page: 1 })}
                >
                  <option value="">Todas</option>
                  {[10, 9, 8, 7, 6, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}+
                    </option>
                  ))}
                </select>
              </label>

              <Button
                variant="secondary"
                className="home__clear-button"
                disabled={!activeFilterCount}
                onClick={() =>
                  updateFilters({
                    ...filters,
                    q: '',
                    searchField: 'all',
                    sort: 'newest',
                    minRating: '',
                    page: 1,
                  })
                }
              >
                Limpiar
              </Button>
            </div>
          </section>

          <div ref={gridRef}>
            {reviews.length ? (
              <div className="home__grid">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showTopControls
                    isTopReview={topReviews.some((item) => item.id === review.id)}
                    onToggleTopReview={handleToggleTopReview}
                  />
                ))}
              </div>
            ) : (
              <p className="home__state">Todavía no tienes entradas en esta pestaña. Crea una reseña y empezamos a poblarla.</p>
            )}
          </div>

          <div className="home__pagination">
            <Button
              variant="secondary"
              disabled={libraryQuery.data.meta.page <= 1}
              onClick={() => updateFilters({ ...filters, page: filters.page - 1 })}
            >
              Anterior
            </Button>
            <span>
              Página {libraryQuery.data.meta.page} de {libraryQuery.data.meta.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={libraryQuery.data.meta.page >= libraryQuery.data.meta.totalPages}
              onClick={() => updateFilters({ ...filters, page: filters.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div ref={topShelfRef}>
          <TopShelfPanel
            reviews={topReviews}
            isSaving={rankingMutation.isPending}
            onMove={handleMoveTopReview}
            onRemove={handleRemoveTopReview}
          />
        </div>
      </div>
    </section>
  )
}

export default PublicHome
