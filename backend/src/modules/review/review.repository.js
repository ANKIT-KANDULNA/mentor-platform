const prisma = require('../../db/prisma');

const createReview = async (data) => {
  return prisma.review.create({
    data,
    include: {
      author: { select: { id: true, fullName: true } },
    },
  });
};

const getReviewsByMentor = async (mentorProfileId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { mentorProfileId },
      include: {
        author: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { mentorProfileId } }),
  ]);
  return { reviews, total };
};

const hasReviewed = async (authorId, mentorProfileId) => {
  const existing = await prisma.review.findFirst({
    where: { authorId, mentorProfileId },
  });
  return !!existing;
};

module.exports = { createReview, getReviewsByMentor, hasReviewed };
