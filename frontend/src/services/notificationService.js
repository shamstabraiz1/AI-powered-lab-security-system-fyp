import api from './api';

export const notificationService = {
  getNotifications: async (params) => {
    console.log('[NOTIFICATION SERVICE] Fetching notifications list...');
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  markRead: async (id) => {
    console.log(`[NOTIFICATION SERVICE] Marking notification #${id} as read...`);
    const response = await api.patch(`/notifications/${id}/`, { is_read: true });
    return response.data;
  },

  markAllRead: async () => {
    console.log('[NOTIFICATION SERVICE] Marking all notifications as read...');
    const response = await api.post('/notifications/mark-all-read/');
    return response.data;
  },

  deleteNotification: async (id) => {
    console.log(`[NOTIFICATION SERVICE] Deleting notification #${id}...`);
    const response = await api.delete(`/notifications/${id}/`);
    return response.data;
  },
};
