import api from './axios';

export const getMentors = async (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
  ).toString();
  const response = await api.get(`/mentors${params ? '?' + params : ''}`);
  return response.data;
};

export const getMentorById = async (mentorId) => {
  const response = await api.get(`/mentors/${mentorId}`);
  return response.data;
};

export const getMyMentorProfile = async () => {
  const response = await api.get('/mentors/me');
  return response.data;
};

export const updateMentorProfile = async (data) => {
  const response = await api.patch('/mentors/profile', data);
  return response.data;
};
