import api from './api';

export const referenceService = {
  getReferenceProfiles: async () => {
    const response = await api.get('/reference-profiles/');
    return response.data;
  },
  getReferenceAssets: async () => {
    const response = await api.get('/reference-assets/');
    return response.data;
  },
};
