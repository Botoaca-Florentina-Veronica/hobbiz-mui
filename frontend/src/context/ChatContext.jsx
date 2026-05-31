import { createContext, useContext, useState } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [popupChat, setPopupChat] = useState(null);
  // popupChat: { announcement, seller, userId, userRole, minimized }

  const openPopupChat = (data) => setPopupChat({ ...data, minimized: false });
  const closePopupChat = () => setPopupChat(null);
  const toggleMinimize = () =>
    setPopupChat((prev) => (prev ? { ...prev, minimized: !prev.minimized } : null));

  return (
    <ChatContext.Provider value={{ popupChat, openPopupChat, closePopupChat, toggleMinimize }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
