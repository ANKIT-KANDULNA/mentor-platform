const reviewService = require('./review.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user, req.body);
  sendSuccess(res, review, 201, 'Review submitted successfully');
});

const getReviewsByMentor = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewService.getReviewsByMentor(req.params.mentorProfileId, +page, +limit);
  sendSuccess(res, result.reviews, 200, 'Reviews retrieved', { total: result.total });
});

module.exports = { createReview, getReviewsByMentor };
