import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Placeholder fetch function – replace with real API integration later
async function fetchNotifications(): Promise<NotificationItem[]> {
  return new Promise(resolve => setTimeout(() => resolve([]), 600));
}

interface NotificationItem {
  _id: string;
  senderName?: string;
  preview?: string;
  senderAvatar?: string | null;
  createdAt?: string;
  read?: boolean;
  link?: string;
}

export default function NotificationsScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <View style={[styles.notificationItem, {
        backgroundColor: item.read ? tokens.colors.surface : isDark ? 'rgba(245,24,102,0.08)' : 'rgba(53,80,112,0.06)',
        borderColor: item.read ? tokens.colors.border : tokens.colors.primary + '55'
      }]}>        
        <View style={styles.notificationMain}>
          {!item.read && <View style={[styles.unreadIndicator, { backgroundColor: tokens.colors.primary }]} />}
          {item.senderName ? (
            <Text style={[styles.senderName, { color: isDark ? '#fe85a4' : tokens.colors.primary }]}>{item.senderName}</Text>
          ) : null}
          <View style={styles.messageRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: item.senderAvatar || 'https://ui-avatars.com/api/?name=User&background=355070&color=fff&size=128' }} style={styles.avatar} />
            </View>
            <Text style={[styles.messageText, { color: tokens.colors.text }]} numberOfLines={3}>{item.preview || 'Nu există conținut.'}</Text>
          </View>
          <Text style={[styles.dateText, { color: tokens.colors.muted }]}>{item.createdAt ? new Date(item.createdAt).toLocaleString('ro-RO') : ''}</Text>
          {item.link && (
            <TouchableOpacity style={[styles.chatButton, { borderColor: tokens.colors.primary + '55', backgroundColor: isDark ? 'rgba(245,24,102,0.12)' : 'rgba(53,80,112,0.06)' }]} onPress={() => console.log('Open chat', item.link)}>
              <Text style={[styles.chatButtonText, { color: isDark ? '#ffdbe6' : tokens.colors.primary }]}>Deschide chat</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => console.log('Delete', item._id)}>
          <Ionicons name="trash-outline" size={20} color={tokens.colors.muted} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
  <View style={[styles.screen, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <View style={styles.header}>        
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]
          }
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Notificări</Text>
      </View>
      <View style={[styles.contentCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă notificările...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image source={require('../assets/images/gumballPeace.jpg')} style={styles.emptyImage} resizeMode="cover" />
            <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>Nu ai notificări noi.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 12,
  },
  contentCard: {
    flex: 1,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notificationMain: {
    flex: 1,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  messageText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 19,
  },
  dateText: {
    fontSize: 11,
    marginBottom: 8,
  },
  chatButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 40,
    alignItems: 'center',
  },
});
