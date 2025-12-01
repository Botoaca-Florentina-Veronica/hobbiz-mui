import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';

import Header from '../components/Header';
import TypingIndicator from '../components/TypingIndicator';
import useSocket from '../hooks/useSocket';
import apiClient from '../api/api';

import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBack from '@mui/icons-material/ArrowBack';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import gumballChat from '../assets/images/gumballChat.jpg';

import './ChatPage.css';

const resolveAvatarUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
  return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
};

const getIsDarkMode = () => {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains('dark-mode');
};
const getAccentHex = () => (getIsDarkMode() ? 'f51866' : '355070');

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem('userId');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(380);

  const [activeTab, setActiveTab] = useState('buying');
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
  
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [userLastSeen, setUserLastSeen] = useState({});

  const MOBILE_BREAKPOINT = 1024;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

  const isChattingOnMobile = isMobile && !!selectedConversation;
  const isDesktop = !isMobile;

  const { emitTyping, on, off } = useSocket(userId);

  // Socket listeners for online status and typing
  useEffect(() => {
    if (!userId) return;

    const handleUserOnline = (data) => {
      setOnlineUsers(prev => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(data.userId);
        return updated;
      });
      if (data.userId && data.lastSeen) {
        setUserLastSeen(prev => ({ ...prev, [data.userId]: data.lastSeen }));
      }
    };

    const handleTypingStatus = (data) => {
      if (data.userId === userId) return; // Ignore own typing
      setTypingUsers(prev => {
        const updated = new Set(prev);
        if (data.isTyping) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
    };

    const handleOnlineUsersList = (data) => {
      if (data.userIds) {
        setOnlineUsers(new Set(data.userIds));
      }
    };

    on('user:online', handleUserOnline);
    on('user:offline', handleUserOffline);
    on('typing', handleTypingStatus);
    on('online:users', handleOnlineUsersList);

    return () => {
      off('user:online', handleUserOnline);
      off('user:offline', handleUserOffline);
      off('typing', handleTypingStatus);
      off('online:users', handleOnlineUsersList);
    };
  }, [userId, on, off]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && !selectedConversation) setIsSidebarOpen(true);
  }, [isMobile, selectedConversation]);

  // Sidebar Dragging
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - startXRef.current;
      setSidebarWidth(Math.max(240, Math.min(720, startWidthRef.current + dx)));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleDocClick = (e) => {
      if (e.target.closest('.reaction-picker') || e.target.closest('.message-action-btn')) return;
      if (reactionTargetId) setReactionTargetId(null);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [reactionTargetId]);

  // Fetch Data
  useEffect(() => {
    if (!userId) return;
    apiClient.get(`/api/users/profile/${userId}`).then(res => {
      if (res.data?.avatar) setCurrentUserAvatar(res.data.avatar);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const fetchConv = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/messages/conversations/${userId}`);
        const data = res.data || [];
        const formatted = data.map(c => {
          const partAvatar = resolveAvatarUrl(c.otherParticipant?.avatar);
          const annImg = resolveAvatarUrl(c.announcementImage);
          return {
            ...c,
            id: c.otherParticipant.id,
            avatar: (annImg || partAvatar) || partAvatar,
            participantName: `${c.otherParticipant.firstName} ${c.otherParticipant.lastName}`.trim(),
            participantAvatar: partAvatar,
            displayTitle: c.announcementTitle || c.name || '(Fără titlu)',
            lastMessageText: c.lastMessage?.text || 'Imagine',
            timeFormatted: new Date(c.lastMessage?.createdAt).toLocaleString('ro-RO', {hour:'2-digit', minute:'2-digit'})
          };
        });
        if (activeTab === 'selling') {
          setConversations(formatted.filter(c => c.announcementOwnerId === userId));
        } else {
          setConversations(formatted.filter(c => c.announcementOwnerId !== userId));
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchConv();
  }, [userId, activeTab]);

  useEffect(() => {
    const targetId = location.state?.conversationId;
    if (targetId && conversations.length > 0 && !selectedConversation) {
      const found = conversations.find(c => c.conversationId === targetId);
      if (found) setSelectedConversation(found);
    }
  }, [location.state, conversations, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;
    const fetchMsgs = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/messages/conversation/${selectedConversation.conversationId}`);
        setMessages(res.data || []);
        await apiClient.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`);
        setConversations(prev => prev.map(c => c.conversationId === selectedConversation.conversationId ? { ...c, unread: false } : c));
        window.dispatchEvent(new Event('chat:counts-updated'));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchMsgs();
  }, [selectedConversation]);

  // Socket
  useEffect(() => {
    if (!userId) return;
    const handleNew = (msg) => {
      if (selectedConversation && msg.conversationId === selectedConversation.conversationId) {
        setMessages(prev => { if (prev.some(m => m._id === msg._id)) return prev; return [...prev, msg]; });
      }
    };
    on('newMessage', handleNew);
    return () => off('newMessage', handleNew);
  }, [userId, selectedConversation, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    const tempId = Date.now().toString();
    const payload = {
      _id: tempId, conversationId: selectedConversation.conversationId, senderId: userId,
      destinatarId: selectedConversation.otherParticipant.id,
      text: newMessage.trim(), image: selectedImage?.preview,
      createdAt: new Date().toISOString(), isRead: false,
      senderInfo: { firstName: 'Tu', avatar: currentUserAvatar },
      replyTo: selectedReply ? { ...selectedReply } : undefined,
      reactions: []
    };
    setMessages(prev => [...prev, payload]);
    setNewMessage('');
    setSelectedImage(null);
    setSelectedReply(null);
    
    try {
      const formData = new FormData();
      formData.append('conversationId', selectedConversation.conversationId);
      formData.append('senderId', userId);
      formData.append('destinatarId', selectedConversation.otherParticipant.id);
      if (payload.text) formData.append('text', payload.text);
      if (selectedImage?.file) formData.append('image', selectedImage.file);
      if (selectedReply) formData.append('replyTo', JSON.stringify({ messageId: selectedReply.messageId, text: selectedReply.text, image: selectedReply.image, senderId: selectedReply.senderId }));
      
      const res = await apiClient.post('/api/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      setMessages(prev => prev.map(m => m._id === tempId ? { ...res.data, senderInfo: payload.senderInfo } : m));
    } catch (err) { setMessages(prev => prev.filter(m => m._id !== tempId)); }
  };

  // --- LOGICA REACȚII (Toggle) ---
  const handleReactToMessage = async (msgId, emoji) => {
    setReactionTargetId(null);
    
    // Optimistic UI Update
    setMessages(prev => prev.map(msg => {
      if (msg._id !== msgId) return msg;
      
      const reactions = msg.reactions || [];
      const existingIndex = reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
      
      let newReactions;
      if (existingIndex > -1) {
        // Toggle OFF (Remove)
        newReactions = reactions.filter((_, i) => i !== existingIndex);
      } else {
        // Toggle ON (Add)
        newReactions = [...reactions, { userId, emoji, createdAt: new Date() }];
      }
      return { ...msg, reactions: newReactions };
    }));

    try {
      // Call endpoint
      // Observație: Asumăm că backend-ul știe să facă toggle sau add.
      // Dacă backend-ul suportă doar add, ar trebui un endpoint de delete.
      // Aici trimitem cererea și actualizăm cu răspunsul serverului.
      const res = await apiClient.post(`/api/messages/${msgId}/react`, { emoji });
      
      setMessages(prev => prev.map(m => m._id === msgId ? { 
        ...m, 
        reactions: res.data.reactions || m.reactions // Fallback 
      } : m));
    } catch (e) {
      console.error(e);
      // Revert in case of error would require storing prev state, skipped for brevity
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage({ file, preview: ev.target.result });
      reader.readAsDataURL(file);
    }
  };

  // Helper function to format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Offline';
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum un moment';
    if (diffMins < 60) return `Acum ${diffMins} min`;
    if (diffHours < 24) return `Acum ${diffHours}h`;
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `Acum ${diffDays} zile`;
    return lastSeen.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  // Helper function to format date for separators
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date);
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    msgDate.setHours(0, 0, 0, 0);
    
    if (msgDate.getTime() === today.getTime()) {
      return 'Astăzi';
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return 'Ieri';
    } else {
      const day = new Date(date).getDate();
      // Some locales return abbreviated month with a trailing dot (e.g. 'sept.'),
      // so strip any trailing dots before adding our standardized dot.
      let month = new Date(date).toLocaleString('ro-RO', { month: 'short' }).toUpperCase();
      month = month.replace(/\.+$/g, '');
      return `${day} ${month}.`;
    }
  };

  const popularEmojis = ['😀', '😍', '🥰', '😊', '😂', '😭', '😎', '🤔', '😴', '🎉', '❤️', '👍', '👎', '🔥', '💯'];
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  const unreadConvs = conversations.filter(c => c.unread);
  const readConvs = conversations.filter(c => !c.unread);

  return (
    <>
      <Header />
      <div className="chat-mobile-topbar">
        <button type="button" className="chat-mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
          ☰ Conversații {unreadConvs.length > 0 && `(${unreadConvs.length})`}
        </button>
      </div>

      <div className={`chat-page-container ${isChattingOnMobile ? 'mobile-chatting' : ''}`}>
        
        {/* Sidebar */}
        <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`} style={isDesktop ? { width: sidebarWidth } : {}}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, mb: 1, pt: 'clamp(36px, 7vh, 72px)', px: 2 }}>
            <IconButton onClick={() => navigate('/')} sx={{ color: 'var(--c-text-primary)' }}><ArrowBack /></IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--c-text-primary)' }}>Chat</Typography>
          </Box>

          <div className="chat-tabs">
            <button className={`chat-tab ${activeTab === 'buying' ? 'active' : ''}`} onClick={() => setActiveTab('buying')}>De cumpărat</button>
            <button className={`chat-tab ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')}>De vândut</button>
          </div>

          <div className="chat-conversation-list">
            {unreadConvs.length > 0 && <div className="chat-section-label">NECITITE</div>}
            {unreadConvs.map(c => (
              <div key={c.conversationId} className={`chat-conversation-item unread ${selectedConversation?.conversationId === c.conversationId ? 'selected' : ''}`} onClick={() => { setSelectedConversation(c); setIsSidebarOpen(false); }}>
                <img className="chat-avatar" src={c.avatar} alt="av" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${(c.displayTitle||'U').slice(0,1)}&background=${getAccentHex()}&color=fff`; }}/>
                <div className="chat-conversation-info">
                  <div className="chat-conversation-owner">{c.announcementOwnerName}</div>
                  <div className="chat-conversation-title">{c.displayTitle}</div>
                  <div className="chat-conversation-message">{c.lastMessageText}</div>
                </div>
                <div className="chat-conversation-time">{c.timeFormatted}</div>
              </div>
            ))}
            {readConvs.length > 0 && <div className="chat-section-label">CITITE</div>}
            {readConvs.map(c => (
              <div key={c.conversationId} className={`chat-conversation-item read ${selectedConversation?.conversationId === c.conversationId ? 'selected' : ''}`} onClick={() => { setSelectedConversation(c); setIsSidebarOpen(false); }}>
                <img className="chat-avatar" src={c.avatar} alt="av" onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${(c.displayTitle||'U').slice(0,1)}&background=${getAccentHex()}&color=fff`; }}/>
                <div className="chat-conversation-info">
                  <div className="chat-conversation-owner">{c.announcementOwnerName}</div>
                  <div className="chat-conversation-title">{c.displayTitle}</div>
                  <div className="chat-conversation-message">{c.lastMessageText}</div>
                </div>
                <div className="chat-conversation-time">{c.timeFormatted}</div>
              </div>
            ))}
          </div>
        </aside>

        {isDesktop && <div className="chat-separator" onMouseDown={(e) => { draggingRef.current = true; startXRef.current = e.clientX; startWidthRef.current = sidebarWidth; document.body.style.userSelect = 'none'; }} />}

        {/* Main Chat */}
        <main className="chat-main">
          {selectedConversation ? (
            <>
              <div className="chat-main-header">
                {isMobile && <IconButton onClick={() => setSelectedConversation(null)} sx={{color: 'var(--c-text-primary)'}}><ArrowBack /></IconButton>}
                <img className="chat-main-avatar" src={selectedConversation.participantAvatar} alt="av" onClick={() => navigate(`/profil/${selectedConversation.id}`)}/>
                <div className="chat-main-user-info">
                  <h3>{selectedConversation.participantName}</h3>
                  <p className="chat-user-status">
                    {typingUsers.has(selectedConversation.otherParticipant?.id) ? (
                      <span className="typing-status">tastează...</span>
                    ) : onlineUsers.has(selectedConversation.otherParticipant?.id) ? (
                      <span className="online-status">● Activ acum</span>
                    ) : (
                      <span className="offline-status">{formatLastSeen(userLastSeen[selectedConversation.otherParticipant?.id])}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="chat-messages-container">
                {loading && <CircularProgress sx={{ alignSelf: 'center', mt: 2 }} />}
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === userId;
                  // Group reactions
                  const reactionCounts = (msg.reactions || []).reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {});
                  const myReactions = (msg.reactions || []).filter(r => r.userId === userId).map(r => r.emoji);

                  // Check if we need a date separator
                  const showDateSeparator = i === 0 || 
                    new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                  return (
                    <React.Fragment key={msg._id || i}>
                      {showDateSeparator && (
                        <div className="chat-date-separator">
                          <span className="chat-date-separator-text">{formatDateSeparator(msg.createdAt)}</span>
                        </div>
                      )}
                    <div className={`chat-message ${isOwn ? 'own' : ''}`} onMouseEnter={() => setHoveredMessageId(msg._id)} onMouseLeave={() => setHoveredMessageId(null)}>
                      <div className="chat-message-content-group">
                        <div className="chat-bubble-row">
                          <div className="chat-message-bubble">
                            {msg.replyTo && <div className={`chat-reply-preview ${msg.replyTo.senderId === userId ? 'own' : ''}`}><div className="chat-reply-text">{msg.replyTo.text || 'Imagine'}</div></div>}
                            {msg.image && <div className="chat-message-image"><img src={msg.image} alt="att" /></div>}
                            {msg.text && <p className="chat-message-text">{msg.text}</p>}
                            
                            {/* ACTIONS HOVER */}
                            {hoveredMessageId === msg._id && reactionTargetId !== msg._id && (
                              <div className="message-actions-bar">
                                <button className="message-action-btn" onClick={() => setSelectedReply({ messageId: msg._id, senderId: msg.senderId, senderName: isOwn ? 'Tu' : 'Utilizator', text: msg.text, image: msg.image })}><ReplyIcon fontSize="small"/></button>
                                <button className="message-action-btn" onClick={() => setReactionTargetId(msg._id)}><SentimentSatisfiedAltIcon fontSize="small"/></button>
                                <button className="message-action-btn copy" onClick={() => { navigator.clipboard.writeText(msg.text||''); setCopiedMessageId(msg._id); setTimeout(()=>setCopiedMessageId(null), 1200); }}>
                                  <ContentCopyIcon fontSize="small"/>
                                  {copiedMessageId === msg._id && (
                                    <div className="message-copied" role="status" aria-live="polite">Copiat</div>
                                  )}
                                </button>
                                {isOwn && <button className="message-action-btn" onClick={() => { apiClient.delete(`/api/messages/${msg._id}`).then(() => setMessages(p => p.filter(m => m._id !== msg._id))); }}><DeleteIcon fontSize="small"/></button>}
                              </div>
                            )}

                            {/* REACTIONS PILLS */}
                            {Object.keys(reactionCounts).length > 0 && (
                              <div className="message-reactions-bubble">
                                {Object.entries(reactionCounts).map(([emoji, count]) => {
                                  const iReacted = myReactions.includes(emoji);
                                  return (
                                    <div 
                                      key={emoji} 
                                      className={`reaction-chip ${iReacted ? 'mine' : ''}`}
                                      onClick={() => handleReactToMessage(msg._id, emoji)}
                                      title={iReacted ? 'Șterge reacția' : 'Adaugă reacție'}
                                    >
                                      <span>{emoji}</span>
                                      {count > 1 && <span style={{marginLeft:2, fontWeight:600}}>{count}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="chat-message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          {isOwn && <DoneAllIcon fontSize="inherit" sx={{ ml: 0.5, color: msg.isRead ? 'var(--chat-tick-read, #40a9ff)' : 'inherit' }} />}
                        </div>
                      </div>

                      {reactionTargetId === msg._id && (
                        <div className="reaction-picker">
                          {reactionEmojis.map(e => <button key={e} className="reaction-option" onClick={() => handleReactToMessage(msg._id, e)}>{e}</button>)}
                        </div>
                      )}
                    </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-container" onSubmit={handleSendMessage}>
                {selectedReply && (
                  <div className="chat-reply-composer">
                    <div>Răspuns către {selectedReply.senderName}</div>
                    <button type="button" onClick={() => setSelectedReply(null)}>×</button>
                  </div>
                )}
                {selectedImage && <div className="chat-image-preview"><img src={selectedImage.preview} alt="prev"/><button type="button" className="chat-image-remove" onClick={() => setSelectedImage(null)}>×</button></div>}
                
                <div className="chat-input-wrapper">
                  <div className="chat-input-buttons">
                    <button type="button" className="chat-input-button" onClick={() => fileInputRef.current?.click()}>📎</button>
                    <button type="button" className="chat-input-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  </div>
                  <input className="chat-input" placeholder="Scrie mesajul tău..." value={newMessage} onChange={e => { setNewMessage(e.target.value); emitTyping([userId, selectedConversation.id].sort().join('-'), true); }}/>
                  <button type="submit" className="chat-send-button" disabled={!newMessage && !selectedImage}>➤</button>
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageSelect} />
                
                {showEmojiPicker && (
                  <div className="chat-emoji-picker" style={{position:'absolute', bottom:'100%', left: 20, background:'var(--c-bg-container)', padding:10, borderRadius:8, boxShadow:'var(--c-shadow-hover)', zIndex:100}}>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:5}}>
                      {popularEmojis.map(e => <button key={e} type="button" style={{background:'none', border:'none', fontSize:20, cursor:'pointer'}} onClick={() => { setNewMessage(p => p + e); setShowEmojiPicker(false); }}>{e}</button>)}
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            <div className="chat-empty-main">
              <img src={gumballChat} className="chat-empty-img" alt="Chat" />
              <h3>Selectează o conversație pentru a o citi</h3>
              <p>Alege o conversație din lista de pe stânga pentru a începe să comunici</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}