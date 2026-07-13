import api from './axios';

export const getCommunities = async () => {
  const response = await api.get('/communities');
  return response.data;
};

export const getCommunityById = async (communityId) => {
  const response = await api.get(`/communities/${communityId}`);
  return response.data;
};

export const createCommunity = async ({ name, description, slug }) => {
  const response = await api.post('/communities', { name, description, slug });
  return response.data;
};

export const joinCommunity = async (communityId) => {
  const response = await api.post(`/communities/${communityId}/join`);
  return response.data;
};

export const leaveCommunity = async (communityId) => {
  const response = await api.delete(`/communities/${communityId}/leave`);
  return response.data;
};

export const getCommunityMessages = async (communityId, limit = 50) => {
  const response = await api.get(`/communities/${communityId}/messages`, { params: { limit } });
  return response.data;
};
