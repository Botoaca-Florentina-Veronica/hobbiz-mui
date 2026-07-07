import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Conexiunea Socket.IO e partajată la nivel de modul — un singur socket per
// tab, indiferent câte componente (AuthContext, ChatPage, ChatPopup) apelează
// useSocket simultan. Înainte, fiecare apelant crea propria conexiune, deci
// fiecare plătea din nou handshake-ul connect+join la fiecare montare —
// evenimentele 'userTyping' trimise de celălalt utilizator în acea fereastră
// (înainte ca join să se termine pe acel socket anume) se pierdeau silențios.
// Cu un singur socket partajat, conexiunea e deja stabilită și în camera
// 'user:<id>' cu mult înainte ca ChatPage/ChatPopup să se monteze (AuthContext
// o inițiază imediat după autentificare), deci indicatorul de typing nu mai
// depinde de un nou handshake de fiecare dată când deschizi un chat.
let sharedSocket = null;
let sharedUserId = null;
let consumerCount = 0;
const pendingSubs = []; // [{ event, callback }]
const pendingEmits = []; // [{ event, payload }]

function resolveServerUrl() {
  const mode = import.meta.env.MODE;
  const explicitUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  return explicitUrl || process.env.REACT_APP_API_URL || (mode === 'production'
    ? 'https://hobbiz-app-kkull.ondigitalocean.app/'
    : 'http://localhost:5000');
}

function ensureSocket(userId) {
  if (sharedSocket && sharedUserId === userId) return sharedSocket;

  // userId nou (sau prima conexiune) — orice conexiune veche aparține altui user.
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }

  const serverUrl = resolveServerUrl();
  if (!serverUrl) {
    console.warn('[useSocket] No Socket.IO server URL set. Define VITE_SOCKET_URL or VITE_API_URL.');
    return null;
  }

  sharedUserId = userId;
  sharedSocket = io(serverUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  // La (re)conectare (inclusiv reconnect automat după pierderea rețelei):
  // rejoin camera + golește orice emit/subscribe pus în coadă cât timp
  // conexiunea nu era încă gata.
  sharedSocket.on('connect', () => {
    sharedSocket.emit('join', userId);
    if (pendingSubs.length) {
      pendingSubs.forEach(({ event, callback }) => sharedSocket.on(event, callback));
      pendingSubs.length = 0;
    }
    if (pendingEmits.length) {
      pendingEmits.forEach(({ event, payload }) => sharedSocket.emit(event, payload));
      pendingEmits.length = 0;
    }
  });

  return sharedSocket;
}

const useSocket = (userId) => {
  useEffect(() => {
    if (!userId) return;
    ensureSocket(userId);
    consumerCount += 1;

    return () => {
      consumerCount -= 1;
      // Deconectăm doar când ULTIMUL consumator (de obicei AuthContext,
      // montat cât timp ești autentificat) se demontează — nu la fiecare
      // închidere de ChatPopup/ChatPage individual.
      if (consumerCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedUserId = null;
        consumerCount = 0;
      }
    };
  }, [userId]);

  // Emit typing status
  const emitTyping = (conversationId, isTyping) => {
    const payload = { conversationId, isTyping };
    if (sharedSocket && sharedSocket.connected) {
      sharedSocket.emit('typing', payload);
    } else {
      pendingEmits.push({ event: 'typing', payload });
    }
  };

  // Anunță serverul ce conversație este activ vizualizată de acest utilizator — folosit
  // pentru a marca mesajele de sistem (negociere etc.) ca citite chiar la creare, fără
  // să se mai bazeze exclusiv pe un apel ulterior de pe client, fragil la curse.
  const joinConversation = (conversationId) => {
    const payload = { userId, conversationId };
    if (sharedSocket && sharedSocket.connected) {
      sharedSocket.emit('joinConversation', payload);
    } else {
      pendingEmits.push({ event: 'joinConversation', payload });
    }
  };

  const leaveConversation = () => {
    const payload = { userId };
    if (sharedSocket && sharedSocket.connected) {
      sharedSocket.emit('leaveConversation', payload);
    } else {
      pendingEmits.push({ event: 'leaveConversation', payload });
    }
  };

  // Listen for events
  const on = (event, callback) => {
    if (sharedSocket) {
      sharedSocket.on(event, callback);
    } else {
      // Queue until socket connects
      pendingSubs.push({ event, callback });
    }
  };

  const off = (event, callback) => {
    if (sharedSocket) {
      sharedSocket.off(event, callback);
    }
    // Elimină și din coadă dacă nu a apucat încă să fie atașat.
    const idx = pendingSubs.findIndex((s) => s.event === event && s.callback === callback);
    if (idx !== -1) pendingSubs.splice(idx, 1);
  };

  return {
    socket: sharedSocket,
    emitTyping,
    joinConversation,
    leaveConversation,
    on,
    off
  };
};

export default useSocket;
