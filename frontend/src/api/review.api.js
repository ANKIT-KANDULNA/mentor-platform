import api from './axios';

export const createReview = async (data) => {
  const response = await api.post('/reviews', data);
  return response.data;
};

export const getReviewsByMentor = async (mentorProfileId, page = 1, limit = 10) => {
  const response = await api.get(`/reviews/mentor/${mentorProfileId}?page=${page}&limit=${limit}`);
  return response.data;
};
