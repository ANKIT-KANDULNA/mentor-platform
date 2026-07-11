const sessionService = require('./session.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(req.user, req.body);
  sendSuccess(res, session, 201, 'Session created successfully');
});

const getSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await sessionService.getSessions(req.user, filters, +page, +limit);
  sendSuccess(res, result.sessions, 200, 'Sessions retrieved successfully', {
    page: +page,
    limit: +limit,
    total: result.total,
  });
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionService.getSessionById(req.params.sessionId);
  sendSuccess(res, session, 200, 'Session retrieved successfully');
});

const joinSession = asyncHandler(async (req, res) => {
  const participant = await sessionService.joinSession(req.params.sessionId, req.user.id);
  sendSuccess(res, participant, 200, 'Joined session successfully');
});

const leaveSession = asyncHandler(async (req, res) => {
  await sessionService.leaveSession(req.params.sessionId, req.user.id);
  sendSuccess(res, null, 200, 'Left session successfully');
});

const updateSessionStatus = asyncHandler(async (req, res) => {
  const session = await sessionService.updateSessionStatus(req.params.sessionId, req.user, req.body.status);
  sendSuccess(res, session, 200, 'Session status updated');
});

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  joinSession,
  leaveSession,
  updateSessionStatus,
};
