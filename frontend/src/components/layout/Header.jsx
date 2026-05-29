import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useAuthStore from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { logoutUser } from '../../api/auth'
import Button from '../common/Button'
import { getAvatarImage } from '../../utils/avatarPresets'
import logoUrl from '../../assets/logo.svg'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const { isDark, toggleTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const avatarImage = getAvatarImage(user?.avatar_url)

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
          <nav className="site-header__nav" aria-label="Navegacion principal">
            <Link to="/library">Biblioteca</Link>
            <Link to="/wishlist">Lista de deseos</Link>
          </nav>
        ) : null}

        <div className="site-header__actions">
          <Button
            variant="ghost"
            className="site-header__theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <span
              className={`site-header__theme-icon ${isDark ? 'site-header__theme-icon--sun' : 'site-header__theme-icon--moon'}`}
              aria-hidden="true"
            />
          </Button>

          {user ? (
            <div className="site-header__user">
              <Link to={`/u/${user.username}`} className="site-header__avatar" aria-label="Ver perfil">
                {avatarImage ? (
                  <img src={avatarImage} alt={`Avatar de ${user.username}`} loading="lazy" />
                ) : (
                  (user.username || 'R').slice(0, 1).toUpperCase()
                )}
              </Link>
              <Button
                variant="secondary"
                className="site-header__logout"
                loading={isLoggingOut}
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <span className="site-header__logout-icon" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="site-header__guest">
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
