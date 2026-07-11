const { setUserOnline, setUserOffline } = require('../redis/presence');
const SOCKET_EVENTS = require('../constants/events');
const prisma = require('../db/prisma');

const setupPresence = (io, socket) => {
  const userId = socket.data.user.id;

  // Mark online
  setUserOnline(userId, socket.id);
  
  // Join personal room
  socket.join(`user:${userId}`);
  
  // Broadcast to all
  socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId });

  // Handle disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
    await setUserOffline(userId);
    
    // Update lastSeenAt
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    }).catch(console.error);

    io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
  });
};

module.exports = { setupPresence };