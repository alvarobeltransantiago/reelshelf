import { Helmet } from 'react-helmet-async'
import { useEffect, useRef, useState, startTransition } from 'react'
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

const LIBRARY_CLIENT_PAGE_SIZE = 9
const LIBRARY_FETCH_LIMIT = 500

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
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setFilters({
      category: searchParams.get('category') || 'game',
      sort: searchParams.get('sort') || 'newest',
      page: Number(searchParams.get('page') || 1),
    })
  }, [searchParams])

  const libraryQuery = useQuery({
    queryKey: ['my-library', filters.category, filters.sort],
    queryFn: () =>
      getMyLibrary({
        category: filters.category,
        sort: filters.sort,
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

  function updateFilters(nextFilters) {
    startTransition(() => {
      setFilters(nextFilters)

      const params = new URLSearchParams()
      Object.entries(nextFilters).forEach(([key, value]) => {
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

  function handleRemoveTopReview(reviewId) {
    const topReviews = (libraryQuery.data?.data.topReviews || []).filter((review) => review.category === filters.category)
    rankingMutation.mutate({
      category: filters.category,
      reviewIds: topReviews.filter((review) => review.id !== reviewId).map((review) => review.id),
    })
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
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredReviews = normalizedSearchTerm
    ? reviews.filter((review) => {
        const haystack = [review.title, review.author, review.body].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(normalizedSearchTerm)
      })
    : reviews
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
      description: 'Desde esta cabecera entiendes el tono general de tu archivo personal.',
    },
    {
      targetRef: tabsRef,
      title: 'Pestanas por universo',
      description: 'Cada pestana separa videojuegos, peliculas, series y libros.',
    },
    {
      targetRef: gridRef,
      title: 'Reseñas compactas',
      description: 'Aqui ves tus fichas con busqueda reactiva por titulo, autor y descripcion.',
    },
    {
      targetRef: topShelfRef,
      title: 'Top 10 por categoria',
      description: 'Cada categoria tiene su propio ranking editable y reordenable.',
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
          <section className="home__control-deck" aria-label="Buscador de biblioteca">
            <div className="home__control-copy">
              <h2>{activeCategory?.label}</h2>
              <span>{filteredReviews.length} {filteredReviews.length === 1 ? 'resultado' : 'resultados'}</span>
            </div>

            <div className="home__control-grid home__control-grid--simple">
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
            </div>
          </section>

          <div ref={gridRef}>
            {visibleReviews.length ? (
              <div className="home__grid">
                {visibleReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showTopControls
                    isTopReview={activeTopReviews.some((item) => item.id === review.id)}
                    onToggleTopReview={handleToggleTopReview}
                  />
                ))}
              </div>
            ) : (
              <p className="home__state">No hay resultados en esta categoria.</p>
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

        <div ref={topShelfRef}>
          <TopShelfPanel
            title={`Top 10 ${activeCategory?.label || ''}`}
            reviews={activeTopReviews}
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
