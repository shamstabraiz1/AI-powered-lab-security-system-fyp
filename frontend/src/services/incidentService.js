import api from './api';

export const incidentService = {
  getIncidents: async (params) => {
    const response = await api.get('/incidents/', { params });
    return response.data;
  },
};
