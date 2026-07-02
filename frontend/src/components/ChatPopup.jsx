import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Popover } from '@mui/material';
import apiClient, { sendMessage, sendMessageMultipart, getMessages, deleteMessage, editMessage } from '../api/api';
import useSocket from '../hooks/useSocket';
import TypingIndicator from './TypingIndicator';
import './ChatPopup.css';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

export default function ChatPopup({ open, onClose, onMinimize, minimized, announcement, seller, userId, userRole, onMessageSent }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [reactionTargetId, setReactionTargetId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [selectedReply, setSelectedReply] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
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

  // Drag (desktop) — permite mutarea popup-ului oriunde pe ecran. `null` = poziție
  // implicită (ancorată jos-dreapta prin CSS); după prima mutare, devine {left, top}.
  const [dragPos, setDragPos] = useState(null);
  const overlayRef = useRef(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ left: 0, top: 0, w: 440, h: 450, clientX: 0, clientY: 0 });
  const dragLatestRef = useRef({ left: 0, top: 0 });

  const emojiList = ['😀','😂','🤣','😍','😘','🥰','😎','😝','😢', '😉','👍','👎','🤞','🤝','👏','🖕','🙏','🤟','🤙','🎉','🔥','❤️','👀','😅','🤔','😇','😡','🥳'];
  const reactionEmojis = ['❤️','😂','😮','😢','😡','👍','👎','🎉','🔥','💯'];
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
  
  // Rolul utilizatorului curent în această conversație — implicit cumpărător (cazul uzual:
  // popup-ul deschis din pagina unui anunț/profil de vânzător), dar poate fi 'vanzator'
  // când popup-ul e scos dintr-o conversație din pagina de chat unde utilizatorul curent
  // este chiar proprietarul anunțului.
  const isCurrentUserSeller = userRole === 'vanzator';

  // Creează conversationId unic pentru fiecare anunț. Formatul canonic, folosit identic
  // de restul aplicației (negocieri, listarea conversațiilor etc.), este mereu
  // `${sellerId}-${buyerId}-${announcementId}` — indiferent care dintre cei doi participanți
  // este utilizatorul curent. Prop-ul `seller` reprezintă mereu "celălalt participant".
  const conversationId = React.useMemo(() => {
    if (!seller || !effectiveUserId || !announcement) return null;
    const otherId = seller._id || seller.id;
    const announcementId = announcement.id || announcement._id;
    if (!otherId || !announcementId) return null;
    const sellerId = isCurrentUserSeller ? effectiveUserId : otherId;
    const buyerId = isCurrentUserSeller ? otherId : effectiveUserId;
    return [sellerId, buyerId, announcementId].join('-');
  }, [seller, effectiveUserId, announcement, isCurrentUserSeller]);

  // Socket — typing support
  const { emitTyping, joinConversation, leaveConversation, on, off } = useSocket(effectiveUserId);

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

  // Anunță serverul ce conversație vizualizăm activ — folosit pentru a marca mesajele de
  // sistem ale negocierii ca citite chiar la creare, dacă popup-ul e deja deschis aici.
  useEffect(() => {
    if (!open || !conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversationId]);

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

  // Închide reaction picker la click în afara lui
  useEffect(() => {
    if (!reactionTargetId) return;
    const handle = (e) => {
      if (!e.target.closest('.cp-reaction-picker') && !e.target.closest('.cp-message-action-btn')) {
        setReactionTargetId(null);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [reactionTargetId]);

  // Enable/disable resizable mode based on viewport width
  useEffect(() => {
    const check = () => {
      const enable = getEffectiveViewportWidth() > 1024;
      setIsResizable(enable);
      if (enable) {
        // Ensure box fits viewport height
        const maxH = Math.min(window.innerHeight * 0.85, 800);
        setBoxHeight(h => Math.min(h, maxH));
        const maxW = Math.min(720, window.innerWidth - 64); // leave margins
        setBoxWidth(w => Math.min(w, maxW));
        // Reclamp poziția liberă (drag) ca să nu rămână în afara ferestrei după redimensionare
        const rect = overlayRef.current?.getBoundingClientRect();
        if (rect) {
          setDragPos(pos => {
            if (!pos) return pos;
            const left = Math.max(0, Math.min(pos.left, window.innerWidth - rect.width));
            const top = Math.max(0, Math.min(pos.top, window.innerHeight - rect.height));
            return (left === pos.left && top === pos.top) ? pos : { left, top };
          });
        }
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
      y: e.clientY,
      // Capturăm poziția floating la momentul startului — necesară pentru a
      // compensa deplasarea muchiilor top/left când popup-ul e în mod drag liber.
      floatLeft: dragPos?.left ?? null,
      floatTop:  dragPos?.top  ?? null,
    };
    document.body.classList.add('chat-resizing');
  }, [isResizable, boxWidth, boxHeight, dragPos]);

  const doResize = useCallback((e) => {
    if (!resizingRef.current) return;
    const { w, h, x, y, floatLeft, floatTop } = startSizeRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    let newW = w;
    let newH = h;
    const dir = resizeDirRef.current;
    if (dir.includes('right'))  newW = w + dx;
    if (dir.includes('left'))   newW = w - dx;
    if (dir.includes('bottom')) newH = h + dy;
    if (dir.includes('top'))    newH = h - dy;
    const maxW = Math.min(900, window.innerWidth - 64);
    const maxH = Math.min(window.innerHeight - 80, 900);
    newW = Math.max(320, Math.min(newW, maxW));
    newH = Math.max(360, Math.min(newH, maxH));
    setBoxWidth(newW);
    setBoxHeight(newH);
    // Când popup-ul e în mod floating (left/top explicit după un drag), muchia de sus
    // și cea stângă nu sunt ancorate la nimic — fără corecție, redimensionarea din
    // aceste direcții deplasează muchia greșită (bottom/right crește în loc de top/left).
    // Soluție: mutăm left/top astfel încât muchia OPUSĂ (bottom/right) să rămână fixă.
    // Formula: new_top = startTop + startH - newH (muchia de jos rămâne la startTop+startH).
    if (floatLeft !== null || floatTop !== null) {
      setDragPos(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        if (dir.includes('top')  && floatTop  !== null) next.top  = Math.max(0, floatTop  + h - newH);
        if (dir.includes('left') && floatLeft !== null) next.left = Math.max(0, floatLeft + w - newW);
        return (next.top === prev.top && next.left === prev.left) ? prev : next;
      });
    }
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

  // Drag — mutare liberă a popup-ului, activă doar pe desktop (același prag ca resize-ul).
  // Pornește din header, dar ignoră click-urile pe avatar/nume (navighează profilul) și pe
  // butoanele de minimizare/închidere.
  const startDrag = useCallback((e) => {
    if (!isResizable) return;
    if (e.target.closest('.chat-popup-user, .chat-popup-header-actions')) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    draggingRef.current = true;
    // Capturăm poziția, dimensiunea și punctul de pornire o singură dată. Nu apelăm
    // setState aici — un re-render al întregii componente (cu toată lista de mesaje)
    // chiar la pornire ar adăuga lag.
    dragStartRef.current = {
      left: rect.left, top: rect.top,
      w: rect.width, h: rect.height,
      clientX: e.clientX, clientY: e.clientY,
    };
    dragLatestRef.current = { left: rect.left, top: rect.top };
    document.body.classList.add('chat-dragging');
  }, [isResizable]);

  const doDrag = useCallback((e) => {
    if (!draggingRef.current) return;
    const el = overlayRef.current;
    if (!el) return;
    const s = dragStartRef.current;
    // Deltă față de punctul de pornire, limitată ca popup-ul să rămână complet în fereastră.
    let dx = e.clientX - s.clientX;
    let dy = e.clientY - s.clientY;
    dx = Math.max(-s.left, Math.min(dx, window.innerWidth - s.w - s.left));
    dy = Math.max(-s.top, Math.min(dy, window.innerHeight - s.h - s.top));
    dragLatestRef.current = { left: s.left + dx, top: s.top + dy };
    // Mutare prin transform (compus pe GPU, fără layout/reflow și fără re-ancorare
    // right→left). La dx=dy=0 nu există absolut nicio mișcare, deci niciun salt la prima
    // mișcare — popup-ul urmărește cursorul exact de la primul pixel.
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);

  const stopDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.classList.remove('chat-dragging');
    const el = overlayRef.current;
    if (el) {
      // Citim poziția vizuală REALĂ (getBoundingClientRect include transform-ul curent),
      // nu cea calculată din s.left + dx — astfel evităm orice diferență sub-pixel între
      // ancorarea right/bottom și left/top, care altfel ar muta popup-ul puțin la fixare.
      const rect = el.getBoundingClientRect();
      const pos = { left: rect.left, top: rect.top };
      // Fixăm left/top exact pe poziția măsurată și anulăm transform-ul în același cadru —
      // fără salt, fără reancorare vizibilă.
      el.style.left = pos.left + 'px';
      el.style.top = pos.top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = '';
      dragLatestRef.current = pos;
      setDragPos(pos);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', doDrag);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointermove', doDrag);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [doDrag, stopDrag]);

  // Resetează poziția liberă când popup-ul trece pe mobil (unde e fullscreen, ancorat prin CSS).
  useEffect(() => {
    if (!isResizable) setDragPos(null);
  }, [isResizable]);

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
    const replyToPayload = selectedReply
      ? { messageId: selectedReply.messageId, text: selectedReply.text, image: selectedReply.image, senderId: selectedReply.senderId }
      : undefined;

    const optimistic = {
      _id: tempId,
      conversationId,
      senderId: effectiveUserId,
      senderRole: isCurrentUserSeller ? 'vanzator' : 'cumparator',
      destinatarId: recipientId,
      text: hasText ? textToSend : undefined,
      image: hasFile ? URL.createObjectURL(selectedFile) : undefined,
      imageFile: hasFile ? selectedFile.name : undefined,
      createdAt: new Date().toISOString(),
      replyTo: replyToPayload,
    };
    setMessages(prev => [...prev, optimistic]);

    // Reset UI rapid
    setInput('');
    setSelectedFile(null);
    setSelectedReply(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let response;
      if (hasFile) {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('senderId', effectiveUserId);
        formData.append('senderRole', isCurrentUserSeller ? 'vanzator' : 'cumparator');
        formData.append('destinatarId', recipientId);
        formData.append('announcementId', announcement.id || announcement._id);
        if (hasText) formData.append('text', textToSend);
        if (replyToPayload) formData.append('replyTo', JSON.stringify(replyToPayload));
        formData.append('image', selectedFile);
        formData.append('imageFile', selectedFile.name);
        response = await sendMessageMultipart(formData);
      } else {
        const payload = {
          conversationId,
          senderId: effectiveUserId,
          senderRole: isCurrentUserSeller ? 'vanzator' : 'cumparator',
          destinatarId: recipientId,
          announcementId: announcement.id || announcement._id,
          text: textToSend,
          ...(replyToPayload && { replyTo: replyToPayload }),
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

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.text || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSaveEdit = async (msgId) => {
    const trimmed = editText.trim();
    if (!trimmed || savingEdit) return;
    setSavingEdit(true);
    try {
      const res = await editMessage(msgId, trimmed);
      const updated = res.data?.message;
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, text: updated?.text ?? trimmed, editedAt: updated?.editedAt ?? new Date().toISOString() } : m));
      setEditingMessageId(null);
      setEditText('');
    } catch (error) {
      console.error('❌ Eroare la editarea mesajului:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  // Reacție pe mesaj
  const handleReactToMessage = async (msgId, emoji) => {
    setReactionTargetId(null);
    setHoveredMsgId(null);
    try {
      setMessages(prev => prev.map(m => {
        if (m._id !== msgId) return m;
        const reactions = m.reactions || [];
        const idx = reactions.findIndex(r => r.userId === effectiveUserId && r.emoji === emoji);
        return {
          ...m,
          reactions: idx >= 0
            ? reactions.filter((_, i) => i !== idx)
            : [...reactions, { userId: effectiveUserId, emoji, createdAt: new Date() }]
        };
      }));
      const res = await apiClient.post(`/api/messages/${msgId}/react`, { emoji });
      if (res.data?.reactions) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: res.data.reactions } : m));
      }
    } catch (e) {
      console.error('Eroare reacție:', e);
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
    <div
      className="chat-popup-overlay"
      ref={overlayRef}
      style={dragPos ? { left: dragPos.left + 'px', top: dragPos.top + 'px', right: 'auto', bottom: 'auto' } : undefined}
    >
      <div
        className={"chat-popup-box" + (isResizable ? " resizable" : "") + (minimized ? " minimized" : "")}
        style={isResizable && !minimized ? { width: boxWidth + 'px', height: boxHeight + 'px' } : undefined}
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
        <div
          className={"chat-popup-header" + (isResizable ? " draggable" : "")}
          onPointerDown={startDrag}
        >
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
          <div className="chat-popup-header-actions">
            {onMinimize && (
              <button className="chat-popup-minimize" onClick={onMinimize} title="Minimizează">
                &#8722;
              </button>
            )}
            <button className="chat-popup-close" onClick={onClose}>&#10005;</button>
          </div>
        </div>
        <div
          className="chat-popup-announcement"
          onClick={() => { const id = announcement?.id || announcement?._id; if (id) navigate(`/announcement/${id}`); }}
          style={{ cursor: announcement?.id || announcement?._id ? 'pointer' : 'default' }}
        >
          <img className="chat-popup-announcement-img" src={announcement?.images?.[0] || ''} alt="anunt" />
          <div className="chat-popup-announcement-info">
            <div className="chat-popup-announcement-title">{announcement?.title}</div>
            <div className="chat-popup-announcement-price">{announcement?.price ? `${announcement.price} RON` : ''}</div>
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
            messages.map((msg, idx) => {
              const isOwn = msg.senderId === effectiveUserId;
              const reactionCounts = (msg.reactions || []).reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {});
              const myReactions = (msg.reactions || [])
                .filter(r => r.userId === effectiveUserId)
                .map(r => r.emoji);

              return (
                <div
                  key={msg._id || `msg-${idx}`}
                  className={`chat-popup-message-row ${isOwn ? 'chat-popup-message-own-row' : 'chat-popup-message-other-row'}`}
                >
                  <div
                    className={`cp-msg-wrapper ${isOwn ? 'cp-msg-wrapper--own' : 'cp-msg-wrapper--other'}`}
                    onMouseEnter={() => setHoveredMsgId(msg._id)}
                    onMouseLeave={() => { if (reactionTargetId !== msg._id) setHoveredMsgId(null); }}
                  >
                    {/* Bara de acțiuni (hover) */}
                    {hoveredMsgId === msg._id && reactionTargetId !== msg._id && editingMessageId !== msg._id && (
                      <div className={`cp-message-actions-bar ${isOwn ? 'own' : ''}`}>
                        <button
                          className="cp-message-action-btn"
                          title="Răspunde"
                          onClick={() => setSelectedReply({ messageId: msg._id, senderId: msg.senderId, text: msg.text, image: msg.image })}
                        >
                          <ReplyIcon sx={{ fontSize: 15 }} />
                        </button>
                        <button
                          className="cp-message-action-btn"
                          title="Reacție"
                          onClick={() => setReactionTargetId(msg._id)}
                        >
                          <SentimentSatisfiedAltIcon sx={{ fontSize: 15 }} />
                        </button>
                        <button
                          className="cp-message-action-btn copy"
                          title="Copiază"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text || '');
                            setCopiedMessageId(msg._id);
                            setTimeout(() => setCopiedMessageId(null), 1200);
                          }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 15 }} />
                          {copiedMessageId === msg._id && <span className="cp-copied-label">Copiat</span>}
                        </button>
                        {isOwn && (!msg.messageType || msg.messageType === 'text') && (
                          <button
                            className="cp-message-action-btn"
                            title="Editează"
                            onClick={() => handleStartEdit(msg)}
                          >
                            <EditIcon sx={{ fontSize: 15 }} />
                          </button>
                        )}
                        {isOwn && (
                          <button
                            className="cp-message-action-btn delete"
                            title="Șterge"
                            onClick={() => handleDeleteMessage(msg._id)}
                          >
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reaction picker */}
                    {reactionTargetId === msg._id && (
                      <div className={`cp-reaction-picker ${isOwn ? 'own' : ''}`}>
                        {reactionEmojis.map(e => (
                          <button key={e} className="cp-reaction-option" onClick={() => handleReactToMessage(msg._id, e)}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`chat-popup-message ${isOwn ? 'chat-popup-message-own' : 'chat-popup-message-other'}`}>
                      {msg.replyTo && (
                        <div className="cp-reply-preview">
                          <span className="cp-reply-preview-text">{msg.replyTo.text || '📷 Imagine'}</span>
                        </div>
                      )}
                      <div className="chat-popup-message-text">
                        {msg.messageType === 'negotiation' ? (
                          <div className="cp-negotiation-message">
                            <div className="cp-negotiation-message-header">
                              {msg.negotiation?.action === 'collaboration_confirmed' ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                : msg.negotiation?.action === 'partial_confirm' ? <AccessTimeIcon sx={{ fontSize: 16 }} />
                                : msg.negotiation?.action === 'accept' ? <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                : msg.negotiation?.action === 'reject' ? <EventBusyIcon sx={{ fontSize: 16 }} />
                                : <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} />}
                              <span>
                                {msg.negotiation?.action === 'collaboration_confirmed' ? t('chat.collaborationConfirmed')
                                  : msg.negotiation?.action === 'partial_confirm' ? t('chat.partialConfirm')
                                  : msg.negotiation?.action === 'accept' ? t('chat.offerAccepted')
                                  : msg.negotiation?.action === 'reject' ? t('chat.offerRejected')
                                  : msg.negotiation?.action === 'counter_offer' ? t('chat.counterOffer')
                                  : t('chat.negotiationOffer')}
                              </span>
                            </div>
                            {msg.negotiation?.price != null && (
                              <div className="cp-negotiation-message-price">{msg.negotiation.price} RON</div>
                            )}
                            {msg.negotiation?.message && (
                              <div className="cp-negotiation-message-text">{msg.negotiation.message}</div>
                            )}
                          </div>
                        ) : (
                          <>
                            {msg.image && (
                              <div className="chat-popup-image-wrapper">
                                <img
                                  src={msg.image}
                                  alt={msg.imageFile || 'image'}
                                  className="chat-popup-image"
                                  onLoad={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                />
                              </div>
                            )}
                            {editingMessageId === msg._id ? (
                              <div className="cp-message-edit-box">
                                <textarea
                                  className="cp-message-edit-textarea"
                                  value={editText}
                                  maxLength={2000}
                                  autoFocus
                                  onChange={(e) => setEditText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(msg._id); }
                                    else if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }
                                  }}
                                />
                                <div className="cp-message-edit-actions">
                                  <button type="button" className="cp-message-edit-cancel" onClick={handleCancelEdit} disabled={savingEdit}>
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </button>
                                  <button type="button" className="cp-message-edit-save" onClick={() => handleSaveEdit(msg._id)} disabled={savingEdit || !editText.trim()}>
                                    <CheckIcon sx={{ fontSize: 14 }} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              msg.text && <div>{msg.text}{msg.editedAt && <span className="cp-message-edited">(editat)</span>}</div>
                            )}
                          </>
                        )}
                      </div>
                      {msg.createdAt && (
                        <div className="chat-popup-message-time">
                          {new Date(msg.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {/* Reaction pills */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="cp-reaction-pills">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className={`cp-reaction-chip ${myReactions.includes(emoji) ? 'mine' : ''}`}
                            onClick={() => handleReactToMessage(msg._id, emoji)}
                          >
                            {emoji}
                            {count > 1 && <span className="cp-reaction-count">{count}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isOtherUserTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        {selectedReply && (
          <div className="cp-reply-composer">
            <div className="cp-reply-composer-content">
              <span className="cp-reply-composer-label">Răspunzi la:</span>
              <span className="cp-reply-composer-text">{selectedReply.text || '📷 Imagine'}</span>
            </div>
            <button className="cp-reply-composer-cancel" onClick={() => setSelectedReply(null)}>✕</button>
          </div>
        )}
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
