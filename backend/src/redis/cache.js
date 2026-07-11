const { redisClient } = require('./client');

const getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

const setCache = async (key, value, ttlSeconds = 300) => {
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const deleteCache = async (key) => {
  await redisClient.del(key);
};

const deletePattern = async (pattern) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

module.exports = { getCache, setCache, deleteCache, deletePattern };