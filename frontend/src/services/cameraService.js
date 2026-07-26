import api from './api';

export const cameraService = {
  getCameras: async (params) => {
    console.log('[CAMERA SERVICE] Fetching cameras from /api/cameras/...');
    const response = await api.get('/cameras/', { params });
    console.log('[CAMERA SERVICE] Cameras response received:', response.data);
    return response.data;
  },

  getCameraDetail: async (id) => {
    console.log(`[CAMERA SERVICE] Fetching camera detail for ID #${id}...`);
    const response = await api.get(`/cameras/${id}/`);
    return response.data;
  },

  createCamera: async (data) => {
    console.log('[CAMERA SERVICE] Submitting POST payload to /api/cameras/:', data);
    const response = await api.post('/cameras/', data);
    console.log('[CAMERA SERVICE] POST response received:', response.data);
    return response.data;
  },

  updateCamera: async (id, data) => {
    console.log(`[CAMERA SERVICE] Submitting PATCH payload for Camera #${id}:`, data);
    const response = await api.patch(`/cameras/${id}/`, data);
    console.log('[CAMERA SERVICE] PATCH response received:', response.data);
    return response.data;
  },

  deleteCamera: async (id) => {
    console.log(`[CAMERA SERVICE] Deleting Camera #${id}...`);
    const response = await api.delete(`/cameras/${id}/`);
    return response.data;
  },

  testConnection: async (data) => {
    console.log('[CAMERA SERVICE] Testing RTSP Stream connection:', data);
    const response = await api.post('/cameras/test-connection/', data);
    console.log('[CAMERA SERVICE] Test connection response:', response.data);
    return response.data;
  },

  getCameraHealth: async (id) => {
    const response = await api.get(`/cameras/${id}/health-status/`);
    return response.data;
  },
};
