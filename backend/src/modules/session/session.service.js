const sessionRepo = require('./session.repository');
const mentorRepo = require('../mentor/mentor.repository');
const AppError = require('../../utils/AppError');

const createSession = async (currentUser, sessionData) => {
  const { title, description, type, scheduledAt, maxParticipants, mentorProfileId } = sessionData;

  // Validate mentor profile exists
  const mentorProfile = await mentorRepo.getMentorById(mentorProfileId);
  if (!mentorProfile) {
    throw new AppError('Mentor profile not found', 404);
  }

  // If current user is a mentor, verify they are creating it for themselves
  if (currentUser.role === 'MENTOR') {
    const userMentorProfile = await mentorRepo.getMentorByUserId(currentUser.id);
    if (!userMentorProfile || userMentorProfile.id !== mentorProfileId) {
      throw new AppError('Mentors can only create sessions for their own profiles', 403);
    }
  }

  return sessionRepo.createSession({
    title,
    description,
    type,
    scheduledAt: new Date(scheduledAt),
    maxParticipants: maxParticipants ? parseInt(maxParticipants) : 1,
    creatorId: currentUser.id,
    mentorProfileId,
  });
};

const getSessions = async (currentUser, filters, page, limit) => {
  return sessionRepo.getSessions(currentUser.id, currentUser.role, filters, page, limit);
};

const getSessionById = async (sessionId) => {
  const session = await sessionRepo.getSessionById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }
  return session;
};

const joinSession = async (sessionId, userId) => {
  const session = await sessionRepo.getSessionById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (session.status !== 'SCHEDULED') {
    throw new AppError('Cannot join a session that is not scheduled', 400);
  }

  // Check if session is full
  const activeParticipantsCount = session.participants.filter(p => !p.leftAt).length;
  if (activeParticipantsCount >= session.maxParticipants) {
    throw new AppError('Session is already full', 400);
  }

  // Check if already joined
  const alreadyJoined = session.participants.some(p => p.userId === userId && !p.leftAt);
  if (alreadyJoined) {
    throw new AppError('You have already joined this session', 400);
  }

  return sessionRepo.addParticipant(sessionId, userId);
};

const leaveSession = async (sessionId, userId) => {
  const session = await sessionRepo.getSessionById(sessionId);
  if (!session) {
    throw new AppError('Session not found', 404);
  }

  const participant = session.participants.find(p => p.userId === userId && !p.leftAt);
  if (!participant) {
    throw new AppError('You are not an active participant in this session', 400);
  }

  return sessionRepo.removeParticipant(participant.id);
};

const updateSessionStatus = async (sessionId, currentUser, status) => {
  const session = await sessionRepo.getSessionById(sessionId);
  if (!session) throw new AppError('Session not found', 404);

  // Only the mentor of the session or creator can update status
  const isMentor = currentUser.role === 'MENTOR' && session.mentorProfile?.userId === currentUser.id;
  const isCreator = session.creatorId === currentUser.id;
  if (!isMentor && !isCreator) throw new AppError('Unauthorized to update this session', 403);

  return sessionRepo.updateSessionStatus(sessionId, status);
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  joinSession,
  leaveSession,
  updateSessionStatus,
};
