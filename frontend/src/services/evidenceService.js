import api from './api';

export const evidenceService = {
  getEvidenceList: async (params) => {
    const response = await api.get('/evidence/', { params });
    return response.data;
  },
  getEvidenceById: async (id) => {
    const response = await api.get(`/evidence/${id}/`);
    return response.data;
  },
  getEvidenceImageUrl: (id) => `/api/evidence/${id}/image/`,
  getEvidenceVideoUrl: (id) => `/api/evidence/${id}/video/`,
  getEvidenceDownloadUrl: (id) => `/api/evidence/${id}/download/`,
};
