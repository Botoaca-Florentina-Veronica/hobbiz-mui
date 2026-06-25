import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '../../src/context/TabBarContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuestModeRestriction } from '../../src/components/GuestModeRestriction';
import { useAuth } from '../../src/context/AuthContext';
import { useChatNotifications } from '../../src/context/ChatNotificationContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useLocale } from '../../src/context/LocaleContext';
import { getChatTranslations } from '../../src/i18n/chat';

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

const getAvatarFallback = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.slice(0, 1).toUpperCase())}&background=355070&color=fff`;

interface ConversationItemProps {
  conv: Conversation;
  isDark: boolean;
  tokens: any;
  onPress: (conv: Conversation) => void;
}

const ACCENT = '#F51866';
const ONLINE_GREEN = '#22C55E';

const ConversationItem = React.memo(({ conv, isDark, tokens, onPress }: ConversationItemProps) => {
  const handlePress = useCallback(() => onPress(conv), [conv, onPress]);
  const isUnread = !!conv.unread;
  const count = conv.unreadCount ?? 0;
  const showCount = isUnread && count > 1;

  // Subtle pulse animation on the unread indicator (loops while unread).
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isUnread) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.16, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isUnread, pulse]);

  // Brief "fresh message" highlight: when conv becomes unread, fade the row's bg gently.
  const fresh = useRef(new Animated.Value(0)).current;
  const wasUnreadRef = useRef(isUnread);
  useEffect(() => {
    if (isUnread && !wasUnreadRef.current) {
      fresh.setValue(1);
      Animated.timing(fresh, {
        toValue: 0,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
    wasUnreadRef.current = isUnread;
  }, [isUnread, fresh]);

  // "Online" if lastSeen within last 2 minutes.
  const isOnline = useMemo(() => {
    const ls = conv.otherParticipant?.lastSeen;
    if (!ls) return false;
    const t = new Date(ls).getTime();
    return !isNaN(t) && Date.now() - t < 2 * 60 * 1000;
  }, [conv.otherParticipant?.lastSeen]);

  const avatarUri = conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName);
  const freshBg = fresh.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(245, 24, 102, 0)',
      isDark ? 'rgba(245, 24, 102, 0.10)' : 'rgba(245, 24, 102, 0.07)',
    ],
  });

  return (
    <Animated.View style={{ backgroundColor: freshBg }}>
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
        style={({ pressed }) => [
          styles.conversationRow,
          pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
        ]}
      >
        {isUnread && <View style={[styles.accentBar, { backgroundColor: ACCENT }]} />}

        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.avatarRing,
              { borderColor: isUnread ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') },
            ]}
          >
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </View>
          {isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: tokens.colors.bg }]} />
          )}
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.name,
                { color: tokens.colors.text },
                isUnread && styles.nameUnread,
              ]}
              numberOfLines={1}
            >
              {conv.participantName}
            </Text>
            <Text
              style={[
                styles.time,
                { color: isUnread ? ACCENT : tokens.colors.muted },
                isUnread && styles.timeUnread,
              ]}
            >
              {conv.time}
            </Text>
          </View>

          <View style={styles.midRow}>
            <Text
              style={[
                styles.snippet,
                { color: isUnread ? tokens.colors.text : tokens.colors.muted },
                isUnread && styles.snippetUnread,
              ]}
              numberOfLines={1}
            >
              {conv.lastMessage}
            </Text>

            {isUnread && (
              <Animated.View style={{ transform: [{ scale: pulse }], marginLeft: 8 }}>
                {showCount ? (
                  <View style={[styles.countBadge, { backgroundColor: ACCENT }]}>
                    <Text style={styles.countBadgeText}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.singleDot, { backgroundColor: ACCENT }]} />
                )}
              </Animated.View>
            )}
          </View>

          {conv.announcementTitle ? (
            <View style={styles.bottomRow}>
              <Ionicons name="pricetag-outline" size={11} color={tokens.colors.muted} style={{ marginRight: 4 }} />
              <Text style={[styles.topic, { color: tokens.colors.muted }]} numberOfLines={1}>
                {conv.announcementTitle}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default function ChatScreen() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getChatTranslations(locale);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { showTabBar } = useTabBar();
  const { refreshUnreadCount, setUnreadCount } = useChatNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationFilter, setConversationFilter] = useState<'selling' | 'buying'>('buying');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const lastUnreadCountRef = useRef<number>(-1);

  const width = Dimensions.get('window').width;
  const gumballChat = require('../../assets/images/gumballChat.jpg');

  const hexToRgba = useCallback((hex: string, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const handleConversationPress = useCallback((conv: Conversation) => {
    setConversations(prev => prev.map(c =>
      c.conversationId === conv.conversationId ? { ...c, unread: false, unreadCount: 0 } : c
    ));
    router.push({
      pathname: '/conversation',
      params: {
        conversationId: conv.conversationId,
        senderName: conv.participantName,
        senderAvatar: conv.participantAvatar,
        senderId: conv.otherParticipant.id,
        announcementTitle: conv.announcementTitle,
        announcementId: conv.announcementId,
        announcementOwnerId: conv.announcementOwnerId,
        announcementImage: conv.avatar,
        unread: conv.unread ? 'true' : 'false',
        unreadCount: conv.unreadCount ? conv.unreadCount.toString() : '0',
      },
    });
  }, [router]);

  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Check incoming route params to auto-redirect to conversation page
  const routeParams = useLocalSearchParams();
  useEffect(() => {
    if (!userId) return;
    const routeConversationId = (routeParams as any)?.conversationId;
    const ownerId = (routeParams as any)?.announcementOwnerId;

    if (routeConversationId || ownerId) {
        // Redirect to the new conversation page
        router.replace({
            pathname: '/conversation',
            params: routeParams as any
        });
    }
  }, [JSON.stringify(routeParams), userId]);

  const resolveAvatarUrl = useCallback((src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
    const path = cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
    return `${base}${path}`;
  }, []);

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
        const lastMsgType = conv.lastMessage?.messageType;
        const lastMsgRaw = conv.lastMessage?.text || '';
        const lastMessageText =
          lastMsgType === 'collaboration_request' || lastMsgRaw === 'COLLABORATION_REQUEST'
            ? `🤝 ${t.collaborationRequest}`
            : lastMsgType === 'negotiation'
            ? `💰 ${t.negotiationOffer}`
            : lastMsgType === 'booking_request'
            ? `📅 ${t.bookingRequest}`
            : lastMsgRaw;

        return {
          id: conv.otherParticipant.id,
          conversationId: conv.conversationId,
          name: resolvedAnnouncementTitle,
          avatar: announcementImg || participantAvatar || '',
          participantName,
          participantAvatar,
          announcementTitle: resolvedAnnouncementTitle,
          announcementOwnerName,
          lastMessage: lastMessageText,
          time: new Date(conv.lastMessage.createdAt).toLocaleString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unread: conv.unread,
          unreadCount: conv.unreadCount || 0,
          otherParticipant: conv.otherParticipant,
          lastSeen: conv.otherParticipant.lastSeen,
          announcementOwnerId: conv.announcementOwnerId,
          announcementId: conv.announcementId,
        };
      });
      setConversations(formattedConversations);
      
      try {
        const localTotal = formattedConversations.reduce((acc: number, c: Conversation) => acc + (c.unreadCount ?? (c.unread ? 1 : 0)), 0);
        if (localTotal !== lastUnreadCountRef.current) {
            setUnreadCount(localTotal);
            lastUnreadCountRef.current = localTotal;
        }
      } catch {}
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

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      refreshUnreadCount();
      showTabBar();
    }, [showTabBar, fetchConversations, refreshUnreadCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const unreadConversations = conversations.filter((conv) => conv.unread);
  const readConversations = conversations.filter((conv) => !conv.unread);
  const sellingConversations = conversations.filter((conv) => conv.announcementOwnerId === userId);
  const buyingConversations = conversations.filter((conv) => conv.announcementOwnerId !== userId);
  const filteredConversations = conversationFilter === 'selling' ? sellingConversations : buyingConversations;
  const totalConversations = conversations.length;
  
  // Calculate unread counts per category
  const buyingUnreadCount = buyingConversations.reduce((acc, conv) => acc + (conv.unreadCount || (conv.unread ? 1 : 0)), 0);
  const sellingUnreadCount = sellingConversations.reduce((acc, conv) => acc + (conv.unreadCount || (conv.unread ? 1 : 0)), 0);

  return (
    <ProtectedRoute>
      <GuestModeRestriction allowedRoutes={[]}>
        <View style={[styles.listContainer, { backgroundColor: tokens.colors.bg }]}> 
      <LinearGradient
        colors={
          isDark
            ? ['#f51866', '#00000000']
            : [
                tokens.colors.primary || '#355070',
                hexToRgba(tokens.colors.primary || '#355070', 0.75),
                tokens.colors.bg || '#ffffff',
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.listHeaderGradient, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.listHeaderTopRow}>
          <View>
            <ThemedText style={styles.listHeaderTitle}>{t.messages} ({totalConversations})</ThemedText>
            <ThemedText style={styles.listHeaderSubtitle}>{t.continueConversations}</ThemedText>
          </View>
        </View>

        <View style={styles.filterSegment}>
          {(['buying', 'selling'] as const).map((filterKey) => {
            const unreadCount = filterKey === 'buying' ? buyingUnreadCount : sellingUnreadCount;
            const hasUnread = unreadCount > 0;
            
            return (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterButton,
                  conversationFilter === filterKey && styles.filterButtonActive,
                  hasUnread && conversationFilter !== filterKey && styles.filterButtonWithBadge,
                ]}
                activeOpacity={0.85}
                onPress={() => setConversationFilter(filterKey)}
              >
                {hasUnread && conversationFilter !== filterKey && (
                  <View style={styles.filterButtonPulse} />
                )}
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    conversationFilter === filterKey && styles.filterButtonTextActive,
                  ]}
                >
                  {filterKey === 'buying' ? t.buying : t.selling}
                </ThemedText>
                {hasUnread && (
                  <View style={[
                    styles.filterBadge,
                    conversationFilter === filterKey && styles.filterBadgeActive
                  ]}>
                    <ThemedText style={[
                      styles.filterBadgeText,
                      conversationFilter === filterKey && styles.filterBadgeTextActive
                    ]}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <View style={[styles.listContentWrapper, { backgroundColor: 'transparent', marginTop: 0, paddingTop: 0 }]}>
        {loading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? tokens.colors.primary : '#355070'} />
            <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>{t.loadingConversations}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.conversationId}
            renderItem={({ item }) => (
              <ConversationItem
                conv={item}
                isDark={isDark}
                tokens={tokens}
                onPress={handleConversationPress}
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.itemSeparator, { backgroundColor: tokens.colors.border }]} />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(104, insets.bottom + 40) }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? tokens.colors.primary : '#355070'}
              />
            }
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={12}
            ListEmptyComponent={
              <View style={styles.chatEmptyMain}>
                <View style={styles.chatEmptyIcon}>
                  <Image
                    source={gumballChat}
                    style={{ width: Math.min(160, width * 0.6), height: Math.min(320, width * 0.6), borderRadius: 8 }}
                    resizeMode="contain"
                  />
                </View>
                <ThemedText style={[styles.chatEmptyText, { color: tokens.colors.text }]}>{t.noConversations} </ThemedText>
                <ThemedText style={[styles.chatEmptySubtitle, { color: tokens.colors.muted }]}>{t.startWriting}</ThemedText>
              </View>
            }
          />
        )}
      </View>
    </View>
      </GuestModeRestriction>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
  },
  filterButtonWithBadge: {
    shadowColor: '#F51866',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#F51866',
    opacity: 0.3,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F51866',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    zIndex: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#355070',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBadgeTextActive: {
    color: '#ffffff',
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
    paddingTop: 4,
  },
  // === Conversation row (modern, elegant) ===
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    backgroundColor: ONLINE_GREEN,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: -0.2,
  },
  nameUnread: {
    fontWeight: '800',
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeUnread: {
    fontWeight: '700',
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  snippet: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
  },
  snippetUnread: {
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  singleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topic: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  itemSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 90,
    marginRight: 16,
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
  chatEmptyMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  chatEmptyIcon: {
    marginBottom: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmptyText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -55,
  },
  chatEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

