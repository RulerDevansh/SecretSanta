const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const buildHeaders = (token, extra = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const apiRequest = async (endpoint, { method = 'GET', body, token, headers = {} } = {}) => {
  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: buildHeaders(token, headers),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Network error. Please try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Something went wrong';
    throw new Error(message);
  }

  return data;
};

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  googleLogin: (payload) => apiRequest('/auth/google', { method: 'POST', body: payload }),
  me: (token) => apiRequest('/auth/me', { token }),
};

export const groupApi = {
  getMine: (token) => apiRequest('/groups', { token }),
  create: (token, payload) => apiRequest('/groups', { method: 'POST', body: payload, token }),
  join: (token, payload) => apiRequest('/groups/join', { method: 'POST', body: payload, token }),
  getByCode: (token, code) => apiRequest(`/groups/${code}`, { token }),
  start: (token, code) => apiRequest(`/groups/${code}/start`, { method: 'PATCH', token }),
  leave: (token, code) => apiRequest(`/groups/${code}/leave`, { method: 'DELETE', token }),
  delete: (token, code) => apiRequest(`/groups/${code}`, { method: 'DELETE', token }),
};

export const wishApi = {
  status: (token, code) => apiRequest(`/wishes/${code}/status`, { token }),
  submit: (token, code, payload) => apiRequest(`/wishes/${code}`, {
    method: 'POST',
    body: payload,
    token,
  }),
};
