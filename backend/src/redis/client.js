const { createClient } = require('redis');
const env = require('../config/env');
const url = require('url');

const redisClient = createClient({ url: env.REDIS_URL, RESP: 2 });

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

const connectRedis = async () => {
  await redisClient.connect();
};

const redisUrlParsed = url.parse(env.REDIS_URL);
const bullConnection = {
  host: redisUrlParsed.hostname || '127.0.0.1',
  port: parseInt(redisUrlParsed.port) || 6379,
  protocol: '2',
  maxRetriesPerRequest: null,
};
if (redisUrlParsed.auth) {
  const [, password] = redisUrlParsed.auth.split(':');
  bullConnection.password = password;
}

module.exports = { redisClient, connectRedis, bullConnection };