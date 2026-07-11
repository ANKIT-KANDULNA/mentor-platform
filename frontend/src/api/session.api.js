import api from './axios';

export const getSessions = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/sessions${params ? '?' + params : ''}`);
  return response.data;
};

export const createSession = async (data) => {
  const response = await api.post('/sessions', data);
  return response.data;
};

export const getSessionById = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

export const updateSessionStatus = async (sessionId, status) => {
  const response = await api.patch(`/sessions/${sessionId}/status`, { status });
  return response.data;
};
