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
  UIManager,
  findNodeHandle,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useTabBar } from '../../src/context/TabBarContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../../src/services/storage';
import { useAuth } from '../../src/context/AuthContext';
import ImageViewing from 'react-native-image-viewing';
// NOTE: Pentru a evita eroarea html2canvas (folosită intern de react-native-view-shot pe web),
// NU importăm direct view-shot; vom crea un loader lazy doar pentru platformele native.
// Dacă vrei snapshot real pentru web mai târziu, putem introduce o implementare fallback bazată pe canvas.
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
  otherParticipant: { id: string; firstName?: string; lastName?: string; avatar?: string; lastSeen?: string };
  lastSeen?: string;
  announcementOwnerId: string;
  announcementId: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  createdAt: string;
  isRead?: boolean;
  senderInfo?: { firstName?: string; lastName?: string; avatar?: string };
  replyTo?: { messageId: string; senderId: string; text?: string; image?: string };
  reactions?: Array<{ userId: string; emoji: string }>;
  // If true the message has been deleted and should render a placeholder bubble
  deleted?: boolean;
}

export default function ChatScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { hideTabBar, showTabBar } = useTabBar();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationFilter, setConversationFilter] = useState<'selling' | 'buying'>('buying');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const messagesEndRef = useRef<ScrollView>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  // dynamic menu positioning states
  const [menuPosition, setMenuPosition] = useState<null | { x: number; y: number; width: number; height: number; showAbove: boolean }>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [reactionBarWidth, setReactionBarWidth] = useState(0);
  const [reactionBarHeight, setReactionBarHeight] = useState(0);
  const [floatingSnapshot, setFloatingSnapshot] = useState<string | null>(null);
  const [floatingReady, setFloatingReady] = useState(false);
  const [overlayPlacement, setOverlayPlacement] = useState<'above' | 'below'>('above');
  // Hold refs for each bubble to measure its screen position
  const bubbleRefs = useRef<Record<string, View | null>>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const width = Dimensions.get('window').width;
  
  // Page colors (solid): primary used for headers, accent used for tabs
  const primaryColor = '#355070';
  const accent = '#F8B195';

  // Keep local userId in sync with AuthContext
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversations/${userId}`);
      const conversationsData = response.data;

      const formattedConversations = conversationsData.map((conv: any) => {
        const participantAvatar = resolveAvatarUrl(conv.otherParticipant?.avatar);
        const announcementImg = resolveAvatarUrl(conv.announcementImage);
        const participantName = `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`.trim();
        const resolvedAnnouncementTitle =
          conv.announcementTitle ||
          conv.name ||
          (conv.announcement && (conv.announcement.title || conv.announcement.name)) ||
          conv.title ||
          '(fără titlu)';

        const announcementOwnerName = conv.announcementOwnerName || participantName;
        return {
          id: conv.otherParticipant.id,
          conversationId: conv.conversationId,
          name: resolvedAnnouncementTitle,
          avatar: announcementImg || participantAvatar || '',
          participantName,
          participantAvatar,
          announcementTitle: resolvedAnnouncementTitle,
          announcementOwnerName,
          lastMessage: conv.lastMessage.text,
          time: new Date(conv.lastMessage.createdAt).toLocaleString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unread: conv.unread,
          otherParticipant: conv.otherParticipant,
          lastSeen: conv.otherParticipant.lastSeen,
          announcementOwnerId: conv.announcementOwnerId,
          announcementId: conv.announcementId,
        };
      });
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversation/${selectedConversation.conversationId}`);
      setMessages(response.data || []);

      // Mark as read
      try {
        await api.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`);
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === selectedConversation.conversationId ? { ...c, unread: false } : c
          )
        );
      } catch (e) {
        console.error('Error marking as read:', e);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Hide the bottom tab bar when we're inside a conversation detail view.
  // Use counter-based API to avoid races: call hideTabBar when entering and showTabBar when leaving.
  useEffect(() => {
    if (selectedConversation) {
      hideTabBar();
      return () => showTabBar();
    }
    // If not selectedConversation, ensure we show (no-op if already visible)
    showTabBar();
    return;
  }, [selectedConversation, hideTabBar, showTabBar]);

  // Ensure that if the screen loses focus (user navigates away) we close any open conversation
  // and restore the tab bar. This helps when the user navigates via tabs, deep links, or other screens.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (selectedConversation) {
          setSelectedConversation(null);
        }
        showTabBar();
      };
    }, [selectedConversation, showTabBar])
  );

  // Handle Android hardware back button when inside a conversation: close it and show tab bar.
  useEffect(() => {
    if (!selectedConversation) return;
    const onBackPress = () => {
      setSelectedConversation(null);
      showTabBar();
      return true; // prevent default behavior
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [selectedConversation, showTabBar]);

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
    } else {
      await fetchConversations();
    }
    setRefreshing(false);
  }, [selectedConversation, fetchMessages, fetchConversations]);

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim() || !selectedConversation) return;

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
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const messageData = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        senderRole: 'cumparator',
        destinatarId: selectedConversation.otherParticipant.id,
        text: newMessage.trim(),
        ...(selectedConversation.announcementId ? { announcementId: selectedConversation.announcementId } : {}),
      };

      const response = await api.post('/api/messages', messageData);

      if (response.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id
              ? {
                  ...response.data,
                  senderInfo: tempMessage.senderInfo,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert('Eroare', 'Nu s-a putut trimite mesajul.');
    }
  };

  // Pick image from gallery, request permission first
  const handlePickImagePress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permisiune', 'Trebuie să permiți accesul la galerie pentru a selecta o imagine.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

  // expo-image-picker v13+ returns { canceled: boolean, assets: [...] }
  if ((result as any).canceled) return;

      // expo-image-picker v13+ returns { assets: [...] }
      const asset: any = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || !asset.uri) return;

      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mimeType = asset.type ? `${asset.type}/${ext}` : `image/${ext}`;

      // Optimistic UI: add a temporary message
      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri,
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Prepare multipart form data
      const form = new FormData();
      // @ts-ignore - react native file
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }

      try {
        const res = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res?.data) {
          setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? { ...res.data, senderInfo: tempMessage.senderInfo } : m)));
        }
      } catch (err) {
        console.error('Upload image error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert('Eroare', 'Nu s-a putut trimite imaginea.');
      }
    } catch (err) {
      console.error('handlePickImagePress error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea imaginii.');
    }
  };

  // Pick a generic file (document). Uses dynamic import for expo-document-picker so the dependency is optional.
  const handlePickFilePress = async () => {
    try {
      // On Android modern SDKs there are different permissions; try to request whichever exist.
      if (Platform.OS === 'android') {
        try {
          // Try the common READ_EXTERNAL_STORAGE permission first
          const perm = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          if (perm) {
            const granted = await PermissionsAndroid.request(perm);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              // If not granted, try the newer media permissions if available
              const imgPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const vidPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const g2 = await PermissionsAndroid.requestMultiple([imgPerm, vidPerm]);
              const ok = Object.values(g2).some((v) => v === PermissionsAndroid.RESULTS.GRANTED);
              if (!ok) {
                Alert.alert('Permisiune', 'Trebuie să permiți accesul la fișiere pentru a selecta un document.');
                return;
              }
            }
          }
        } catch (pErr) {
          // ignore and proceed — DocumentPicker may request its own permissions
          console.warn('Permission request failed, proceeding to picker', pErr);
        }
      }

      let DocumentPicker: any = null;
      try {
        // dynamic import to avoid build-time errors if not installed
        // @ts-ignore
        DocumentPicker = await import('expo-document-picker');
      } catch (e) {
        // If the package isn't installed, offer the user to open the gallery as a fallback
        Alert.alert(
          'Selector fișiere lipsă',
          'Pentru a selecta orice tip de fișier instalează pachetul expo-document-picker. Vrei să deschizi galeria ca alternativă?',
          [
            { text: 'Anulează', style: 'cancel' },
            {
              text: 'Deschide galerie',
              onPress: async () => {
                try {
                  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
                  if ((res as any).canceled) return;
                  const asset: any = (res as any).assets ? (res as any).assets[0] : res;
                  if (!asset || !asset.uri) return;
                  // Reuse the upload flow for files (image) picked from gallery
                  const uri = asset.uri;
                  const fileName = asset.name || asset.fileName || uri.split('/').pop() || `file_${Date.now()}`;
                  const mimeType = asset.type ? `${asset.type}/${(fileName.split('.').pop() || 'jpg')}` : asset.mimeType || 'application/octet-stream';

                  const tempMessage: Message = {
                    _id: Date.now().toString(),
                    conversationId: selectedConversation!.conversationId,
                    senderId: userId!,
                    image: uri,
                    createdAt: new Date().toISOString(),
                    senderInfo: { firstName: 'Tu', lastName: '' },
                  };
                  setMessages((prev) => [...prev, tempMessage]);

                  const form = new FormData();
                  // @ts-ignore
                  form.append('image', { uri, name: fileName, type: mimeType });
                  form.append('conversationId', selectedConversation!.conversationId);
                  form.append('destinatarId', selectedConversation!.otherParticipant.id);
                  form.append('senderRole', 'cumparator');
                  if (selectedConversation!.announcementId) {
                    form.append('announcementId', selectedConversation!.announcementId);
                  }

                  const r = await api.post('/api/messages', form as any, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  if (r?.data) {
                    setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? { ...r.data, senderInfo: tempMessage.senderInfo } : m)));
                  }
                } catch (err) {
                  console.error('Fallback gallery upload failed', err);
                  Alert.alert('Eroare', 'Nu s-a putut încărca fișierul din galerie.');
                }
              },
            },
          ]
        );
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res || res.type !== 'success') return;

      const uri = res.uri;
      const fileName = res.name || uri.split('/').pop() || `file_${Date.now()}`;
      const mimeType = res.mimeType || 'application/octet-stream';

      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri, // reuse image field for backend; backend accepts any uploaded file under 'image'
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
      };

      setMessages((prev) => [...prev, tempMessage]);

      const form = new FormData();
      // @ts-ignore
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }

      try {
        const r = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (r?.data) {
          setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? { ...r.data, senderInfo: tempMessage.senderInfo } : m)));
        }
      } catch (err) {
        console.error('Upload file error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert('Eroare', 'Nu s-a putut trimite fișierul.');
      }
    } catch (err) {
      console.error('handlePickFilePress error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea fișierului.');
    }
  };

  // (Removed duplicate placeholder permission-only handlers — full picker implementations above are used.)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (lastSeenDate?: string) => {
    if (!lastSeenDate) return 'Necunoscut';

    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
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
        month: 'short',
      });
    }
  };

  const resolveAvatarUrl = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
    return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
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

  const getAvatarFallback = (name: string) => {
    const initial = name.slice(0, 1).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=355070&color=fff`;
  };

  const handleLongPressMessage = (message: Message) => {
    // Haptic feedback
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
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
    // First measurement (immediate)
    UIManager.measureInWindow(node, (x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const spaceAbove = y - insets.top;
      const spaceBelow = screenHeight - (y + height) - insets.bottom;
      const estimatedMenuHeight = 320; // rough estimate
      const showAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      // set initial values so UI can render quickly
      setSelectedMessage(message);
      setMenuPosition({ x, y, width, height, showAbove });
      setContextMenuVisible(true);
      if (!captureRef) {
        // Fallback clone will be used; consider it ready immediately
        setFloatingReady(true);
      }
      // Re-measure after a very short delay to get a stabilized height/width
      // (addresses race conditions where layout/line-wrapping can change slightly)
      setTimeout(() => {
        try {
          UIManager.measureInWindow(node, (x2, y2, w2, h2) => {
            const screenH2 = Dimensions.get('window').height;
            const spaceAbove2 = y2 - insets.top;
            const spaceBelow2 = screenH2 - (y2 + h2) - insets.bottom;
            const showAbove2 = spaceBelow2 < estimatedMenuHeight && spaceAbove2 > spaceBelow2;
            setMenuPosition({ x: x2, y: y2, width: w2, height: h2, showAbove: showAbove2 });
          });
          // Try to capture a pixel-perfect snapshot of the original bubble so we can
          // render it above the BlurView (avoids blurring the message). This only
          // works on native when captureRef is available; otherwise we'll fallback
          // to rendering a cloned view above the blur.
          if (captureRef) {
            try {
              // captureRef can fail if view transiently changes; ignore failures
              // @ts-ignore
              captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' })
                .then((uri: string) => {
                  setFloatingSnapshot(uri as string);
                  setFloatingReady(true);
                })
                .catch(() => {
                  // ignore, fallback handled in render
                  setFloatingReady(true);
                });
            } catch (e) {
              // ignore
              setFloatingReady(true);
            }
          } else {
            // captureRef unavailable → fallback clone considered ready already (if not yet set)
            setFloatingReady(true);
          }
        } catch (e) {
          // ignore failed re-measure
          setFloatingReady(true);
        }
      }, 45);
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

  // Recompute where to place reaction bar + context menu so they NEVER overlap bubble
  useEffect(() => {
    if (!menuPosition || !contextMenuVisible) return;
    const screenH = Dimensions.get('window').height;
    const gap = 8; // base gap between elements
    const rbH = reactionBarHeight || 48; // fallback estimate
    const mH = menuHeight || 300; // until measured
    const spaceAbove = menuPosition.y - insets.top;
    const spaceBelow = screenH - (menuPosition.y + menuPosition.height) - insets.bottom;
    const neededTotal = rbH + mH + gap * 3; // reaction bar + menu + gaps

    if (spaceAbove >= neededTotal) {
      setOverlayPlacement('above');
      return;
    }
    if (spaceBelow >= neededTotal) {
      setOverlayPlacement('below');
      return;
    }
    // Not enough continuous space on either side for full stack.
    // Choose side with more space; elements will compress toward bubble but keep gap.
    if (spaceAbove >= spaceBelow) {
      setOverlayPlacement('above');
    } else {
      setOverlayPlacement('below');
    }
  }, [menuPosition, reactionBarHeight, menuHeight, insets.top, insets.bottom, contextMenuVisible]);

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !userId) return;
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === selectedMessage._id) {
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
            if (existingIdx >= 0) {
              // Remove reaction
              return { ...m, reactions: reactions.filter((_, i) => i !== existingIdx) };
            } else {
              // Add reaction
              return { ...m, reactions: [...reactions, { userId, emoji }] };
            }
          }
          return m;
        })
      );
      closeContextMenu();
      // TODO: send reaction to server
      // await api.post(`/api/messages/${selectedMessage._id}/reaction`, { emoji });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    Alert.alert(
      'Șterge mesaj',
      'Ești sigur că vrei să ștergi acest mesaj?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically mark message as deleted so it stays in the list but shows a placeholder
              setMessages((prev) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true, text: undefined, image: undefined } : m)));
              closeContextMenu();
              // Try deleting on server but don't remove locally if it fails; server may physically delete, but UI keeps a placeholder
              try {
                await api.delete(`/api/messages/${selectedMessage._id}`);
              } catch (serverErr) {
                // If server deletion fails, keep local deleted flag — it represents that user removed it locally.
                console.warn('Server delete failed, message kept as deleted locally', serverErr);
              }
            } catch (err) {
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  const handleCopyMessage = async () => {
    if (selectedMessage?.text) {
      await Clipboard.setStringAsync(selectedMessage.text);
      Alert.alert('Copiat', 'Mesajul a fost copiat.');
      closeContextMenu();
    }
  };

  const handleReplyMessage = () => {
    // TODO: implement reply functionality
    Alert.alert('Reply', 'Funcționalitate în curând');
    closeContextMenu();
  };

  const handleForwardMessage = () => {
    // TODO: implement forward functionality
    Alert.alert('Forward', 'Funcționalitate în curând');
    closeContextMenu();
  };

  const handleStarMessage = () => {
    // TODO: implement star/favorite functionality
    Alert.alert('Star', 'Funcționalitate în curând');
    closeContextMenu();
  };

  const handleReportMessage = () => {
    Alert.alert('Raportează mesaj', 'Vrei să raportezi acest mesaj?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Raportează', onPress: () => {
        // TODO: report to server
        Alert.alert('Raportat', 'Mesajul a fost raportat.');
        closeContextMenu();
      }},
    ]);
  };

  const unreadConversations = conversations.filter((conv) => conv.unread);
  const readConversations = conversations.filter((conv) => !conv.unread);
  const sellingConversations = conversations.filter((conv) => conv.announcementOwnerId === userId);
  const buyingConversations = conversations.filter((conv) => conv.announcementOwnerId !== userId);
  const filteredConversations = conversationFilter === 'selling' ? sellingConversations : buyingConversations;
  const totalConversations = conversations.length;

  // If conversation is selected, show chat view
  if (selectedConversation) {
    return (
      <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
        {/* Clean header with back button, seller avatar + name, and announcement preview below */}
        <View style={[styles.chatHeaderClean, { paddingTop: insets.top + 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }]}>
          {/* Center block: avatar + name (centered), announcement preview below */}
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backBtnClean}>
                <Ionicons name="arrow-back" size={26} color="#000000" />
              </TouchableOpacity>
              <Image
                source={{ uri: selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                style={styles.headerAvatarClean}
              />
              <Text style={styles.headerNameClean}>{selectedConversation.participantName}</Text>
            </View>

            {/* thin separator between title row and announcement preview */}
            <View style={styles.headerSeparator} />

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
                <Text style={styles.announcementTitle} numberOfLines={1}>{selectedConversation.announcementTitle || 'Anunț'}</Text>
                {selectedConversation.announcementId ? (
                  <Text style={styles.announcementId}>ID: {selectedConversation.announcementId}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.moreBtn, styles.moreBtnTop]}>
            <Ionicons name="ellipsis-vertical" size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#100e9aff" />}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#100e9aff" />
              <Text style={[styles.loadingText, { color: '#888888' }]}>Se încarcă mesajele...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#cccccc" />
              <Text style={[styles.emptyText, { color: '#888888' }]}>Nicio conversație încă. Scrie primul mesaj!</Text>
            </View>
          ) : (
            <>
              {messages.map((message, idx) => {
                const isOwn = message.senderId === userId;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const showDateSeparator = 
                  !prevMessage || 
                  new Date(message.createdAt).toLocaleDateString() !== new Date(prevMessage.createdAt).toLocaleDateString();

                // Only show the time for the last message in a run of messages that share the same minute
                // BUT only collapse/hide the time when the next message is from the same sender.
                const timeForMessage = formatTime(message.createdAt);
                const nextMessage = idx < messages.length - 1 ? messages[idx + 1] : null;
                const nextTime = nextMessage ? formatTime(nextMessage.createdAt) : null;
                const sameSenderAsNext = !!nextMessage && nextMessage.senderId === message.senderId;
                const sameTimeAsNext = !!nextMessage && nextTime === timeForMessage;
                // showTime is true when there is no next message OR the next message either has a different time
                // or is from a different sender. We only hide the time when both time and sender match.
                const showTime = !nextMessage || !(sameTimeAsNext && sameSenderAsNext);
                // compactBelow reduces spacing only when next message is from the same sender and same minute
                const compactBelow = sameTimeAsNext && sameSenderAsNext;

                return (
                  <View key={message._id}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateSeparatorText}>
                          {new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).toUpperCase()}
                        </Text>
                        <View style={styles.dateLine} />
                      </View>
                    )}

                    {/* Message bubble */}
                    <View style={[styles.messageRow, isOwn && styles.messageRowOwn, compactBelow && styles.messageRowCompact]}>
                      <View style={styles.messageGroup}>
                        {/* Reactions display above message */}
                        {message.reactions && message.reactions.length > 0 && (
                          <View style={[styles.reactionsContainer, isOwn ? { alignSelf: 'flex-end', marginRight: 12 } : { alignSelf: 'flex-start', marginLeft: 12 }]}>
                            {message.reactions.slice(0, 3).map((reaction, rIdx) => (
                              <View key={`${reaction.userId}-${reaction.emoji}-${rIdx}`} style={styles.reactionBubble}>
                                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                              </View>
                            ))}
                            {message.reactions.length > 3 && (
                              <View style={styles.reactionBubble}>
                                <Text style={styles.reactionCount}>+{message.reactions.length - 3}</Text>
                              </View>
                            )}
                          </View>
                        )}
                        <Pressable
                          ref={(r) => { bubbleRefs.current[message._id] = r; }}
                          onLongPress={() => handleLongPressMessage(message)}
                          delayLongPress={400}
                          style={[
                            styles.messageBubbleClean,
                            isOwn
                              ? {
                                  backgroundColor: '#d1e7ff',
                                  marginLeft: 'auto',
                                  marginRight: 12,
                                  borderTopLeftRadius: 20,
                                  borderTopRightRadius: 20,
                                  borderBottomLeftRadius: 20,
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  backgroundColor: '#f0f0f0',
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
                            <Text style={[styles.messageTextClean, { color: '#888888', fontStyle: 'italic' }]}>acest mesaj a fost șters</Text>
                          ) : (
                            <>
                              {message.text && (
                                <Text style={[styles.messageTextClean, { color: '#1a1a1a' }]}>
                                  {message.text}
                                </Text>
                              )}
                              {message.image && (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => handleOpenImage(message.image)}
                                >
                                  <Image source={{ uri: message.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                                </TouchableOpacity>
                              )}
                              {isOwn && (
                                <Ionicons
                                  name="checkmark-done"
                                  size={15}
                                  color={message.isRead ? '#34B7F1' : '#888888'}
                                  style={styles.tickIconClean}
                                />
                              )}
                            </>
                          )}
                        </Pressable>
                        {/* Time + checkmarks below bubble (only shown at end of same-time group) */}
                        {showTime && (
                          <View 
                            style={[
                              styles.messageTimestamp, 
                              isOwn ? { alignSelf: 'flex-end', marginRight: 12 } : { alignSelf: 'flex-start', marginLeft: 12 }
                            ]}
                          >
                            <Text style={[styles.messageTimeClean, { color: '#888888' }]}>
                              {timeForMessage}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Input bar with icons */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputContainerClean, { backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e0e0e0' }]}>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickImagePress}>
            <Ionicons name="image-outline" size={26} color="#888888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickFilePress}>
            <Ionicons name="attach-outline" size={26} color="#888888" />
          </TouchableOpacity>
          <TextInput
            style={styles.inputClean}
            placeholder="Scrie mesajul tău..."
            placeholderTextColor="#999999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={[styles.sendBtnClean, { opacity: newMessage.trim() ? 1 : 0.4 }]}
          >
            <Ionicons name="send" size={20} color="#100e9aff" />
          </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {Platform.OS !== 'web' && (
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
            FooterComponent={({ imageIndex }) =>
              imageViewerImages.length > 1 ? (
                <View style={[styles.imageViewerFooter, { paddingBottom: insets.bottom + 20 }] }>
                  <Text style={styles.imageViewerFooterText}>{`${imageIndex + 1} / ${imageViewerImages.length}`}</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Dynamic Context Menu Modal */}
  <Modal visible={contextMenuVisible} transparent animationType="none" onRequestClose={closeContextMenu}>
          <Pressable style={styles.modalOverlay} onPress={closeContextMenu}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
            {selectedMessage && menuPosition && (
              <>
                {/* Floating snapshot OR fallback clone (unblurred) */}
                {floatingReady && floatingSnapshot ? (
                  <View pointerEvents="none" style={[styles.floatingBubble, { top: menuPosition.y, left: menuPosition.x, width: menuPosition.width, height: menuPosition.height, zIndex: 30 }]}> 
                    <Image source={{ uri: floatingSnapshot }} style={{ width: menuPosition.width, height: menuPosition.height, borderRadius: 12 }} resizeMode="cover" />
                  </View>
                ) : null}
                {/* When snapshot unavailable (e.g., web), keep original bubble visible */}

                {/* Reaction bar (unblurred) */}
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
                      let top: number;
                      if (overlayPlacement === 'above') {
                        // place reaction bar just above bubble with gap
                        top = menuPosition.y - rbH - gap;
                        // if not enough space, clamp but do NOT let it overlap the bubble: if clamped, we might have to switch placement
                        if (top < insets.top + gap) {
                          // fallback: put below bubble
                          top = menuPosition.y + menuPosition.height + gap;
                        }
                      } else {
                        // below placement
                        top = menuPosition.y + menuPosition.height + gap;
                        const screenBottomLimit = Dimensions.get('window').height - insets.bottom - rbH - gap;
                        if (top > screenBottomLimit) {
                          // fallback: try above
                          const alt = menuPosition.y - rbH - gap;
                          if (alt >= insets.top + gap) top = alt; // else keep and allow scroll
                        }
                      }
                      const left = Math.max(8, Math.min(menuPosition.x + menuPosition.width / 2 - estWidth / 2, screenW - estWidth - 8));
                      return { top, left };
                    })(),
                  ]}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.quickReactionButton}>
                      <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setShowReactionPicker((p) => !p)} style={styles.quickReactionButton}>
                    <Ionicons name={showReactionPicker ? 'close' : 'add-circle-outline'} size={24} color="#666" />
                  </TouchableOpacity>
                  {showReactionPicker && (
                    <View style={styles.reactionPickerDropdown}>
                      {['🤩','😎','🔥','🎉','😔','🙌','👌','🥳','🤔','🤯'].map((emoji) => (
                        <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={styles.reactionPickerButton}>
                          <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Context menu (unblurred) */}
                <View
                  onLayout={(e) => setMenuHeight(e.nativeEvent.layout.height)}
                  style={[
                    styles.contextMenuAbsolute,
                    { zIndex: 50 },
                    (() => {
                      const win = Dimensions.get('window');
                      const gap = 6;
                      const rbH = reactionBarHeight || 48;
                      const mH = menuHeight || 300;
                      let reactionBarTop: number;
                      // replicate reaction bar top logic (must match where we actually placed it):
                      if (overlayPlacement === 'above') {
                        reactionBarTop = Math.max(menuPosition.y - rbH - 8, insets.top + 8);
                        if (reactionBarTop >= menuPosition.y - rbH - 8 + 1) {
                          // if we had to clamp, placement might have changed; treat as below fallback
                          if (reactionBarTop + rbH + gap > menuPosition.y) {
                            // overlapping risk, treat as below
                            reactionBarTop = menuPosition.y + menuPosition.height + 8;
                          }
                        }
                      } else {
                        reactionBarTop = menuPosition.y + menuPosition.height + 8;
                      }
                      let top: number;
                      if (overlayPlacement === 'above') {
                        top = reactionBarTop - mH - gap;
                        if (top < insets.top + 8) {
                          // fallback below stack
                          top = reactionBarTop + rbH + gap;
                          // ensure not overlapping bubble top if forced below while we intended above
                          if (top < menuPosition.y + menuPosition.height + gap) {
                            top = menuPosition.y + menuPosition.height + rbH + gap * 2;
                          }
                        }
                      } else {
                        // below placement
                        top = reactionBarTop + rbH + gap;
                        const maxTop = win.height - insets.bottom - mH - 8;
                        if (top > maxTop) {
                          // try above instead
                          const alt = reactionBarTop - mH - gap;
                          if (alt >= insets.top + 8) top = alt; else top = maxTop;
                        }
                      }
                      const left = Math.max(8, Math.min(menuPosition.x, win.width - 300 - 8));
                      return { top, left };
                    })(),
                  ]}
                >
                  <View style={styles.contextMenu}>
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleStarMessage}>
                      <Text style={styles.contextMenuText}>Star</Text>
                      <Ionicons name="star-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.contextMenuDivider} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReplyMessage}>
                      <Text style={styles.contextMenuText}>Reply</Text>
                      <Ionicons name="arrow-undo-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.contextMenuDivider} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleForwardMessage}>
                      <Text style={styles.contextMenuText}>Forward</Text>
                      <Ionicons name="arrow-redo-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    {selectedMessage.text && (
                      <>
                        <View style={styles.contextMenuDivider} />
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleCopyMessage}>
                          <Text style={styles.contextMenuText}>Copy</Text>
                          <Ionicons name="copy-outline" size={20} color="#333" />
                        </TouchableOpacity>
                      </>
                    )}
                    <View style={styles.contextMenuDivider} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Speak', 'Text-to-speech funcționalitate în curând'); closeContextMenu(); }}>
                      <Text style={styles.contextMenuText}>Speak</Text>
                      <Ionicons name="volume-medium-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.contextMenuDivider} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReportMessage}>
                      <Text style={styles.contextMenuText}>Report</Text>
                      <Ionicons name="warning-outline" size={20} color="#333" />
                    </TouchableOpacity>
                    {selectedMessage.senderId === userId && (
                      <>
                        <View style={styles.contextMenuDivider} />
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDeleteMessage}>
                          <Text style={[styles.contextMenuText, { color: '#ff3b30' }]}>Delete</Text>
                          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Conversation list view
  return (
    <View style={[styles.listContainer, { backgroundColor: tokens.colors.bg }]}> 
      <LinearGradient
        colors={['#355070', '#2a4160']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.listHeaderGradient, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.listHeaderTopRow}>
          <View>
            <Text style={styles.listHeaderTitle}>Mesaje ({totalConversations})</Text>
            <Text style={styles.listHeaderSubtitle}>Continuă conversațiile tale</Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.85}>
            <Ionicons name="search" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSegment}>
          {(['buying', 'selling'] as const).map((filterKey) => (
            <TouchableOpacity
              key={filterKey}
              style={[
                styles.filterButton,
                conversationFilter === filterKey && styles.filterButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setConversationFilter(filterKey)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  conversationFilter === filterKey && styles.filterButtonTextActive,
                ]}
              >
                {filterKey === 'buying' ? 'De cumpărat' : 'De vândut'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

  <View style={[styles.listContentWrapper, { backgroundColor: 'transparent', marginTop: 0, paddingTop: 0 }] }>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#355070" />}
        >
          {loading && conversations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#355070" />
              <Text style={[styles.loadingText, { color: '#6d7a99' }]}>Se încarcă conversațiile...</Text>
            </View>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <TouchableOpacity
                key={conv.conversationId}
                activeOpacity={0.9}
                onPress={async () => {
                  setSelectedConversation(conv);
                  setConversations((prev) =>
                    prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, unread: false } : c))
                  );
                  if (conv.unread) {
                    try {
                      await api.put(`/api/messages/conversation/${conv.conversationId}/mark-read`);
                    } catch (e) {
                      // ignore
                    }
                  }
                }}
                style={[styles.conversationCardFlat, conv.unread && styles.conversationCardUnread, { borderBottomColor: tokens.colors.border }]}
              >
                <View style={styles.conversationAvatarWrapper}>
                  <Image
                    source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }}
                    style={styles.conversationAvatar}
                  />
                  {conv.unread && (
                    <View style={styles.conversationBadge}>
                      <Text style={styles.conversationBadgeText}>•</Text>
                    </View>
                  )}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationRowTop}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                      {conv.participantName}
                    </Text>
                    <Text style={styles.conversationTime}>{conv.time}</Text>
                  </View>
                  <Text style={styles.conversationSnippet} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                  <Text style={styles.conversationTopic} numberOfLines={1}>
                    {conv.announcementTitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="#b4bed8" />
              <Text style={[styles.emptyText, { color: '#6d7a99' }]}>Nu există conversații {conversationFilter === 'buying' ? 'de cumpărat' : 'de vândut'} momentan.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: {
    flex: 1,
  },
  listHeaderGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  listHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  listHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  listHeaderSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.22)',
    padding: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  filterButtonTextActive: {
    color: '#355070',
  },
  listContentWrapper: {
    flex: 1,
    marginTop: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  conversationCard: {
    // kept for backward compatibility; use flat variant for list
  },
  conversationCardFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  conversationCardUnread: {
    borderWidth: 1.2,
    borderColor: 'rgba(53, 80, 112, 0.25)',
  },
  conversationAvatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  conversationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#355070',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  conversationBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: -4,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  conversationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#273043',
    marginRight: 12,
  },
  conversationTime: {
    fontSize: 12,
    color: '#7f89a8',
  },
  conversationSnippet: {
    fontSize: 14,
    color: '#46506a',
    marginBottom: 4,
  },
  conversationTopic: {
    fontSize: 13,
    color: '#9aa3c0',
  },
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
  // Chat view
  chatHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  chatHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F8B195',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 13,
    marginTop: 2,
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
  messageRowOwn: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
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
  imageViewerFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  imageViewerFooterText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  tickIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Clean chat view styles
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
  // headerAvatarClean is declared later with updated sizing
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
    gap: 8,
    marginLeft: 0,
  },
  headerAvatarClean: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingRight: 24,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '75%', // original constraint for normal list; floating bubble will override if needed
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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
  tickIconClean: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
  sendBtnClean: {
    padding: 8,
  },
  // Reactions styles
  reactionsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  reactionBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
  },
  // Context menu styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 0,
    width: Dimensions.get('window').width * 0.75,
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  contextMessagePreview: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 120,
  },
  contextMessageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  contextMessageImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginTop: 8,
  },
  quickReactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  quickReactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  quickReactionEmoji: {
    fontSize: 24,
  },
  reactionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  reactionPickerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  reactionPickerEmoji: {
    fontSize: 28,
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
  // Dynamic absolute positioned elements
  reactionBarAbsolute: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 28,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  reactionPickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
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
  floatingBubble: {
    position: 'absolute',
    zIndex: 20,
    // width & left set dynamically
  },
});
