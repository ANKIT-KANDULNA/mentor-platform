import api from './axios';

export const getStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getActiveMentors = async () => {
  const response = await api.get('/dashboard/active-mentors');
  return response.data;
};

export const getUpcomingSessions = async () => {
  const response = await api.get('/dashboard/upcoming-sessions');
  return response.data;
};
