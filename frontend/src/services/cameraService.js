import api from './api';

export const cameraService = {
  getCameras: async () => {
    const response = await api.get('/cameras/');
    return response.data;
  },
};
