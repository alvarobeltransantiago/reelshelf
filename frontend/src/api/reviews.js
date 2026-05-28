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
  })

  return response.data
}

export async function updateReview(id, payload) {
  const response = await apiRequest(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteReview(id) {
  const response = await apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
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
