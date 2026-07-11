const mentorService = require('./mentor.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getMentors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await mentorService.getMentors(filters, +page, +limit);
  sendSuccess(res, result.mentors, 200, 'Success', {
    page: +page, limit: +limit, total: result.total,
  });
});

const getMentorById = asyncHandler(async (req, res) => {
  const mentor = await mentorService.getMentorById(req.params.mentorId);
  sendSuccess(res, mentor);
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await mentorService.updateProfile(req.user.id, req.body);
  sendSuccess(res, profile);
});

const getMyProfile = asyncHandler(async (req, res) => {
  const mentor = await mentorService.getMyProfile(req.user.id);
  sendSuccess(res, mentor);
});

module.exports = { getMentors, getMentorById, updateProfile, getMyProfile };