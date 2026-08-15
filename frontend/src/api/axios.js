import axios from 'axios';

/**
 * Axios instance pre-configured for the CampusConnect API.
 *
 * baseURL '/api' works because Vite proxies /api → http://localhost:5000 in dev.
 * In production, point baseURL to the deployed backend URL via an env variable.
 *
 * Usage:
 *   import api from '../api/axios';
 *   const { data } = await api.get('/items');
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────
// Automatically attach the JWT token to every request if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────
// Handle 401 Unauthorized globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
