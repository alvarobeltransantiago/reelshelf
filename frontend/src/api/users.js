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

export async function updateMyTopReviews(reviewIds) {
  const response = await apiRequest('/users/me/top-reviews', {
    method: 'PATCH',
    body: JSON.stringify({ reviewIds }),
  })

  return response.data
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
