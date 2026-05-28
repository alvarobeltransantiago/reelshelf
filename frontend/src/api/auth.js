import { apiRequest } from './client'

export async function registerUser(payload) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function loginUser(payload) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function logoutUser() {
  const response = await apiRequest('/auth/logout', {
    method: 'POST',
    skipAuthRetry: true,
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
