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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useTabBar } from '../../src/context/TabBarContext';
import { Ionicons } from '@expo/vector-icons';
// LinearGradient removed — headers use solid colors now
import { useAppTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../../src/services/storage';
import { useAuth } from '../../src/context/AuthContext';

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
}

export default function ChatScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { hideTabBar, showTabBar } = useTabBar();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const messagesEndRef = useRef<ScrollView>(null);

  const width = Dimensions.get('window').width;
  
  // Page colors (solid): primary used for headers, accent used for tabs
  const primaryColor = '#100e9aff';
  const accent = '#fcc22eff';

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

      const sellingConversations = formattedConversations.filter(
        (conv: Conversation) => conv.announcementOwnerId === userId
      );
      const buyingConversations = formattedConversations.filter(
        (conv: Conversation) => conv.announcementOwnerId !== userId
      );

      if (activeTab === 'selling') {
        setConversations(sellingConversations);
      } else {
        setConversations(buyingConversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

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
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permisiune', 'Trebuie să permiți accesul la fișiere pentru a selecta un document.');
          return;
        }
      }

      let DocumentPicker: any = null;
      try {
        // dynamic import to avoid build-time errors if not installed
        // If the package isn't installed TypeScript/node might complain at build time;
        // we ignore the type error here because this import is optional at runtime.
        // @ts-ignore
        // eslint-disable-next-line global-require
        DocumentPicker = await import('expo-document-picker');
      } catch (e) {
        Alert.alert('Lipsă dependență', 'Pentru a selecta fișiere instalează pachetul expo-document-picker: `expo install expo-document-picker`.');
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

  const getAvatarFallback = (name: string) => {
    const initial = name.slice(0, 1).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=355070&color=fff`;
  };

  const unreadConversations = conversations.filter((conv) => conv.unread);
  const readConversations = conversations.filter((conv) => !conv.unread);

  // If conversation is selected, show chat view
  if (selectedConversation) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: '#ffffff' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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

            <View style={styles.announcementRow}>
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
            </View>
          </View>

          <TouchableOpacity style={styles.moreBtn}>
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

                return (
                  <View key={message._id}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <Text style={styles.dateSeparatorText}>
                          {new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Message bubble */}
                    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                      <View 
                        style={[
                          styles.messageBubbleClean, 
                          isOwn
                            ? { backgroundColor: '#d1e7ff', marginLeft: 'auto', marginRight: 12 }
                            : { backgroundColor: '#f0f0f0', marginLeft: 12, marginRight: 'auto' }
                        ]}
                      >
                        {message.text && (
                          <Text style={[styles.messageTextClean, { color: '#1a1a1a' }]}>
                            {message.text}
                          </Text>
                        )}
                        {message.image && (
                          <Image source={{ uri: message.image }} style={styles.messageImage} resizeMode="cover" />
                        )}
                        <Text style={[styles.messageTimeClean, { color: '#888888' }]}>
                          {formatTime(message.createdAt)}
                        </Text>
                        {isOwn && (
                          <Ionicons
                            name="checkmark-done"
                            size={14}
                            color={message.isRead ? '#34B7F1' : '#888888'}
                            style={styles.tickIconClean}
                          />
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
    );
  }

  // Conversation list view
  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Header with solid primary color */}
      <View style={[styles.gradientHeader, { paddingTop: insets.top + 16, backgroundColor: primaryColor }]}> 
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>MESSAGES</Text>
            <TouchableOpacity style={styles.searchIconBtn}>
              <Ionicons name="search" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          {/* Horizontal Scrolling Avatars */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarScroll}
            style={{ marginTop: 16 }}
          >
            {conversations.slice(0, 8).map((conv, idx) => (
              <TouchableOpacity 
                key={conv.conversationId}
                onPress={() => setSelectedConversation(conv)}
                style={styles.storyAvatar}
              >
                <View style={styles.avatarWrapper}>
                  <Image 
                    source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }} 
                    style={styles.storyImage} 
                  />
                  {conv.unread && <View style={styles.onlineDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
  </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: tokens.colors.surface }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('buying')}
          style={[styles.tab, activeTab === 'buying' && { backgroundColor: accent }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'buying' ? '#fff' : tokens.colors.muted }]}>Cumpărare</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('selling')}
          style={[styles.tab, activeTab === 'selling' && { backgroundColor: accent }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'selling' ? '#fff' : tokens.colors.muted }]}>Vânzare</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
      >
        {loading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă conversațiile...</Text>
          </View>
        ) : (
          <>
            {/* Unread section */}
            {unreadConversations.length > 0 && (
              <>
                {unreadConversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.conversationId}
                    onPress={async () => {
                      setSelectedConversation(conv);
                      setConversations((prev) =>
                        prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, unread: false } : c))
                      );
                      try {
                        await api.put(`/api/messages/conversation/${conv.conversationId}/mark-read`);
                      } catch (e) {}
                    }}
                    style={[styles.conversationItem, { backgroundColor: tokens.colors.surface }]}
                  >
                    <View style={styles.avatarBadgeWrapper}>
                      <Image source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }} style={styles.avatar} />
                      {conv.unread && <View style={styles.unreadBadge} />}
                    </View>
                    <View style={styles.conversationContent}>
                      <View style={styles.convTopRow}>
                        <Text style={[styles.convName, { color: tokens.colors.text }]} numberOfLines={1}>
                          {conv.participantName}
                        </Text>
                        <Text style={[styles.convTime, { color: tokens.colors.muted }]}>{conv.time}</Text>
                      </View>
                      <Text style={[styles.convMessage, { color: tokens.colors.text, fontWeight: '600' }]} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                      <Text style={[styles.convSubtitle, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {conv.announcementTitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Read section */}
            {readConversations.length > 0 && (
              <>
                {readConversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.conversationId}
                    onPress={() => setSelectedConversation(conv)}
                    style={[styles.conversationItem, { backgroundColor: tokens.colors.surface }]}
                  >
                    <View style={styles.avatarBadgeWrapper}>
                      <Image source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }} style={styles.avatar} />
                    </View>
                    <View style={styles.conversationContent}>
                      <View style={styles.convTopRow}>
                        <Text style={[styles.convName, { color: tokens.colors.text }]} numberOfLines={1}>
                          {conv.participantName}
                        </Text>
                        <Text style={[styles.convTime, { color: tokens.colors.muted }]}>{conv.time}</Text>
                      </View>
                      <Text style={[styles.convMessage, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                      <Text style={[styles.convSubtitle, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {conv.announcementTitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {conversations.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={80} color={tokens.colors.placeholder} />
                <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>
                  {activeTab === 'buying' ? 'Nicio conversație de cumpărare' : 'Nicio conversație de vânzare'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Modern gradient header
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  // Horizontal avatar scroll
  avatarScroll: {
    paddingVertical: 4,
    gap: 16,
  },
  storyAvatar: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  storyImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Conversation list
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarBadgeWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F8B195',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8B195',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  conversationContent: {
    flex: 1,
    gap: 2,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  convMessage: {
    fontSize: 14,
    marginBottom: 2,
  },
  convSubtitle: {
    fontSize: 13,
  },
  convTime: {
    fontSize: 12,
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
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
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
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.5,
  },
  messageBubbleClean: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '75%',
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
  messageTimeClean: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
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
});
