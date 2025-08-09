import React, { useState, useEffect, useRef } from 'react';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popover } from '@mui/material';
import { sendMessage, getMessages, deleteMessage, getMessagesBetween } from '../api/api';
import './ChatPopup.css';

export default function ChatPopup({ open, onClose, announcement, seller, userId, userRole, onMessageSent }) {
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [deleteHover, setDeleteHover] = useState(false);
  const [attachHover, setAttachHover] = useState(false);
  const [emojiHover, setEmojiHover] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const emojiList = ['😀','😂','🤣','😍','😘','🥰','😎','😝','😢', '😉','👍','👎','🤞','🤝','👏','🖕','🙏','🤟','🤙','🎉','🔥','❤️','👀','😅','🤔','😇','😡','🥳'];
  const messagesEndRef = useRef(null);

  // Obține userId din localStorage dacă nu e pasat ca prop
  const effectiveUserId = userId || localStorage.getItem('userId');
  
  // Creează conversationId mai simplu și consistent - doar între utilizatori
  const conversationId = React.useMemo(() => {
    if (!seller || !effectiveUserId) return null;
    
    const sellerId = seller._id || seller.id;
    
    if (!sellerId) return null;
    
    // Sortăm ID-urile pentru a asigura consistența indiferent de ordinea parametrilor
    const participants = [sellerId, effectiveUserId].sort();
    return participants.join('-');
  }, [seller, effectiveUserId]);

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
        console.log('🔄 API URL folosit:', import.meta.env.VITE_API_URL || 'default');
        console.log('🔄 Token din localStorage:', localStorage.getItem('token') ? 'exists' : 'missing');
        
        // Folosim endpoint-ul pentru mesaje între doi utilizatori
        const sellerId = seller._id || seller.id;
        console.log('🔄 Solicitare mesaje între:', { effectiveUserId, sellerId });
        
        const response = await getMessagesBetween(effectiveUserId, sellerId);
        
        console.log('✅ Răspuns API:', response);
        const messages = response.data || [];
        setMessages(messages);
        console.log('✅ Mesaje încărcate:', messages.length, messages);
      } catch (error) {
        console.error('❌ Eroare la încărcarea mesajelor:', error);
        console.error('❌ Detalii eroare:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config
        });
        
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          console.error('❌ Backend-ul nu răspunde. Verifică dacă serverul rulează.');
        } else if (error.response?.status === 401) {
          console.error('❌ Token invalid sau expirat - încearcă să te reconectezi');
        } else if (error.response?.status === 404) {
          console.error('❌ Endpoint-ul nu a fost găsit');
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

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || sending || !conversationId) return;
    
    const messageText = input.trim();
    setInput("");
    setSending(true);
    
    // Determină destinatarul corect - logic simplu
    const recipientId = seller._id || seller.id;
    
    // Validare înainte de trimitere
    if (!recipientId || !effectiveUserId || !conversationId) {
      console.error('❌ Date lipsă pentru trimiterea mesajului:', {
        recipientId,
        effectiveUserId,
        conversationId,
        seller,
        announcement
      });
      // Nu mai afișăm alert - doar logăm eroarea
      setSending(false);
      setInput(messageText);
      return;
    }
    
    const messageData = {
      conversationId,
      senderId: effectiveUserId,
      text: messageText,
      announcementId: announcement.id || announcement._id,
      destinatarId: recipientId
    };
    
    try {
      console.log('📤 Trimitere mesaj:', messageData);
      console.log('📤 URL API:', import.meta.env.VITE_API_URL || 'default');
      console.log('📤 Token:', localStorage.getItem('token') ? 'exists' : 'missing');
      
      const response = await sendMessage(messageData);
      
      console.log('✅ Răspuns trimitere mesaj:', response);
      
      if (response.data) {
        // Adaugă mesajul la lista existentă
        setMessages(prev => [...prev, response.data]);
        console.log('✅ Mesaj trimis cu succes:', response.data);
        
        // Notifică componenta părinte despre mesajul nou
        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (error) {
      console.error('❌ Eroare la trimiterea mesajului:', error);
      console.error('❌ Detalii eroare trimitere:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // Nu mai afișăm popup-uri - doar logăm erorile în consolă
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error('❌ Backend-ul nu răspunde. Verifică dacă serverul rulează.');
      } else if (error.response?.status === 500) {
        console.error('❌ Eroare de server la trimiterea mesajului. Verifică log-urile backend-ului.');
      } else if (error.response?.status === 401) {
        console.error('❌ Token invalid sau expirat - încearcă să te reconectezi');
        // Poate înlocui token-ul sau redirecționa la login
      } else {
        console.error(`❌ Eroare la trimiterea mesajului: ${error.message}`);
      }
      
      // Restaurează textul în input dacă trimiterea a eșuat
      setInput(messageText);
    } finally {
      setSending(false);
    }
  };

  // Șterge mesaj
  const handleDeleteMessage = async (msgId) => {
    if (!msgId) return;
    
    try {
      await deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
      console.log('✅ Mesaj șters cu succes:', msgId);
    } catch (error) {
      console.error('❌ Eroare la ștergerea mesajului:', error);
      // Nu mai afișăm popup - doar logăm eroarea
    }
  };

  // Adaugă emoji la input
  const handleEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setEmojiAnchor(null);
  };

  // Verifică dacă componenta poate fi afișată
  if (!open || !conversationId) return null;

  return (
    <div className="chat-popup-overlay">
      <div className="chat-popup-box">
        <div className="chat-popup-header">
          <div className="chat-popup-user">
            <div className="chat-popup-avatar">
              {seller?.avatar ? (
                <img src={seller.avatar} alt="avatar" />
              ) : (
                <div className="chat-popup-avatar-placeholder">{seller?.firstName?.[0] || 'U'}</div>
              )}
            </div>
            <span className="chat-popup-username">{seller?.firstName || 'Utilizator'}</span>
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
            <div style={{textAlign: 'center', color: '#888', padding: '20px'}}>
              Se încarcă mesajele...
            </div>
          ) : messages.length === 0 ? (
            <div style={{textAlign: 'center', color: '#888', padding: '20px'}}>
              Nicio conversație încă. Scrie primul mesaj!
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
                        title="Șterge mesajul"
                      >
                        <DeleteIcon sx={{ color: '#222', fontSize: 18 }} />
                      </button>
                      {deleteHover === 'show-' + msg._id && (
                        <span className="chat-popup-message-delete-tooltip">Șterge</span>
                      )}
                    </div>
                  )}
                  <div className="chat-popup-message-text">{msg.text}</div>
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
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-popup-input-row">
          <div className="chat-popup-attach-wrapper">
            <button
              className="chat-popup-icon-btn chat-popup-attach-btn"
              onMouseEnter={() => setAttachHover(true)}
              onMouseLeave={() => setAttachHover(false)}
              type="button"
            >
              {/* Paperclip icon */}
              <svg width="24" height="24" fill="none" stroke="#13344b" strokeWidth="2" viewBox="0 0 24 24"><path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.19 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49"/></svg>
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
              onClick={e => setEmojiAnchor(e.currentTarget)}
              type="button"
            >
              <InsertEmoticonIcon style={{ fontSize: 24, color: '#13344b' }} />
            </button>
            {emojiHover && (
              <div className="chat-popup-attach-tooltip">
                TRIMITE UN EMOJI
                <span className="chat-popup-attach-tooltip-arrow" />
              </div>
            )}
            <Popover
              open={Boolean(emojiAnchor)}
              anchorEl={emojiAnchor}
              onClose={() => setEmojiAnchor(null)}
              anchorReference="anchorEl"
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              PaperProps={{
                className: 'chat-popup-emoji-popover',
              }}
              sx={{
                zIndex: 99999,
                '& .MuiPaper-root': {
                  zIndex: 99999,
                }
              }}
            >
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
            </Popover>
          </div>
          <form onSubmit={handleSend} style={{display: 'flex', flex: 1, alignItems: 'center'}}>
            <input
              className="chat-popup-input"
              placeholder={sending ? "Se trimite..." : "Scrie mesajul tău..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              className="chat-popup-icon-btn"
              style={{
                marginLeft: 4, 
                fontSize: 22, 
                color: sending ? '#ccc' : '#2ec4b6',
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
              aria-label="Trimite mesaj"
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <div style={{
                  width: 20, 
                  height: 20, 
                  border: '2px solid #ccc', 
                  borderTop: '2px solid #2ec4b6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <svg width="24" height="24" fill="none" stroke="#2ec4b6" strokeWidth="2" viewBox="0 0 24 24">
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
