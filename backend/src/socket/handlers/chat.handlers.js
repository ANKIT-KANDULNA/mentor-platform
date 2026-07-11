const prisma = require('../../db/prisma');
const SOCKET_EVENTS = require('../../constants/events');

const setupChatSocket = (io, socket) => {
  const userId = socket.data.user.id;

  // Join conversation room
  socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, ({ conversationId }) => {
    socket.join(`conv:${conversationId}`);
  });

  // Leave conversation room
  socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, ({ conversationId }) => {
    socket.leave(`conv:${conversationId}`);
  });

  // Send message
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ conversationId, content }, callback) => {
    try {
      if (!content || content.trim().length === 0) {
        return callback?.({ success: false, error: 'Empty message' });
      }

      // Verify ownership
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return callback?.({ success: false, error: 'Conversation not found' });
      }

      if (conversation.userAId !== userId && conversation.userBId !== userId) {
        return callback?.({ success: false, error: 'Access denied' });
      }

      // Save to DB
      const message = await prisma.message.create({
        data: { conversationId, senderId: userId, content: content.trim() },
        include: { sender: { select: { id: true, fullName: true } } },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessage: content.substring(0, 100), lastMsgAt: new Date() },
      });

      // Broadcast to room
      io.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);

      callback?.({ success: true, messageId: message.id });
    } catch (error) {
      console.error('Send message error:', error);
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on(SOCKET_EVENTS.TYPING, ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.USER_TYPING, {
      userId,
      conversationId,
    });
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.USER_STOP_TYPING, {
      userId,
      conversationId,
    });
  });

  // Mark read
  socket.on(SOCKET_EVENTS.MARK_READ, async ({ messageId, conversationId }) => {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });

      socket.to(`conv:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
        messageId,
        readAt: new Date(),
      });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
};

module.exports = { setupChatSocket };