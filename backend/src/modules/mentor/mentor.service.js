const mentorRepo = require('./mentor.repository');
const AppError = require('../../utils/AppError');

const getMentors = async (filters, page, limit) => {
  return mentorRepo.getMentors(filters, page, limit);
};

const getMentorById = async (mentorId) => {
  const mentor = await mentorRepo.getMentorById(mentorId);
  if (!mentor) {
    throw new AppError('Mentor profile not found', 404);
  }
  return mentor;
};

const updateProfile = async (userId, data) => {
  // Check if profile exists
  const existing = await mentorRepo.getMentorByUserId(userId);
  if (!existing) {
    throw new AppError('Mentor profile not found', 404);
  }

  // Update profile
  return mentorRepo.updateMentorProfile(userId, data);
};

const getMyProfile = async (userId) => {
  const profile = await mentorRepo.getMentorByUserId(userId);
  return profile;
};

module.exports = {
  getMentors,
  getMentorById,
  updateProfile,
  getMyProfile,
};
