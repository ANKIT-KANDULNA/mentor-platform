const CACHE_KEYS = {
  ONLINE_USER: (userId) => `online:${userId}`,
  TRENDING_QUERIES: 'cache:dashboard:trending',
  ACTIVE_MENTORS: 'cache:dashboard:active-mentors',
  PLATFORM_STATS: 'cache:dashboard:stats',
  USER_PROFILE: (userId) => `cache:user:${userId}`,
  RATE_LIMIT: (ip) => `ratelimit:${ip}`,
};

const CACHE_TTL = {
  DASHBOARD: 300,       // 5 minutes
  USER_PROFILE: 600,    // 10 minutes
  ONLINE_STATUS: 86400, // 24 hours
};

module.exports = { CACHE_KEYS, CACHE_TTL };