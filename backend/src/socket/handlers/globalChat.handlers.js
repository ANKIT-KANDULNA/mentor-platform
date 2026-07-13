const prisma = require('../../db/prisma');
const SOCKET_EVENTS = require('../../constants/events');

const setupGlobalChatSocket = (io, socket) => {
  const userId = socket.data.user.id;

  socket.on(SOCKET_EVENTS.JOIN_GLOBAL, () => {
    socket.join('global-chat');
    console.log(`User ${userId} joined global chat`);
  });

  socket.on(SOCKET_EVENTS.SEND_GLOBAL, async ({ content }, callback) => {
    try {
      if (!content || content.trim().length === 0) {
        return callback?.({ success: false, error: 'Empty message' });
      }

      const message = await prisma.globalMessage.create({
        data: { content: content.trim(), senderId: userId },
        include: { sender: { select: { id: true, fullName: true, role: true } } },
      });

      io.to('global-chat').emit(SOCKET_EVENTS.GLOBAL_MESSAGE, message);
      callback?.({ success: true });
    } catch (error) {
      console.error('Global chat error:', error);
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });
};

module.exports = { setupGlobalChatSocket };