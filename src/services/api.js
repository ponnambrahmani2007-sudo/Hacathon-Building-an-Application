const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

let authToken = localStorage.getItem('workflow_token') || ''

export function setAuthToken(token) {
  authToken = token || ''
  if (authToken) localStorage.setItem('workflow_token', authToken)
  else localStorage.removeItem('workflow_token')
}

export function getAuthToken() {
  return authToken
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.')
  }
  return payload
}
