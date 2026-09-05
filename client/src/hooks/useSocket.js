// client/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { socket as socketInstance } from '../services/socket.js';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(socketInstance.connected);

  useEffect(() => {
    const socket = socketInstance;

    const handleConnect = () => {
      console.log('[useSocket] Connected');
      setIsConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log('[useSocket] Disconnected:', reason);
      setIsConnected(false);
    };

    const handleError = (err) => {
      console.error('[useSocket] Connection Error:', err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    if (!socket.connected) {
      console.log('[useSocket] Attempting initial connection...');
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, []);

  return {
    socket: socketInstance,
    isConnected,
  };
}