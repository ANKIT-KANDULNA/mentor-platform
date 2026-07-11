const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id);
  sendSuccess(res, profile, 200, 'User profile retrieved successfully');
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user.id, req.body);
  sendSuccess(res, profile, 200, 'User profile updated successfully');
});

const updateSettings = asyncHandler(async (req, res) => {
  const profile = await userService.updateSettings(req.user.id, req.body);
  sendSuccess(res, profile, 200, 'User settings updated successfully');
});

const deactivateAccount = asyncHandler(async (req, res) => {
  await userService.deactivateAccount(req.user.id);
  sendSuccess(res, null, 200, 'Account deactivated successfully');
});

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  deactivateAccount,
};
