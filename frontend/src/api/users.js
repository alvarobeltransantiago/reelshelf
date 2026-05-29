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
  })

  return response.data
}

export async function updateWishlistItem(id, payload) {
  const response = await apiRequest(`/users/me/wishlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function deleteWishlistItem(id) {
  const response = await apiRequest(`/users/me/wishlist/${id}`, {
    method: 'DELETE',
  })

  return response.data
}

export async function reorderWishlist(category, itemIds) {
  const response = await apiRequest('/users/me/wishlist/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ category, itemIds }),
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
  })

  return response.data
}

export async function deleteMyAccount() {
  const response = await apiRequest('/users/me', {
    method: 'DELETE',
  })

  return response.data
}
