const { verifyAccessToken } = require('../utils/token');

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    socket.data.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

module.exports = { socketAuthMiddleware };