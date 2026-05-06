// src/lib/api.js - Axios instance
import axios from 'axios';

const resolvedBaseURL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'https://empay-qrs1.onrender.com/api');

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000, // 10s timeout to avoid hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / no-response errors -> provide a friendly message to the UI
    if (!error.response) {
      console.error('API network error or no response:', error);
      error.response = { data: { message: `Network error: could not reach API at ${api.defaults.baseURL}` } };
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
