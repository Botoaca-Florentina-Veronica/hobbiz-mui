import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popover } from '@mui/material';
import apiClient, { sendMessage, sendMessageMultipart, getMessages, deleteMessage } from '../api/api';
import useSocket from '../hooks/useSocket';
import TypingIndicator from './TypingIndicator';
import './ChatPopup.css';

export default function ChatPopup({ open, onClose, announcement, seller, userId, userRole, onMessageSent }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [deleteHover, setDeleteHover] = useState(false);
  const [attachHover, setAttachHover] = useState(false);
  const [emojiHover, setEmojiHover] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // File attachment state
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  // Resize (desktop) state
  const [boxWidth, setBoxWidth] = useState(440);
  const [boxHeight, setBoxHeight] = useState(450);
  const [isResizable, setIsResizable] = useState(false);
  const resizingRef = useRef(false);
  const resizeDirRef = useRef(null);
  const startSizeRef = useRef({ w: 440, h: 450, x: 0, y: 0 });
  
  const emojiList = ['😀','😂','🤣','😍','😘','🥰','😎','😝','😢', '😉','👍','👎','🤞','🤝','👏','🖕','🙏','🤟','🤙','🎉','🔥','❤️','👀','😅','🤔','😇','😡','🥳'];
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [emojiClosing, setEmojiClosing] = useState(false);

  // Obține userId din localStorage dacă nu e pasat ca prop; dacă lipsește dar avem token, încearcă să-l afli din profil
  const [effectiveUserId, setEffectiveUserId] = useState(userId || localStorage.getItem('userId'));
  useEffect(() => {
    if (!effectiveUserId && localStorage.getItem('token')) {
      (async () => {
        try {
          const res = await apiClient.get('/api/users/profile');
          if (res.data?._id) {
            localStorage.setItem('userId', res.data._id);
            setEffectiveUserId(res.data._id);
          }
        } catch (e) {
          console.warn('Nu s-a putut obține profilul pentru a determina userId:', e?.response?.status || e?.message);
        }
      })();
    }
  }, [effectiveUserId]);
  
  // Creează conversationId unic pentru fiecare anunț
  const conversationId = React.useMemo(() => {
    if (!seller || !effectiveUserId || !announcement) return null;
    const sellerId = seller._id || seller.id;
    const announcementId = announcement.id || announcement._id;
    if (!sellerId || !announcementId) return null;
    // Nu sortăm, ordinea e: sellerId, userId, announcementId
    return [sellerId, effectiveUserId, announcementId].join('-');
  }, [seller, effectiveUserId, announcement]);

  // Socket — typing support
  const { emitTyping, on, off } = useSocket(effectiveUserId);

  useEffect(() => {
    if (!conversationId || !effectiveUserId) return;

    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId && data.userId !== effectiveUserId) {
        setIsOtherUserTyping(data.isTyping);
      }
    };

    on('userTyping', handleUserTyping);
    return () => {
      off('userTyping', handleUserTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, effectiveUserId, on, off]);

  const handleTypingInput = (text) => {
    setInput(text);
    if (!conversationId) return;
    emitTyping(conversationId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(conversationId, false), 2000);
  };

  // Persist lightweight chat metadata locally for conversation list fallbacks
  useEffect(() => {
    try {
      if (!conversationId) return;
      const title = announcement?.title || announcement?.name || '';
      const image = (announcement?.images && announcement.images[0]) || '';
      if (title || image) {
        const key = `chat_meta_${conversationId}`;
        const payload = { title, image };
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (_) {}
  }, [conversationId, announcement]);

  // Încarcă mesajele când se deschide popup-ul
  useEffect(() => {
    if (!open || !conversationId) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        console.log('🔄 Încărcare mesaje pentru conversația:', conversationId);
        // Folosim endpoint-ul conversation-scoped
        const response = await getMessages(conversationId);
        setMessages(response.data || []);
        console.log('✅ Mesaje încărcate:', response.data?.length || 0);
      } catch (error) {
        console.error('❌ Eroare la încărcarea mesajelor:', error);
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          console.error('❌ Backend-ul nu răspunde. Verifică dacă serverul rulează pe portul 5000.');
        }
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [open, conversationId]);

  // Scroll la ultimul mesaj
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Scroll when typing indicator appears so it's fully visible
  useEffect(() => {
    if (!isOtherUserTyping) return;
    // Small delay so the element has rendered before we scroll
    const id = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(id);
  }, [isOtherUserTyping]);

  // Enable/disable resizable mode based on viewport width
  useEffect(() => {
    const check = () => {
      const enable = window.innerWidth > 1024;
      setIsResizable(enable);
      if (enable) {
        // Ensure box fits viewport height
        const maxH = Math.min(window.innerHeight * 0.85, 800);
        setBoxHeight(h => Math.min(h, maxH));
        const maxW = Math.min(720, window.innerWidth - 64); // leave margins
        setBoxWidth(w => Math.min(w, maxW));
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const startResize = useCallback((e, dir) => {
    if (!isResizable) return;
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    resizeDirRef.current = dir;
    startSizeRef.current = {
      w: boxWidth,
      h: boxHeight,
      x: e.clientX,
      y: e.clientY
    };
    document.body.classList.add('chat-resizing');
  }, [isResizable, boxWidth, boxHeight]);

  const doResize = useCallback((e) => {
    if (!resizingRef.current) return;
    const { w, h, x, y } = startSizeRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    let newW = w;
    let newH = h;
    const dir = resizeDirRef.current;
    // Anchored to bottom-right (overlay right/bottom). Adjust width/height only.
    if (dir.includes('right')) newW = w + dx;
    if (dir.includes('left')) newW = w - dx; // dragging left edge (dx negative when moving left => grow)
    if (dir.includes('bottom')) newH = h + dy;
    if (dir.includes('top')) newH = h - dy;
    // Constraints
    const maxW = Math.min(900, window.innerWidth - 64);
    const maxH = Math.min(window.innerHeight - 80, 900);
    newW = Math.max(320, Math.min(newW, maxW));
    newH = Math.max(360, Math.min(newH, maxH));
    setBoxWidth(newW);
    setBoxHeight(newH);
  }, []);

  const stopResize = useCallback(() => {
    if (!resizingRef.current) return;
    resizingRef.current = false;
    resizeDirRef.current = null;
    document.body.classList.remove('chat-resizing');
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', doResize);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);
    return () => {
      window.removeEventListener('pointermove', doResize);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [doResize, stopResize]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (sending || !conversationId) return;
    clearTimeout(typingTimeoutRef.current);
    emitTyping(conversationId, false);

    const hasText = !!input.trim();
    const hasFile = !!selectedFile;
    if (!hasText && !hasFile) return;
    if (input.length > 2000) return;

    const recipientId = seller._id || seller.id;
    if (!recipientId || !effectiveUserId) return;

    const textToSend = input.trim();
    setSending(true);

    // Pregătim optimistic message
    const tempId = 'tmp-' + Date.now();
    const optimistic = {
      _id: tempId,
      conversationId,
      senderId: effectiveUserId,
      senderRole: 'cumparator',
      destinatarId: recipientId,
      text: hasText ? textToSend : undefined,
      image: hasFile ? URL.createObjectURL(selectedFile) : undefined,
      imageFile: hasFile ? selectedFile.name : undefined,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);

    // Reset UI rapid
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let response;
      if (hasFile) {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('senderId', effectiveUserId);
        formData.append('senderRole', 'cumparator');
        formData.append('destinatarId', recipientId);
        formData.append('announcementId', announcement.id || announcement._id);
        if (hasText) formData.append('text', textToSend);
        formData.append('image', selectedFile);
        formData.append('imageFile', selectedFile.name);
        response = await sendMessageMultipart(formData);
      } else {
        const payload = {
          conversationId,
          senderId: effectiveUserId,
          senderRole: 'cumparator',
          destinatarId: recipientId,
          announcementId: announcement.id || announcement._id,
          text: textToSend
        };
        response = await sendMessage(payload);
      }

      if (response?.data) {
        setMessages(prev => prev.map(m => m._id === tempId ? response.data : m));
        if (onMessageSent) onMessageSent();
      } else {
        // fallback remove optimistic
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (error) {
      console.error('❌ Eroare la trimiterea mesajului/file:', error);
      // Revoce optimistic
      setMessages(prev => prev.filter(m => m._id !== tempId));
      // Reintrodu textul dacă avea
      if (hasText) setInput(textToSend);
      if (hasFile) setSelectedFile(selectedFile); // repunem fișierul
    } finally {
      setSending(false);
    }
  };

  // Șterge mesaj
  const handleDeleteMessage = async (msgId) => {
    if (!msgId) return;
    
    console.log('🗑️ Încercăm să ștergem mesajul cu ID:', msgId);
    
    try {
      const response = await deleteMessage(msgId);
      console.log('✅ Răspuns de la API:', response);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      console.log('✅ Mesaj șters cu succes:', msgId);
    } catch (error) {
      console.error('❌ Eroare la ștergerea mesajului:', error);
      console.error('❌ Detalii eroare:', error.response?.data);
      // Nu mai afișăm popup - doar logăm eroarea
    }
  };

  // Adaugă emoji la input
  const handleEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setEmojiAnchor(null);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Fișierul este prea mare. Mărimea maximă permisă este 10MB.');
        return;
      }
      
      // Check file type (images, documents, etc.)
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Tipul de fișier nu este suportat. Poți încărca imagini, PDF-uri sau documente Word.');
        return;
      }
      
      setSelectedFile(file);
      console.log('📎 Fișier selectat:', file.name, file.size, 'bytes');
    }
  };

  // Handle file attachment click
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Send file message (placeholder - extend as needed for your backend)
  const handleSendFile = async () => {
    // Trimite imediat chiar dacă nu este text
    if (!selectedFile) return;
    await handleSend(new Event('submit'));
  };

  // Navigate to seller profile page
  const handleNavigateToProfile = () => {
    const sellerId = seller?._id || seller?.id;
    if (sellerId) {
      onClose(); // Close chat popup
      navigate(`/profil/${sellerId}`);
    }
  };

  // Verifică dacă componenta poate fi afișată
  if (!open || !conversationId) return null;

  return (
    <div className="chat-popup-overlay">
      <div
        className={"chat-popup-box" + (isResizable ? " resizable" : "")}
        style={isResizable ? { width: boxWidth + 'px', height: boxHeight + 'px' } : undefined}
      >
        {isResizable && (
          <>
            {/* Corners */}
            <div className="chat-resize-handle corner tl" onPointerDown={(e)=>startResize(e,'top-left')} />
            <div className="chat-resize-handle corner tr" onPointerDown={(e)=>startResize(e,'top-right')} />
            <div className="chat-resize-handle corner bl" onPointerDown={(e)=>startResize(e,'bottom-left')} />
            <div className="chat-resize-handle corner br" onPointerDown={(e)=>startResize(e,'bottom-right')} />
            {/* Edges */}
            <div className="chat-resize-handle edge top" onPointerDown={(e)=>startResize(e,'top')} />
            <div className="chat-resize-handle edge right" onPointerDown={(e)=>startResize(e,'right')} />
            <div className="chat-resize-handle edge bottom" onPointerDown={(e)=>startResize(e,'bottom')} />
            <div className="chat-resize-handle edge left" onPointerDown={(e)=>startResize(e,'left')} />
          </>
        )}
        <div className="chat-popup-header">
          <div className="chat-popup-user" onClick={handleNavigateToProfile} style={{ cursor: 'pointer' }}>
            <div className="chat-popup-avatar">
              {seller?.avatar ? (
                <img src={seller.avatar} alt="avatar" />
              ) : (
                <div className="chat-popup-avatar-placeholder">{seller?.firstName?.[0] || 'U'}</div>
              )}
            </div>
            <span className="chat-popup-username">{seller?.firstName || t('common.user')}</span>
          </div>
          <button className="chat-popup-close" onClick={onClose}>&#10005;</button>
        </div>
        <div className="chat-popup-announcement">
          <img className="chat-popup-announcement-img" src={announcement?.images?.[0] || ''} alt="anunt" />
          <div className="chat-popup-announcement-info">
            <div className="chat-popup-announcement-title">{announcement?.title}</div>
            <div className="chat-popup-announcement-price">{announcement?.price ? `${announcement.price} €` : ''}</div>
            <div className="chat-popup-announcement-id">ID: {announcement?.id}</div>
          </div>
        </div>
        <div className="chat-popup-messages">
          {loading ? (
            <div className="chat-popup-status">
              {t('chat.loading')}
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-popup-status">
              {t('chat.noConversation')}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg._id || `msg-${idx}`}
                className={
                  "chat-popup-message-row " +
                  (msg.senderId === effectiveUserId
                    ? "chat-popup-message-own-row"
                    : "chat-popup-message-other-row" 
                  )
                }
              >
                <div
                  className={
                    "chat-popup-message " +
                    (msg.senderId === effectiveUserId
                      ? "chat-popup-message-own"
                      : "chat-popup-message-other" 
                    )
                  }
                  onMouseEnter={() => setHoveredMsgId(msg._id)}
                  onMouseLeave={() => { setHoveredMsgId(null); setDeleteHover(false); }}
                >
                  {msg.senderId === effectiveUserId && hoveredMsgId === msg._id && (
                    <div className="chat-popup-message-delete">
                      <button
                        className="chat-popup-message-delete-btn"
                        onMouseEnter={() => {
                          setDeleteHover(msg._id);
                          window.deleteTooltipTimeout = setTimeout(() => {
                            setDeleteHover('show-' + msg._id);
                          }, 1000);
                        }}
                        onMouseLeave={() => {
                          setDeleteHover(false);
                          clearTimeout(window.deleteTooltipTimeout);
                        }}
                        onClick={() => handleDeleteMessage(msg._id)}
                        title={t('chat.deleteMessage')}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </button>
                      {deleteHover === 'show-' + msg._id && (
                        <span className="chat-popup-message-delete-tooltip">{t('chat.delete')}</span>
                      )}
                    </div>
                  )}
                  <div className="chat-popup-message-text">
                    {msg.image && (
                      <div className="chat-popup-image-wrapper">
                        <img
                          src={msg.image}
                          alt={msg.imageFile || 'image'}
                          className="chat-popup-image"
                          onLoad={() => messagesEndRef.current?.scrollIntoView({behavior:'smooth'})}
                        />
                      </div>
                    )}
                    {msg.text && <div>{msg.text}</div>}
                  </div>
                  {msg.createdAt && (
                    <div className="chat-popup-message-time">
                      {new Date(msg.createdAt).toLocaleTimeString('ro-RO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isOtherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-popup-input-row">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <div className="chat-popup-attach-wrapper">
            <button
              className="chat-popup-icon-btn chat-popup-attach-btn"
              onMouseEnter={() => setAttachHover(true)}
              onMouseLeave={() => setAttachHover(false)}
              onClick={handleAttachClick}
              type="button"
            >
              {/* Paperclip icon */}
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.19 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49"/></svg>
            </button>
            {attachHover && (
              <div className="chat-popup-attach-tooltip">
                ADAUGĂ FIȘIER
                <span className="chat-popup-attach-tooltip-arrow" />
              </div>
            )}
          </div>
          <div className="chat-popup-attach-wrapper">
            <button
              className="chat-popup-icon-btn chat-popup-emoji-btn"
              onMouseEnter={() => setEmojiHover(true)}
              onMouseLeave={() => setEmojiHover(false)}
              onClick={() => {
                if (emojiAnchor) {
                  setEmojiClosing(true);
                  setTimeout(() => {
                    setEmojiAnchor(null);
                    setEmojiClosing(false);
                  }, 250);
                } else {
                  setEmojiAnchor('open');
                }
              }}
              type="button"
            >
              <InsertEmoticonIcon />
            </button>
            {emojiHover && !emojiAnchor && (
              <div className="chat-popup-attach-tooltip">
                TRIMITE UN EMOJI
                <span className="chat-popup-attach-tooltip-arrow" />
              </div>
            )}
            {/* Emoji Picker - Positioned above button */}
            {emojiAnchor && !emojiClosing && (
              <>
                {/* Backdrop to close menu on click outside */}
                <div 
                  className="chat-popup-emoji-backdrop"
                  onClick={() => {
                    setEmojiClosing(true);
                    setTimeout(() => {
                      setEmojiAnchor(null);
                      setEmojiClosing(false);
                    }, 250);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                />
                <div className="chat-popup-emoji-picker chat-popup-emoji-picker-enter">
                  {emojiList.map(emoji => (
                    <button
                      key={emoji}
                      className="chat-popup-emoji-option"
                      onClick={() => handleEmoji(emoji)}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
            {/* Emoji Picker closing animation */}
            {emojiClosing && (
              <>
                <div 
                  className="chat-popup-emoji-backdrop"
                />
                <div className="chat-popup-emoji-picker chat-popup-emoji-picker-exit">
                  {emojiList.map(emoji => (
                    <button
                      key={emoji}
                      className="chat-popup-emoji-option"
                      type="button"
                      disabled
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <form onSubmit={handleSend} className="chat-popup-form">
            {selectedFile && (
              <div className="chat-popup-file-preview">
                <span className="chat-popup-file-name">📎 {selectedFile.name}</span>
                <button
                  type="button"
                  className="chat-popup-file-remove"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  ✕
                </button>
                <button
                  type="button"
                  className="chat-popup-file-send"
                  onClick={handleSendFile}
                >
                  Trimite
                </button>
              </div>
            )}
            <input
              className="chat-popup-input"
              placeholder={sending ? "Se trimite..." : selectedFile ? "Sau scrie un mesaj..." : "Scrie mesajul tău..."}
              value={input}
              onChange={e => handleTypingInput(e.target.value)}
              maxLength={2000}
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              className="chat-popup-icon-btn chat-popup-send-btn"
              aria-label="Trimite mesaj"
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <div className="chat-popup-spinner" />
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
