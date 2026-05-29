import useAuthStore from '../store/authStore'
import useToastStore from '../store/toastStore'

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')
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
  const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  const url = new URL(`${API_URL}${path}`, base)

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

function pushRequestToast(toast) {
  if (typeof window === 'undefined') {
    return
  }

  useToastStore.getState().pushToast(toast)
}

function resolveToast(config, payload, fallback) {
  if (!config) {
    return null
  }

  const resolved = typeof config === 'function' ? config(payload) : config

  if (!resolved) {
    return null
  }

  return {
    tone: resolved.tone || fallback.tone,
    title: resolved.title || fallback.title,
    message: resolved.message || fallback.message,
  }
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
  const { query, skipAuthRetry = false, rawResponse = false, headers, toast, ...restOptions } = options
  const accessToken = useAuthStore.getState().accessToken

  let response

  try {
    response = await fetch(buildUrl(path, query), {
      credentials: 'include',
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    })
  } catch (error) {
    const networkPayload = {
      error: {
        message: 'No se pudo conectar con el servidor.',
      },
    }
    const errorToast = resolveToast(toast?.error, networkPayload, {
      tone: 'error',
      title: 'Sin conexión',
      message: networkPayload.error.message,
    })

    if (errorToast) {
      pushRequestToast(errorToast)
    }

    throw new ApiError(0, 'NETWORK_ERROR', networkPayload.error.message, error)
  }

  if (rawResponse && response.ok) {
    return response
  }

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
    const errorToast = resolveToast(toast?.error, payload, {
      tone: 'error',
      title: 'No se pudo completar',
      message: payload?.error?.message || 'Revisa la petición e inténtalo de nuevo.',
    })

    if (errorToast) {
      pushRequestToast(errorToast)
    }

    throw new ApiError(
      response.status,
      payload?.error?.code || 'REQUEST_FAILED',
      payload?.error?.message || 'No se pudo completar la petición',
      payload?.error?.details
    )
  }

  const successToast = resolveToast(toast?.success, payload, {
    tone: 'success',
    title: 'Cambios guardados',
    message: payload?.data?.message || 'La operación se ha completado correctamente.',
  })

  if (successToast) {
    pushRequestToast(successToast)
  }

  return payload
}

export function notifyInfo(title, message) {
  pushRequestToast({
    tone: 'info',
    title,
    message,
  })
}

export function notifySuccess(title, message) {
  pushRequestToast({
    tone: 'success',
    title,
    message,
  })
}

export function notifyError(title, message) {
  pushRequestToast({
    tone: 'error',
    title,
    message,
  })
}
