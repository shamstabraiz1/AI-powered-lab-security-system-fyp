import api from './api';

export const referenceService = {
  getReferenceProfiles: async (params) => {
    const response = await api.get('/reference-profiles/', { params });
    return response.data;
  },
  getReferenceProfileById: async (id) => {
    const response = await api.get(`/reference-profiles/${id}/`);
    return response.data;
  },
  getReferenceAssets: async (params) => {
    const response = await api.get('/reference-assets/', { params });
    return response.data;
  },
};
