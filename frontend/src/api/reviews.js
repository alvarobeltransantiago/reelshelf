import { apiRequest } from './client'

async function readJson(response) {
  return response.ok ? response.json() : Promise.reject(new Error('No se pudieron cargar sugerencias'))
}

async function searchItunes(term, media) {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&limit=6`
  )
  const payload = await readJson(response)

  return payload.results.map((item) => ({
    id: `itunes-${media}-${item.trackId || item.collectionId}`,
    title: item.trackName || item.collectionName || term,
    subtitle: item.artistName || '',
    coverUrl: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
  }))
}

async function searchOpenLibrary(term) {
  const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(term)}&limit=6`)
  const payload = await readJson(response)

  return payload.docs
    .filter((item) => item.cover_i)
    .map((item) => ({
      id: `openlibrary-${item.key}`,
      title: item.title,
      subtitle: item.author_name?.[0] || '',
      coverUrl: `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`,
    }))
}

export async function getReviews(filters) {
  const response = await apiRequest('/reviews', {
    method: 'GET',
    query: filters,
  })

  return response
}

export async function getReview(id) {
  const response = await apiRequest(`/reviews/${id}`, {
    method: 'GET',
  })

  return response.data
}

export async function createReview(payload) {
  const response = await apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
    toast: {
      success: {
        title: 'Reseña guardada',
        message: payload.status === 'draft' ? 'El borrador se ha guardado.' : 'La reseña se ha añadido a tu biblioteca.',
      },
      error: (payload) => ({
        title: 'No se pudo guardar',
        message: payload?.error?.message || 'Revisa los campos de la reseña.',
      }),
    },
  })

  return response.data
}

export async function updateReview(id, payload) {
  const response = await apiRequest(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    toast: {
      success: payload.is_favorite !== undefined && Object.keys(payload).length === 1
        ? {
            title: payload.is_favorite ? 'Marcada como favorita' : 'Favorito retirado',
            message: payload.is_favorite
              ? 'Queda destacada sin ocupar un puesto del Top 10.'
              : 'La reseña ya no está marcada como favorita.',
          }
        : {
            title: 'Reseña actualizada',
            message: 'Los cambios se han guardado correctamente.',
          },
      error: (payload) => ({
        title: 'No se pudo actualizar',
        message: payload?.error?.message || 'Revisa los cambios e inténtalo otra vez.',
      }),
    },
  })

  return response.data
}

export async function deleteReview(id) {
  const response = await apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
    toast: {
      success: {
        title: 'Reseña eliminada',
        message: 'La entrada ha salido de tu biblioteca.',
      },
      error: (payload) => ({
        title: 'No se pudo eliminar',
        message: payload?.error?.message || 'Inténtalo de nuevo en unos segundos.',
      }),
    },
  })

  return response.data
}

export async function getCoverSuggestions(title, category) {
  const normalizedTitle = title.trim()

  if (normalizedTitle.length < 2) {
    return []
  }

  try {
    if (category === 'book') {
      return searchOpenLibrary(normalizedTitle)
    }

    if (category === 'series') {
      return searchItunes(normalizedTitle, 'tvShow')
    }

    if (category === 'game') {
      return searchItunes(normalizedTitle, 'software')
    }

    return searchItunes(normalizedTitle, 'movie')
  } catch {
    return []
  }
}
