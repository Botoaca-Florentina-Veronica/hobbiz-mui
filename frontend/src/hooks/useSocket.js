import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (userId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Resolve Socket.IO server URL using Vite env
    // Prefer explicit VITE_SOCKET_URL, else fallback based on mode
    const mode = import.meta.env.MODE;
    const explicitUrl = import.meta.env.VITE_SOCKET_URL;
    const serverUrl = explicitUrl || (mode === 'production'
      ? 'https://hobbiz-mui.onrender.com'
      : 'http://localhost:5000');

    socketRef.current = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // Join with user ID
    socketRef.current.emit('join', userId);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  // Emit typing status
  const emitTyping = (conversationId, isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { conversationId, isTyping });
    }
  };

  // Listen for events
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    emitTyping,
    on,
    off
  };
};

export default useSocket;
