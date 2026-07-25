import api from './api';

export const cameraService = {
  getCameras: async (params) => {
    const response = await api.get('/cameras/', { params });
    return response.data;
  },
  getCameraById: async (id) => {
    const response = await api.get(`/cameras/${id}/`);
    return response.data;
  },
  createCamera: async (data) => {
    const response = await api.post('/cameras/', data);
    return response.data;
  },
  updateCamera: async (id, data) => {
    const response = await api.patch(`/cameras/${id}/`, data);
    return response.data;
  },
};
