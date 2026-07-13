const communityRepo = require('../../modules/community/community.repository');
const SOCKET_EVENTS = require('../../constants/events');

/**
 * Handles real-time community messaging.
 * Each community gets its own socket room: `community:<communityId>`
 */
const setupCommunitySocket = (io, socket) => {
  const userId = socket.data.user.id;

  // Join a community room (verify membership first)
  socket.on(SOCKET_EVENTS.JOIN_COMMUNITY, async ({ communityId }, callback) => {
    try {
      const membership = await communityRepo.getMembership(userId, communityId);
      if (!membership) {
        return callback?.({ success: false, error: 'You must be a member to join this community room' });
      }

      const room = `community:${communityId}`;
      socket.join(room);
      console.log(`User ${userId} joined community room ${communityId}`);
      callback?.({ success: true });
    } catch (error) {
      console.error('JOIN_COMMUNITY error:', error);
      callback?.({ success: false, error: 'Failed to join community room' });
    }
  });

  // Leave a community room
  socket.on(SOCKET_EVENTS.LEAVE_COMMUNITY, ({ communityId }) => {
    const room = `community:${communityId}`;
    socket.leave(room);
    console.log(`User ${userId} left community room ${communityId}`);
  });

  // Send a message to a community
  socket.on(SOCKET_EVENTS.SEND_COMMUNITY_MSG, async ({ communityId, content }, callback) => {
    try {
      if (!content || content.trim().length === 0) {
        return callback?.({ success: false, error: 'Empty message' });
      }

      // Verify membership before allowing message
      const membership = await communityRepo.getMembership(userId, communityId);
      if (!membership) {
        return callback?.({ success: false, error: 'You must be a member to send messages' });
      }

      const message = await communityRepo.createCommunityMessage({
        communityId,
        senderId: userId,
        content: content.trim(),
      });

      const room = `community:${communityId}`;
      io.to(room).emit(SOCKET_EVENTS.COMMUNITY_MESSAGE, message);
      callback?.({ success: true });
    } catch (error) {
      console.error('SEND_COMMUNITY_MSG error:', error);
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });
};

module.exports = { setupCommunitySocket };
