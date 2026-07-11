/**
 * WebRTC Signaling handlers for peer-to-peer video calling.
 * This acts as a relay between two clients negotiating WebRTC connections.
 */

// Track active calls: callId -> { callerId, calleeId, sessionId }
const activeCalls = new Map();

// Map userId -> socketId for direct targeting
const userSockets = new Map();

const setupWebRTCSocket = (io, socket) => {
  const userId = socket.data.user.id;
  userSockets.set(userId, socket.id);

  // Request a video call (caller -> callee)
  socket.on('webrtc:call-request', ({ calleeId, sessionId, callerName }) => {
    const calleeSocketId = userSockets.get(calleeId);
    if (!calleeSocketId) {
      socket.emit('webrtc:call-error', { message: 'User is not online' });
      return;
    }
    const callId = `${userId}-${calleeId}-${Date.now()}`;
    activeCalls.set(callId, { callerId: userId, calleeId, sessionId });
    io.to(calleeSocketId).emit('webrtc:incoming-call', {
      callId,
      callerId: userId,
      callerName,
      sessionId,
    });
    socket.emit('webrtc:call-initiated', { callId });
  });

  // Callee accepts the call
  socket.on('webrtc:call-accepted', ({ callId, callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('webrtc:call-accepted', { callId, calleeId: userId });
    }
  });

  // Callee rejects the call
  socket.on('webrtc:call-rejected', ({ callId, callerId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('webrtc:call-rejected', { callId });
    }
    activeCalls.delete(callId);
  });

  // Relay SDP offer (caller -> callee)
  socket.on('webrtc:offer', ({ calleeId, sdp, callId }) => {
    const calleeSocketId = userSockets.get(calleeId);
    if (calleeSocketId) {
      io.to(calleeSocketId).emit('webrtc:offer', { sdp, callId, callerId: userId });
    }
  });

  // Relay SDP answer (callee -> caller)
  socket.on('webrtc:answer', ({ callerId, sdp, callId }) => {
    const callerSocketId = userSockets.get(callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('webrtc:answer', { sdp, callId });
    }
  });

  // Relay ICE candidates
  socket.on('webrtc:ice-candidate', ({ targetId, candidate }) => {
    const targetSocketId = userSockets.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:ice-candidate', { candidate, fromId: userId });
    }
  });

  // End the call
  socket.on('webrtc:call-ended', ({ targetId, callId }) => {
    const targetSocketId = userSockets.get(targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:call-ended', { callId });
    }
    activeCalls.delete(callId);
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    userSockets.delete(userId);
    // Notify any active call partner
    for (const [callId, call] of activeCalls) {
      if (call.callerId === userId || call.calleeId === userId) {
        const partnerId = call.callerId === userId ? call.calleeId : call.callerId;
        const partnerSocketId = userSockets.get(partnerId);
        if (partnerSocketId) {
          io.to(partnerSocketId).emit('webrtc:call-ended', { callId, reason: 'disconnected' });
        }
        activeCalls.delete(callId);
      }
    }
  });
};

module.exports = { setupWebRTCSocket };
