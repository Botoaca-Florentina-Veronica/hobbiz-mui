import React, { useState, useEffect, useLayoutEffect, useRef, Fragment } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';

import TypingIndicator from '../components/TypingIndicator';
import useSocket from '../hooks/useSocket';
import apiClient from '../api/api';

import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ArrowBack from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import gumballChat from '../assets/images/gumballChat.jpg';

import './ChatPage.css';
import './ChatPageCollaboration.css';
import { resolveMediaUrl } from '../utils/media';
import { useChatContext } from '../context/ChatContext';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

const resolveAvatarUrl = (src) => resolveMediaUrl(src);

const getIsDarkMode = () => {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains('dark-mode');
};
const getAccentHex = () => (getIsDarkMode() ? 'f51866' : '355070');

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const userId = localStorage.getItem('userId');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(380);
  const longPressTimersRef = useRef({});

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
  const [longPressBarStyle, setLongPressBarStyle] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [selectedReply, setSelectedReply] = useState(null);
  const [reactionTargetId, setReactionTargetId] = useState(null);
  
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [sendingCollab, setSendingCollab] = useState(false);
  const [confirmCollabDialog, setConfirmCollabDialog] = useState(false);
  const [collabStatusDialog, setCollabStatusDialog] = useState({ open: false, message: '', type: 'info' });

  // Negotiation state
  const [activeNegotiation, setActiveNegotiation] = useState(null);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState('');
  const [loadingNegotiation, setLoadingNegotiation] = useState(false);
  const [negotiationSnackbar, setNegotiationSnackbar] = useState(null); // { message, type }
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);

  const MOBILE_BREAKPOINT = 1024;
  const [isMobile, setIsMobile] = useState(() => getEffectiveViewportWidth() <= MOBILE_BREAKPOINT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => getEffectiveViewportWidth() <= MOBILE_BREAKPOINT);

  const isChattingOnMobile = isMobile && !!selectedConversation;
  const isDesktop = !isMobile;

  const { socket, emitTyping, on, off } = useSocket(userId);
  const { openPopupChat } = useChatContext();
  const { user: currentUser } = useAuth() || {};
  const isAdmin = !!currentUser?.isAdmin;
  const [confirmDeleteConvOpen, setConfirmDeleteConvOpen] = useState(false);

  const handlePopOut = () => {
    if (!selectedConversation) return;
    openPopupChat({
      announcement: {
        id: selectedConversation.announcementId,
        _id: selectedConversation.announcementId,
        title: selectedConversation.displayTitle || selectedConversation.announcementTitle,
        images: selectedConversation.announcementImage
          ? [resolveMediaUrl(selectedConversation.announcementImage)]
          : [],
      },
      seller: {
        _id: selectedConversation.id,
        id: selectedConversation.id,
        firstName: selectedConversation.participantName,
        avatar: selectedConversation.participantAvatar,
      },
      userId,
      userRole: 'cumparator',
    });
    navigate('/');
  };

  // Add/remove body class for mobile chat
  useEffect(() => {
    if (isChattingOnMobile) {
      document.body.classList.add('chat-mobile-active');
    } else {
      document.body.classList.remove('chat-mobile-active');
    }
    return () => document.body.classList.remove('chat-mobile-active');
  }, [isChattingOnMobile]);

  // Ensure the chat page is scoped so page-level background rules don't leak globally
  // Use useLayoutEffect to apply synchronously before browser paint
  useLayoutEffect(() => {
    // Add the chat-page class IMMEDIATELY - CSS will handle the white background
    // This prevents any flash by letting CSS take over before any JS paint
    document.body.classList.add('chat-page');

    return () => {
      document.body.classList.remove('chat-page');
    };
  }, []);

  // Socket listeners for online status and typing
  useEffect(() => {
    if (!userId) return;

    const handleUserStatus = (data) => {
      if (!data?.userId) return;
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (data.status === 'online') {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });
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

    on('userStatus', handleUserStatus);
    on('userTyping', handleTypingStatus);

    return () => {
      off('userStatus', handleUserStatus);
      off('userTyping', handleTypingStatus);
    };
  }, [userId, on, off]);

  // Cere starea curentă (online/offline) a interlocutorului la deschiderea unei conversații —
  // evenimentul 'userStatus' de mai sus prinde doar tranzițiile viitoare de connect/disconnect,
  // nu starea curentă a unui utilizator deja conectat înainte ca acest listener să fi pornit.
  useEffect(() => {
    const otherId = selectedConversation?.otherParticipant?.id;
    if (!socket || !otherId) return;

    socket.emit('checkStatus', otherId, (response) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (response?.status === 'online') {
          updated.add(otherId);
        } else {
          updated.delete(otherId);
        }
        return updated;
      });
    });
  }, [socket, selectedConversation?.otherParticipant?.id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(getEffectiveViewportWidth() <= MOBILE_BREAKPOINT);
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

    // Cleanup long-press timers on unmount
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // clear any residual long press timers
      Object.values(longPressTimersRef.current || {}).forEach(tm => { try { clearTimeout(tm); } catch(e){} });
      longPressTimersRef.current = {};
    };
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleDocClick = (e) => {
      // If clicking/touching inside reaction picker or message action buttons, keep state
      if (e.target.closest('.reaction-picker') || e.target.closest('.message-action-btn') || e.target.closest('.message-actions-bar')) return;
      if (reactionTargetId) setReactionTargetId(null);
      if (hoveredMessageId) { setHoveredMessageId(null); setLongPressBarStyle(null); }
      if (copiedMessageId) setCopiedMessageId(null);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('touchstart', handleDocClick);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('touchstart', handleDocClick);
    };
  }, [reactionTargetId, hoveredMessageId, copiedMessageId]);

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
          const msgType = c.lastMessage?.messageType;
          const rawText = c.lastMessage?.text || '';
          const lastMessageText =
            msgType === 'collaboration_request' || rawText === 'COLLABORATION_REQUEST'
              ? `🤝 ${t('chat.collaborationRequestText')}`
              : msgType === 'negotiation'
              ? `💰 ${t('chat.negotiationOffer')}`
              : msgType === 'booking_request'
              ? `📅 ${t('chat.bookingRequestText')}`
              : rawText || t('chat.image');

          return {
            ...c,
            id: c.otherParticipant.id,
            avatar: (annImg || partAvatar) || partAvatar,
            participantName: `${c.otherParticipant.firstName} ${c.otherParticipant.lastName}`.trim(),
            participantAvatar: partAvatar,
            displayTitle: c.announcementTitle || c.name || '(Fără titlu)',
            lastMessageText,
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

  // Load negotiation when conversation changes
  useEffect(() => {
    if (selectedConversation?.announcementId) {
      loadActiveNegotiation(selectedConversation.announcementId);
    } else {
      setActiveNegotiation(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.announcementId]);

  // Socket
  useEffect(() => {
    if (!userId) return;
    const handleNew = (msg) => {
      if (selectedConversation && msg.conversationId === selectedConversation.conversationId) {
        setMessages(prev => { if (prev.some(m => m._id === msg._id)) return prev; return [...prev, msg]; });
        // Refresh negotiation when a negotiation system message arrives
        if (msg.messageType === 'negotiation' && selectedConversation?.announcementId) {
          loadActiveNegotiation(selectedConversation.announcementId);
        }
        // Auto-mark as read since user is actively viewing this conversation
        if (String(msg.senderId) !== String(userId)) {
          apiClient.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`)
            .then(() => {
              setConversations(prev => prev.map(c =>
                c.conversationId === selectedConversation.conversationId ? { ...c, unread: false } : c
              ));
              window.dispatchEvent(new Event('chat:counts-updated'));
            })
            .catch(() => {});
        }
      }
    };
    on('newMessage', handleNew);

    const handleConversationCleared = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation.conversationId) {
        setMessages([]);
      }
    };
    on('conversationCleared', handleConversationCleared);

    // Cererile de rezervare se actualizează in-place pe mesajul existent (ca la collaboration_request),
    // dar diferit de collaborationUpdated, acesta E ascultat - altfel partea care nu a făcut acțiunea
    // (accept/respinge/anulează) nu ar vedea schimbarea de status fără refresh.
    const handleBookingUpdated = (data) => {
      if (selectedConversation && data.conversationId === selectedConversation.conversationId && data.messageId) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, bookingData: { ...m.bookingData, ...data.bookingData } } : m));
      }
    };
    on('bookingUpdated', handleBookingUpdated);

    return () => {
      off('newMessage', handleNew);
      off('conversationCleared', handleConversationCleared);
      off('bookingUpdated', handleBookingUpdated);
    };
  }, [userId, selectedConversation, on, off]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll when typing indicator appears so it's fully visible
  useEffect(() => {
    if (!typingUsers.size) return;
    const id = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(id);
  }, [typingUsers.size]);

  // --- Collaboration Helpers ---
  const isCollaborationRequestMessage = (msg) => {
    return msg.messageType === 'collaboration_request' || 
           String(msg.text || '').trim() === 'COLLABORATION_REQUEST';
  };

  const getCollaborationStatus = (msg) => {
    const acceptedBy = (msg.collaborationData?.acceptedBy || []).map(String);
    const declinedBy = (msg.collaborationData?.declinedBy || []).map(String);
    const isAccepted = acceptedBy.length >= 2;
    const isDeclined = declinedBy.length > 0;
    return { acceptedBy, declinedBy, isAccepted, isDeclined };
  };

  const findExistingCollaborationRequest = () => {
    const collabMessages = messages.filter(m => isCollaborationRequestMessage(m));
    if (collabMessages.length === 0) {
      return { latest: null, accepted: false, pending: false };
    }
    const latest = collabMessages[collabMessages.length - 1];
    const accepted = collabMessages.some(m => getCollaborationStatus(m).isAccepted);
    const pending = !accepted && collabMessages.some(m => {
      const s = getCollaborationStatus(m);
      return !s.isAccepted && !s.isDeclined;
    });
    return { latest, accepted, pending };
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    setConfirmDeleteConvOpen(false);
    const convId = selectedConversation.conversationId;
    console.log('[Admin] DELETE conversation messages, conversationId:', convId);
    try {
      const res = await apiClient.delete(`/api/messages/conversation/${convId}/all`);
      console.log('[Admin] Delete response:', res.data);
      setMessages([]);
      setConversations(prev => prev.filter(c => c.conversationId !== convId));
      setSelectedConversation(null);
      showNegotiationSnackbar('Toate mesajele au fost șterse.', 'success');
    } catch (err) {
      console.error('Eroare la ștergerea conversației:', err);
      const msg = err?.response?.data?.error || `Eroare ${err?.response?.status || ''}: nu s-au putut șterge mesajele.`;
      showNegotiationSnackbar(msg, 'error');
    }
  };

  // ── Negotiation helpers ──────────────────────────────────────

  const showNegotiationSnackbar = (message, type = 'success') => {
    setNegotiationSnackbar({ message, type });
    setTimeout(() => setNegotiationSnackbar(null), 3500);
  };

  const loadActiveNegotiation = async (announcementId) => {
    if (!announcementId) { setActiveNegotiation(null); return; }
    try {
      const res = await apiClient.get(`/api/negotiations/announcement/${announcementId}`);
      const negotiations = res.data.negotiations || [];
      const active = negotiations.find(neg =>
        (neg.buyer._id === userId || neg.seller._id === userId) &&
        ['pending', 'counter_offer', 'pending_confirmation', 'confirmed'].includes(neg.status)
      );
      setActiveNegotiation(active || null);
    } catch (e) {
      if (e?.response?.status !== 404) console.error('Negotiation load error:', e);
      setActiveNegotiation(null);
    }
  };

  const handleAcceptOffer = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await apiClient.post(`/api/negotiations/${activeNegotiation._id}/accept`);
      showNegotiationSnackbar(t('chat.offerAccepted'), 'success');
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleRejectOffer = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await apiClient.post(`/api/negotiations/${activeNegotiation._id}/reject`);
      showNegotiationSnackbar(t('chat.offerRejected'), 'info');
      setActiveNegotiation(null);
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleSendCounterOffer = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    const price = parseFloat(counterOfferPrice);
    if (isNaN(price) || price <= 0) return;
    try {
      setLoadingNegotiation(true);
      setCounterOfferOpen(false);
      const isSeller = String(userId) === String(activeNegotiation.seller._id);
      let res;
      if (isSeller) {
        res = await apiClient.post(`/api/negotiations/${activeNegotiation._id}/counter-offer`, { counterPrice: price });
      } else {
        res = await apiClient.post(`/api/negotiations/${activeNegotiation._id}/buyer-counter`, { newPrice: price });
      }
      const displayPrice = res.data.negotiation?.currentPrice ?? price;
      showNegotiationSnackbar(t('chat.counterOfferSent').replace('{price}', displayPrice), 'success');
      setCounterOfferPrice('');
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleAcceptCounterOffer = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await apiClient.post(`/api/negotiations/${activeNegotiation._id}/accept-counter`);
      showNegotiationSnackbar(t('chat.offerAccepted'), 'success');
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleConfirmCollaboration = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    try {
      setLoadingNegotiation(true);
      const res = await apiClient.post(`/api/negotiations/${activeNegotiation._id}/confirm`);
      if (res.data.collaborationEstablished) {
        showNegotiationSnackbar(t('chat.collaborationConfirmedMsg'), 'success');
      } else {
        showNegotiationSnackbar(t('chat.waitingForConfirmation'), 'info');
      }
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleFinalizeDeal = async () => {
    if (!activeNegotiation || loadingNegotiation) return;
    setConfirmFinalizeOpen(false);
    try {
      setLoadingNegotiation(true);
      await apiClient.post(`/api/negotiations/${activeNegotiation._id}/finalize`);
      showNegotiationSnackbar(`${t('chat.dealFinalized')} ${activeNegotiation.currentPrice} RON`, 'success');
      await loadActiveNegotiation(selectedConversation?.announcementId);
    } catch (e) {
      showNegotiationSnackbar(e?.response?.data?.message || t('chat.negotiationError'), 'error');
    } finally { setLoadingNegotiation(false); }
  };

  const handleSendCollaborationRequest = () => {
    if (!selectedConversation || sendingCollab) return;
    const existing = findExistingCollaborationRequest();
    if (existing.accepted) {
      setCollabStatusDialog({ open: true, message: t('chat.collaborationAlreadyAccepted'), type: 'success' });
      return;
    }
    if (existing.pending) {
      setCollabStatusDialog({ open: true, message: t('chat.collaborationAlreadyPending'), type: 'pending' });
      return;
    }
    setConfirmCollabDialog(true);
  };

  const confirmSendCollaborationRequest = async () => {
    if (!selectedConversation || sendingCollab) return;
    setConfirmCollabDialog(false);
    setSendingCollab(true);

    const otherId = selectedConversation.otherParticipant.id;
    const tempId = `tmp-collab-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      conversationId: selectedConversation.conversationId,
      senderId: userId,
      destinatarId: otherId,
      text: t('chat.collaborationRequestText'),
      createdAt: new Date().toISOString(),
      senderInfo: { firstName: 'Tu', avatar: currentUserAvatar },
      messageType: 'collaboration_request',
      collaborationData: {
        participants: [String(userId), String(otherId)],
        acceptedBy: [String(userId)],
        declinedBy: []
      }
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const payload = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        destinatarId: otherId,
        text: 'COLLABORATION_REQUEST',
        messageType: 'collaboration_request',
        collaborationData: {
          participants: [String(userId), String(otherId)],
          acceptedBy: [String(userId)],
          declinedBy: []
        }
      };

      if (selectedConversation.announcementId) {
        payload.announcementId = selectedConversation.announcementId;
      }

      const response = await apiClient.post('/api/messages', payload);
      if (response.data && response.data._id) {
        setMessages(prev => prev.map(m => m._id === tempId ? { ...response.data, senderInfo: tempMessage.senderInfo } : m));
      }
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      alert(t('chat.sendMessageError'));
    } finally {
      setSendingCollab(false);
    }
  };

  const handleCollaborationResponse = async (messageId, accept) => {
    if (!messageId) return;
    try {
      const res = await apiClient.post(`/api/messages/${encodeURIComponent(String(messageId))}/collaboration-response`, { accept });
      const updated = res.data;
      if (updated && updated._id) {
        setMessages(prev => prev.map(m => m._id === updated._id ? { ...m, ...updated } : m));
      }
    } catch (err) {
      console.error('Collaboration response error:', err);
      alert(t('chat.sendMessageError'));
    }
  };

  // --- Booking request helpers ---

  const handleBookingResponse = async (bookingId, accept) => {
    if (!bookingId) return;
    try {
      const res = await apiClient.post(`/api/bookings/${encodeURIComponent(String(bookingId))}/respond`, { accept });
      const updated = res.data?.message;
      if (updated && updated._id) {
        setMessages(prev => prev.map(m => m._id === updated._id ? { ...m, ...updated } : m));
      }
    } catch (err) {
      console.error('Booking response error:', err);
      alert(t('chat.sendMessageError'));
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      const res = await apiClient.post(`/api/bookings/${encodeURIComponent(String(bookingId))}/cancel`);
      const updated = res.data?.message;
      if (updated && updated._id) {
        setMessages(prev => prev.map(m => m._id === updated._id ? { ...m, ...updated } : m));
      }
    } catch (err) {
      console.error('Booking cancel error:', err);
      alert(t('chat.sendMessageError'));
    }
  };

  // --- Handlers ---

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    if (newMessage.length > 2000) return;
    clearTimeout(typingTimeoutRef.current);
    if (selectedConversation) emitTyping([userId, selectedConversation.id].sort().join('-'), false);
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
  const reactionEmojis = [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '😍', '🤔', '😎', '👎',
    '🥰', '😘', '🤩', '😏', '😴', '🤯', '🥳', '😡', '🤮', '💀', '👻', '🤡',
    '💪', '👏', '🙌', '🤝', '✌️', '🫶', '💯', '💔', '💕', '⭐', '🌟', '🎯',
    '🏆', '🎵', '🍀', '🌈', '☀️', '🌙', '❄️', '💎', '🦋', '🐱', '🐶', '🍕',
    '☕', '🍺', '🚀', '✅',
  ];
  const unreadConvs = conversations.filter(c => c.unread);
  const readConvs = conversations.filter(c => !c.unread);

  return (
    <>
      <div className="chat-mobile-topbar">
        <button type="button" className="chat-mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
          ☰ {t('chat.conversations')} {unreadConvs.length > 0 && `(${unreadConvs.length})`}
        </button>
      </div>

      <div className={`chat-page-container ${isChattingOnMobile ? 'mobile-chatting' : ''}`}>
        
        {/* Sidebar */}
        <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`} style={isDesktop ? { width: sidebarWidth } : {}}>
          {/* Default Desktop Header / Legacy Mobile header replaced by gradient on mobile */}
          {!isMobile && (
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, mb: 1, pt: 'clamp(36px, 7vh, 72px)', px: 2 }}>
              <IconButton onClick={() => navigate('/')} sx={{ color: 'var(--c-text-primary)' }}><ArrowBack /></IconButton>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--c-text-primary)' }}>Chat</Typography>
            </Box>
          )}
          
          {isMobile ? (
            <div className="chat-mobile-gradient-header">
              <div className="chat-mobile-header-top">
                <div className="chat-mobile-header-title-section">
                  <Typography variant="h5" className="list-header-title">
                    {t('chat.conversations', 'Mesaje')} ({conversations?.length || 0})
                  </Typography>
                  <Typography variant="subtitle2" className="list-header-subtitle">
                    {t('chat.continueConversations', 'Continuă conversațiile')}
                  </Typography>
                </div>
              </div>
              
              <div className="chat-mobile-filter-segment">
                <button className={`chat-mobile-filter-btn ${activeTab === 'buying' ? 'active' : ''}`} onClick={() => setActiveTab('buying')}>
                  <span className="chat-mobile-filter-text">{t('chat.buying')}</span>
                </button>
                <button className={`chat-mobile-filter-btn ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')}>
                  <span className="chat-mobile-filter-text">{t('chat.selling')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-tabs">
              <button className={`chat-tab ${activeTab === 'buying' ? 'active' : ''}`} onClick={() => setActiveTab('buying')}>{t('chat.buying')}</button>
              <button className={`chat-tab ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')}>{t('chat.selling')}</button>
            </div>
          )}

          <div className="chat-conversation-list mobile-flat-list">
            {unreadConvs.length > 0 && <div className="chat-section-label">{t('chat.unread')}</div>}
            {unreadConvs.map(c => (
              <div key={c.conversationId} className={`chat-conversation-item unread ${selectedConversation?.conversationId === c.conversationId ? 'selected' : ''}`} onClick={() => { setSelectedConversation(c); setIsSidebarOpen(false); }}>
                <img className="chat-avatar" src={c.avatar} alt="av" style={{cursor: c.announcementId ? 'pointer' : 'default'}} onClick={(e) => { if (c.announcementId) { e.stopPropagation(); navigate(`/announcement/${c.announcementId}`); } }} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${(c.displayTitle||'U').slice(0,1)}&background=${getAccentHex()}&color=fff`; }}/>
                <div className="chat-conversation-info">
                  <div className="chat-conversation-owner">{c.announcementOwnerName}</div>
                  <div className="chat-conversation-title">{c.displayTitle}</div>
                  <div className="chat-conversation-message">{c.lastMessageText}</div>
                </div>
                <div className="chat-conversation-time">{c.timeFormatted}</div>
              </div>
            ))}
            {readConvs.length > 0 && <div className="chat-section-label">{t('chat.read')}</div>}
            {readConvs.map(c => (
              <div key={c.conversationId} className={`chat-conversation-item read ${selectedConversation?.conversationId === c.conversationId ? 'selected' : ''}`} onClick={() => { setSelectedConversation(c); setIsSidebarOpen(false); }}>
                <img className="chat-avatar" src={c.avatar} alt="av" style={{cursor: c.announcementId ? 'pointer' : 'default'}} onClick={(e) => { if (c.announcementId) { e.stopPropagation(); navigate(`/announcement/${c.announcementId}`); } }} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${(c.displayTitle||'U').slice(0,1)}&background=${getAccentHex()}&color=fff`; }}/>
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
                      <span className="typing-status">{t('chat.typing')}</span>
                    ) : onlineUsers.has(selectedConversation.otherParticipant?.id) ? (
                      <span className="online-status">{t('chat.online')}</span>
                    ) : (
                      <span className="offline-status">{formatLastSeen()}</span>
                    )}
                  </p>
                </div>
                {/* Pop-out Button */}
                <IconButton
                  onClick={handlePopOut}
                  sx={{
                    marginLeft: 'auto',
                    color: 'var(--c-text-primary)',
                    '&:hover': { backgroundColor: 'var(--c-hover-bg)' }
                  }}
                  title={t('chat.popOut', 'Deschide în popup')}
                >
                  <OpenInNewIcon sx={{ fontSize: 22 }} />
                </IconButton>
                {/* Collaboration Button */}
                <IconButton
                  onClick={handleSendCollaborationRequest}
                  disabled={sendingCollab}
                  sx={{
                    color: 'var(--c-text-primary)',
                    opacity: sendingCollab ? 0.5 : 1,
                    '&:hover': { backgroundColor: 'var(--c-hover-bg)' }
                  }}
                  title={t('chat.collaborate')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </IconButton>
                {/* Finalize Deal Button (buyer only, when negotiation confirmed) */}
                {activeNegotiation?.status === 'confirmed' && String(activeNegotiation?.buyer?._id) === String(userId) && (
                  <IconButton
                    onClick={() => setConfirmFinalizeOpen(true)}
                    disabled={loadingNegotiation}
                    sx={{
                      color: '#16a34a',
                      opacity: loadingNegotiation ? 0.5 : 1,
                      '&:hover': { backgroundColor: 'rgba(22,163,74,0.1)' }
                    }}
                    title={t('chat.finalizeDeal')}
                  >
                    <CheckCircleOutlineIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                )}
                {/* Admin: Delete All Messages Button */}
                {isAdmin && (
                  <IconButton
                    onClick={() => setConfirmDeleteConvOpen(true)}
                    sx={{
                      color: '#e53935',
                      '&:hover': { backgroundColor: 'rgba(229,57,53,0.1)' }
                    }}
                    title="Șterge toate mesajele (admin)"
                  >
                    <DeleteSweepIcon sx={{ fontSize: 22 }} />
                  </IconButton>
                )}
              </div>

              {/* Negotiation Bar */}
              {activeNegotiation && activeNegotiation.status !== 'finalized' && (
                <div className="negotiation-bar">
                  <div className="negotiation-bar-top">
                    <div className="negotiation-bar-icon">💰</div>
                    <div className="negotiation-bar-info">
                      <div className="negotiation-bar-label">{t('chat.negotiationOffer')}</div>
                      <div className="negotiation-bar-status">
                        {activeNegotiation.status === 'pending'
                          ? (String(activeNegotiation.buyer._id) === String(userId)
                              ? t('chat.awaitingReply')
                              : t('chat.respondToOffer'))
                          : activeNegotiation.status === 'counter_offer'
                          ? (String(activeNegotiation.lastActionBy) === String(userId)
                              ? t('chat.awaitingReply')
                              : t('chat.respondToCounter'))
                          : activeNegotiation.status === 'pending_confirmation'
                          ? t('chat.pendingConfirmation')
                          : activeNegotiation.status === 'confirmed'
                          ? t('chat.collaborationConfirmed')
                          : t('chat.negotiationOffer')}
                      </div>
                    </div>
                    <div className="negotiation-bar-price">{activeNegotiation.currentPrice} RON</div>
                    {['pending', 'counter_offer', 'pending_confirmation'].includes(activeNegotiation.status) && (
                      <button
                        className="negotiation-bar-reject"
                        onClick={handleRejectOffer}
                        disabled={loadingNegotiation}
                      >
                        {t('chat.rejectOffer')}
                      </button>
                    )}
                  </div>

                  {/* Seller sees Accept + Counter when pending or when buyer countered */}
                  {String(activeNegotiation.seller._id) === String(userId) &&
                   (activeNegotiation.status === 'pending' ||
                    (activeNegotiation.status === 'counter_offer' && String(activeNegotiation.lastActionBy) === String(activeNegotiation.buyer._id))) && (
                    <div className="negotiation-bar-actions">
                      <button className="negotiation-bar-btn primary" disabled={loadingNegotiation} onClick={handleAcceptOffer}>
                        {t('chat.acceptOffer')}
                      </button>
                      <button className="negotiation-bar-btn secondary" disabled={loadingNegotiation} onClick={() => setCounterOfferOpen(true)}>
                        {t('chat.sendCounterOffer')}
                      </button>
                    </div>
                  )}

                  {/* Buyer sees Accept Counter + Counter when seller countered */}
                  {String(activeNegotiation.buyer._id) === String(userId) &&
                   activeNegotiation.status === 'counter_offer' &&
                   String(activeNegotiation.lastActionBy) === String(activeNegotiation.seller._id) && (
                    <div className="negotiation-bar-actions">
                      <button className="negotiation-bar-btn primary" disabled={loadingNegotiation} onClick={handleAcceptCounterOffer}>
                        {t('chat.acceptOffer')}
                      </button>
                      <button className="negotiation-bar-btn secondary" disabled={loadingNegotiation} onClick={() => setCounterOfferOpen(true)}>
                        {t('chat.sendCounterOffer')}
                      </button>
                    </div>
                  )}

                  {/* Both see Confirm button when pending_confirmation */}
                  {activeNegotiation.status === 'pending_confirmation' && (
                    <div className="negotiation-bar-actions">
                      <button className="negotiation-bar-btn primary" disabled={loadingNegotiation} onClick={handleConfirmCollaboration}>
                        {t('chat.confirmCollaboration')}
                      </button>
                    </div>
                  )}

                  {/* Confirmed message */}
                  {activeNegotiation.status === 'confirmed' && (
                    <div className="negotiation-bar-confirmed-msg">{t('chat.collaborationConfirmedMsg')}</div>
                  )}
                </div>
              )}

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
                    <div
                      className={`chat-message ${isOwn ? 'own' : ''}`}
                      onMouseEnter={() => setHoveredMessageId(msg._id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      onContextMenu={(e) => { e.preventDefault(); setHoveredMessageId(msg._id); }}
                      onTouchStart={(e) => {
                        // Start long press timer
                        if (e.touches && e.touches.length > 1) return; // ignore multi-touch
                        const el = e.currentTarget;
                        longPressTimersRef.current[msg._id] = setTimeout(() => {
                          if (getEffectiveViewportWidth() <= MOBILE_BREAKPOINT) {
                            const rect = el.getBoundingClientRect();
                            const barHeight = 56;
                            const topPx = Math.max(barHeight + 8, rect.top - barHeight - 6);
                            setLongPressBarStyle({
                              top: `${topPx}px`,
                              bottom: 'auto',
                              left: isOwn ? 'auto' : `${Math.max(8, rect.left)}px`,
                              right: isOwn ? `${Math.max(8, window.innerWidth - rect.right)}px` : 'auto',
                              transform: 'none',
                            });
                          }
                          setHoveredMessageId(msg._id);
                        }, 500);
                      }}
                      onTouchEnd={(e) => {
                        // Cancel long press timer if released quickly
                        if (longPressTimersRef.current[msg._id]) { clearTimeout(longPressTimersRef.current[msg._id]); delete longPressTimersRef.current[msg._id]; }
                      }}
                      onTouchMove={(e) => {
                        // If the finger moved, cancel long-press
                        if (longPressTimersRef.current[msg._id]) { clearTimeout(longPressTimersRef.current[msg._id]); delete longPressTimersRef.current[msg._id]; }
                      }}
                    >
                      <div className="chat-message-content-group">
                        <div className="chat-bubble-row">
                          <div className="chat-message-bubble">
                            {msg.replyTo && <div className={`chat-reply-preview ${msg.replyTo.senderId === userId ? 'own' : ''}`}><div className="chat-reply-text">{msg.replyTo.text || t('chat.image')}</div></div>}
                            
                            {/* Collaboration Request Message */}
                            {isCollaborationRequestMessage(msg) ? (
                              <div className="collaboration-message">
                                <div className="collaboration-header">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                  </svg>
                                  <strong>{t('chat.collaborationRequestText')}</strong>
                                </div>
                                {(() => {
                                  const { acceptedBy, declinedBy, isAccepted, isDeclined } = getCollaborationStatus(msg);
                                  const iAccepted = acceptedBy.includes(String(userId));
                                  const iDeclined = declinedBy.includes(String(userId));
                                  const canRespond = !isAccepted && !isDeclined && !iAccepted && !iDeclined;
                                  
                                  let statusText = isAccepted 
                                    ? t('chat.collaborationAccepted')
                                    : isDeclined 
                                      ? t('chat.collaborationDeclined')
                                      : `${t('chat.collaborationPending')} (${acceptedBy.length}/2)`;

                                  return (
                                    <>
                                      <div className="collaboration-status">{statusText}</div>
                                      {iAccepted && !isAccepted && !isDeclined && (
                                        <div className="collaboration-hint">{t('chat.collaborationYouAcceptedWaiting')}</div>
                                      )}
                                      {canRespond && (
                                        <div className="collaboration-buttons">
                                          <button 
                                            className="collab-btn accept"
                                            onClick={() => handleCollaborationResponse(msg._id, true)}
                                          >
                                            {t('chat.accept')}
                                          </button>
                                          <button 
                                            className="collab-btn decline"
                                            onClick={() => handleCollaborationResponse(msg._id, false)}
                                          >
                                            {t('chat.decline')}
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            ) : msg.messageType === 'booking_request' ? (
                              <div className="booking-message">
                                <div className="booking-message-header">
                                  <CalendarMonthIcon fontSize="small" />
                                  <strong>{t('chat.bookingRequestText')}</strong>
                                </div>
                                <div className="booking-message-details">
                                  {msg.bookingData?.date && new Date(`${msg.bookingData.date}T00:00:00`).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
                                  {' · '}{msg.bookingData?.startTime} - {msg.bookingData?.endTime}
                                </div>
                                {msg.text && <div className="booking-message-text">{msg.text}</div>}
                                <div className={`booking-status booking-status--${msg.bookingData?.status || 'pending'}`}>
                                  {msg.bookingData?.status === 'accepted' ? <CheckCircleOutlineIcon fontSize="inherit" />
                                    : (msg.bookingData?.status === 'rejected' || msg.bookingData?.status === 'cancelled') ? <EventBusyIcon fontSize="inherit" />
                                    : <AccessTimeIcon fontSize="inherit" />}
                                  {t(`chat.bookingStatus.${msg.bookingData?.status || 'pending'}`)}
                                </div>
                                {msg.bookingData?.status === 'pending' && String(msg.bookingData?.providerId) === String(userId) && (
                                  <div className="booking-buttons">
                                    <button className="collab-btn accept" onClick={() => handleBookingResponse(msg.bookingData.bookingId, true)}>
                                      {t('chat.accept')}
                                    </button>
                                    <button className="collab-btn decline" onClick={() => handleBookingResponse(msg.bookingData.bookingId, false)}>
                                      {t('chat.decline')}
                                    </button>
                                  </div>
                                )}
                                {['pending', 'accepted'].includes(msg.bookingData?.status) && (
                                  <div className="booking-buttons">
                                    <button className="collab-btn decline" onClick={() => handleCancelBooking(msg.bookingData.bookingId)}>
                                      {t('chat.bookingCancel')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : msg.messageType === 'negotiation' ? (
                              <div className="negotiation-message">
                                <div className="negotiation-message-header">
                                  <span>💰</span>
                                  <span>{t('chat.negotiationOffer')}</span>
                                </div>
                                {msg.negotiation?.price != null && (
                                  <div className="negotiation-message-price">{msg.negotiation.price} RON</div>
                                )}
                                {msg.text && (
                                  <div className="negotiation-message-text">{msg.text}</div>
                                )}
                              </div>
                            ) : (
                              <>
                                {msg.image && <div className="chat-message-image"><img src={msg.image} alt="att" /></div>}
                                {msg.text && <p className="chat-message-text">{msg.text}</p>}
                              </>
                            )}
                            
                            {/* ACTIONS (hover or long-press on mobile) */}
                            {hoveredMessageId === msg._id && reactionTargetId !== msg._id && (
                              <div className="message-actions-bar" style={longPressBarStyle || undefined}>
                                <button className="message-action-btn" onClick={() => setSelectedReply({ messageId: msg._id, senderId: msg.senderId, senderName: isOwn ? t('common.you') : t('common.user'), text: msg.text, image: msg.image })}><ReplyIcon fontSize="small"/></button>
                                <button className="message-action-btn" onClick={() => setReactionTargetId(msg._id)}><SentimentSatisfiedAltIcon fontSize="small"/></button>
                                <button className="message-action-btn copy" onClick={() => { navigator.clipboard.writeText(msg.text||''); setCopiedMessageId(msg._id); setTimeout(()=>setCopiedMessageId(null), 1200); }}>
                                  <ContentCopyIcon fontSize="small"/>
                                  {copiedMessageId === msg._id && (
                                    <div className="message-copied" role="status" aria-live="polite">{t('chat.copied')}</div>
                                  )}
                                </button>
                                {isOwn && <button className="message-action-btn" onClick={() => { apiClient.delete(`/api/messages/${msg._id}`).then(() => setMessages(p => p.filter(m => m._id !== msg._id))); }}><DeleteIcon fontSize="small"/></button>}
                              </div>
                            )}

                          </div>
                          {/* REACTIONS PILLS - outside bubble, next to it */}
                          {Object.keys(reactionCounts).length > 0 && (
                            <div className="message-reactions-bubble">
                              {Object.entries(reactionCounts).map(([emoji, count]) => {
                                const iReacted = myReactions.includes(emoji);
                                return (
                                  <div 
                                    key={emoji} 
                                    className={`reaction-chip ${iReacted ? 'mine' : ''}`}
                                    onClick={() => handleReactToMessage(msg._id, emoji)}
                                    title={iReacted ? t('chat.deleteReaction') : t('chat.addReaction')}
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && <span style={{marginLeft:2, fontWeight:600}}>{count}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
                {typingUsers.has(selectedConversation?.otherParticipant?.id) && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-container" onSubmit={handleSendMessage}>
                {selectedReply && (
                  <div className="chat-reply-composer">
                    <div>{t('chat.replyTo')} {selectedReply.senderName}</div>
                    <button type="button" onClick={() => setSelectedReply(null)}>×</button>
                  </div>
                )}
                {selectedImage && <div className="chat-image-preview"><img src={selectedImage.preview} alt="prev"/><button type="button" className="chat-image-remove" onClick={() => setSelectedImage(null)}>×</button></div>}
                
                <div className="chat-input-wrapper">
                  <div className="chat-input-buttons">
                    <button type="button" className="chat-input-button" onClick={() => fileInputRef.current?.click()}>📎</button>
                    <button type="button" className="chat-input-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  </div>
                  <input className="chat-input" placeholder={t('chat.messagePlaceholder')} value={newMessage} maxLength={2000} onChange={e => {
                    setNewMessage(e.target.value);
                    const convId = [userId, selectedConversation.id].sort().join('-');
                    emitTyping(convId, true);
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => emitTyping(convId, false), 2000);
                  }}/>
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
              <h3>{t('chat.selectConversationTitle')}</h3>
              <p>{t('chat.empty')}</p>
            </div>
          )}
        </main>
      </div>

      {/* Collaboration Confirmation Dialog */}
      {confirmCollabDialog && (
        <div className="collab-dialog-overlay" onClick={() => setConfirmCollabDialog(false)}>
          <div className="collab-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="collab-dialog-header">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>{t('chat.collaborateConfirmTitle')}</h3>
            </div>
            <p className="collab-dialog-message">{t('chat.collaborateConfirmMessage')}</p>
            <div className="collab-dialog-actions">
              <button 
                className="collab-dialog-btn cancel"
                onClick={() => setConfirmCollabDialog(false)}
              >
                {t('chat.cancel')}
              </button>
              <button 
                className="collab-dialog-btn confirm"
                onClick={confirmSendCollaborationRequest}
              >
                {t('chat.collaborate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Status Dialog */}
      {collabStatusDialog.open && (
        <div className="collab-dialog-overlay" onClick={() => setCollabStatusDialog({ open: false, message: '' })}>
          <div className="collab-dialog collab-status-dialog" onClick={(e) => e.stopPropagation()}>
            <div className={`collab-status-icon ${collabStatusDialog.type || 'info'}`}>
              {collabStatusDialog.type === 'success' ? (
                <CheckCircleOutlineIcon style={{ fontSize: 48 }} />
              ) : collabStatusDialog.type === 'pending' ? (
                <AccessTimeIcon style={{ fontSize: 48 }} />
              ) : (
                <InfoOutlinedIcon style={{ fontSize: 48 }} />
              )}
            </div>
            <p className="collab-status-message">{collabStatusDialog.message}</p>
            <button
              className="collab-dialog-btn confirm full-width"
              onClick={() => setCollabStatusDialog({ open: false, message: '' })}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Counter-offer dialog */}
      {counterOfferOpen && (
        <div className="negotiation-counter-overlay" onClick={() => { setCounterOfferOpen(false); setCounterOfferPrice(''); }}>
          <div className="negotiation-counter-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>💰 {t('chat.sendCounterOffer')}</h3>
            <p>
              {t('chat.negotiationOffer')}: <strong>{activeNegotiation?.currentPrice} RON</strong>
            </p>
            <div className="negotiation-counter-input-wrap">
              <input
                className="negotiation-counter-input"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={counterOfferPrice}
                onChange={(e) => setCounterOfferPrice(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendCounterOffer(); }}
                autoFocus
              />
              <span className="negotiation-counter-currency">RON</span>
            </div>
            <div className="negotiation-counter-actions">
              <button className="btn-cancel" onClick={() => { setCounterOfferOpen(false); setCounterOfferPrice(''); }}>
                {t('chat.cancel')}
              </button>
              <button
                className="btn-send"
                disabled={!counterOfferPrice || parseFloat(counterOfferPrice) <= 0 || loadingNegotiation}
                onClick={handleSendCounterOffer}
              >
                {t('chat.sendCounterOffer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize deal confirmation dialog */}
      {confirmFinalizeOpen && (
        <div className="collab-dialog-overlay" onClick={() => setConfirmFinalizeOpen(false)}>
          <div className="collab-dialog delete-conv-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-conv-icon-wrap" style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', color: '#166534' }}>
              <CheckCircleOutlineIcon style={{ fontSize: 36 }} />
            </div>
            <h3 className="delete-conv-title" style={{ color: 'var(--c-text-primary)' }}>{t('chat.finalizeDeal')}</h3>
            <p className="delete-conv-message">{t('chat.finalizeDealConfirm')}</p>
            <div className="delete-conv-actions">
              <button className="collab-dialog-btn delete-cancel" onClick={() => setConfirmFinalizeOpen(false)}>
                {t('chat.cancel')}
              </button>
              <button
                className="collab-dialog-btn delete-confirm"
                style={{ background: '#16a34a' }}
                onClick={handleFinalizeDeal}
              >
                {t('chat.finalizeDeal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation snackbar */}
      {negotiationSnackbar && (
        <div className={`negotiation-snackbar ${negotiationSnackbar.type}`}>
          {negotiationSnackbar.message}
        </div>
      )}

      {/* Admin: Confirm delete all messages dialog */}
      {confirmDeleteConvOpen && (
        <div className="collab-dialog-overlay" onClick={() => setConfirmDeleteConvOpen(false)}>
          <div className="collab-dialog delete-conv-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-conv-icon-wrap">
              <DeleteSweepIcon style={{ fontSize: 36 }} />
            </div>
            <h3 className="delete-conv-title">Șterge toate mesajele</h3>
            <p className="delete-conv-message">
              Ești sigur că vrei să ștergi <strong>toate mesajele</strong> din această conversație?<br />
              Această acțiune este <strong>ireversibilă</strong>.
            </p>
            <div className="delete-conv-actions">
              <button
                className="collab-dialog-btn delete-cancel"
                onClick={() => setConfirmDeleteConvOpen(false)}
              >
                Anulează
              </button>
              <button
                className="collab-dialog-btn delete-confirm"
                onClick={handleDeleteConversation}
              >
                Șterge tot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}