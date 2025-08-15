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
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';

// Helper: normalize avatar/announcement image URLs
const resolveAvatarUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  // Normalize already-uploaded relative paths like 'uploads/...' or '/uploads/...'
  const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
  return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
};

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
  const [selectedReply, setSelectedReply] = useState(null);
  const [reactionTargetId, setReactionTargetId] = useState(null);
  // Drawer mobil pentru lista de conversații (deschis implicit pe mobil)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 600;
    }
    return false;
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  // refs inutile eliminate
  const userId = localStorage.getItem('userId');
  const location = useLocation();

  // Detectează mobil pentru a ascunde lista când este selectată o conversație
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth <= 600;
    return false;
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isChattingOnMobile = isMobile && !!selectedConversation;

  // Accent color helpers: blue in light mode, pink in dark mode
  const getIsDarkMode = () => {
    if (typeof document === 'undefined') return false;
    const b = document.body;
    const de = document.documentElement;
    return (b && b.classList.contains('dark-mode')) || (de && de.classList.contains('dark-mode'));
  };
  const getAccentHex = () => (getIsDarkMode() ? 'f51866' : '355070');
  const getAccentCss = () => `#${getAccentHex()}`;

  // Lista de emoji-uri populare
  const popularEmojis = ['😀', '😍', '🥰', '😊', '😂', '😭', '😎', '🤔', '😴', '🎉', '❤️', '👍', '👎', '🔥', '💯', '🙌', '👏', '🤝', '💪', '🎯'];
  // Emoji-urile disponibile pentru reacții rapide (stil WhatsApp)
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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
    // asigură-te că pe mobil e deschis la montare
    if (typeof window !== 'undefined' && window.innerWidth <= 600) {
      setIsSidebarOpen(true);
    }
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
          const formattedConversations = conversationsData.map(conv => {
            const participantAvatar = resolveAvatarUrl(conv.otherParticipant?.avatar);
            const announcementImg = resolveAvatarUrl(conv.announcementImage);
            return {
              id: conv.otherParticipant.id,
              conversationId: conv.conversationId,
              name: `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`.trim(),
              lastMessage: conv.lastMessage.text,
              time: new Date(conv.lastMessage.createdAt).toLocaleString('ro-RO', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              // Prefer avatarul utilizatorului; dacă lipsește, folosim imaginea anunțului ca fallback
              avatar: participantAvatar || announcementImg || '',
              unread: conv.unread,
              otherParticipant: conv.otherParticipant,
              lastSeen: conv.otherParticipant.lastSeen,
              announcementOwnerId: conv.announcementOwnerId // nou, pentru split
            };
          });

          // Split conversations by role
          const sellingConversations = formattedConversations.filter(conv => conv.announcementOwnerId === userId);
          const buyingConversations = formattedConversations.filter(conv => conv.announcementOwnerId !== userId);

          // Nu mai eliminăm duplicatele pe baza ID-ului participantului, păstrăm fiecare conversație per anunț
          if (activeTab === 'selling') {
            setConversations(sellingConversations);
          } else {
            setConversations(buyingConversations);
          }
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
        if (selectedReply) {
          formData.append('replyTo', JSON.stringify({
            messageId: selectedReply.messageId,
            senderId: selectedReply.senderId,
            text: selectedReply.text,
            image: selectedReply.image
          }));
        }
        messageData = formData;
      } else {
        messageData = {
          conversationId: conversationId,
          senderId: userId,
          senderRole: 'cumparator',
          destinatarId: selectedConversation.otherParticipant.id,
          ...(newMessage.trim() ? { text: newMessage.trim() } : {}),
          ...(selectedReply ? { replyTo: {
            messageId: selectedReply.messageId,
            senderId: selectedReply.senderId,
            text: selectedReply.text,
            image: selectedReply.image
          }} : {})
        };
      }

      // Adaugă mesajul local (evităm spread pe FormData)
      const nowIso = new Date().toISOString();
      tempMessage = {
        _id: Date.now().toString(),
        conversationId,
        senderId: userId,
        senderRole: 'cumparator',
        destinatarId: selectedConversation.otherParticipant.id,
        text: newMessage.trim() || undefined,
        image: selectedImage?.preview || undefined,
        replyTo: selectedReply ? {
          messageId: selectedReply.messageId,
          senderId: selectedReply.senderId,
          text: selectedReply.text,
          image: selectedReply.image
        } : undefined,
        createdAt: nowIso,
        senderInfo: {
          firstName: 'Tu',
          lastName: '',
          avatar: currentUserAvatar
        }
      };
      setMessages(prev => [...prev, tempMessage]);
  setNewMessage('');
  setSelectedReply(null);
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
            // Asigură că replyTo rămâne vizibil dacă backend-ul nu-l reflectă
            replyTo: response.data.replyTo || tempMessage.replyTo,
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
    const senderName = message.senderId === userId ? 'Tu' : (message.senderInfo?.firstName || 'Utilizator');
    setSelectedReply({
      messageId: message._id,
      senderId: message.senderId,
      senderName,
      text: message.text || '',
      image: message.image || null,
    });
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      const res = await apiClient.post(`/api/messages/${messageId}/react`, { emoji });
      const updated = res.data;
      setMessages(prev => prev.map(m => m._id === messageId ? {
        ...m,
        ...updated,
        // păstrează senderInfo existent dacă lipsește din răspuns
        senderInfo: m.senderInfo || updated.senderInfo
      } : m));
    } catch (err) {
      console.error('Eroare la setarea reacției:', err?.response?.data || err.message);
    } finally {
      setReactionTargetId(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    console.log('🗑️ ChatPage: Încercăm să ștergem mesajul cu ID:', messageId);
    try {
      // Folosim apiClient care atașează automat token-ul JWT în Authorization
      const { status, data } = await apiClient.delete(`/api/messages/${messageId}`);
      console.log('📡 Răspuns HTTP status:', status);
      console.log('✅ Rezultat backend:', data);

      // Elimină mesajul din lista locală doar dacă ștergerea din BD a fost cu succes
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      console.log('✅ ChatPage: Mesaj șters cu succes:', messageId);
    } catch (error) {
      // Log detaliat
      console.error('❌ ChatPage: Eroare la ștergerea mesajului:', error);
      console.error('❌ Detalii backend:', error.response?.data);
      // TODO: opțional - afișează un toast/alert pentru utilizator
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
      {/* Top bar mobil cu buton pentru conversații */}
      <div className="chat-mobile-topbar">
        <button
          type="button"
          className="chat-mobile-toggle"
          onClick={() => setIsSidebarOpen(true)}
        >
          ☰ Conversații{unreadConversations.length > 0 ? ` (${unreadConversations.length})` : ''}
        </button>
      </div>
      <div className={`chat-page-container ${isChattingOnMobile ? 'mobile-chatting' : ''}`}>
        {!isChattingOnMobile && (
        <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
                    onClick={async () => {
                      // Selectează conversația
                      setSelectedConversation(conversation);
                      // Închide drawer-ul pe mobil după selectare
                      setIsSidebarOpen(false);
                      // Marcăm local conversația ca citită ca să o mutăm din secțiunea NECITITE imediat în UI
                      setConversations(prev => prev.map(c =>
                        c.otherParticipant.id === conversation.otherParticipant.id
                          ? { ...c, unread: false }
                          : c
                      ));
                      // Backend: marchează mesajele ca citite (deja se face și în useEffect, dar dăm un semnal imediat)
                      try {
                        await apiClient.put(`/api/messages/mark-read/${userId}/${conversation.otherParticipant.id}`);
                      } catch (e) {
                        // Non-blocking
                      }
                    }}
                  >
                    <img 
                      className="chat-avatar" 
                      src={conversation.avatar} 
                      alt={conversation.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name[0] || 'U')}&background=${getAccentHex()}&color=fff`;
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
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <img 
                      className="chat-avatar" 
                      src={conversation.avatar} 
                      alt={conversation.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name[0] || 'U')}&background=${getAccentHex()}&color=fff`;
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
        )}

        <main className="chat-main">
          {isChattingOnMobile && (
            <div className="chat-main-header" style={{display:'flex', alignItems:'center', gap:8}}>
              <button type="button" onClick={() => setSelectedConversation(null)} className="chat-mobile-back" aria-label="Înapoi la conversații" style={{border:'none',background:'transparent',padding:8}}>
                ← Înapoi
              </button>
            </div>
          )}
          {!selectedConversation ? (
            <div className="chat-empty-main">
              <div className="chat-empty-icon">
                <ForumOutlinedIcon sx={{ fontSize: 96, color: getAccentCss() }} />
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
                                    `https://ui-avatars.com/api/?name=Tu&background=${getAccentHex()}&color=fff`;
                    } else {
                      // Mesaj primit - folosim avatarul din senderInfo
                      messageAvatar = message.senderInfo?.avatar || 
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent((message.senderInfo?.firstName?.[0] || '') + (message.senderInfo?.lastName?.[0] || ''))}&background=${getAccentHex()}&color=fff`;
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
                        >
                          {/* ...existing code... */}

                          {/* Avatar eliminat la cerere */}
                          <div className="chat-message-content-group">
                            <div className="chat-bubble-row">
                              <div 
                                className="chat-message-bubble"
                                onMouseEnter={() => setHoveredMessageId(message._id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                              >
                                {/* Bara de acțiuni - mesajele proprii */}
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
                                      onClick={() => setReactionTargetId(prev => prev === message._id ? null : message._id)}
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
                                {/* Bara de acțiuni - mesajele primite (fără Șterge) */}
                                {message.senderId !== userId && hoveredMessageId === message._id && (
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
                                      onClick={() => setReactionTargetId(prev => prev === message._id ? null : message._id)}
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
                                  </div>
                                )}
                                {/* Secțiune reply pentru mesaj */}
                                {message.replyTo && (
                                  <div className={`chat-reply-preview ${message.senderId === userId ? 'own' : ''}`}>
                                    <div className="chat-reply-bar" />
                                    <div className="chat-reply-content">
                                      <div className="chat-reply-author">
                                        {message.replyTo.senderId === userId
                                          ? 'Tu'
                                          : (message.replyTo.senderId === selectedConversation.otherParticipant.id
                                              ? selectedConversation.name
                                              : (message.senderInfo?.firstName || 'Utilizator'))}
                                      </div>
                                      {message.replyTo.text && (
                                        <div className="chat-reply-text">{message.replyTo.text}</div>
                                      )}
                                      {!message.replyTo.text && message.replyTo.image && (
                                        <div className="chat-reply-text">Imagine</div>
                                      )}
                                    </div>
                                  </div>
                                )}
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
                                      color: message.isRead ? getAccentCss() : '#9ca3af' // accent dacă citit, gri dacă nu
                                    }}
                                  >
                                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M2 9l2.5 2.5L8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M6 9l2.5 2.5L14 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </span>
                                )}
                                {/* Reacții fixate pe bulă (colț interior) */}
                                {Array.isArray(message.reactions) && message.reactions.length > 0 && (
                                  <div className={`message-reactions-bubble ${message.senderId === userId ? 'own' : ''}`}>
                                    {Object.entries(
                                      message.reactions.reduce((acc, r) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                        return acc;
                                      }, {})
                                    ).map(([emoji, count]) => {
                                      const mine = message.reactions.some(r => r.userId === userId && r.emoji === emoji);
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          className={`reaction-item ${mine ? 'mine' : ''}`}
                                          onClick={() => handleReactToMessage(message._id, emoji)}
                                          title={mine ? 'Elimină reacția' : 'Reacționează'}
                                        >
                                          <span className="emoji">{emoji}</span>
                                          {count > 1 && (<span className="count">{count}</span>)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="chat-message-time">{formatTime(message.createdAt)}</div>
                          </div>
                          
                          
                          
                          {/* Picker reacții, ancorat deasupra mesajului */}
                          {hoveredMessageId === message._id && reactionTargetId === message._id && (
                            <div className={`reaction-picker ${message.senderId === userId ? 'own' : ''}`}>
                              {reactionEmojis.map((emo) => (
                                <button
                                  key={emo}
                                  type="button"
                                  className="reaction-option"
                                  onClick={() => handleReactToMessage(message._id, emo)}
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-container" onSubmit={handleSendMessage}>
                {selectedReply && (
                  <div className="chat-reply-composer">
                    <div className="chat-reply-bar" />
                    <div className="chat-reply-content">
                      <div className="chat-reply-author">Răspuns către {selectedReply.senderName}</div>
                      {selectedReply.text ? (
                        <div className="chat-reply-text">{selectedReply.text}</div>
                      ) : (
                        <div className="chat-reply-text">Imagine</div>
                      )}
                    </div>
                    <button type="button" className="chat-reply-cancel" onClick={() => setSelectedReply(null)} aria-label="Anulează răspunsul">×</button>
                  </div>
                )}
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
