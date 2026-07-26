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
  startMonitoring: async () => {
    console.log('[SESSION SERVICE] Starting monitoring scheduler...');
    const response = await api.post('/monitoring/start/');
    return response.data;
  },
  stopMonitoring: async () => {
    console.log('[SESSION SERVICE] Stopping monitoring scheduler...');
    const response = await api.post('/monitoring/stop/');
    return response.data;
  },
  restartScheduler: async () => {
    console.log('[SESSION SERVICE] Restarting scheduler...');
    const response = await api.post('/scheduler/restart/');
    return response.data;
  },
};
