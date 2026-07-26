import api from './api';

export const incidentService = {
  getIncidents: async (params) => {
    console.log('[INCIDENT SERVICE] Fetching incidents list...');
    const response = await api.get('/incidents/', { params });
    return response.data;
  },

  getIncidentDetail: async (id) => {
    console.log(`[INCIDENT SERVICE] Fetching detail for incident #${id}...`);
    const response = await api.get(`/incidents/${id}/`);
    return response.data;
  },

  updateIncidentStatus: async (id, data) => {
    console.log(`[INCIDENT SERVICE] Updating status for incident #${id}:`, data);
    const response = await api.patch(`/incidents/${id}/`, data);
    return response.data;
  },
};
