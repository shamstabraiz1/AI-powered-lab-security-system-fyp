import api from './api';

export const labService = {
  getLabs: async () => {
    const response = await api.get('/labs/');
    return response.data;
  },
};
