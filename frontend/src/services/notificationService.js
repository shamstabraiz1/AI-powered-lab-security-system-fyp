import api from './api';

export const notificationService = {
  getNotifications: async (params) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },
  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread/');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },
};
