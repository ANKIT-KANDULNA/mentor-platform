import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Returns the active Socket.IO connection or initializes a new one.
 */
export const getSocket = () => {
  if (socket) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    autoConnect: false,
  });

  return socket;
};

/**
 * Connects the global socket connection if authenticated.
 */
export const connectSocket = () => {
  const s = getSocket();
  if (s && !s.connected) {
    s.connect();
    console.log('🔌 Socket.IO client connecting...');
  }
};

/**
 * Disconnects and destroys the socket connection.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket.IO client disconnected');
  }
};
