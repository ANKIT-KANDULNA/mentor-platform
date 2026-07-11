const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const env = require('../config/env');

/**
 * Creates and connects pub/sub Redis clients to initialize a Socket.IO Redis adapter.
 * Useful for scaling Socket.IO across multiple server instances.
 */
const createRedisAdapter = async () => {
  const pubClient = createClient({ url: env.REDIS_URL, RESP: 2 });
  const subClient = pubClient.duplicate();
  
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  return createAdapter(pubClient, subClient);
};

module.exports = { createRedisAdapter };
