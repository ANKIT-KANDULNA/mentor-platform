const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { socketAuthMiddleware } = require('./auth');
const { setupPresence } = require('./presence');
const { setupChatSocket } = require('./handlers/chat.handlers');
const { setupGlobalChatSocket } = require('./handlers/globalChat.handlers');
const { setupSessionSocket } = require('./handlers/session.handlers');
const { setupWebRTCSocket } = require('./handlers/webrtc.handlers');
const { setupCommunitySocket } = require('./handlers/community.handlers');
const env = require('../config/env');

let ioInstance;

const initializeSocket = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  ioInstance = io;

  // Redis Adapter for multi-server scaling
  const pubClient = createClient({ url: env.REDIS_URL, RESP: 2 });
  const subClient = pubClient.duplicate();
  
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // Auth middleware
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.data.user.id}`);

    setupPresence(io, socket);
    setupChatSocket(io, socket);
    setupGlobalChatSocket(io, socket);
    setupSessionSocket(io, socket);
    setupWebRTCSocket(io, socket);
    setupCommunitySocket(io, socket);
  });

  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized');
  }
  return ioInstance;
};

module.exports = { initializeSocket, getIO };