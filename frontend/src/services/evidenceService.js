import api from './api';

export const evidenceService = {
  getEvidenceList: async () => {
    const response = await api.get('/evidence/');
    return response.data;
  },
};
