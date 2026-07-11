const prisma = require('../../db/prisma');

const getTrendingQueries = async () => {
  return prisma.query ? prisma.query.findMany({
    orderBy: { views: 'desc' },
    take: 10,
  }) : [];
};

const getActiveMentors = async () => {
  return prisma.mentorProfile.findMany({
    where: { isAvailable: true, user: { isActive: true } },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { avgRating: 'desc' },
    take: 5,
  });
};

const getPlatformStats = async () => {
  const [students, mentors, sessions, messages] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'MENTOR', isActive: true } }),
    prisma.session.count(),
    prisma.message.count(),
  ]);

  return { totalStudents: students, totalMentors: mentors, totalSessions: sessions, totalMessages: messages };
};

const getUpcomingSessions = async () => {
  return prisma.session.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { gt: new Date() } },
    include: {
      creator: { select: { id: true, fullName: true } },
      mentorProfile: { select: { collegeName: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });
};

module.exports = { getTrendingQueries, getActiveMentors, getPlatformStats, getUpcomingSessions };