import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import useAuthStore from './store/authStore'
import useThemeStore from './store/themeStore'
import { refreshSession } from './api/auth'
import './styles/variables.css'
import './styles/reset.css'
import './styles/typography.css'
import './styles/themes.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeBootstrap() {
  const initializeTheme = useThemeStore((state) => state.initializeTheme)
  const syncWithSystem = useThemeStore((state) => state.syncWithSystem)

  useEffect(() => {
    initializeTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => syncWithSystem()

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [initializeTheme, syncWithSystem])

  return null
}

function AuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped)

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      try {
        const session = await refreshSession()

        if (!cancelled) {
          setSession(session)
        }
      } catch (error) {
        if (!cancelled) {
          clearSession()
          setBootstrapped()
        }
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [clearSession, setBootstrapped, setSession])

  return null
}

function Root() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeBootstrap />
          <AuthBootstrap />
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
