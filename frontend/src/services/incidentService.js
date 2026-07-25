import api from './api';

export const incidentService = {
  getIncidents: async (params) => {
    const response = await api.get('/incidents/', { params });
    return response.data;
  },
  getIncidentById: async (id) => {
    const response = await api.get(`/incidents/${id}/`);
    return response.data;
  },
  updateIncidentStatus: async (id, status) => {
    const response = await api.patch(`/incidents/${id}/`, { status });
    return response.data;
  },
};
