import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import apiClient from '../api/api';
import './ChatPage.css';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('buying'); // 'buying' sau 'selling'
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const messagesEndRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const location = useLocation();

  // Fetch current user avatar
  useEffect(() => {
    if (!userId) return;
    
    const fetchCurrentUser = async () => {
      try {
        const response = await apiClient.get(`/api/users/profile/${userId}`);
        if (response.data && response.data.avatar) {
          setCurrentUserAvatar(response.data.avatar);
        }
      } catch (error) {
        console.error('Eroare la încărcarea profilului utilizatorului:', error);
      }
    };

    fetchCurrentUser();
  }, [userId]);

  // Fetch conversations
  useEffect(() => {
    if (!userId) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        console.log(`Încărcăm conversații pentru utilizatorul ${userId}`);
        
        // Folosim noul endpoint pentru conversații
        const response = await apiClient.get(`/api/messages/conversations/${userId}`);
        const conversationsData = response.data;
        
        console.log(`Primite ${conversationsData.length} conversații din backend`);
        
        // Formatează datele pentru UI
        const formattedConversations = conversationsData.map(conv => ({
          id: conv.otherParticipant.id,
          conversationId: conv.conversationId,
          name: `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`,
          lastMessage: conv.lastMessage.text,
          time: new Date(conv.lastMessage.createdAt).toLocaleString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          avatar: conv.otherParticipant.avatar || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.otherParticipant.firstName[0] + conv.otherParticipant.lastName[0])}&background=355070&color=fff`,
          unread: conv.unread,
          otherParticipant: conv.otherParticipant
        }));
        
        // Eliminăm duplicatele pe baza ID-ului participantului (extra verificare)
        const uniqueConversations = formattedConversations.filter((conv, index, arr) => 
          arr.findIndex(c => c.otherParticipant.id === conv.otherParticipant.id) === index
        );
        
        console.log(`Conversații originale: ${formattedConversations.length}, unice: ${uniqueConversations.length}`);
        
        setConversations(uniqueConversations);
      } catch (error) {
        console.error('Eroare la încărcarea conversațiilor:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, activeTab]);

  // Auto-selectează conversația din state (din notificări)
  useEffect(() => {
    if (location.state?.conversationId && conversations.length > 0) {
      // Extragem participanții din conversationId pentru a găsi utilizatorul
      const conversationId = location.state.conversationId;
      const participantIds = conversationId.split('-');
      const otherParticipantId = participantIds.find(id => id !== userId);
      
      if (otherParticipantId) {
        const targetConversation = conversations.find(conv => 
          conv.otherParticipant.id === otherParticipantId
        );
        if (targetConversation) {
          setSelectedConversation(targetConversation);
        }
      }
    }
  }, [location.state, conversations, userId]);

  // Fetch messages pentru conversația selectată
  useEffect(() => {
    if (!selectedConversation) return;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        console.log(`Încărcăm mesaje între ${userId} și ${selectedConversation.otherParticipant.id}`);
        
        // Folosim noul endpoint pentru mesajele între doi utilizatori
        const response = await apiClient.get(`/api/messages/between/${userId}/${selectedConversation.otherParticipant.id}`);
        
        console.log(`Primite ${response.data.length} mesaje din backend`);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Eroare la încărcarea mesajelor:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, userId]);

  // Scroll la ultimul mesaj
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Trimite mesaj
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Generăm conversationId din IDs-urile participanților (sortate pentru consistență)
      const participantIds = [userId, selectedConversation.otherParticipant.id].sort();
      const conversationId = participantIds.join('-');
      
      const messageData = {
        conversationId: conversationId,
        senderId: userId,
        senderRole: 'cumparator', // sau determină rolul în funcție de context
        text: newMessage.trim(),
        destinatarId: selectedConversation.otherParticipant.id
      };

      // Adaugă mesajul local
      const tempMessage = {
        ...messageData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        senderInfo: {
          firstName: 'Tu',
          lastName: '',
          avatar: currentUserAvatar
        }
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Trimite la server
      const response = await apiClient.post('/api/messages', messageData);
      
      // Înlocuiește mesajul temporar cu cel de pe server
      if (response.data) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessage._id ? {
            ...response.data,
            senderInfo: tempMessage.senderInfo
          } : msg
        ));
      }
    } catch (error) {
      console.error('Eroare la trimiterea mesajului:', error);
      // Elimină mesajul temporar în caz de eroare
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadConversations = conversations.filter(conv => conv.unread);
  const readConversations = conversations.filter(conv => !conv.unread);

  return (
    <>
      <Header />
      <div className="chat-page-container">
        <aside className="chat-sidebar">
          <div className="chat-tabs">
            <button 
              className={`chat-tab ${activeTab === 'buying' ? 'active' : ''}`}
              onClick={() => setActiveTab('buying')}
            >
              <span>De cumpărat</span>
            </button>
            <button 
              className={`chat-tab ${activeTab === 'selling' ? 'active' : ''}`}
              onClick={() => setActiveTab('selling')}
            >
              <span>De vândut</span>
            </button>
          </div>

          {unreadConversations.length > 0 && (
            <>
              <div className="chat-section-label">NECITITE ({unreadConversations.length})</div>
              <div className="chat-conversation-list">
                {unreadConversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className={`chat-conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <img 
                      className="chat-avatar" 
                      src={conversation.avatar} 
                      alt={conversation.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name[0] || 'U')}&background=355070&color=fff`;
                      }}
                    />
                    <div className="chat-conversation-info">
                      <div className="chat-conversation-name">{conversation.name}</div>
                      <div className="chat-conversation-message">{conversation.lastMessage}</div>
                    </div>
                    <div className="chat-conversation-time">{conversation.time}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {unreadConversations.length === 0 && (
            <>
              <div className="chat-section-label">NECITITE</div>
              <div className="chat-empty-state">
                <span role="img" aria-label="party">🎉</span> Ești la zi!
              </div>
            </>
          )}

          {readConversations.length > 0 && (
            <>
              <div className="chat-section-label">CITITE ({readConversations.length})</div>
              <div className="chat-conversation-list">
                {readConversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className={`chat-conversation-item read ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <img 
                      className="chat-avatar" 
                      src={conversation.avatar} 
                      alt={conversation.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name[0] || 'U')}&background=355070&color=fff`;
                      }}
                    />
                    <div className="chat-conversation-info">
                      <div className="chat-conversation-name">{conversation.name}</div>
                      <div className="chat-conversation-message">{conversation.lastMessage}</div>
                    </div>
                    <div className="chat-conversation-time">{conversation.time}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        <main className="chat-main">
          {!selectedConversation ? (
            <div className="chat-empty-main">
              <div className="chat-empty-icon">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="60" fill="#E3EDFF"/>
                  <circle cx="85" cy="85" r="40" fill="#355070"/>
                  <path d="M60 80c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z" fill="#D6E4FF"/>
                  <circle cx="60" cy="60" r="10" fill="#00394C"/>
                  <path d="M65 65c-2.5 2.5-7.5 2.5-10 0" stroke="#00394C" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="chat-empty-text">Selectează o conversație pentru a o citi</div>
              <div className="chat-empty-subtitle">
                Alege o conversație din lista de pe stânga pentru a începe să comunici
              </div>
            </div>
          ) : (
            <>
              <div className="chat-main-header">
                <img 
                  className="chat-main-avatar" 
                  src={selectedConversation.avatar} 
                  alt={selectedConversation.name}
                />
                <div className="chat-main-user-info">
                  <h3>{selectedConversation.name}</h3>
                  <p>Activ recent</p>
                </div>
              </div>

              <div className="chat-messages-container">
                {loading ? (
                  <div style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>
                    Se încarcă mesajele...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{textAlign: 'center', color: '#6b7280', padding: '20px'}}>
                    Nicio conversație încă. Scrie primul mesaj!
                  </div>
                ) : (
                  messages.map((message) => {
                    // Determinăm avatarul pentru mesaj
                    let messageAvatar;
                    if (message.senderId === userId) {
                      // Mesaj trimis de utilizatorul curent
                      messageAvatar = currentUserAvatar || 
                                    `https://ui-avatars.com/api/?name=Tu&background=355070&color=fff`;
                    } else {
                      // Mesaj primit - folosim avatarul din senderInfo
                      messageAvatar = message.senderInfo?.avatar || 
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent((message.senderInfo?.firstName?.[0] || '') + (message.senderInfo?.lastName?.[0] || ''))}&background=355070&color=fff`;
                    }

                    return (
                      <div 
                        key={message._id} 
                        className={`chat-message ${message.senderId === userId ? 'own' : ''}`}
                      >
                        <img 
                          className="chat-message-avatar" 
                          src={messageAvatar}
                          alt="avatar"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${message.senderId === userId ? 'Tu' : 'U'}&background=355070&color=fff`;
                          }}
                        />
                        <div className="chat-message-bubble">
                          <p className="chat-message-text">{message.text}</p>
                          <div className="chat-message-time">
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-container" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Scrie mesajul tău..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="chat-send-button"
                  disabled={!newMessage.trim()}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 2L11 13"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                  </svg>
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </>
  );
}
