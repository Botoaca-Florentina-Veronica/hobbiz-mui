import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import apiClient from '../api/api';
import './ChatPage.css';
// Import iconițe MUI
import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('buying'); // 'buying' sau 'selling'
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const userId = localStorage.getItem('userId');
  const location = useLocation();

  // Lista de emoji-uri populare
  const popularEmojis = ['😀', '😍', '🥰', '😊', '😂', '😭', '😎', '🤔', '😴', '🎉', '❤️', '👍', '👎', '🔥', '💯', '🙌', '👏', '🤝', '💪', '🎯'];

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Adaugă emoji în mesaj
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Gestionează selecția de imagini
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({
          file: file,
          preview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Elimină imaginea selectată
  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
          otherParticipant: conv.otherParticipant,
          lastSeen: conv.otherParticipant.lastSeen
        }));
        
        // Eliminăm duplicatele pe baza ID-ului participantului (extra verificare)
        const uniqueConversations = formattedConversations.filter((conv, index, arr) => 
          arr.findIndex(c => c.otherParticipant.id === conv.otherParticipant.id) === index
        );
        
        console.log(`Conversații originale: ${formattedConversations.length}, unice: ${uniqueConversations.length}`);
        
        setConversations(uniqueConversations);
      } catch (error) {
        if (error?.response?.status === 401) {
          setConversations([]);
        } else {
          console.error('Eroare la încărcarea conversațiilor:', error);
          setConversations([]);
        }
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
        
        // Marchează mesajele ca citite când se deschide conversația
        try {
          await apiClient.put(`/api/messages/mark-read/${userId}/${selectedConversation.otherParticipant.id}`);
        } catch (error) {
          console.error('Eroare la marcarea mesajelor ca citite:', error);
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          setMessages([]);
        } else {
          console.error('Eroare la încărcarea mesajelor:', error);
          setMessages([]);
        }
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
    if (!userId) {
      console.error('Utilizator neautentificat pentru trimiterea mesajelor.');
      return;
    }
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation) return;

    let tempMessage;
    
    try {
      // Generăm conversationId din IDs-urile participanților (sortate pentru consistență)
      const participantIds = [userId, selectedConversation.otherParticipant.id].sort();
      const conversationId = participantIds.join('-');
      
      // Construim payload: dacă avem imagine, folosim FormData (multipart)
      const useMultipart = !!selectedImage?.file;
      let messageData;
      if (useMultipart) {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('senderId', userId);
        formData.append('senderRole', 'cumparator');
        formData.append('destinatarId', selectedConversation.otherParticipant.id);
        if (newMessage.trim()) formData.append('text', newMessage.trim());
        // câmpul se numește 'image' ca să corespundă upload.single('image')
        formData.append('image', selectedImage.file);
        formData.append('imageFile', selectedImage.file.name);
        messageData = formData;
      } else {
        messageData = {
          conversationId: conversationId,
          senderId: userId,
          senderRole: 'cumparator',
          destinatarId: selectedConversation.otherParticipant.id,
          ...(newMessage.trim() ? { text: newMessage.trim() } : {})
        };
      }

      // Adaugă mesajul local
      tempMessage = {
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
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Trimite la server
      const response = await apiClient.post('/api/messages', messageData, useMultipart ? {
        headers: { 'Content-Type': 'multipart/form-data' }
      } : undefined);
      
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
      const backendMsg = error?.response?.data?.error;
      if (backendMsg) {
        console.error(`Eroare server: ${backendMsg}`);
      }
      // Elimină mesajul temporar în caz de eroare (doar dacă a fost creat)
      if (tempMessage) {
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      }
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funcție pentru formatarea datei separatorului
  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Resetăm orele pentru comparație corectă
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === today.getTime()) {
      return 'Astăzi';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short'
      }).toUpperCase();
    }
  };

  // Funcție pentru a verifica dacă două mesaje sunt în zile diferite
  const isDifferentDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() !== d2.toDateString();
  };

  const formatLastSeen = (lastSeenDate) => {
    if (!lastSeenDate) return 'Necunoscut';
    
    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 5) {
      return 'Online acum';
    } else if (diffInMinutes < 60) {
      return `Activ acum ${diffInMinutes} minute`;
    } else if (diffInHours < 24) {
      return `Activ acum ${diffInHours} ${diffInHours === 1 ? 'oră' : 'ore'}`;
    } else if (diffInDays === 1) {
      return 'Activ ieri';
    } else if (diffInDays < 7) {
      return `Activ acum ${diffInDays} zile`;
    } else {
      return lastSeen.toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Funcții pentru bara de acțiuni din mesaje
  const handleReplyMessage = (message) => {
    // Adaugă textul de reply în input
    setNewMessage(`@${message.senderInfo?.firstName || 'Utilizator'}: "${message.text}" \n`);
  };

  const handleReactToMessage = (messageId, emoji) => {
    // Aici poți implementa logica pentru reacții
    console.log(`React cu ${emoji} la mesajul ${messageId}`);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Elimină mesajul din lista locală
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      console.log('Mesaj șters:', messageId);
    } catch (error) {
      console.error('Eroare la ștergerea mesajului:', error);
    }
  };

  const handleCopyMessage = async (messageId, messageText) => {
    if (!messageText) return; // nimic de copiat
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(messageText);
      } else {
        // Fallback pentru contexte nesecurizate
        const textArea = document.createElement('textarea');
        textArea.value = messageText;
        // Evită scroll pe iOS
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(textArea);
        }
      }
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch (err) {
      console.error('Nu s-a putut copia mesajul:', err);
    }
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
                  <p>{formatLastSeen(selectedConversation.lastSeen)}</p>
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
                  messages.map((message, index) => {
                    // Verificăm dacă trebuie să afișăm un separator de dată
                    const showDateSeparator = index === 0 || 
                      (index > 0 && isDifferentDay(messages[index - 1].createdAt, message.createdAt));
                    
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
                      <React.Fragment key={message._id}>
                        {/* Separator de dată */}
                        {showDateSeparator && (
                          <div className="date-separator">
                            <div className="date-separator-line"></div>
                            <span className="date-separator-text">
                              {formatDateSeparator(message.createdAt)}
                            </span>
                            <div className="date-separator-line"></div>
                          </div>
                        )}

                        <div 
                          className={`chat-message ${message.senderId === userId ? 'own' : ''}`}
                          onMouseEnter={() => setHoveredMessageId(message._id)}
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {/* Bara de acțiuni - doar pentru mesajele proprii */}
                          {message.senderId === userId && hoveredMessageId === message._id && (
                            <div className="message-actions-bar">
                              <button 
                                className="message-action-btn"
                                onClick={() => handleReplyMessage(message)}
                                title="Răspunde"
                              >
                                <ReplyIcon fontSize="small" />
                              </button>
                              
                              <button 
                                className="message-action-btn"
                                onClick={() => handleReactToMessage(message._id, '😊')}
                                title="Reacționează"
                              >
                                <SentimentSatisfiedAltIcon fontSize="small" />
                              </button>
                              
                              <button 
                                className="message-action-btn copy"
                                onClick={() => handleCopyMessage(message._id, message.text)}
                                disabled={!message.text}
                                title="Copiază"
                              >
                                <ContentCopyIcon fontSize="small" />
                                {copiedMessageId === message._id && (
                                  <span className="message-copied">Copiat!</span>
                                )}
                              </button>
                              
                              <button 
                                className="message-action-btn delete"
                                onClick={() => handleDeleteMessage(message._id)}
                                title="Șterge"
                              >
                                <DeleteIcon fontSize="small" />
                              </button>
                            </div>
                          )}

                          {/* Avatar eliminat la cerere */}
                          <div className="chat-message-content-group">
                            <div className="chat-bubble-row">
                              <div className="chat-message-bubble">
                                {message.image && (
                                  <div className="chat-message-image">
                                    <img src={message.image} alt="Imagine trimisă" />
                                  </div>
                                )}
                                {message.text && (
                                  <p className="chat-message-text">{message.text}</p>
                                )}
                                {message.senderId === userId && (
                                  <span 
                                    className="chat-message-ticks" 
                                    aria-label="Livrat / citit"
                                    style={{ 
                                      color: message.isRead ? '#4fc3f7' : '#9e9e9e' // Albastru dacă citit, gri dacă nu
                                    }}
                                  >
                                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M2 9l2.5 2.5L8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M6 9l2.5 2.5L14 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="chat-message-time">{formatTime(message.createdAt)}</div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-container" onSubmit={handleSendMessage}>
                {selectedImage && (
                  <div className="chat-image-preview">
                    <img src={selectedImage.preview} alt="Preview" />
                    <button 
                      type="button" 
                      className="chat-image-remove" 
                      onClick={removeSelectedImage}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <div className="chat-input-wrapper">
                  <div className="chat-input-buttons">
                    <button 
                      type="button" 
                      className="chat-input-button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Atașează imagine"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49"/>
                      </svg>
                    </button>
                    
                    <button 
                      type="button" 
                      className="chat-input-button"
                      onClick={toggleEmojiPicker}
                      title="Adaugă emoji"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </button>
                  </div>
                  
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
                    disabled={!newMessage.trim() && !selectedImage}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                  </button>
                </div>

                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />

                {/* Emoji picker */}
                {showEmojiPicker && (
                  <div className="chat-emoji-picker">
                    <div className="chat-emoji-grid">
                      {popularEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          className="chat-emoji-button"
                          onClick={() => addEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
        </main>
      </div>
    </>
  );
}
