import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/token/', credentials);
    return response.data;
  },
  getUserProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  refreshToken: async (refresh) => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
};
