const prisma = require('../../db/prisma');

const getMentors = async (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const where = { user: { isActive: true, deletedAt: null } };

  if (filters.branch) where.branch = { contains: filters.branch, mode: 'insensitive' };
  if (filters.collegeName) where.collegeName = { contains: filters.collegeName, mode: 'insensitive' };
  if (filters.isAvailable !== undefined) where.isAvailable = filters.isAvailable === 'true';
  if (filters.minRating) where.avgRating = { gte: parseFloat(filters.minRating) };

  const [mentors, total] = await Promise.all([
    prisma.mentorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, isActive: true } },
        availability: true,
      },
      orderBy: { avgRating: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mentorProfile.count({ where }),
  ]);

  return { mentors, total };
};

const getMentorById = async (mentorId) => {
  return prisma.mentorProfile.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { id: true, fullName: true, createdAt: true } },
      availability: true,
      reviews: {
        include: {
          author: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
};

const getMentorByUserId = async (userId) => {
  return prisma.mentorProfile.findUnique({ where: { userId } });
};

const updateMentorProfile = async (userId, data) => {
  return prisma.mentorProfile.update({
    where: { userId },
    data,
  });
};

module.exports = { getMentors, getMentorById, getMentorByUserId, updateMentorProfile };