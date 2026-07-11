const { redisClient } = require('./client');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');

const setUserOnline = async (userId, socketId) => {
  await redisClient.set(
    CACHE_KEYS.ONLINE_USER(userId),
    socketId,
    { EX: CACHE_TTL.ONLINE_STATUS }
  );
};

const setUserOffline = async (userId) => {
  await redisClient.del(CACHE_KEYS.ONLINE_USER(userId));
};

const isUserOnline = async (userId) => {
  const socketId = await redisClient.get(CACHE_KEYS.ONLINE_USER(userId));
  return !!socketId;
};

const getOnlineUsers = async (userIds) => {
  const pipeline = redisClient.multi();
  userIds.forEach((id) => pipeline.get(CACHE_KEYS.ONLINE_USER(id)));
  const results = await pipeline.exec();
  return userIds.filter((_, i) => results[i] !== null);
};

module.exports = { setUserOnline, setUserOffline, isUserOnline, getOnlineUsers };