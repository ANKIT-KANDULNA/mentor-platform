const reviewRepo = require('./review.repository');
const mentorRepo = require('../mentor/mentor.repository');
const prisma = require('../../db/prisma');
const AppError = require('../../utils/AppError');

const createReview = async (currentUser, { mentorProfileId, rating, comment }) => {
  if (currentUser.role !== 'STUDENT') {
    throw new AppError('Only students can submit reviews', 403);
  }

  const mentor = await mentorRepo.getMentorById(mentorProfileId);
  if (!mentor) throw new AppError('Mentor not found', 404);
  if (mentor.userId === currentUser.id) throw new AppError('Cannot review yourself', 400);

  const already = await reviewRepo.hasReviewed(currentUser.id, mentorProfileId);
  if (already) throw new AppError('You have already reviewed this mentor', 400);

  const review = await reviewRepo.createReview({
    authorId: currentUser.id,
    mentorProfileId,
    rating: parseInt(rating),
    comment,
  });

  // Recalculate average rating
  const all = await prisma.review.findMany({ where: { mentorProfileId }, select: { rating: true } });
  const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  await prisma.mentorProfile.update({
    where: { id: mentorProfileId },
    data: { avgRating: parseFloat(avg.toFixed(2)), ratingCount: all.length },
  });

  return review;
};

const getReviewsByMentor = async (mentorProfileId, page, limit) => {
  return reviewRepo.getReviewsByMentor(mentorProfileId, page, limit);
};

module.exports = { createReview, getReviewsByMentor };
