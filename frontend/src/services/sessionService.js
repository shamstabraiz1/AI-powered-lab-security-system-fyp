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

  // Lab Session Management CRUD
  getSessions: async (params) => {
    console.log('[SESSION SERVICE] Fetching lab sessions list...');
    const response = await api.get('/sessions/', { params });
    console.log('[SESSION SERVICE] Sessions list response received:', response.data);
    return response.data;
  },
  createSession: async (data) => {
    console.log('[SESSION SERVICE] Submitting POST payload to /api/sessions/:', data);
    const response = await api.post('/sessions/', data);
    console.log('[SESSION SERVICE] Create session response:', response.data);
    return response.data;
  },
  pauseSession: async (id) => {
    console.log(`[SESSION SERVICE] Pausing session #${id}...`);
    const response = await api.post(`/sessions/${id}/pause/`);
    return response.data;
  },
  resumeSession: async (id) => {
    console.log(`[SESSION SERVICE] Resuming session #${id}...`);
    const response = await api.post(`/sessions/${id}/resume/`);
    return response.data;
  },
  endSession: async (id) => {
    console.log(`[SESSION SERVICE] Ending session #${id}...`);
    const response = await api.post(`/sessions/${id}/end/`);
    return response.data;
  },
};
