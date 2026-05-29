import { apiRequest } from './client'

export async function getUserProfile(username) {
  const response = await apiRequest(`/users/${username}`, {
    method: 'GET',
  })

  return response.data
}

export async function getUserReviews(username, page = 1, category = '') {
  const response = await apiRequest(`/users/${username}/reviews`, {
    method: 'GET',
    query: { page, category },
  })

  return response
}

export async function getMyLibrary(filters) {
  const response = await apiRequest('/users/me/library', {
    method: 'GET',
    query: filters,
  })

  return response
}

export async function updateMyTopReviews(category, reviewIds) {
  const response = await apiRequest('/users/me/top-reviews', {
    method: 'PATCH',
    body: JSON.stringify({ category, reviewIds }),
    toast: {
      success: {
        title: 'Top 10 actualizado',
        message: reviewIds.length ? 'El orden se ha guardado.' : 'El ranking queda vacío por ahora.',
      },
      error: (payload) => ({
        title: 'No se pudo actualizar el Top 10',
        message: payload?.error?.message || 'Prueba de nuevo en unos segundos.',
      }),
    },
  })

  return response.data
}

export async function getMyWishlist(category = '') {
  const response = await apiRequest('/users/me/wishlist', {
    method: 'GET',
    query: { category },
  })

  return response.data
}

export async function createWishlistItem(payload) {
  const response = await apiRequest('/users/me/wishlist', {
    method: 'POST',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Deseo añadido',
        message: 'Queda guardado en tu lista.',
      },
      error: (payload) => ({
        title: 'No se pudo añadir',
        message: payload?.error?.message || 'Revisa los datos del deseo.',
      }),
    },
  })

  return response.data
}

export async function updateWishlistItem(id, payload) {
  const response = await apiRequest(`/users/me/wishlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Deseo actualizado',
        message: 'Los cambios se han guardado.',
      },
      error: (payload) => ({
        title: 'No se pudo actualizar',
        message: payload?.error?.message || 'Revisa los campos del deseo.',
      }),
    },
  })

  return response.data
}

export async function deleteWishlistItem(id) {
  const response = await apiRequest(`/users/me/wishlist/${id}`, {
    method: 'DELETE',
    toast: {
      success: {
        title: 'Deseo eliminado',
        message: 'Se ha quitado de la lista.',
      },
      error: (payload) => ({
        title: 'No se pudo eliminar',
        message: payload?.error?.message || 'Inténtalo otra vez.',
      }),
    },
  })

  return response.data
}

export async function reorderWishlist(category, itemIds) {
  const response = await apiRequest('/users/me/wishlist/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ category, itemIds }),
    toast: {
      error: (payload) => ({
        title: 'No se pudo reordenar',
        message: payload?.error?.message || 'El orden no se ha guardado.',
      }),
    },
  })

  return response.data
}

export async function downloadMyBackup() {
  const response = await apiRequest('/users/me/backup', {
    method: 'GET',
    rawResponse: true,
  })

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const filename = disposition.match(/filename="(.+)"/)?.[1] || 'reelshelf-backup.sql'

  return { blob, filename }
}

export async function updateMyProfile(payload) {
  const response = await apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Perfil actualizado',
        message: 'Tu identidad pública está al día.',
      },
      error: (payload) => ({
        title: 'No se pudo guardar el perfil',
        message: payload?.error?.message || 'Revisa los campos del perfil.',
      }),
    },
  })

  return response.data
}

export async function deleteMyAccount() {
  const response = await apiRequest('/users/me', {
    method: 'DELETE',
    toast: {
      success: {
        title: 'Cuenta eliminada',
        message: 'Tu cuenta se ha eliminado correctamente.',
      },
      error: (payload) => ({
        title: 'No se pudo eliminar la cuenta',
        message: payload?.error?.message || 'Inténtalo de nuevo más tarde.',
      }),
    },
  })

  return response.data
}
