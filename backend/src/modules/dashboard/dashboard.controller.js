const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats();
  sendSuccess(res, stats);
});

const getActiveMentors = asyncHandler(async (req, res) => {
  const mentors = await dashboardService.getActiveMentors();
  sendSuccess(res, mentors);
});

const getUpcomingSessions = asyncHandler(async (req, res) => {
  const sessions = await dashboardService.getUpcomingSessions();
  sendSuccess(res, sessions);
});

module.exports = { getStats, getActiveMentors, getUpcomingSessions };