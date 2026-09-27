import axios from 'axios';

// Production backend hosted on Render
export const PRODUCTION_BACKEND_URL = 'https://miniproject-backend-rdei.onrender.com';

export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
  }
  return PRODUCTION_BACKEND_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token from localStorage if cookie is not sent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nova_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle session expiration cleanly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear localStorage and redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
