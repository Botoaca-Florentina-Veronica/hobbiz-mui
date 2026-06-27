import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  Keyboard,
  UIManager,
  findNodeHandle,
  Linking,
  ViewStyle,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '../components/themed-text';
// @ts-ignore - local component resolves correctly at runtime
import { ThemedTextInput } from '../components/themed-text-input';
import { Toast } from '../components/ui/Toast';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore - rely on Expo's runtime types for this native module
import * as DocumentPicker from 'expo-document-picker';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../src/services/storage';
import { useAuth } from '../src/context/AuthContext';
import { useChatNotifications } from '../src/context/ChatNotificationContext';
import ImageViewing from '../src/components/ImageViewer';
// @ts-ignore - local component resolves correctly at runtime
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { useLocale } from '../src/context/LocaleContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ReportContentModal } from '../components/ui/ReportContentModal';
import negotiationService from '../src/services/negotiationService';
import { getConversationTranslations } from '../src/i18n/conversation';

// NOTE: Pentru a evita eroarea html2canvas (folosită intern de react-native-view-shot pe web),
// NU importăm direct view-shot; vom crea un loader lazy doar pentru platformele native.
let captureRef: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    captureRef = require('react-native-view-shot').captureRef;
  } catch (e) {
    captureRef = null;
  }
}

interface Conversation {
  id: string;
  conversationId: string;
  name: string;
  avatar: string;
  participantName: string;
  participantAvatar: string;
  announcementTitle: string;
  announcementOwnerName: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  otherParticipant: { id: string; firstName?: string; lastName?: string; avatar?: string; lastSeen?: string };
  lastSeen?: string;
  announcementOwnerId: string;
  announcementId: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  destinatarId?: string;
  text?: string;
  image?: string;
  createdAt: string;
  isRead?: boolean;
  senderInfo?: { firstName?: string; lastName?: string; avatar?: string };
  replyTo?: { messageId: string; senderId: string; senderName: string; text?: string; image?: string };
  reactions?: Array<{ userId: string; emoji: string }>;
  deleted?: boolean;
  messageType?: 'text' | 'collaboration_request' | 'negotiation' | 'booking_request';
  negotiation?: { negotiationId?: string; price?: number; action?: string };
  lastActionBy?: string;
  collaborationData?: {
    participants?: string[];
    acceptedBy?: string[];
    declinedBy?: string[];
  };
  bookingData?: {
    bookingId?: string;
    providerId?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  };
}


// Animated dot for the typing indicator bubble
function TypingDot({ delay, isDark, primary }: { delay: number; isDark: boolean; primary: string }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,  duration: 300, useNativeDriver: true }),
        Animated.delay(700),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: isDark ? '#6b7280' : '#b0b8c4',
        transform: [{ translateY: anim }],
        marginHorizontal: 2,
      }}
    />
  );
}

export default function ConversationScreen() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getConversationTranslations(locale);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { decrementUnreadCount, socket } = useChatNotifications();
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const messagesEndRef = useRef<ScrollView>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [menuPosition, setMenuPosition] = useState<null | { x: number; y: number; width: number; height: number; showAbove: boolean }>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const FIXED_MENU_WIDTH = 300;
  const MENU_ITEM_HEIGHT = 48;
  const MENU_DIVIDER_HEIGHT = StyleSheet.hairlineWidth || 1;
  const [reactionBarWidth, setReactionBarWidth] = useState(0);
  const [reactionBarHeight, setReactionBarHeight] = useState(0);
  const [floatingSnapshot, setFloatingSnapshot] = useState<string | null>(null);
  const [floatingReady, setFloatingReady] = useState(false);
  const [overlayPlacement, setOverlayPlacement] = useState<'above' | 'below'>('above');
  const bubbleRefs = useRef<Record<string, View | null>>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [bubbleLayoutsMap, setBubbleLayoutsMap] = useState<Record<string, {x:number;y:number;width:number;height:number}>>({});
  const [reactionDimsMap, setReactionDimsMap] = useState<Record<string, {width:number;height:number}>>({});
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderId: string; senderName: string; text?: string; image?: string } | null>(null);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmDeleteConvVisible, setConfirmDeleteConvVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [confirmCollabVisible, setConfirmCollabVisible] = useState(false);
  const [sendingCollab, setSendingCollab] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetMessage, setReportTargetMessage] = useState<any>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  // Negotiation states
  const [activeNegotiation, setActiveNegotiation] = useState<any>(null);
  const [counterOfferModalVisible, setCounterOfferModalVisible] = useState(false);
  const [counterOfferPrice, setCounterOfferPrice] = useState('');
  const [loadingNegotiation, setLoadingNegotiation] = useState(false);
  
  // Announcement details state
  const [announcementDetails, setAnnouncementDetails] = useState<any>(null);
  const [loadingAnnouncementDetails, setLoadingAnnouncementDetails] = useState(false);

  const width = Dimensions.get('window').width;

  // Socket effect
  useEffect(() => {
    if (!socket || !selectedConversation || !userId) return;

    // Notify server that user entered this conversation
    socket.emit('joinConversation', { 
      userId, 
      conversationId: selectedConversation.conversationId 
    });
    console.log(`📱 Joined conversation: ${selectedConversation.conversationId}`);

    // Check initial status
    const otherUserId = selectedConversation.otherParticipant?.id;
    if (otherUserId) {
        // Emitere event cu ack callback
        socket.emit('checkStatus', otherUserId, (response: { status: string }) => {
            setIsOtherUserOnline(response.status === 'online');
        });
    }

    const handleNewMessage = (newMsg: Message) => {
      // Only process if it belongs to current conversation
      if (newMsg.conversationId === selectedConversation.conversationId) {
           setMessages((prev) => {
               if (prev.some(m => m._id === newMsg._id)) return prev;
               return [...prev, newMsg];
           });
           // Auto-mark as read since user is actively viewing this conversation
           if (String(newMsg.senderId) !== String(userId)) {
             api.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`).catch(() => {});
             decrementUnreadCount(1);
           }
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (data.conversationId === selectedConversation.conversationId && data.userId !== userId) {
            setIsOtherUserTyping(data.isTyping);
        }
    };
    
    const handleUserStatus = (data: { userId: string; status: string }) => {
        if (selectedConversation.otherParticipant?.id === data.userId) {
            setIsOtherUserOnline(data.status === 'online');
        }
    };

    const handleCollaborationUpdated = (data: { messageId: string; conversationId: string; collaborationData: any }) => {
      if (data.conversationId === selectedConversation.conversationId) {
        setMessages((prev) => prev.map((m) =>
          m._id === data.messageId
            ? { ...m, collaborationData: data.collaborationData }
            : m
        ));
      }
    };

    const handleBookingUpdated = (data: { messageId: string; conversationId: string; bookingData: any }) => {
      if (data.conversationId === selectedConversation.conversationId) {
        setMessages((prev) => prev.map((m) =>
          m._id === data.messageId
            ? { ...m, bookingData: { ...m.bookingData, ...data.bookingData } }
            : m
        ));
      }
    };

    const handleConversationCleared = (data: { conversationId: string }) => {
      if (data.conversationId === selectedConversation.conversationId) {
        setMessages([]);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStatus', handleUserStatus);
    socket.on('collaborationUpdated', handleCollaborationUpdated);
    socket.on('bookingUpdated', handleBookingUpdated);
    socket.on('conversationCleared', handleConversationCleared);

    return () => {
        // Notify server that user left this conversation
        socket.emit('leaveConversation', { userId });
        console.log(`👋 Left conversation: ${selectedConversation.conversationId}`);

        socket.off('newMessage', handleNewMessage);
        socket.off('userTyping', handleUserTyping);
        socket.off('userStatus', handleUserStatus);
        socket.off('collaborationUpdated', handleCollaborationUpdated);
        socket.off('bookingUpdated', handleBookingUpdated);
        socket.off('conversationCleared', handleConversationCleared);
    };
  }, [socket, selectedConversation, userId, decrementUnreadCount]);

  // Typing handler
  const handleTypingInput = (text: string) => {
    setNewMessage(text);
    
    if (!socket || !selectedConversation) return;
    
    if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { conversationId: selectedConversation.conversationId, isTyping: true });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { conversationId: selectedConversation.conversationId, isTyping: false });
    }, 2000);
  };

  const getCollaborationMessageStatus = useCallback((message: Message) => {
    const acceptedBy = (message.collaborationData?.acceptedBy || []).map(String);
    const declinedBy = (message.collaborationData?.declinedBy || []).map(String);
    const isDeclined = declinedBy.length > 0;
    const isAccepted = acceptedBy.length >= 2;
    return { acceptedBy, declinedBy, isDeclined, isAccepted };
  }, []);

  const isCollaborationRequestMessage = useCallback((message: Message) => {
    if (!message) return false;
    return (
      message.messageType === 'collaboration_request' ||
      String(message.text || '').trim() === 'COLLABORATION_REQUEST'
    );
  }, []);

  const isBookingRequestMessage = useCallback((message: Message) => {
    return !!message && message.messageType === 'booking_request';
  }, []);

  const findExistingCollaborationRequest = useCallback(() => {
    const collabMessages = messages.filter((m) => isCollaborationRequestMessage(m));
    const latest = [...collabMessages].reverse()[0] || null;
    if (collabMessages.length === 0) {
      return { latest: null as Message | null, accepted: false, pending: false };
    }

    const accepted = collabMessages.some((m) => getCollaborationMessageStatus(m).isAccepted);
    const pending =
      !accepted &&
      collabMessages.some((m) => {
        const s = getCollaborationMessageStatus(m);
        return !s.isAccepted && !s.isDeclined;
      });

    return { latest, accepted, pending };
  }, [messages, getCollaborationMessageStatus, isCollaborationRequestMessage]);

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    setConfirmDeleteConvVisible(false);
    try {
      await api.delete(`/api/messages/conversation/${selectedConversation.conversationId}/all`);
      setMessages([]);
    } catch (err) {
      console.error('Eroare la ștergerea conversației:', err);
    }
  };

  const handleSendCollaborationRequest = async () => {
    if (!userId || !selectedConversation || sendingCollab) return;

    const existing = findExistingCollaborationRequest();
    if (existing.accepted) {
      setToastMessage(t.collaborationAlreadyAccepted);
      setToastType('info');
      setToastVisible(true);
      return;
    }
    if (existing.pending) {
      setToastMessage(t.collaborationAlreadyPending);
      setToastType('info');
      setToastVisible(true);
      return;
    }

    setConfirmCollabVisible(true);
  };

  const confirmSendCollaborationRequest = async () => {
    if (!userId || !selectedConversation || sendingCollab) return;
    const otherId = selectedConversation.otherParticipant?.id;
    if (!otherId) return;

    setConfirmCollabVisible(false);
    setSendingCollab(true);

    const tempMessage: Message = {
      _id: `tmp-collab-${Date.now()}`,
      conversationId: selectedConversation.conversationId,
      senderId: userId,
      destinatarId: otherId,
      text: t.collaborationRequestText,
      createdAt: new Date().toISOString(),
      senderInfo: { firstName: 'Tu', lastName: '' },
      messageType: 'collaboration_request',
      collaborationData: {
        participants: [String(userId), String(otherId)],
        acceptedBy: [String(userId)],
        declinedBy: [],
      },
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const isSeller = String(userId) === String(selectedConversation.announcementOwnerId);
      const senderRole = isSeller ? 'vanzator' : 'cumparator';

      const payload: any = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        senderRole,
        destinatarId: otherId,
        text: 'COLLABORATION_REQUEST',
        messageType: 'collaboration_request',
        collaborationData: {
          participants: [String(userId), String(otherId)],
          acceptedBy: [String(userId)],
          declinedBy: [],
        },
        ...(selectedConversation.announcementId ? { announcementId: selectedConversation.announcementId } : {}),
      };

      const response = await api.post('/api/messages', payload);
      if (response.data && response.data._id) {
        setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? { ...response.data, senderInfo: tempMessage.senderInfo } : m)));
      }
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
      Alert.alert(t.error, t.sendMessageError);
    } finally {
      setSendingCollab(false);
    }
  };

  const handleCollaborationResponse = async (messageId: string, accept: boolean) => {
    if (!messageId) return;
    try {
      const res = await api.post(`/api/messages/${encodeURIComponent(String(messageId))}/collaboration-response`, { accept });
      const updated = res.data;
      if (updated && updated._id) {
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)));
      }
    } catch (err) {
      console.error('Collaboration response error:', err);
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  const handleBookingResponse = async (bookingId: string, accept: boolean) => {
    if (!bookingId) return;
    try {
      const res = await api.post(`/api/bookings/${encodeURIComponent(String(bookingId))}/respond`, { accept });
      const updated = res.data?.message;
      if (updated && updated._id) {
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)));
      }
    } catch (err) {
      console.error('Booking response error:', err);
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!bookingId) return;
    try {
      const res = await api.post(`/api/bookings/${encodeURIComponent(String(bookingId))}/cancel`);
      const updated = res.data?.message;
      if (updated && updated._id) {
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)));
      }
    } catch (err) {
      console.error('Booking cancel error:', err);
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  // Load announcement details
  const loadAnnouncementDetails = useCallback(async () => {
    if (!selectedConversation?.announcementId) return;
    try {
      setLoadingAnnouncementDetails(true);
      const response = await api.get(`/api/announcements/${selectedConversation.announcementId}`);
      setAnnouncementDetails(response.data);
    } catch (error) {
      console.error('Error loading announcement details:', error);
    } finally {
      setLoadingAnnouncementDetails(false);
    }
  }, [selectedConversation?.announcementId]);

  // Negotiation functions
  const loadActiveNegotiation = useCallback(async () => {
    if (!selectedConversation?.announcementId) return;
    try {
      setLoadingNegotiation(true);
      const response = await negotiationService.getAnnouncementNegotiations(selectedConversation.announcementId);
      const negotiations = response.negotiations || [];
      // Find the active negotiation between current user and the other participant
      const active = negotiations.find((neg: any) => 
        (neg.buyer._id === userId || neg.seller._id === userId) &&
        ['pending', 'counter_offer', 'pending_confirmation', 'confirmed'].includes(neg.status)
      );
      setActiveNegotiation(active || null);
      
      // Update selectedConversation with announcement info from negotiation if available
      if (active?.announcement && selectedConversation) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          announcementTitle: active.announcement.title || prev.announcementTitle,
          announcementId: active.announcement._id || prev.announcementId
        } : prev);
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 404) {
        // No negotiation yet (or backend not deployed with this route) -> keep UI clean
        setActiveNegotiation(null);
      } else {
        console.error('Error loading negotiation:', error);
      }
    } finally {
      setLoadingNegotiation(false);
    }
  }, [selectedConversation?.announcementId, userId]);

  useEffect(() => {
    if (selectedConversation?.announcementId) {
      loadActiveNegotiation();
      loadAnnouncementDetails();
    }
  }, [selectedConversation?.announcementId, loadActiveNegotiation, loadAnnouncementDetails]);

  const handleAcceptOffer = async () => {
    if (!activeNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await negotiationService.acceptOffer(activeNegotiation._id);
      setToastMessage(t.offerAccepted);
      setToastType('success');
      setToastVisible(true);
      await loadActiveNegotiation();
    } catch (error: any) {
      console.error('Error accepting offer:', error);
      Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
    } finally {
      setLoadingNegotiation(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!activeNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await negotiationService.rejectOffer(activeNegotiation._id);
      setToastMessage(t.offerRejected);
      setToastType('info');
      setToastVisible(true);
      // Ascunde bara de negociere după refuz
      setActiveNegotiation(null);
      await loadActiveNegotiation();
    } catch (error: any) {
      console.error('Error rejecting offer:', error);
      Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
    } finally {
      setLoadingNegotiation(false);
    }
  };

  const handleSendCounterOffer = async () => {
    if (!activeNegotiation || !counterOfferPrice) return;
    const price = parseFloat(counterOfferPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t.error, 'Te rog introdu un preț valid.');
      return;
    }

    try {
      setLoadingNegotiation(true);
      setCounterOfferModalVisible(false);
      
      const isSeller = String(userId) === String(activeNegotiation.seller._id);
      let res: any = null;
      if (isSeller) {
        res = await negotiationService.counterOffer(activeNegotiation._id, { counterPrice: price });
      } else {
        res = await negotiationService.buyerCounterOffer(activeNegotiation._id, { newPrice: price });
      }
      
      // Determine the displayed price from server response or fallback to entered price
      const displayedPrice = res?.negotiation?.currentPrice ?? price;

      // More descriptive toast to help users understand what happened
      const sentMessage = t.counterOfferSent ? t.counterOfferSent.replace('{price}', String(displayedPrice)) : `${t.counterOffer}: ${displayedPrice} RON`;
      setToastMessage(sentMessage);
      setToastType('success');
      setToastVisible(true);
      setCounterOfferPrice('');
      await loadActiveNegotiation();
    } catch (error: any) {
      console.error('Error sending counter offer:', error);
      Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
    } finally {
      setLoadingNegotiation(false);
    }
  };

  const handleAcceptCounterOffer = async () => {
    if (!activeNegotiation) return;
    try {
      setLoadingNegotiation(true);
      await negotiationService.acceptCounterOffer(activeNegotiation._id);
      setToastMessage(t.offerAccepted);
      setToastType('success');
      setToastVisible(true);
      await loadActiveNegotiation();
    } catch (error: any) {
      console.error('Error accepting counter offer:', error);
      Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
    } finally {
      setLoadingNegotiation(false);
    }
  };

  const handleCancelAcceptedOffer = async () => {
    if (!activeNegotiation) return;

    const title = t.rejectOffer;
    const body = locale === 'ro'
      ? 'Ești sigur că vrei să anulezi această ofertă acceptată?'
      : 'Are you sure you want to cancel this accepted offer?';

    Alert.alert(title, body, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.rejectOffer,
        style: 'destructive',
        onPress: async () => {
          try {
            setLoadingNegotiation(true);
            await negotiationService.cancelNegotiation(activeNegotiation._id);
            setToastMessage(t.offerRejected);
            setToastType('info');
            setToastVisible(true);
            await loadActiveNegotiation();
          } catch (error: any) {
            console.error('Error cancelling accepted offer:', error);
            Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
          } finally {
            setLoadingNegotiation(false);
          }
        },
      },
    ]);
  };

  const handleFinalizeDeal = async () => {
    if (!activeNegotiation) return;
    
    Alert.alert(
      t.finalizeDeal,
      t.finalizeDealConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.finalizeDeal,
          onPress: async () => {
            try {
              setLoadingNegotiation(true);
              const response = await negotiationService.finalizeNegotiation(activeNegotiation._id);
              setToastMessage(`${t.dealFinalized} ${t.balanceUpdated} ${activeNegotiation.currentPrice} RON`);
              setToastType('success');
              setToastVisible(true);
              await loadActiveNegotiation();
            } catch (error: any) {
              console.error('Error finalizing deal:', error);
              Alert.alert(t.error, error?.response?.data?.message || t.negotiationError);
            } finally {
              setLoadingNegotiation(false);
            }
          }
        }
      ]
    );
  };

  const handleConfirmCollaboration = async () => {
    if (!activeNegotiation) return;
    
    try {
      setLoadingNegotiation(true);
      const response = await negotiationService.confirmCollaboration(activeNegotiation._id);
      
      if (response.collaborationEstablished) {
        if (response.sellerNewBalance && String(activeNegotiation.seller._id) === String(userId)) {
          setToastMessage(`${t.collaborationAndBalanceUpdated} ${activeNegotiation.currentPrice} RON.`);
        } else {
          setToastMessage(t.collaborationEstablished);
        }
        setToastType('success');
        setToastVisible(true);
      } else {
        setToastMessage(t.waitingForConfirmation);
        setToastType('info');
        setToastVisible(true);
      }
      
      await loadActiveNegotiation();
    } catch (error: any) {
      console.error('Error confirming collaboration:', error);
      Alert.alert(t.error, error?.response?.data?.message || 'Eroare la confirmarea colaborării');
    } finally {
      setLoadingNegotiation(false);
    }
  };

  const renderCollaborationBody = (message: Message, isOwn: boolean) => {
    const { acceptedBy, declinedBy, isAccepted, isDeclined } = getCollaborationMessageStatus(message);
    const me = String(userId || '');
    const iAccepted = acceptedBy.includes(me);
    const iDeclined = declinedBy.includes(me);
    const canRespond = !isAccepted && !isDeclined && !iAccepted && !iDeclined;

    const statusText = isAccepted
      ? t.collaborationAccepted
      : isDeclined
        ? t.collaborationDeclined
        : `${t.collaborationPending} (${acceptedBy.length}/2)`;

    return (
      <View style={styles.collabContainer}>
        <ThemedText
          style={[
            styles.collabTitle,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text },
          ]}
        >
          {t.collaborationRequestText}
        </ThemedText>
        <ThemedText
          style={[
            styles.collabStatus,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted },
          ]}
        >
          {statusText}
        </ThemedText>

        {iAccepted && !isAccepted && !isDeclined ? (
          <ThemedText
            style={[
              styles.collabHint,
              { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted },
            ]}
          >
            {t.collaborationYouAcceptedWaiting}
          </ThemedText>
        ) : null}

        {canRespond ? (
          <View style={styles.collabButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCollaborationResponse(message._id, true)}
              style={[
                styles.collabBtn,
                {
                  backgroundColor: tokens.colors.primary,
                  borderColor: tokens.colors.primary,
                },
              ]}
            >
              <ThemedText style={[styles.collabBtnText, { color: tokens.colors.primaryContrast }]}>
                {t.accept}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCollaborationResponse(message._id, false)}
              style={[
                styles.collabBtn,
                {
                  backgroundColor: 'transparent',
                  borderColor: tokens.colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.collabBtnText,
                  { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text },
                ]}
              >
                {t.decline}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderNegotiationBody = (message: Message, isOwn: boolean) => {
    const price = message.negotiation?.price ?? null;
    const action = message.negotiation?.action ?? null;

    return (
      <View style={styles.collabContainer}>
        <ThemedText
          style={[
            styles.collabTitle,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text },
          ]}
        >
          {t.negotiationOffer}
        </ThemedText>
        <ThemedText
          style={[
            styles.collabStatus,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted },
          ]}
        >
          {price ? `${t.priceOffered}: ${price} RON` : t.negotiationOffer}
        </ThemedText>
        {message.text ? (
          <ThemedText
            style={[styles.collabHint, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted }]}
          >
            {message.text}
          </ThemedText>
        ) : null}
        <View style={{ marginTop: 6 }} />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            // Navigate to negotiation details if available
            const nid = message.negotiation?.negotiationId;
            if (nid) {
              try { router.push((`/negotiations/${encodeURIComponent(String(nid))}`) as any); } catch (e) {}
            }
          }}
          style={[styles.collabBtn, { backgroundColor: 'transparent', borderColor: tokens.colors.border }]}
        >
          <ThemedText style={{ color: tokens.colors.text }}>{t.priceOffered}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const BOOKING_STATUS_COLORS: Record<string, string> = {
    pending: '#b45309',
    accepted: '#15803d',
    rejected: '#b91c1c',
    cancelled: '#b91c1c',
  };

  const renderBookingBody = (message: Message, isOwn: boolean) => {
    const status = message.bookingData?.status || 'pending';
    const statusColor = BOOKING_STATUS_COLORS[status] || BOOKING_STATUS_COLORS.pending;
    const statusLabel =
      status === 'accepted' ? t.bookingAccepted
        : status === 'rejected' ? t.bookingRejected
        : status === 'cancelled' ? t.bookingCancelled
        : t.bookingPending;
    const statusIcon = status === 'accepted' ? 'checkmark-done' : (status === 'rejected' || status === 'cancelled') ? 'close-circle' : 'time-outline';

    const dateLabel = message.bookingData?.date
      ? new Date(`${message.bookingData.date}T00:00:00`).toLocaleDateString(
          locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'ro-RO',
          { weekday: 'short', day: 'numeric', month: 'short' }
        )
      : '';

    const canRespond = status === 'pending' && String(message.bookingData?.providerId) === String(userId);
    const canCancel = status === 'pending' || status === 'accepted';

    return (
      <View style={styles.collabContainer}>
        <ThemedText
          style={[styles.collabTitle, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }]}
        >
          {t.bookingRequestText}
        </ThemedText>
        <ThemedText
          style={[styles.collabStatus, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted }]}
        >
          {dateLabel}{dateLabel ? ' · ' : ''}{message.bookingData?.startTime} - {message.bookingData?.endTime}
        </ThemedText>
        {message.text ? (
          <ThemedText style={[styles.collabHint, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted }]}>
            {message.text}
          </ThemedText>
        ) : null}
        <View style={[styles.bookingStatusBadge, { backgroundColor: hexToRgba(statusColor, 0.15) }]}>
          <Ionicons name={statusIcon as any} size={13} color={statusColor} />
          <ThemedText style={[styles.bookingStatusBadgeText, { color: statusColor }]}>{statusLabel}</ThemedText>
        </View>
        {canRespond && (
          <View style={styles.collabButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleBookingResponse(message.bookingData?.bookingId || '', true)}
              style={[styles.collabBtn, { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }]}
            >
              <ThemedText style={[styles.collabBtnText, { color: tokens.colors.primaryContrast }]}>{t.accept}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleBookingResponse(message.bookingData?.bookingId || '', false)}
              style={[styles.collabBtn, { backgroundColor: 'transparent', borderColor: tokens.colors.border }]}
            >
              <ThemedText
                style={[styles.collabBtnText, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }]}
              >
                {t.decline}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {canCancel && (
          <View style={[styles.collabButtonsRow, { marginTop: canRespond ? 6 : 4 }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCancelBooking(message.bookingData?.bookingId || '')}
              style={[styles.collabBtn, { backgroundColor: 'transparent', borderColor: tokens.colors.border }]}
            >
              <ThemedText
                style={[styles.collabBtnText, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }]}
              >
                {t.bookingCancelAction}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const hexToRgba = (hex: string, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Handle screen focus/blur to manage conversation viewing state
  useFocusEffect(
    useCallback(() => {
      // Screen focused - rejoin conversation if we have one
      if (socket && userId && selectedConversation) {
        socket.emit('joinConversation', { 
          userId, 
          conversationId: selectedConversation.conversationId 
        });
        console.log(`📱 Re-joined conversation on focus: ${selectedConversation.conversationId}`);
      }

      return () => {
        // Screen blurred - leave conversation
        if (socket && userId) {
          socket.emit('leaveConversation', { userId });
          console.log(`👋 Left conversation on blur`);
        }
      };
    }, [socket, userId, selectedConversation])
  );

  const routeParams = useLocalSearchParams();
  const routeParamsRef = useRef(routeParams);
  routeParamsRef.current = routeParams;

  const resolveAvatarUrl = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
    const path = cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
    return `${base}${path}`;
  };

  const getAvatarFallback = (name: string) => {
    const initial = name.slice(0, 1).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=355070&color=fff`;
  };

  // Initialize conversation from params
  useEffect(() => {
    if (!userId) return;

    const routeConversationId = (routeParams as any)?.conversationId;
    const routeMessageId = (routeParams as any)?.messageId;

    if (routeConversationId) {
      const expectedConversationId = String(routeConversationId);
      
      // Try to construct conversation object from params
      const senderName = (routeParams as any)?.senderName || 'Utilizator';
      const senderAvatar = (routeParams as any)?.senderAvatar || '';
      let senderId = (routeParams as any)?.senderId || '';
      
      if (!senderId && expectedConversationId && userId) {
        const parts = expectedConversationId.split('-');
        const candidate = parts.find(p => p !== userId && /^[a-fA-F0-9]{24}$/.test(p));
        if (candidate) senderId = candidate;
      }

      const conversationAvatar = (routeParams as any)?.announcementImage || senderAvatar;
      const resolvedAvatar = resolveAvatarUrl(conversationAvatar) || resolveAvatarUrl(senderAvatar) || '';
      const resolvedParticipantAvatar = resolveAvatarUrl(senderAvatar) || '';
      
      const tempConv: Conversation = {
        id: senderId || expectedConversationId,
        conversationId: expectedConversationId,
        name: (routeParams as any)?.announcementTitle || '(Conversatie)',
        avatar: resolvedAvatar,
        participantName: senderName,
        participantAvatar: resolvedParticipantAvatar,
        announcementTitle: (routeParams as any)?.announcementTitle || '',
        announcementOwnerName: senderName,
        lastMessage: '',
        time: new Date().toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        unread: (routeParams as any)?.unread === 'true',
        unreadCount: parseInt((routeParams as any)?.unreadCount || '0', 10),
        otherParticipant: { 
          id: senderId, 
          firstName: senderName.split(' ')[0] || '', 
          lastName: senderName.split(' ').slice(1).join(' ') || '', 
          avatar: resolvedParticipantAvatar,
          lastSeen: undefined
        },
        lastSeen: undefined,
        announcementOwnerId: (routeParams as any)?.announcementOwnerId || '',
        announcementId: (routeParams as any)?.announcementId || '',
      };
      setSelectedConversation(tempConv);
      if (routeMessageId) setTargetMessageId(String(routeMessageId));
    } else {
        // Fallback for announcementOwnerId logic
        const ownerId = (routeParams as any)?.announcementOwnerId;
        const announcementId = (routeParams as any)?.announcementId;
        if (ownerId) {
            let expectedConversationId = '';
            if (announcementId) {
                expectedConversationId = `${ownerId}-${userId}-${announcementId}`;
            } else {
                expectedConversationId = [String(ownerId), String(userId)].sort().join('-');
            }
            
            const senderName = (routeParams as any)?.senderName || 
                `${(routeParams as any)?.announcementOwnerFirstName || ''} ${(routeParams as any)?.announcementOwnerLastName || ''}`.trim() || 
                'Utilizator';
            const senderAvatar = (routeParams as any)?.senderAvatar || 
                (routeParams as any)?.announcementOwnerAvatar || '';
            
            const conversationAvatar = (routeParams as any)?.announcementImage || senderAvatar || '';
            const resolvedAvatar = resolveAvatarUrl(conversationAvatar) || '';
            const resolvedParticipantAvatar = resolveAvatarUrl(senderAvatar) || '';

            const tempConv: Conversation = {
                id: ownerId,
                conversationId: expectedConversationId,
                name: (routeParams as any)?.announcementTitle || '(fără titlu)',
                avatar: resolvedAvatar,
                participantName: senderName,
                participantAvatar: resolvedParticipantAvatar,
                announcementTitle: (routeParams as any)?.announcementTitle || '',
                announcementOwnerName: senderName,
                lastMessage: '',
                time: new Date().toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                unread: (routeParams as any)?.unread === 'true',
                unreadCount: parseInt((routeParams as any)?.unreadCount || '0', 10),
                otherParticipant: { 
                id: ownerId, 
                firstName: (routeParams as any)?.announcementOwnerFirstName || senderName.split(' ')[0] || '', 
                lastName: (routeParams as any)?.announcementOwnerLastName || senderName.split(' ').slice(1).join(' ') || '', 
                avatar: resolvedParticipantAvatar,
                lastSeen: undefined
                },
                lastSeen: undefined,
                announcementOwnerId: ownerId,
                announcementId: announcementId || '',
            };
            setSelectedConversation(tempConv);
        }
    }
  }, [JSON.stringify(routeParams), userId]);

  // Numele celuilalt participant vine inițial din parametrii de navigare (capturați în
  // momentul în care utilizatorul a deschis conversația din listă) și poate rămâne învechit
  // dacă acela și-a schimbat numele cât timp ecranul a stat montat. Îl reîmprospătăm cu o
  // interogare live de profil de fiecare dată când se schimbă conversația selectată.
  useEffect(() => {
    const otherUserId = selectedConversation?.otherParticipant?.id;
    if (!otherUserId) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get(`/api/users/profile/${otherUserId}`);
        const fresh = response.data;
        if (cancelled || !fresh) return;
        const freshName = `${fresh.firstName || ''} ${fresh.lastName || ''}`.trim() || 'Utilizator';
        setSelectedConversation(prev => {
          if (!prev || prev.otherParticipant?.id !== otherUserId) return prev;
          if (prev.participantName === freshName) return prev;
          return {
            ...prev,
            participantName: freshName,
            announcementOwnerName: prev.announcementOwnerName === prev.participantName ? freshName : prev.announcementOwnerName,
            otherParticipant: { ...prev.otherParticipant, firstName: fresh.firstName || '', lastName: fresh.lastName || '' },
          };
        });
      } catch (e) {
        // Nefatal — păstrăm numele din parametrii de navigare dacă lookup-ul live eșuează
      }
    })();

    return () => { cancelled = true; };
  }, [selectedConversation?.otherParticipant?.id]);

  // Scroll to target message
  useEffect(() => {
    const idToScroll = targetMessageId || (routeParams as any)?.messageId;
    if (!idToScroll) return;
    if (!messages || messages.length === 0) return;
    const layout = bubbleLayoutsMap[idToScroll];
    if (layout && messagesEndRef.current && typeof messagesEndRef.current.scrollTo === 'function') {
      try {
        messagesEndRef.current.scrollTo({ y: Math.max(0, layout.y - 20), animated: true });
        if (targetMessageId) setTargetMessageId(null);
      } catch (e) {}
    }
  }, [messages, bubbleLayoutsMap, routeParams, targetMessageId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversation/${selectedConversation.conversationId}`);
      const raw = (response.data || []) as any[];
      const normalized = raw.map((m: any) => {
        if (m && m.replyTo && !m.replyTo.senderName) {
          const isSelf = String(m.replyTo.senderId || '') === String(userId || '');
          const fallbackName = isSelf ? 'Tu' : (selectedConversation?.participantName || 'Utilizator');
          return { ...m, replyTo: { ...m.replyTo, senderName: fallbackName } };
        }
        return m;
      });
      setMessages(normalized);

      // Always mark as read regardless of local unread flag — the flag may be
      // stale (e.g. navigating from a push notification that doesn't pass unread=true).
      // Backend returns modifiedCount so we only decrement when something was actually marked.
      try {
        const markRes = await api.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`);
        const marked = (markRes?.data?.modifiedCount as number) ?? 0;
        if (marked > 0) {
          decrementUnreadCount(marked);
        }
      } catch (e) {
        // non-fatal: unread count will self-correct on next periodic refresh
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, userId, decrementUnreadCount]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to end when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedConversation) {
      await fetchMessages();
    }
    setRefreshing(false);
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim() || !selectedConversation) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket && selectedConversation) socket.emit('typing', { conversationId: selectedConversation.conversationId, isTyping: false });
    const capturedReply = replyTo;

    const tempMessage: Message = {
      _id: Date.now().toString(),
      conversationId: selectedConversation.conversationId,
      senderId: userId,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      senderInfo: {
        firstName: 'Tu',
        lastName: '',
      },
      ...(capturedReply ? { replyTo: capturedReply } : {}),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setReplyTo(null);

    try {
      const messageData: any = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        senderRole: 'cumparator',
        destinatarId: selectedConversation.otherParticipant.id,
        text: newMessage.trim(),
        ...(selectedConversation.announcementId ? { announcementId: selectedConversation.announcementId } : {}),
        ...(capturedReply ? { replyTo: capturedReply } : {}),
      };

      const response = await api.post('/api/messages', messageData);

      if (response.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id
              ? {
                  ...response.data,
                  senderInfo: tempMessage.senderInfo,
                  replyTo: (() => {
                    const serverReply: any = response.data.replyTo || {};
                    const localReply: any = tempMessage.replyTo || {};
                    return {
                      ...(serverReply || {}),
                      ...(localReply.senderName && !serverReply?.senderName ? { senderName: localReply.senderName } : {}),
                    };
                  })(),
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  const handlePickImagePress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert(t.permissionTitle, t.galleryPermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if ((result as any).canceled) return;

      const asset: any = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || !asset.uri) return;

      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mimeType = asset.type ? `${asset.type}/${ext}` : `image/${ext}`;

      const capturedReplyForImage = replyTo;

      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri,
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
        ...(capturedReplyForImage ? { replyTo: capturedReplyForImage } : {}),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setReplyTo(null);

      const form = new FormData();
      // @ts-ignore
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }
      if (capturedReplyForImage) {
        form.append('replyTo', JSON.stringify(capturedReplyForImage));
      }

      try {
        const res = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res?.data) {
          setMessages((prev) => prev.map((m) => {
            if (m._id !== tempMessage._id) return m;
            const server = res.data;
            return {
              ...server,
              senderInfo: tempMessage.senderInfo,
              replyTo: server.replyTo || tempMessage.replyTo,
            };
          }));
        }
      } catch (err) {
        console.error('Upload image error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert(t.error, t.sendImageError);
      }
    } catch (err) {
      console.error('handlePickImagePress error:', err);
      Alert.alert(t.error, t.selectImageError);
    }
  };

  const handlePickFilePress = async () => {
    try {
      if (Platform.OS === 'android') {
        try {
          const perm = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          if (perm) {
            const granted = await PermissionsAndroid.request(perm);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              const imgPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const vidPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const g2 = await PermissionsAndroid.requestMultiple([imgPerm, vidPerm]);
              const ok = Object.values(g2).some((v) => v === PermissionsAndroid.RESULTS.GRANTED);
              if (!ok) {
                Alert.alert(t.permissionTitle, t.filePermission);
                return;
              }
            }
          }
        } catch (pErr) {
          console.warn('Permission request failed, proceeding to picker', pErr);
        }
      }

      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (res.canceled) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      const fileName = asset.name;
      const mimeType = asset.mimeType || 'application/octet-stream';

      const capturedReplyForFile = replyTo;
      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri,
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
        ...(capturedReplyForFile ? { replyTo: capturedReplyForFile } : {}),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setReplyTo(null);

      const form = new FormData();
      // @ts-ignore
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }
      if (capturedReplyForFile) form.append('replyTo', JSON.stringify(capturedReplyForFile));

      try {
        const r = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (r?.data) {
          setMessages((prev) => prev.map((m) => {
            if (m._id !== tempMessage._id) return m;
            const server = r.data;
            return {
              ...server,
              senderInfo: tempMessage.senderInfo,
              replyTo: server.replyTo || tempMessage.replyTo,
            };
          }));
        }
      } catch (err) {
        console.error('Upload file error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert(t.error, t.sendFileError);
      }
    } catch (err) {
      console.error('handlePickFilePress error:', err);
      Alert.alert(t.error, t.selectFileError);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenImage = useCallback(
    (uri?: string) => {
      if (!uri) return;
      if (Platform.OS === 'web') {
        Linking.openURL(uri).catch((err) => console.error('Nu s-a putut deschide imaginea în browser.', err));
        return;
      }

      const imageMessages = messages.filter((m) => !!m.image);
      const gallery = imageMessages.length > 0 ? imageMessages.map((m) => ({ uri: m.image! })) : [{ uri }];
      const initialIndex = imageMessages.findIndex((m) => m.image === uri);

      setImageViewerImages(gallery);
      setImageViewerIndex(initialIndex >= 0 ? initialIndex : 0);
      setImageViewerVisible(true);
    },
    [messages]
  );

  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setTimeout(() => {
      setImageViewerImages([]);
      setImageViewerIndex(0);
    }, 250);
  }, []);

  const handleLongPressMessage = (message: Message) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    try { Keyboard.dismiss(); } catch {}
    setFloatingSnapshot(null);
    setFloatingReady(false);
    const ref = bubbleRefs.current[message._id];
    if (!ref) {
      setSelectedMessage(message);
      setMenuPosition(null);
      setContextMenuVisible(true);
      return;
    }
    const node = findNodeHandle(ref);
    if (!node) {
      setSelectedMessage(message);
      setMenuPosition(null);
      setContextMenuVisible(true);
      return;
    }
    UIManager.measureInWindow(node, (x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const spaceAbove = y - insets.top;
      const spaceBelow = screenHeight - (y + height) - insets.bottom;
      const estimatedMenuHeight = 320;
      const showAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      
      setSelectedMessage(message);
      setMenuPosition({ x, y, width, height, showAbove });
      setContextMenuVisible(true);
      setFloatingReady(true);
    });
  };

  const closeContextMenu = () => {
    setContextMenuVisible(false);
    setShowReactionPicker(false);
    setMenuPosition(null);
    setFloatingSnapshot(null);
    setFloatingReady(false);
    setTimeout(() => setSelectedMessage(null), 250);
  };

  useEffect(() => {
    if (!menuPosition || !contextMenuVisible) return;
    const screenH = Dimensions.get('window').height;
    const gap = 8;
    const rbH = reactionBarHeight || 48;
    const menuCountBase = 6;
    const includeDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
    const mCount = menuCountBase + (includeDelete ? 1 : 0);
    const mH = mCount * MENU_ITEM_HEIGHT + Math.max(0, mCount - 1) * MENU_DIVIDER_HEIGHT;
    const spaceAbove = menuPosition.y - insets.top;
    const spaceBelow = screenH - (menuPosition.y + menuPosition.height) - insets.bottom;
    const neededTotal = rbH + mH + gap * 3;

    if (spaceAbove >= neededTotal) {
      setOverlayPlacement('above');
      return;
    }
    if (spaceBelow >= neededTotal) {
      setOverlayPlacement('below');
      return;
    }
    if (spaceAbove >= spaceBelow) {
      setOverlayPlacement('above');
    } else {
      setOverlayPlacement('below');
    }
  }, [menuPosition, reactionBarHeight, menuHeight, insets.top, insets.bottom, contextMenuVisible]);

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !userId) return;
    const previousMessages = messages;
    try {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === selectedMessage._id) {
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
            if (existingIdx >= 0) {
              return { ...m, reactions: reactions.filter((_, i) => i !== existingIdx) };
            } else {
              return { ...m, reactions: [...reactions, { userId, emoji }] };
            }
          }
          return m;
        })
      );
      closeContextMenu();

      const res = await api.post(`/api/messages/${selectedMessage._id}/react`, { emoji });
      const updatedMessage = res.data;
      if (updatedMessage && updatedMessage._id) {
        setMessages((prev) => prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)));
      }
    } catch (err) {
      console.error('Reaction error:', err);
      try {
        setMessages(previousMessages || []);
      } catch (e) {}
      try {
        Alert.alert(t.error, t.reactionError);
      } catch (e) {}
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    if (String(selectedMessage.senderId) !== String(userId)) {
      Alert.alert(t.cannotDelete, t.notOwner);
      closeContextMenu();
      return;
    }

    if (selectedMessage.deleted) {
      Alert.alert(t.alreadyDeleted, t.messageDeleted);
      closeContextMenu();
      return;
    }

    // Open the styled ConfirmDialog instead of native Alert
    setConfirmDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage) return;
    try {
      // Mark locally as deleted immediately for fast feedback
      setMessages((prev) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true, text: undefined, image: undefined } : m)));
      setConfirmDeleteVisible(false);
      closeContextMenu();
      try {
        await api.delete(`/api/messages/${selectedMessage._id}`);
      } catch (serverErr) {
        console.warn('Server delete failed, message kept as deleted locally', serverErr);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setConfirmDeleteVisible(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) return;
    try {
      if (selectedMessage.text) {
        await Clipboard.setStringAsync(selectedMessage.text);
        setToastMessage(t.messageCopied);
        setToastType('success');
        setToastVisible(true);
        closeContextMenu();
        return;
      }
      if (selectedMessage.image) {
        await Clipboard.setStringAsync(selectedMessage.image);
        setToastMessage(t.imageLinkCopied);
        setToastType('success');
        setToastVisible(true);
        closeContextMenu();
        return;
      }
      setToastMessage(t.nothingToCopyMessage || t.nothingToCopy);
      setToastType('info');
      setToastVisible(true);
      closeContextMenu();
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
    const senderName = selectedMessage.senderId === userId 
      ? 'Tu'
      : selectedConversation?.participantName || 'Utilizator';
    
    setReplyTo({
      messageId: selectedMessage._id,
      senderId: selectedMessage.senderId,
      senderName,
      text: selectedMessage.text,
      image: selectedMessage.image,
    });
    closeContextMenu();
  };

  const handleForwardMessage = () => {
    Alert.alert(t.forward, t.comingSoon);
    closeContextMenu();
  };

  const handleReportMessage = () => {
    const messageToReport = selectedMessage;
    if (!messageToReport) return;

    if (messageToReport.senderId === userId) {
      Alert.alert(t.reportMessage, t.reportOwnMessage);
      closeContextMenu();
      return;
    }

    closeContextMenu();
    setReportTargetMessage(messageToReport);
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;
    setReportModalVisible(false);
    setReportTargetMessage(null);
  };

  const handleSubmitMessageReport = async (reason: string, details: string) => {
    if (!reportTargetMessage) return;

    setReportSubmitting(true);
    try {
      await api.post('/api/reports/messages', { messageId: reportTargetMessage._id, reason, details });
      setReportModalVisible(false);
      setReportTargetMessage(null);
      Alert.alert(t.reported, t.messageReported);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        Alert.alert(t.reportMessage, t.reportAlready);
      } else if (err?.response?.status === 400) {
        Alert.alert(t.reportMessage, t.reportOwnMessage);
      } else {
        console.error('Report message error:', err);
        Alert.alert(t.reportMessage, t.reportError);
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  if (!selectedConversation) {
      return (
          <View style={[styles.container, { backgroundColor: tokens.colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
      );
  }

  return (
    <ProtectedRoute>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: tokens.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[
          styles.chatHeaderClean,
          {
            paddingTop: insets.top + 12,
            backgroundColor: tokens.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.border,
          },
        ]}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity 
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(tabs)/chat');
                    }
                  }} 
                  style={styles.backBtnClean}
                >
                  <Ionicons name="arrow-back" size={26} color={tokens.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const otherId = selectedConversation.id || selectedConversation.otherParticipant?.id;
                    if (!otherId) return;
                    try {
                      router.push(`/profile?userId=${encodeURIComponent(String(otherId))}`);
                    } catch (e) {}
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                    style={styles.headerAvatarClean}
                  />
                  <View style={{ justifyContent: 'center' }}>
                    <ThemedText style={[styles.headerNameClean, isDark ? styles.headerNameCleanDark : undefined]} numberOfLines={1}>
                      {selectedConversation.participantName}
                    </ThemedText>
                    {(isOtherUserOnline || isOtherUserTyping) && (
                      <Text style={{ 
                          fontSize: 10, 
                          color: isOtherUserTyping ? (isDark ? '#F51866' : tokens.colors.primary) : '#4CAF50',
                          marginLeft: 12, // Match likely margin of headerNameClean
                          marginTop: -2
                      }}>
                          {isOtherUserTyping ? (locale === 'ro' ? 'scrie...' : 'typing...') : 'Online'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Finalize Deal Button - only for buyer when negotiation is confirmed */}
                {activeNegotiation &&
                 activeNegotiation.status === 'confirmed' &&
                 String(activeNegotiation.buyer._id) === String(userId) && (
                  <TouchableOpacity
                    onPress={handleFinalizeDeal}
                    disabled={loadingNegotiation}
                    activeOpacity={0.85}
                    style={[styles.headerActionBtn, { opacity: loadingNegotiation ? 0.5 : 1, backgroundColor: tokens.colors.primary }]}
                  >
                    <Ionicons name="checkmark-done-outline" size={22} color={tokens.colors.primaryContrast} />
                  </TouchableOpacity>
                )}

                {/* Collaborate Button */}
                <TouchableOpacity
                  onPress={handleSendCollaborationRequest}
                  disabled={sendingCollab}
                  activeOpacity={0.85}
                  style={[styles.headerActionBtn, { opacity: sendingCollab ? 0.5 : 1 }]}
                >
                  <Ionicons name="people-outline" size={22} color={tokens.colors.text} />
                </TouchableOpacity>

                {/* Admin: Delete All Messages Button */}
                {user?.isAdmin && (
                  <TouchableOpacity
                    onPress={() => setConfirmDeleteConvVisible(true)}
                    activeOpacity={0.85}
                    style={[styles.headerActionBtn, { backgroundColor: isDark ? 'rgba(255,59,48,0.15)' : 'rgba(211,47,47,0.1)' }]}
                  >
                    <Ionicons name="trash-outline" size={22} color={isDark ? '#ff3b30' : '#d32f2f'} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={[styles.headerSeparator, isDark ? styles.headerSeparatorDark : undefined]} />

            <TouchableOpacity
              style={styles.announcementRow}
              activeOpacity={0.85}
              onPress={() => {
                const aid = selectedConversation?.announcementId;
                if (!aid) return;
                router.push(`/announcement-details?id=${encodeURIComponent(aid)}`);
              }}
            >
              <Image
                source={{ uri: selectedConversation.avatar || selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                style={styles.announcementThumb}
              />
              <View style={styles.announcementInfo}>
                <ThemedText style={[styles.announcementTitle, isDark ? styles.announcementTitleDark : undefined]} numberOfLines={1}>
                  {activeNegotiation?.announcement?.title || selectedConversation.announcementTitle || 'Anunț'}
                </ThemedText>
                {(activeNegotiation?.announcement?._id || selectedConversation.announcementId) ? (
                  <ThemedText style={[styles.announcementId, isDark ? styles.announcementIdDark : undefined]}>
                    ID: {activeNegotiation?.announcement?._id || selectedConversation.announcementId}
                  </ThemedText>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Negotiation Bar */}
        {activeNegotiation && activeNegotiation.status !== 'finalized' && (
          <View style={[styles.negotiationBar, { backgroundColor: tokens.colors.surface, borderBottomWidth: 1, borderBottomColor: tokens.colors.border }]}>
            <View style={styles.negotiationContent}>
              <Ionicons name="pricetag" size={20} color={tokens.colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.negotiationTitle, { color: tokens.colors.text }]}>
                  {activeNegotiation.status === 'pending' 
                    ? (String(activeNegotiation.buyer._id) === String(userId) 
                        ? t.negotiationOffer + ' - ' + (locale === 'ro' ? 'Așteaptă răspuns' : 'Waiting for reply')
                        : t.negotiationOffer + ' - ' + (locale === 'ro' ? 'Răspunde la ofertă' : 'Respond to offer'))
                    : activeNegotiation.status === 'counter_offer'
                    ? (String(activeNegotiation.lastActionBy) === String(userId)
                        ? t.counterOffer + ' - ' + (locale === 'ro' ? 'Așteaptă răspuns' : 'Waiting for reply')
                        : t.counterOffer + ' - ' + (locale === 'ro' ? 'Răspunde la contraofertă' : 'Respond to counter'))
                    : activeNegotiation.status === 'pending_confirmation'
                    ? t.pendingConfirmation
                    : activeNegotiation.status === 'confirmed'
                    ? t.collaborationConfirmed
                    : activeNegotiation.status === 'accepted'
                    ? t.offerAccepted
                    : t.negotiationOffer}
                </ThemedText>
                <ThemedText style={[styles.negotiationPrice, { color: tokens.colors.primary }]}>
                  {activeNegotiation.currentPrice} RON
                </ThemedText>
              </View>
              {/* Buton de refuză poziționat pe același rând cu oferta */}
              {(String(activeNegotiation.seller._id) === String(userId) || String(activeNegotiation.buyer._id) === String(userId)) && 
               ['pending', 'counter_offer', 'pending_confirmation', 'confirmed'].includes(activeNegotiation.status) && (
                <TouchableOpacity
                  onPress={handleRejectOffer}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationRejectBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: tokens.colors.border }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationRejectBtnText, { color: tokens.colors.muted }]}>
                    {t.rejectOffer}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Action buttons based on role and status */}
            {/* Seller sees buttons when: status is 'pending' OR (status is 'counter_offer' AND buyer made last action) */}
            {String(activeNegotiation.seller._id) === String(userId) && 
             (
               (activeNegotiation.status === 'pending') ||
               (activeNegotiation.status === 'counter_offer' && String(activeNegotiation.lastActionBy) === String(activeNegotiation.buyer._id))
             ) && (
              <View style={styles.negotiationActions}>
                <TouchableOpacity
                  onPress={handleAcceptOffer}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationBtn, { backgroundColor: tokens.colors.primary }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.primaryContrast }]}>
                    {t.acceptOffer}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCounterOfferModalVisible(true)}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationBtn, { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.text }]}>
                    {t.sendCounterOffer}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Buyer sees buttons when: status is 'counter_offer' AND seller made last action */}
            {String(activeNegotiation.buyer._id) === String(userId) && 
             activeNegotiation.status === 'counter_offer' &&
             String(activeNegotiation.lastActionBy) === String(activeNegotiation.seller._id) && (
              <View style={styles.negotiationActions}>
                <TouchableOpacity
                  onPress={handleAcceptCounterOffer}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationBtn, { backgroundColor: tokens.colors.primary }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.primaryContrast }]}>
                    {t.acceptOffer}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCounterOfferModalVisible(true)}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationBtn, { backgroundColor: tokens.colors.surface, borderWidth: 1, borderColor: tokens.colors.border }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.text }]}>
                    {t.sendCounterOffer}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Confirmation button for pending_confirmation status */}
            {(String(activeNegotiation.seller._id) === String(userId) || String(activeNegotiation.buyer._id) === String(userId)) && 
             activeNegotiation.status === 'pending_confirmation' && (
              <View style={styles.negotiationActions}>
                <TouchableOpacity
                  onPress={handleConfirmCollaboration}
                  disabled={loadingNegotiation}
                  style={[styles.negotiationBtn, { backgroundColor: tokens.colors.primary }]}
                  activeOpacity={0.85}
                >
                  <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.primaryContrast }]}>
                    {t.confirmCollaboration}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Message for confirmed status */}
            {activeNegotiation.status === 'confirmed' && (
              <View style={[styles.negotiationActions, { justifyContent: 'center' }]}>
                <ThemedText style={[styles.negotiationBtnText, { color: tokens.colors.success || tokens.colors.primary, textAlign: 'center' }]}>
                  {t.collaborationConfirmedMessage}
                </ThemedText>
              </View>
            )}


          </View>
        )}

        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
        >
          {loading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tokens.colors.primary} />
                <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>{t.loadingMessages}</ThemedText>
              </View>
          ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.border} />
                <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>{t.noConversation}</ThemedText>
              </View>
          ) : (
            <>
              {messages.map((message, idx) => {
                const isOwn = message.senderId === userId;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const showDateSeparator = 
                  !prevMessage || 
                  new Date(message.createdAt).toLocaleDateString() !== new Date(prevMessage.createdAt).toLocaleDateString();

                const timeForMessage = formatTime(message.createdAt);
                const nextMessage = idx < messages.length - 1 ? messages[idx + 1] : null;
                const nextTime = nextMessage ? formatTime(nextMessage.createdAt) : null;
                const sameSenderAsNext = !!nextMessage && nextMessage.senderId === message.senderId;
                const sameTimeAsNext = !!nextMessage && nextTime === timeForMessage;
                const showTime = !nextMessage || !(sameTimeAsNext && sameSenderAsNext);
                const compactBelow = sameTimeAsNext && sameSenderAsNext;
                const hasReactions = !!(message.reactions && message.reactions.length > 0);

                return (
                  <View key={message._id}>
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <ThemedText style={styles.dateSeparatorText}>
                          {new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).toUpperCase()}
                        </ThemedText>
                        <View style={styles.dateLine} />
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageRow,
                        isOwn && styles.messageRowOwn,
                        compactBelow && styles.messageRowCompact,
                        hasReactions && styles.messageRowWithReactions,
                      ]}
                    >
                      <View style={styles.messageGroup}>
                        <View style={{ position: 'relative' }}>
                        <Pressable
                          ref={(r) => { bubbleRefs.current[message._id] = r; }}
                          onLayout={(e) => {
                            const { x, y, width, height } = e.nativeEvent.layout;
                            setBubbleLayoutsMap((prev) => ({ ...prev, [message._id]: { x, y, width, height } }));
                          }}
                          onLongPress={() => handleLongPressMessage(message)}
                          delayLongPress={400}
                          style={[
                            styles.messageBubbleClean,
                            isOwn
                              ? {
                                  backgroundColor: isDark ? tokens.colors.primary : '#e3f2fd',
                                  marginLeft: 'auto',
                                  marginRight: 12,
                                  borderTopLeftRadius: 20,
                                  borderTopRightRadius: 20,
                                  borderBottomLeftRadius: 20,
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  backgroundColor: isDark ? tokens.colors.elev : '#f5f5f5',
                                  marginLeft: 12,
                                  marginRight: 'auto',
                                  borderTopLeftRadius: 20,
                                  borderTopRightRadius: 20,
                                  borderBottomLeftRadius: 6,
                                  borderBottomRightRadius: 20,
                                },
                          ]}
                        >
                          {message.deleted ? (
                            <ThemedText style={[styles.messageTextClean, { color: tokens.colors.muted, fontStyle: 'italic' }]}>{t.deletedMessage}</ThemedText>
                          ) : (
                            <>
                              {message.replyTo && message.replyTo.messageId && (
                                <View style={[styles.replyInBubble, {
                                  backgroundColor: isOwn
                                    ? (isDark ? '#ffffff' : 'rgba(0,0,0,0.08)')
                                    : 'rgba(0,0,0,0.05)',
                                  borderLeftColor: isDark ? '#000000' : tokens.colors.primary
                                }]}>
                                  <ThemedText style={[styles.replyInBubbleName, {
                                    color: isOwn && isDark ? '#000000' : tokens.colors.primary
                                  }]}>
                                    {message.replyTo.senderName}
                                  </ThemedText>
                                  {message.replyTo.text && (
                                    <ThemedText
                                      style={[styles.replyInBubbleText, {
                                        color: isOwn && isDark ? '#000000' : tokens.colors.muted
                                      }]}
                                      numberOfLines={1}
                                    >
                                      {message.replyTo.text}
                                    </ThemedText>
                                  )}
                                  {message.replyTo.image && (
                                    <View style={styles.replyInBubbleImageRow}>
                                      <Ionicons
                                        name="image-outline"
                                        size={14}
                                        color={isOwn && isDark ? '#000000' : tokens.colors.muted}
                                      />
                                      <ThemedText
                                        style={[styles.replyInBubbleText, {
                                          color: isOwn && isDark ? '#000000' : tokens.colors.muted,
                                          marginLeft: 4
                                        }]}
                                      >
                                        {t.photo}
                                      </ThemedText>
                                    </View>
                                  )}
                                </View>
                              )}

                                                      {isCollaborationRequestMessage(message) ? (
                                renderCollaborationBody(message, isOwn)
                              ) : isBookingRequestMessage(message) ? (
                                renderBookingBody(message, isOwn)
                              ) : message.messageType === 'negotiation' ? (
                                renderNegotiationBody(message, isOwn)
                              ) : (
                                <>
                                  {message.text && (
                                    <ThemedText style={[styles.messageTextClean, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }] }>
                                      {message.text}
                                    </ThemedText>
                                  )}
                                  {message.image && (
                                    <TouchableOpacity
                                      activeOpacity={0.85}
                                      onPress={() => handleOpenImage(message.image)}
                                    >
                                      <Image source={{ uri: message.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                                    </TouchableOpacity>
                                  )}
                                </>
                              )}
                              {showTime && (
                                <View style={styles.messageMetaRow}>
                                  <ThemedText style={[styles.messageMetaTime, {
                                    color: isOwn && isDark ? 'rgba(255,255,255,0.65)' : tokens.colors.muted,
                                  }]}>
                                    {timeForMessage}
                                  </ThemedText>
                                  {isOwn && (
                                    <Ionicons
                                      name="checkmark-done"
                                      size={13}
                                      color={message.isRead
                                        ? (isDark ? '#ffabb7' : '#34B7F1')
                                        : (isDark ? 'rgba(255,255,255,0.45)' : tokens.colors.muted)}
                                    />
                                  )}
                                </View>
                              )}
                            </>
                          )}
                        </Pressable>
                        {message.reactions && message.reactions.length > 0 && (() => {
                          const counts: Record<string, number> = {};
                          (message.reactions || []).forEach((r) => {
                            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                          });
                          const entries = Object.keys(counts).map((emoji) => ({ emoji, count: counts[emoji] }));
                          entries.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
                          const visible = entries.slice(0, 3);
                          const more = Math.max(0, entries.length - visible.length);
                          const absStyle: ViewStyle = isOwn
                            ? { position: 'absolute', right: 12, bottom: -16 }
                            : { position: 'absolute', left: 12, bottom: -16 };
                          const reactionBg = isDark ? tokens.colors.elev : '#ffffff';
                          const reactionBorder = isDark ? tokens.colors.bg : '#e8e8e8';
                          const reactionCountColor = isDark ? '#e0e0e0' : '#444444';
                          return (
                            <View
                              onLayout={(e) => {
                                const { width, height } = e.nativeEvent.layout;
                                setReactionDimsMap((prev) => ({ ...prev, [message._id]: { width, height } }));
                              }}
                              style={[
                                styles.reactionsContainer,
                                absStyle,
                                { backgroundColor: reactionBg, borderColor: reactionBorder },
                              ]}
                            >
                              {visible.map((e) => (
                                <View
                                  key={`r-${e.emoji}`}
                                  style={[
                                    styles.reactionBubble,
                                    e.count > 1 ? styles.reactionBubbleWithCount : styles.reactionBubbleSingle,
                                  ]}
                                >
                                  <ThemedText
                                    style={[
                                      styles.reactionEmoji,
                                      e.count > 1 ? styles.reactionEmojiWithCount : styles.reactionEmojiSingle,
                                    ]}
                                  >
                                    {e.emoji}
                                  </ThemedText>
                                  {e.count > 1 && <ThemedText style={[styles.reactionCount, { color: reactionCountColor }]}>{e.count}</ThemedText>}
                                </View>
                              ))}
                              {more > 0 && (
                                <View style={[styles.reactionBubble, styles.reactionBubbleMore]}>
                                  <ThemedText style={[styles.reactionCount, { color: reactionCountColor }]}>+{more}</ThemedText>
                                </View>
                              )}
                            </View>
                          );
                        })()}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Typing indicator */}
          {isOtherUserTyping && (
            <View style={styles.typingRow}>
              <View style={[styles.typingBubble, { backgroundColor: isDark ? '#2a2a2a' : '#f0f2f5' }]}>
                <View style={styles.typingDots}>
                  <TypingDot delay={0}    isDark={isDark} primary={tokens.colors.primary} />
                  <TypingDot delay={190}  isDark={isDark} primary={tokens.colors.primary} />
                  <TypingDot delay={380}  isDark={isDark} primary={tokens.colors.primary} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

    {replyTo && replyTo.messageId && (
            <View style={[styles.replyPreviewContainer, { backgroundColor: tokens.colors.elev, borderTopColor: tokens.colors.border }]}> 
              <View style={[styles.replyPreviewBar, { backgroundColor: isDark ? '#000000' : tokens.colors.primary }]} />
              <View style={styles.replyPreviewContent}>
                <ThemedText style={[styles.replyPreviewName, { color: tokens.colors.primary }]}>
                  {replyTo.senderName}
                </ThemedText>
                {replyTo.text && (
                  <ThemedText style={[styles.replyPreviewText, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {replyTo.text}
                  </ThemedText>
                )}
                {replyTo.image && (
                  <View style={styles.replyPreviewImageRow}>
                    <Ionicons name="image-outline" size={16} color={tokens.colors.muted} />
                    <ThemedText style={[styles.replyPreviewText, { color: tokens.colors.muted, marginLeft: 4 }]}>
                      {t.photo}
                    </ThemedText>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyPreviewClose}>
                <Ionicons name="close" size={20} color={tokens.colors.muted} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={[styles.inputContainerClean, { 
            backgroundColor: tokens.colors.surface, 
            borderTopWidth: 1, 
            borderTopColor: tokens.colors.border,
            paddingBottom: Math.max(insets.bottom, 10),
          }]}>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickImagePress}>
            <Ionicons name="image-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickFilePress}>
            <Ionicons name="attach-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <ThemedTextInput
            style={[styles.inputClean, isDark ? styles.inputCleanDark : undefined]}
            placeholder={t.writeMessage}
            placeholderTextColor={tokens.colors.placeholder}
            value={newMessage}
            onChangeText={handleTypingInput}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={[styles.sendBtnClean, { opacity: newMessage.trim() ? 1 : 0.4 }]}
          >
            <Ionicons name="send" size={20} color={isDark ? '#F51866' : tokens.colors.primary} />
          </TouchableOpacity>
          </View>

        <ImageViewing
          images={imageViewerImages}
          imageIndex={imageViewerIndex}
          visible={imageViewerVisible}
          onRequestClose={handleCloseImageViewer}
          onImageIndexChange={setImageViewerIndex}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
          backgroundColor="rgba(0,0,0,0.96)"
          HeaderComponent={() => (
            <View style={[styles.imageViewerHeader, { paddingTop: insets.top + 12 }] }>
              <TouchableOpacity
                onPress={handleCloseImageViewer}
                activeOpacity={0.85}
                style={styles.imageViewerCloseButton}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        />

  <Modal visible={contextMenuVisible} transparent animationType="none" onRequestClose={closeContextMenu}>
          <Pressable style={styles.modalOverlay} onPress={closeContextMenu}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : { style: [StyleSheet.absoluteFill, { pointerEvents: 'none' }] })}
            />
            {selectedMessage && menuPosition && (
              <>
                {floatingReady && (
                  <View
                    style={[
                      styles.messageBubbleClean,
                      selectedMessage.senderId === userId
                        ? {
                            backgroundColor: isDark ? tokens.colors.primary : '#d1e7ff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 6,
                          }
                        : {
                            backgroundColor: tokens.colors.elev,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 6,
                            borderBottomRightRadius: 20,
                          },
                      {
                        position: 'absolute',
                        top: menuPosition.y,
                        left: menuPosition.x,
                        width: menuPosition.width,
                        height: menuPosition.height,
                        zIndex: 30,
                        margin: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        maxWidth: undefined,
                      },
                      Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
                    ]}
                    {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
                  >
                    {selectedMessage.deleted ? (
                      <ThemedText style={[styles.messageTextClean, { color: tokens.colors.muted, fontStyle: 'italic' }]}>{t.deletedMessage}</ThemedText>
                    ) : (
                      <>
                        {selectedMessage.replyTo && selectedMessage.replyTo.messageId && (
                          <View style={[styles.replyInBubble, { 
                            backgroundColor: selectedMessage.senderId === userId 
                              ? (isDark ? '#ffffff' : 'rgba(0,0,0,0.08)') 
                              : 'rgba(0,0,0,0.05)',
                            borderLeftColor: isDark ? '#000000' : tokens.colors.primary 
                          }]}> 
                            <ThemedText style={[styles.replyInBubbleName, { 
                              color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.primary 
                            }]}>
                              {selectedMessage.replyTo.senderName}
                            </ThemedText>
                            {selectedMessage.replyTo.text && (
                              <ThemedText 
                                style={[styles.replyInBubbleText, { 
                                  color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted 
                                }]} 
                                numberOfLines={1}
                              >
                                {selectedMessage.replyTo.text}
                              </ThemedText>
                            )}
                            {selectedMessage.replyTo.image && (
                              <View style={styles.replyInBubbleImageRow}>
                                <Ionicons 
                                  name="image-outline" 
                                  size={14} 
                                  color={selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted} 
                                />
                                <ThemedText 
                                  style={[styles.replyInBubbleText, { 
                                    color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted,
                                    marginLeft: 4 
                                  }]}
                                >
                                  {t.photo}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {selectedMessage.text && (
                          <ThemedText style={[styles.messageTextClean, { color: selectedMessage.senderId === userId && isDark ? tokens.colors.primaryContrast : tokens.colors.text }] }>
                            {selectedMessage.text}
                          </ThemedText>
                        )}
                        {selectedMessage.image && (
                          <Image source={{ uri: selectedMessage.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                        )}
                        <View style={styles.messageMetaRow}>
                          <ThemedText style={[styles.messageMetaTime, {
                            color: selectedMessage.senderId === userId && isDark ? 'rgba(255,255,255,0.65)' : tokens.colors.muted,
                          }]}>
                            {formatTime(selectedMessage.createdAt)}
                          </ThemedText>
                          {selectedMessage.senderId === userId && (
                            <Ionicons
                              name="checkmark-done"
                              size={13}
                              color={selectedMessage.isRead
                                ? (isDark ? '#ffabb7' : '#34B7F1')
                                : (isDark ? 'rgba(255,255,255,0.45)' : tokens.colors.muted)}
                            />
                          )}
                        </View>
                      </>
                    )}
                  </View>
                )}

                <View
                  onLayout={(e) => { setReactionBarWidth(e.nativeEvent.layout.width); setReactionBarHeight(e.nativeEvent.layout.height); }}
                  style={[
                    styles.reactionBarAbsolute,
                    { zIndex: 40 },
                    (() => {
                      const screenW = Dimensions.get('window').width;
                      const estWidth = reactionBarWidth || 280;
                      const rbH = reactionBarHeight || 48;
                      const gap = 8;
                      const desiredBarSide = overlayPlacement === 'above' ? 'below' : 'above';
                      let top: number;
                      if (desiredBarSide === 'above') {
                        top = menuPosition.y - rbH - gap;
                        if (top < insets.top + gap) top = insets.top + gap;
                        if (top + rbH > menuPosition.y) top = menuPosition.y + menuPosition.height + gap;
                      } else {
                        top = menuPosition.y + menuPosition.height + gap;
                        const screenBottomLimit = Dimensions.get('window').height - insets.bottom - rbH - gap;
                        if (top > screenBottomLimit) {
                          top = Math.max(insets.top + gap, screenBottomLimit);
                        }
                        if (top < menuPosition.y + menuPosition.height + gap) {
                          const alt = menuPosition.y - rbH - gap;
                          if (alt >= insets.top + gap) top = alt;
                        }
                      }
                      const left = Math.max(8, Math.min(menuPosition.x + menuPosition.width / 2 - estWidth / 2, screenW - estWidth - 8));
                      return { top, left };
                    })(),
                    { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)', shadowOpacity: isDark ? 0.08 : 0.15 },
                  ]}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                      <ThemedText style={styles.quickReactionEmoji}>{emoji}</ThemedText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setShowReactionPicker((p) => !p)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                    <Ionicons name={showReactionPicker ? 'close' : 'add-circle-outline'} size={24} color={isDark ? tokens.colors.muted : '#666'} />
                  </TouchableOpacity>
                  {showReactionPicker && (
                    <View style={[styles.reactionPickerDropdown, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }] }>
                      {['🤩','😎','🔥','🎉','😔','🙌','👌','🥳','🤔','🤯'].map((emoji) => (
                          <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.reactionPickerButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                            <ThemedText style={styles.reactionPickerEmoji}>{emoji}</ThemedText>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.contextMenuAbsolute,
                    { zIndex: 50 },
                    (() => {
                      const win = Dimensions.get('window');
                      const gap = 8;
                      const baseCount = 4;
                      const showDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
                      const count = baseCount + (showDelete ? 1 : 0);
                      const desiredH = count * MENU_ITEM_HEIGHT + Math.max(0, count - 1) * MENU_DIVIDER_HEIGHT;
                      const desiredW = FIXED_MENU_WIDTH;
                      let top: number;
                      if (overlayPlacement === 'above') {
                        top = menuPosition.y - desiredH - gap;
                        if (top < insets.top + 8) top = insets.top + 8;
                      } else {
                        top = menuPosition.y + menuPosition.height + gap;
                        if (top + desiredH + insets.bottom > win.height) top = Math.max(insets.top + 8, win.height - insets.bottom - desiredH - 8);
                      }
                      const left = Math.max(8, Math.min(menuPosition.x, win.width - desiredW - 8));
                      return { top, left, width: desiredW, height: desiredH };
                    })(),
                  , { backgroundColor: isDark ? tokens.colors.surface : '#ffffff', shadowOpacity: isDark ? 0.18 : 0.3 }
                  ]}
                >
                  <View
                    style={[
                      { width: FIXED_MENU_WIDTH, height: '100%', overflow: 'hidden' },
                      Platform.OS === 'web' ? { pointerEvents: 'box-none' as any } : undefined,
                    ]}
                    {...(Platform.OS !== 'web' ? { pointerEvents: 'box-none' } : {})}
                  >
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ backgroundColor: isDark ? tokens.colors.surface : '#ffffff' }}
                      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <View style={[styles.contextMenu, { backgroundColor: isDark ? tokens.colors.surface : '#ffffff' }] }>
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReplyMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.reply}</ThemedText>
                      <Ionicons name="arrow-undo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleForwardMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.forward}</ThemedText>
                      <Ionicons name="arrow-redo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleCopyMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.copy}</ThemedText>
                      <Ionicons name="copy-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReportMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.report}</ThemedText>
                      <Ionicons name="warning-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    {String(selectedMessage?.senderId) === String(userId) && !selectedMessage?.deleted ? (
                      <>
                        <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDeleteMessage}>
                          <ThemedText style={[styles.contextMenuText, { color: '#ff3b30' }]}>{t.deleteBtn}</ThemedText>
                          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                    </View>
                    </ScrollView>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Modal>
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
        <ConfirmDialog
          visible={confirmDeleteVisible}
          title={t.deleteMessage}
          message={t.deleteConfirm}
          confirmText={t.deleteBtn}
          cancelText={t.cancel}
          confirmColor={isDark ? '#ff3b30' : '#d32f2f'}
          icon="trash-outline"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteVisible(false)}
        />
        <ConfirmDialog
          visible={confirmCollabVisible}
          title={t.collaborateConfirmTitle}
          message={
            announcementDetails?.price && announcementDetails.price > 0
              ? `${t.collaborationPriceText} ${announcementDetails.price} ${t.priceRON}?`
              : t.collaborateConfirmMessage
          }
          confirmText={
            announcementDetails?.price && announcementDetails.price > 0
              ? `${t.collaborationPriceText} ${announcementDetails.price} RON`
              : t.collaborate
          }
          cancelText={t.cancel}
          confirmColor={tokens.colors.primary}
          icon="people-outline"
          onConfirm={confirmSendCollaborationRequest}
          onCancel={() => setConfirmCollabVisible(false)}
        />
        <ConfirmDialog
          visible={confirmDeleteConvVisible}
          title="Șterge toate mesajele"
          message="Ești sigur că vrei să ștergi toate mesajele din această conversație? Acțiunea este ireversibilă."
          confirmText="Șterge tot"
          cancelText={t.cancel}
          confirmColor={isDark ? '#ff3b30' : '#d32f2f'}
          icon="trash-outline"
          onConfirm={handleDeleteConversation}
          onCancel={() => setConfirmDeleteConvVisible(false)}
        />
        <ReportContentModal
          visible={reportModalVisible}
          title={t.reportDialogTitle}
          description={t.reportDialogDescription}
          reasonLabel={t.reportReasonLabel}
          reasons={[
            { value: 'spam', label: t.reportReasonSpam },
            { value: 'abusive', label: t.reportReasonAbusive },
            { value: 'harassment', label: t.reportReasonHarassment },
            { value: 'inappropriate', label: t.reportReasonInappropriate },
            { value: 'other', label: t.reportReasonOther },
          ]}
          detailsLabel={t.reportDetailsLabel}
          detailsPlaceholder={t.reportDetailsPlaceholder}
          submitText={t.reportSubmit}
          cancelText={t.reportCancel}
          submitting={reportSubmitting}
          onSubmit={handleSubmitMessageReport}
          onCancel={closeReportModal}
        />

        {/* Counter Offer Modal */}
        <Modal
          visible={counterOfferModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCounterOfferModalVisible(false)}
        >
          <Pressable 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => setCounterOfferModalVisible(false)}
          >
            <Pressable 
              style={[styles.counterOfferModal, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <ThemedText style={[styles.counterOfferTitle, { color: tokens.colors.text }]}>
                {t.sendCounterOffer}
              </ThemedText>
              <View style={[styles.counterOfferInputWrapper, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.elev }]}>
                <ThemedText style={[{ color: tokens.colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }]}>
                  {t.enterNewPrice}
                </ThemedText>
                <TextInput
                  style={[styles.counterOfferInput, { color: tokens.colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={tokens.colors.placeholder}
                  value={counterOfferPrice}
                  onChangeText={setCounterOfferPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.counterOfferActions}>
                <TouchableOpacity
                  onPress={() => {
                    setCounterOfferModalVisible(false);
                    setCounterOfferPrice('');
                  }}
                  style={[styles.counterOfferBtn, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface }]}
                  activeOpacity={0.8}
                >
                  <ThemedText style={[styles.counterOfferBtnText, { color: tokens.colors.text }]}>
                    {t.cancel}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendCounterOffer}
                  style={[styles.counterOfferBtn, { backgroundColor: tokens.colors.primary }]}
                  activeOpacity={0.8}
                  disabled={loadingNegotiation}
                >
                  <ThemedText style={[styles.counterOfferBtnText, { color: tokens.colors.primaryContrast }]}>
                    {t.send}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  typingBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  chatHeaderClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtnClean: {
    padding: 4,
  },
  headerNameClean: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  moreBtn: {
    padding: 4,
  },
  moreBtnTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 14,
    marginLeft: 0,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerActionBtn: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 12,
  },
  headerAvatarClean: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },

  collabContainer: {
    gap: 8,
  },
  collabTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  collabStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  collabHint: {
    fontSize: 12,
  },
  bookingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bookingStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  collabButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  collabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#e6e6e6',
    alignSelf: 'stretch',
    marginTop: 8,
    marginBottom: 8,
  },
  announcementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  announcementThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  announcementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  announcementTitle: {
    fontSize: 14,
    color: '#444444',
  },
  announcementId: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  headerNameCleanDark: {
    color: '#ffffff',
  },
  headerSeparatorDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  announcementTitleDark: {
    color: '#ffffff',
  },
  announcementIdDark: {
    color: 'rgba(255,255,255,0.65)',
  },
  messagesContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  messageRowCompact: {
    marginBottom: 4,
  },
  messageRowWithReactions: {
    marginBottom: 28,
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 6,
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  imageViewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickIconClean: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.5,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e6e6e6',
    marginHorizontal: 12,
  },
  messageGroup: {
    flex: 1,
  },
  messageBubbleClean: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
    maxWidth: '75%',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageMetaTime: {
    fontSize: 11,
    lineHeight: 14,
  },
  messageTextClean: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTimeClean: {
    fontSize: 11,
  },
  inputContainerClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    padding: 4,
  },
  inputClean: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
  },
  inputCleanDark: {
    color: '#ffffff',
  },
  sendBtnClean: {
    padding: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  reactionBubble: {
    borderRadius: 999,
    paddingHorizontal: 2,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  reactionBubbleSingle: {
    paddingHorizontal: 1,
    paddingVertical: 0,
  },
  reactionBubbleWithCount: {
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  reactionBubbleMore: {
    minWidth: 16,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  reactionEmoji: {
    fontSize: 13,
    lineHeight: 17,
  },
  reactionEmojiSingle: {},
  reactionEmojiWithCount: {},
  reactionCount: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  reactionPickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  reactionPickerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionPickerEmoji: {
    fontSize: 30,
  },
  contextMenu: {
    backgroundColor: '#ffffff',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contextMenuText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  contextMenuDivider: {
    height: 0.5,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 20,
  },
  reactionBarAbsolute: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 28,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    alignItems: 'center',
  },
  contextMenuAbsolute: {
    position: 'absolute',
    width: 300,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  replyPreviewBar: {
    width: 3,
    height: '100%',
    marginRight: 8,
    borderRadius: 2,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
  },
  replyPreviewImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyPreviewClose: {
    padding: 8,
  },
  replyInBubble: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 6,
    paddingRight: 8,
    marginBottom: 6,
    borderRadius: 6,
  },
  replyInBubbleName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyInBubbleText: {
    fontSize: 12,
  },
  replyInBubbleImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Negotiation styles
  negotiationBar: {
    padding: 16,
    gap: 12,
  },
  negotiationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  negotiationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  negotiationPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  negotiationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  negotiationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  negotiationBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  negotiationRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  negotiationRejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  counterOfferModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  counterOfferTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  counterOfferInputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  counterOfferInput: {
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
  counterOfferActions: {
    flexDirection: 'row',
    gap: 12,
  },
  counterOfferBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  counterOfferBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});