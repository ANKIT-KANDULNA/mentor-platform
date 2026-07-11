import { useEffect, useState } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../socket/socket';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Custom React hook for subscribing to/retrieving the global Socket.IO connection.
 * Automatically initiates connections or cleanups depending on authorization state.
 */
export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      connectSocket();
      const s = getSocket();
      setSocket(s);
    } else {
      setSocket(null);
      disconnectSocket();
    }
  }, [user]);

  return socket;
};

// Alias to safeguard against spelling discrepancies in imports
export const useScoket = useSocket;
