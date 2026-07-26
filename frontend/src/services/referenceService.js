import api from './api';

export const referenceService = {
  getReferenceProfiles: async (params) => {
    console.log('[REFERENCE SERVICE] Fetching reference profiles...');
    const response = await api.get('/reference-profiles/', { params });
    console.log('[REFERENCE SERVICE] Profiles response received:', response.data);
    return response.data;
  },

  createReferenceProfile: async (data) => {
    console.log('[REFERENCE SERVICE] Creating reference profile:', data);
    const response = await api.post('/reference-profiles/', data);
    return response.data;
  },

  updateReferenceProfile: async (id, data) => {
    console.log(`[REFERENCE SERVICE] Updating profile #${id}:`, data);
    const response = await api.patch(`/reference-profiles/${id}/`, data);
    return response.data;
  },

  deleteReferenceProfile: async (id) => {
    console.log(`[REFERENCE SERVICE] Deleting profile #${id}...`);
    const response = await api.delete(`/reference-profiles/${id}/`);
    return response.data;
  },

  activateProfile: async (id) => {
    console.log(`[REFERENCE SERVICE] Activating profile #${id}...`);
    const response = await api.post(`/reference-profiles/${id}/activate/`);
    console.log('[REFERENCE SERVICE] Activate response received:', response.data);
    return response.data;
  },

  captureReference: async (data) => {
    console.log('[REFERENCE SERVICE] Capturing reference baseline wizard:', data);
    const response = await api.post('/reference-profiles/capture-reference/', data);
    console.log('[REFERENCE SERVICE] Capture wizard response:', response.data);
    return response.data;
  },

  getReferenceAssets: async () => {
    const response = await api.get('/reference-assets/');
    return response.data;
  },
};
