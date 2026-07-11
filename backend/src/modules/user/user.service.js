const userRepo = require('./user.repository');
const mentorRepo = require('../mentor/mentor.repository');
const AppError = require('../../utils/AppError');
const { getCache, setCache, deleteCache } = require('../../redis/cache');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/cacheKeys');

const getUserProfile = async (userId) => {
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  
  // Try caching
  try {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.error('Redis cache get error:', err.message);
  }

  const user = await userRepo.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Sanitise password
  delete user.passwordHash;

  try {
    await setCache(cacheKey, user, CACHE_TTL.USER_PROFILE);
  } catch (err) {
    console.error('Redis cache set error:', err.message);
  }

  return user;
};

const updateProfile = async (userId, data) => {
  const user = await userRepo.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { fullName, email, studentProfile, mentorProfile } = data;

  // Perform updates
  if (fullName || email) {
    const userUpdate = {};
    if (fullName) userUpdate.fullName = fullName;
    if (email) userUpdate.email = email;
    await userRepo.updateUser(userId, userUpdate);
  }

  if (user.role === 'MENTOR' && mentorProfile) {
    await mentorRepo.updateMentorProfile(userId, mentorProfile);
  } else if (user.role === 'STUDENT' && studentProfile) {
    await userRepo.updateStudentProfile(userId, studentProfile);
  }

  // Invalidate Redis cache
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  await deleteCache(cacheKey).catch(() => null);

  // Return fresh profile
  return getUserProfile(userId);
};

const updateSettings = async (userId, settingsData) => {
  const user = await userRepo.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await userRepo.updateUserSettings(userId, settingsData);

  // Invalidate Redis cache
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  await deleteCache(cacheKey).catch(() => null);

  return getUserProfile(userId);
};

const deactivateAccount = async (userId) => {
  const user = await userRepo.getUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await userRepo.softDeleteUser(userId);

  // Invalidate Redis cache
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  await deleteCache(cacheKey).catch(() => null);
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateSettings,
  deactivateAccount,
};
