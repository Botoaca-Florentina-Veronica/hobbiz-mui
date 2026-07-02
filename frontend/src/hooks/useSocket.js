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
    const serverUrl = explicitUrl || process.env.REACT_APP_API_URL || (mode === 'production' 
    ? 'https://hobbiz-app-kkull.ondigitalocean.app/' 
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

  // Anunță serverul ce conversație este activ vizualizată de acest utilizator — folosit
  // pentru a marca mesajele de sistem (negociere etc.) ca citite chiar la creare, fără
  // să se mai bazeze exclusiv pe un apel ulterior de pe client, fragil la curse.
  const joinConversation = (conversationId) => {
    const payload = { userId, conversationId };
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinConversation', payload);
    } else {
      pendingEmitsRef.current.push({ event: 'joinConversation', payload });
    }
  };

  const leaveConversation = () => {
    const payload = { userId };
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leaveConversation', payload);
    } else {
      pendingEmitsRef.current.push({ event: 'leaveConversation', payload });
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
    joinConversation,
    leaveConversation,
    on,
    off
  };
};

export default useSocket;
