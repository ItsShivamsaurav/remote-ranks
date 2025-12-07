const API_BASE = 'http://localhost:4000/api';

export function getToken() {
  return localStorage.getItem('token');
}
export function setToken(t) {
  localStorage.setItem('token', t);
}
export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}
export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
export async function api(path, options = {}) {
  const headers = options.headers || {};
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}
export function requireAuthRedirect() {
  if (!getToken()) window.location.href = 'login.html';
}
export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}
