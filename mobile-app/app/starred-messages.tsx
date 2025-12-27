import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../src/services/storage';
import { useAuth } from '../src/context/AuthContext';
import { useLocale } from '../src/context/LocaleContext';
import { Ionicons } from '@expo/vector-icons';

const TRANSLATIONS = {
  ro: {
    title: 'Mesaje cu stea',
    image: 'Imagine',
    message: 'Mesaj',
    noMessages: 'Nu ai mesaje salvate cu stea.',
    error: 'Eroare',
    loadError: 'Nu s-au putut încărca mesajele favorite.',
  },
  en: {
    title: 'Starred Messages',
    image: 'Image',
    message: 'Message',
    noMessages: 'You have no saved starred messages.',
    error: 'Error',
    loadError: 'Could not load favorite messages.',
  },
};

export default function StarredMessagesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { tokens } = useAppTheme();
  const { user } = useAuth();
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const raw = await storage.getItemAsync(`starredMessages:${user.id}`);
      const list = raw ? JSON.parse(raw) : [];
      setItems(list.reverse());
    } catch (err) {
      console.error('Failed loading starred messages', err);
      Alert.alert(t.error, t.loadError);
    }
  }, [user?.id, t.error, t.loadError]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(
    React.useCallback(() => {
      load();
      return () => {};
    }, [load])
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image source={{ uri: item.image || undefined }} style={styles.thumb} />
      </View>
      <View style={styles.center}>
        <ThemedText style={styles.text} numberOfLines={2}>{item.text || (item.image ? t.image : t.message)}</ThemedText>
        <ThemedText style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</ThemedText>
      </View>
      <TouchableOpacity style={styles.action} onPress={async () => {
        // remove
        try {
          if (!user?.id) return;
          const raw = await storage.getItemAsync(`starredMessages:${user.id}`);
          const list = raw ? JSON.parse(raw) : [];
          const updated = list.filter((s: any) => String(s._id) !== String(item._id));
          await storage.setItemAsync(`starredMessages:${user.id}`, JSON.stringify(updated));
          setItems(updated.reverse());
        } catch (err) {
          console.error('Remove starred error', err);
        }
      }}>
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, backgroundColor: tokens.colors.bg }] }>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t.title}</ThemedText>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ThemedText style={{ color: '#666' }}>{t.noMessages}</ThemedText>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  left: { marginRight: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f2f2f2' },
  center: { flex: 1 },
  text: { fontSize: 15, color: '#222' },
  meta: { fontSize: 12, color: '#888', marginTop: 6 },
  action: { padding: 8 },
});

