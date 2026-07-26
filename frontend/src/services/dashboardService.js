import api from './api';

export const dashboardService = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/');
    return response.data;
  },
  getAnalyticsStats: async () => {
    const response = await api.get('/analytics/');
    return response.data;
  },
};
