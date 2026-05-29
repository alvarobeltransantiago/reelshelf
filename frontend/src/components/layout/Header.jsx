import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import useAuthStore from '../../store/authStore'
import useMusicStore from '../../store/musicStore'
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
  const isMusicPlaying = useMusicStore((state) => state.isPlaying)
  const musicVolume = useMusicStore((state) => state.volume)
  const setMusicVolume = useMusicStore((state) => state.setVolume)
  const toggleMusic = useMusicStore((state) => state.toggleMusic)
  const initializeMusicPreference = useMusicStore((state) => state.initializeMusicPreference)
  const { isDark, toggleTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMusicPanelOpen, setIsMusicPanelOpen] = useState(false)
  const musicControlRef = useRef(null)
  const avatarImage = getAvatarImage(user?.avatar_url)

  useEffect(() => {
    initializeMusicPreference()
  }, [initializeMusicPreference])

  useEffect(() => {
    if (!isMusicPanelOpen) {
      return undefined
    }

    function handlePointerDown(event) {
      if (musicControlRef.current && !musicControlRef.current.contains(event.target)) {
        setIsMusicPanelOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMusicPanelOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMusicPanelOpen])

  function handleMusicButtonClick() {
    setIsMusicPanelOpen((isOpen) => !isOpen)

    if (!isMusicPlaying) {
      toggleMusic()
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await logoutUser()
      clearSession()
      navigate('/login')
    } catch {
      return
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
          <div className="site-header__music-control" ref={musicControlRef}>
            <Button
              variant="ghost"
              className={`site-header__music-toggle ${isMusicPlaying ? 'site-header__music-toggle--active' : ''}`}
              onClick={handleMusicButtonClick}
              aria-label={isMusicPlaying ? 'Ajustar música ambiente' : 'Activar música ambiente'}
              aria-expanded={isMusicPanelOpen}
              aria-controls="ambient-volume-control"
              title={isMusicPlaying ? 'Ajustar música ambiente' : 'Activar música ambiente'}
            >
              <span
                className={`site-header__music-icon ${isMusicPlaying ? 'site-header__music-icon--active' : ''}`}
                aria-hidden="true"
              />
            </Button>

            {isMusicPanelOpen ? (
              <div id="ambient-volume-control" className="site-header__music-popover">
                <div className="site-header__music-status">
                  <div>
                    <strong>Música</strong>
                    <span>{isMusicPlaying ? 'Activada' : 'Apagada'}</span>
                  </div>
                  <p>{isMusicPlaying ? 'Ambiente tranquilo' : 'Pulsa activar para escucharla'}</p>
                </div>
                <label>
                  <span>
                    Volumen <strong>{Math.round(musicVolume * 100)}%</strong>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVolume}
                    onChange={(event) => setMusicVolume(event.target.value)}
                    aria-label="Volumen de música ambiente"
                  />
                </label>
                <div className="site-header__music-popover-actions">
                  <button
                    type="button"
                    className="site-header__music-action site-header__music-action--primary"
                    onClick={() => {
                      if (!isMusicPlaying) {
                        toggleMusic()
                      }
                    }}
                    disabled={isMusicPlaying}
                  >
                    Activar
                  </button>
                  <button
                    type="button"
                    className="site-header__music-action"
                    onClick={() => {
                      if (isMusicPlaying) {
                        toggleMusic()
                      }
                    }}
                    disabled={!isMusicPlaying}
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ) : null}
          </div>

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
