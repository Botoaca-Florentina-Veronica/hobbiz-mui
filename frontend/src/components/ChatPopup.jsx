import React, { useState, useEffect, useRef } from 'react';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DeleteIcon from '@mui/icons-material/Delete';
import { Popover } from '@mui/material';
import { sendMessage, getMessages, deleteMessage } from '../api/api';
import './ChatPopup.css';

// userId și userRole ar trebui să vină din contextul de autentificare sau ca prop
export default function ChatPopup({ open, onClose, announcement, seller, userId, userRole }) {
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [deleteHover, setDeleteHover] = useState(false);
  const [attachHover, setAttachHover] = useState(false);
  const [emojiHover, setEmojiHover] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const emojiList = ['😀','😂','🤣','😍','😘','🥰','😎','😝','😢', '😉','👍','👎','🤞','🤝','👏','🖕','🙏','🤟','🤙','🎉','🔥','❤️','👀','😅','🤔','😇','😡','🥳'];
  const messagesEndRef = useRef(null);

  // Creează un id unic pentru conversație (ex: anuntId + sellerId + cumparatorId)
  const annId = announcement?.id || announcement?._id;
  const sellerId = seller?._id;
  // Warn dacă lipsesc id-uri
  if (!annId || !sellerId || !userId) {
    console.warn('ChatPopup: id-uri lipsă', { annId, sellerId, userId });
  }
  const conversationId = annId && sellerId && userId
    ? [annId, sellerId, userId].sort().join("-")
    : "";

  // Fetch messages când se deschide popup-ul sau se schimbă conversația
  useEffect(() => {
    if (open && conversationId) {
      setLoading(true);
      getMessages(conversationId)
        .then(res => setMessages(res.data))
        .catch(() => setMessages([]))
        .finally(() => setLoading(false));
    }
  }, [open, conversationId]);

  // Scroll la ultimul mesaj
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = {
      conversationId,
      senderId: userId,
      senderRole: userRole,
      text: input.trim(),
    };
    try {
      const res = await sendMessage(msg);
      setMessages(prev => [...prev, res.data]);
      setInput("");
    } catch (err) {
      // handle error
    }
  };

  // Șterge mesaj
  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      // handle error
    }
  };

  // Adaugă emoji la input
  const handleEmoji = (emoji) => {
    setInput(input + emoji);
    setEmojiAnchor(null);
  };

  if (!open) return null;
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
            <div style={{textAlign: 'center', color: '#888'}}>Se încarcă...</div>
          ) : (
            messages.length === 0 ? (
              <div style={{textAlign: 'center', color: '#888'}}>Nicio conversație încă.</div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={
                    "chat-popup-message-row " +
                    (msg.senderId === userId
                      ? "chat-popup-message-own-row"
                      : "chat-popup-message-other-row" 
                    )
                  }
                >
                  <div
                    className={
                      "chat-popup-message " +
                      (msg.senderId === userId
                        ? "chat-popup-message-own"
                        : "chat-popup-message-other" 
                      )
                    }
                    title={msg.senderRole === 'vanzator' ? 'Vânzător' : 'Cumpărător'}
                    onMouseEnter={() => setHoveredMsgId(msg._id)}
                    onMouseLeave={() => { setHoveredMsgId(null); setDeleteHover(false); }}
                  >
                    {msg.senderId === userId && hoveredMsgId === msg._id && (
                      <div
                        className="chat-popup-message-delete"
                        onMouseEnter={() => setDeleteHover(true)}
                        onMouseLeave={() => { setDeleteHover(false); setHoveredMsgId(null); }}
                      >
                        <span className="chat-popup-message-delete-label">Șterge</span>
                        <button
                          className="chat-popup-message-delete-btn"
                          title="Șterge mesaj"
                          onClick={() => handleDeleteMessage(msg._id)}
                        >
                          <DeleteIcon sx={{ color: '#222', fontSize: 18 }} />
                        </button>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))
            )
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
              placeholder="Scrie mesajul tău..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="chat-popup-icon-btn"
              style={{marginLeft: 4, fontSize: 22, color: '#2ec4b6'}}
              aria-label="Trimite mesaj"
              disabled={!input.trim()}
            >
              <svg width="24" height="24" fill="none" stroke="#2ec4b6" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
