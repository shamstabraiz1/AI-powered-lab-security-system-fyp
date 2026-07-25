import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer JWT token ONLY to protected endpoints
api.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes('/auth/token/');
    const token = localStorage.getItem('access_token');

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Attached Bearer token to headers.');
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Safe 401 refresh mechanism without auth loop
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/token/');

    console.error(
      `[API Response Error] ${error.response?.status || 'Network Error'} from ${originalRequest?.url}:`,
      error.response?.data || error.message
    );

    // Never attempt token refresh on login or refresh endpoints
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          console.log('[API Auth] Attempting access token refresh...');
          const res = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccess = res.data.access;
          console.log('[API Auth] Access token refresh successful.');
          localStorage.setItem('access_token', newAccess);

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error('[API Auth] Token refresh failed. Clearing session.', refreshErr);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_profile');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
