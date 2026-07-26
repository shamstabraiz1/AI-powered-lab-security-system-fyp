import api from './api';

export const sessionService = {
  getMonitoringStatus: async () => {
    const response = await api.get('/monitoring/status/');
    return response.data;
  },
  getSchedulerStatus: async () => {
    const response = await api.get('/scheduler/status/');
    return response.data;
  },
};
