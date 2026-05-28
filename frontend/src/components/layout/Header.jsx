import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import useAuthStore from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { logoutUser } from '../../api/auth'
import Button from '../common/Button'
import logoUrl from '../../assets/logo.svg'
import './Header.css'

function Header() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const { isDark, toggleTheme } = useTheme()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await logoutUser()
      clearSession()
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextParams = new URLSearchParams()

    if (query.trim()) {
      nextParams.set('q', query.trim())
    }

    navigate(`/library?${nextParams.toString()}`)
  }

  return (
    <header className="site-header">
      <div className={`site-header__inner ${user ? '' : 'site-header__inner--guest'}`}>
        <Link to="/" className="site-header__brand" aria-label="Ir al inicio de Reelshelf">
          <span className="site-header__mark">
            <img src={logoUrl} alt="" aria-hidden="true" />
          </span>
          <strong>Reelshelf</strong>
        </Link>

        {user ? (
          <form className="site-header__search" onSubmit={handleSubmit}>
            <input
              type="search"
              placeholder="Buscar por título"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar reseñas por título"
            />
          </form>
        ) : null}

        <div className="site-header__actions">
          <Button variant="ghost" onClick={toggleTheme}>
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </Button>

          {user ? (
            <div className="site-header__user">
              <Link to="/library">Biblioteca</Link>
              <Link to={`/u/${user.username}`} className="site-header__avatar" aria-label="Ver perfil">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={`Avatar de ${user.username}`} loading="lazy" />
                ) : (
                  (user.username || 'R').slice(0, 1).toUpperCase()
                )}
              </Link>
              <Link to="/review/new">Nueva reseña</Link>
              <Link to="/settings">Ajustes</Link>
              <Button variant="secondary" loading={isLoggingOut} onClick={handleLogout}>
                Salir
              </Button>
            </div>
          ) : (
            <div className="site-header__guest">
              <Link to="/login">Entrar</Link>
              <Link to="/register">Crear cuenta</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
