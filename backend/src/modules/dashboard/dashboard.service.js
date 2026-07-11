const dashRepo = require('./dashboard.repository');
const { getCache, setCache } = require('../../redis/cache');
const { CACHE_KEYS, CACHE_TTL } = require('../../constants/cacheKeys');

const getStats = async () => {
  const cacheKey = CACHE_KEYS.PLATFORM_STATS;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const stats = await dashRepo.getPlatformStats();
  await setCache(cacheKey, stats, CACHE_TTL.DASHBOARD);
  return stats;
};

const getActiveMentors = async () => {
  const cacheKey = CACHE_KEYS.ACTIVE_MENTORS;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const mentors = await dashRepo.getActiveMentors();
  await setCache(cacheKey, mentors, CACHE_TTL.DASHBOARD);
  return mentors;
};

const getUpcomingSessions = async () => {
  return dashRepo.getUpcomingSessions();
};

module.exports = { getStats, getActiveMentors, getUpcomingSessions };