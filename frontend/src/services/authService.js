import api from './api';

export const authService = {
  login: async ({ username, password }) => {
    // Send ONLY username and password to Django SimpleJWT endpoint
    const payload = { username, password };
    console.log('[AUTH Service] Posting credentials payload to /auth/token/:', { username, password: '***' });

    const response = await api.post('/auth/token/', payload);
    console.log('[AUTH Service] Received token response:', response.data);
    return response.data;
  },

  getUserProfile: async () => {
    console.log('[AUTH Service] Fetching user profile from /auth/profile/...');
    const response = await api.get('/auth/profile/');
    console.log('[AUTH Service] User profile response:', response.data);
    return response.data;
  },

  refreshToken: async (refresh) => {
    console.log('[AUTH Service] Refreshing access token...');
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },
};
