import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (userId) => {
  const socketRef = useRef(null);
  const pendingSubsRef = useRef([]); // [{ event, callback }]
  const pendingEmitsRef = useRef([]); // [{ event, payload }]

  useEffect(() => {
    if (!userId) return;

    // Resolve Socket.IO server URL using Vite env
    // Prefer explicit VITE_SOCKET_URL, else fallback to VITE_API_URL, else localhost in dev
    const mode = import.meta.env.MODE;
    const explicitUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
    const serverUrl = explicitUrl || (mode === 'production'
      ? 'https://hobbiz-app-kkull.ondigitalocean.app/' // In production, require explicit env to avoid wrong origin
      : 'http://localhost:5000');

    if (!serverUrl) {
      console.warn('[useSocket] No Socket.IO server URL set. Define VITE_SOCKET_URL or VITE_API_URL.');
      return;
    }

    socketRef.current = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    // On connect: join and flush pending subscriptions
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', userId);
      if (pendingSubsRef.current.length) {
        pendingSubsRef.current.forEach(({ event, callback }) => {
          socketRef.current.on(event, callback);
        });
        pendingSubsRef.current = [];
      }
      if (pendingEmitsRef.current.length) {
        pendingEmitsRef.current.forEach(({ event, payload }) => {
          socketRef.current.emit(event, payload);
        });
        pendingEmitsRef.current = [];
      }
    });

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
    const payload = { conversationId, isTyping };
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', payload);
    } else {
      pendingEmitsRef.current.push({ event: 'typing', payload });
    }
  };

  // Listen for events
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    } else {
      // Queue until socket connects
      pendingSubsRef.current.push({ event, callback });
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    } else {
      // Remove from pending queue if not yet attached
      pendingSubsRef.current = pendingSubsRef.current.filter(
        (s) => !(s.event === event && s.callback === callback)
      );
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
