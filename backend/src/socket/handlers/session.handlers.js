const SOCKET_EVENTS = require('../../constants/events');

/**
 * Sets up WebSocket event listeners for real-time mentorship session rooms.
 */
const setupSessionSocket = (io, socket) => {
  const userId = socket.data.user.id;

  // Join a specific session's live event room
  socket.on(SOCKET_EVENTS.JOIN_SESSION, ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    console.log(`User ${userId} joined session room: ${sessionId}`);
    
    // Broadcast join event to other participants
    socket.to(`session:${sessionId}`).emit('participant-joined', { userId });
  });

  // Leave a specific session's room
  socket.on(SOCKET_EVENTS.LEAVE_SESSION, ({ sessionId }) => {
    socket.leave(`session:${sessionId}`);
    console.log(`User ${userId} left session room: ${sessionId}`);
    
    // Broadcast leave event to other participants
    socket.to(`session:${sessionId}`).emit('participant-left', { userId });
  });

  // Signal that session has started (triggered by mentor)
  socket.on(SOCKET_EVENTS.SESSION_STARTED, ({ sessionId }) => {
    io.to(`session:${sessionId}`).emit(SOCKET_EVENTS.SESSION_STARTED, { sessionId });
  });
};

module.exports = { setupSessionSocket };
