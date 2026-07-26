import api from './api';

export const labService = {
  getLabs: async () => {
    console.log('[LAB SERVICE] Fetching laboratories from /api/labs/...');
    const response = await api.get('/labs/');
    console.log('[LAB SERVICE] Laboratories response received:', response.data);
    return response.data;
  },

  createLab: async ({ name }) => {
    const payload = { name };
    console.log('[LAB SERVICE] Submitting POST payload to /api/labs/:', payload);
    const response = await api.post('/labs/', payload);
    console.log('[LAB SERVICE] POST response received:', response.data);
    return response.data;
  },

  updateLab: async (id, { name }) => {
    const payload = { name };
    console.log(`[LAB SERVICE] Submitting PATCH payload for Lab #${id}:`, payload);
    const response = await api.patch(`/labs/${id}/`, payload);
    console.log('[LAB SERVICE] PATCH response received:', response.data);
    return response.data;
  },

  deleteLab: async (id) => {
    console.log(`[LAB SERVICE] Deleting Laboratory #${id}...`);
    const response = await api.delete(`/labs/${id}/`);
    console.log('[LAB SERVICE] DELETE response received:', response.data);
    return response.data;
  },
};
