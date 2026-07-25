import api from './api';

export const sessionService = {
  startMonitoring: async () => {
    const response = await api.post('/monitoring/start/');
    return response.data;
  },
  stopMonitoring: async () => {
    const response = await api.post('/monitoring/stop/');
    return response.data;
  },
  getMonitoringStatus: async () => {
    const response = await api.get('/monitoring/status/');
    return response.data;
  },
  getSchedulerStatus: async () => {
    const response = await api.get('/scheduler/status/');
    return response.data;
  },
  restartScheduler: async () => {
    const response = await api.post('/scheduler/restart/');
    return response.data;
  },
  getLabs: async () => {
    const response = await api.get('/labs/');
    return response.data;
  },
};
