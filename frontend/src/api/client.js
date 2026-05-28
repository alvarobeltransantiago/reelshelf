import useAuthStore from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL
let refreshPromise = null

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function buildUrl(path, query) {
  const url = new URL(`${API_URL}${path}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

async function readJson(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function attemptRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(async (response) => {
        const payload = await readJson(response)

        if (!response.ok || !payload?.data?.accessToken) {
          useAuthStore.getState().clearSession()
          throw new ApiError(
            response.status,
            payload?.error?.code || 'REFRESH_FAILED',
            payload?.error?.message || 'No se pudo renovar la sesión'
          )
        }

        useAuthStore.getState().setSession(payload.data)
        return payload.data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

/**
 * Wrapper centralizado para aplicar credenciales, auth y manejo homogéneo de errores.
 * @param {string} path
 * @param {RequestInit & { query?: Record<string, string | number | undefined>, skipAuthRetry?: boolean }} options
 * @returns {Promise<any>}
 */
export async function apiRequest(path, options = {}) {
  const { query, skipAuthRetry = false, headers, ...restOptions } = options
  const accessToken = useAuthStore.getState().accessToken

  const response = await fetch(buildUrl(path, query), {
    credentials: 'include',
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  const payload = await readJson(response)

  if (response.status === 401 && !skipAuthRetry && path !== '/auth/refresh') {
    try {
      await attemptRefresh()
      return apiRequest(path, { ...options, skipAuthRetry: true })
    } catch (error) {
      throw error
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code || 'REQUEST_FAILED',
      payload?.error?.message || 'No se pudo completar la petición',
      payload?.error?.details
    )
  }

  return payload
}
