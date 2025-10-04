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
import { Ionicons } from '@expo/vector-icons';
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
        style={[styles.container, { backgroundColor: tokens.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View
          style={[
            styles.chatHeader,
            { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
            style={styles.headerAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: tokens.colors.text }]}>{selectedConversation.participantName}</Text>
            <Text style={[styles.headerStatus, { color: tokens.colors.muted }]}>
              {formatLastSeen(selectedConversation.lastSeen)}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
              <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă mesajele...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.placeholder} />
              <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>Nicio conversație încă. Scrie primul mesaj!</Text>
            </View>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === userId;
              return (
                <View key={message._id} style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                  <View style={[styles.messageBubble, isOwn ? { backgroundColor: tokens.colors.primary } : { backgroundColor: tokens.colors.surface }]}>
                    {message.text && (
                      <Text style={[styles.messageText, { color: isOwn ? '#fff' : tokens.colors.text }]}>{message.text}</Text>
                    )}
                    {message.image && (
                      <Image source={{ uri: message.image }} style={styles.messageImage} resizeMode="cover" />
                    )}
                    <Text style={[styles.messageTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : tokens.colors.muted }]}>
                      {formatTime(message.createdAt)}
                    </Text>
                    {isOwn && (
                      <Ionicons
                        name="checkmark-done"
                        size={16}
                        color={message.isRead ? '#34B7F1' : 'rgba(255,255,255,0.7)'}
                        style={styles.tickIcon}
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: tokens.colors.elev, color: tokens.colors.text }]}
            placeholder="Scrie mesajul tău..."
            placeholderTextColor={tokens.colors.placeholder}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={[styles.sendBtn, { backgroundColor: tokens.colors.primary, opacity: newMessage.trim() ? 1 : 0.5 }]}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversation list view
  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Chat</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { paddingHorizontal: 16 }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('buying')}
          style={[styles.tab, activeTab === 'buying' && { backgroundColor: tokens.colors.primary }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'buying' ? '#fff' : tokens.colors.muted }]}>De cumpărat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('selling')}
          style={[styles.tab, activeTab === 'selling' && { backgroundColor: tokens.colors.primary }]}
        >
          <Text style={[styles.tabText, { color: activeTab === 'selling' ? '#fff' : tokens.colors.muted }]}>De vândut</Text>
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
                <View style={[styles.section, { borderBottomColor: tokens.colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: tokens.colors.text }]}>NECITITE</Text>
                </View>
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
                    style={[styles.conversationItem, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                  >
                    <Image source={{ uri: conv.avatar || getAvatarFallback(conv.name) }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.convOwner, { color: tokens.colors.muted }]}>{conv.announcementOwnerName}</Text>
                      <Text style={[styles.convTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                        {conv.announcementTitle}
                      </Text>
                      <Text style={[styles.convMessage, { color: tokens.colors.text, fontWeight: '700' }]} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                    </View>
                    <Text style={[styles.convTime, { color: tokens.colors.muted }]}>{conv.time}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {unreadConversations.length === 0 && (
              <View style={[styles.emptySection, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>
                <Text style={[styles.sectionLabel, { color: tokens.colors.text, marginBottom: 8 }]}>NECITITE</Text>
                <Text style={{ color: tokens.colors.muted, fontSize: 14 }}>🎉 Ești la zi!</Text>
              </View>
            )}

            {/* Read section */}
            {readConversations.length > 0 && (
              <>
                <View style={[styles.section, { borderBottomColor: tokens.colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: tokens.colors.text }]}>CITITE ({readConversations.length})</Text>
                </View>
                {readConversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.conversationId}
                    onPress={() => setSelectedConversation(conv)}
                    style={[styles.conversationItem, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                  >
                    <Image source={{ uri: conv.avatar || getAvatarFallback(conv.name) }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.convOwner, { color: tokens.colors.muted }]}>{conv.announcementOwnerName}</Text>
                      <Text style={[styles.convTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                        {conv.announcementTitle}
                      </Text>
                      <Text style={[styles.convMessage, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                    </View>
                    <Text style={[styles.convTime, { color: tokens.colors.muted }]}>{conv.time}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerBackBtn: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  emptySection: { marginHorizontal: 16, marginVertical: 12, padding: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  conversationItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginHorizontal: 12, marginBottom: 6, borderRadius: 12, borderWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#355070' },
  convOwner: { fontSize: 12, marginBottom: 2 },
  convTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  convMessage: { fontSize: 13 },
  convTime: { fontSize: 12, alignSelf: 'flex-start' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#355070' },
  headerName: { fontSize: 16, fontWeight: '600' },
  headerStatus: { fontSize: 13, marginTop: 2 },
  messagesContainer: { flex: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  messageRowOwn: { alignSelf: 'flex-end' },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: '100%' },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 6 },
  messageTime: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  tickIcon: { position: 'absolute', bottom: 8, right: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
