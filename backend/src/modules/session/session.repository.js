const prisma = require('../../db/prisma');

const createSession = async (data) => {
  return prisma.session.create({
    data,
    include: {
      creator: { select: { id: true, fullName: true, email: true } },
      mentorProfile: { include: { user: { select: { fullName: true } } } },
    },
  });
};

const getSessions = async (userId, role, filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const where = {};

  // Role-specific filtering
  if (role === 'MENTOR') {
    // Mentors see sessions they created or are scheduled with their profile
    where.OR = [
      { creatorId: userId },
      { mentorProfile: { userId } },
    ];
  } else if (role === 'STUDENT') {
    // Students see sessions they created or sessions they have joined
    where.OR = [
      { creatorId: userId },
      { participants: { some: { userId, leftAt: null } } },
    ];
  }

  // Filter by status if provided
  if (filters.status) {
    where.status = filters.status;
  }

  // Filter by upcoming if requested
  if (filters.upcoming === 'true') {
    where.scheduledAt = { gte: new Date() };
    where.status = 'SCHEDULED';
  }

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      include: {
        creator: { select: { id: true, fullName: true } },
        mentorProfile: { include: { user: { select: { fullName: true } } } },
        participants: {
          where: { leftAt: null },
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.session.count({ where }),
  ]);

  return { sessions, total };
};

const getSessionById = async (sessionId) => {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      creator: { select: { id: true, fullName: true, email: true } },
      mentorProfile: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      participants: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
    },
  });
};

const addParticipant = async (sessionId, userId) => {
  return prisma.sessionParticipant.create({
    data: {
      sessionId,
      userId,
    },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  });
};

const removeParticipant = async (participantId) => {
  return prisma.sessionParticipant.update({
    where: { id: participantId },
    data: {
      leftAt: new Date(),
    },
  });
};

const updateSessionStatus = async (sessionId, status) => {
  return prisma.session.update({
    where: { id: sessionId },
    data: { status },
    include: {
      creator: { select: { id: true, fullName: true } },
      mentorProfile: { include: { user: { select: { fullName: true } } } },
    },
  });
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  addParticipant,
  removeParticipant,
  updateSessionStatus,
};
