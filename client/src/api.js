const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Standard fetch wrapper with automatic Authorization header and JSON parsing.
 */
export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('skillswap_token');
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: reqHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Invalid response from server' };
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// API methods
export const api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  getMe: () => apiRequest('/auth/me'),

  // Skills
  getSkills: () => apiRequest('/skills'),

  // Profile
  updateProfile: (payload) => apiRequest('/users/me', { method: 'PUT', body: payload }),
  getPublicProfile: (id) => apiRequest(`/users/${id}`),

  // Matches
  getMatches: (category = 'all') => apiRequest(`/matches?category=${category}`),

  // Requests
  createRequest: (payload) => apiRequest('/requests', { method: 'POST', body: payload }),
  getRequests: (box = 'incoming') => apiRequest(`/requests?box=${box}`),
  acceptRequest: (id, payload) => apiRequest(`/requests/${id}/accept`, { method: 'PATCH', body: payload }),
  rejectRequest: (id) => apiRequest(`/requests/${id}/reject`, { method: 'PATCH' }),
  cancelRequest: (id) => apiRequest(`/requests/${id}/cancel`, { method: 'PATCH' }),
  completeRequest: (id) => apiRequest(`/requests/${id}/complete`, { method: 'PATCH' }),
  paySession: (id) => apiRequest(`/requests/${id}/pay`, { method: 'POST' }),

  // Wallet
  getWallet: () => apiRequest('/wallet'),

  // Reviews & Ratings
  createReview: (requestId, payload) =>
    apiRequest(`/requests/${requestId}/review`, { method: 'POST', body: payload }),
  getUserReviews: (userId, skill = '', page = 1) =>
    apiRequest(`/users/${userId}/reviews?skill=${encodeURIComponent(skill)}&page=${page}`),
};
