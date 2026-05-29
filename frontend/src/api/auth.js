import { apiRequest } from './client'

export async function registerUser(payload) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Biblioteca creada',
        message: 'Tu sesión se ha iniciado correctamente.',
      },
      error: (payload) => ({
        title: 'No se pudo crear la cuenta',
        message: payload?.error?.message || 'Revisa los datos e inténtalo de nuevo.',
      }),
    },
  })

  return response.data
}

export async function loginUser(payload) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Sesión iniciada',
        message: 'Bienvenido de nuevo a tu biblioteca.',
      },
      error: (payload) => ({
        title: 'No se pudo iniciar sesión',
        message: payload?.error?.message || 'Comprueba tus credenciales.',
      }),
    },
  })

  return response.data
}

export async function logoutUser() {
  const response = await apiRequest('/auth/logout', {
    method: 'POST',
    skipAuthRetry: true,
    toast: {
      success: {
        title: 'Sesión cerrada',
        message: 'Has salido de Reelshelf correctamente.',
      },
      error: (payload) => ({
        title: 'No se pudo cerrar sesión',
        message: payload?.error?.message || 'La sesión local se mantiene por seguridad.',
      }),
    },
  })

  return response.data
}

export async function refreshSession() {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
    skipAuthRetry: true,
  })

  return response.data
}
