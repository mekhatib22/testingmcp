/**
 * API helpers for the backend relay server.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/api/health'),

  machines: {
    list: () => request('/api/machines'),
    register: (body) =>
      request('/api/machines', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/api/machines/${id}`, { method: 'DELETE' }),
  },

  execute: (body) =>
    request('/api/execute', { method: 'POST', body: JSON.stringify(body) }),

  context: {
    get: () => request('/api/context'),
    set: (key, value) =>
      request('/api/context', { method: 'POST', body: JSON.stringify({ key, value }) }),
    delete: (key) => request(`/api/context/${key}`, { method: 'DELETE' }),
  },
};

/**
 * Create and return a WebSocket connection to the backend.
 */
export function createWS(onMessage) {
  const wsUrl = (import.meta.env.VITE_BACKEND_URL || window.location.origin).replace(
    /^http/,
    'ws'
  );
  const ws = new WebSocket(`${wsUrl}/ws`);
  ws.onmessage = (evt) => {
    try {
      onMessage(JSON.parse(evt.data));
    } catch {
      /* ignore malformed messages */
    }
  };
  return ws;
}
