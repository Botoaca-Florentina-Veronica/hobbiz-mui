import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, View, StyleSheet, RefreshControl } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import api from '@/src/services/api';

type Announcement = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  name?: string;
  body?: string;
  createdAt?: string;
};

export default function HomeScreen() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/api/announcements');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load announcements', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/announcements');
        if (mounted) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to load announcements', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchAnnouncements]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAnnouncements();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.center}>
          <ThemedText>Nu s-au găsit anunțuri.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item._id || item.id || item.createdAt || JSON.stringify(item))}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <ThemedView style={styles.item}>
              <ThemedText type="subtitle">{item.title || item.name || 'Untitled'}</ThemedText>
              <ThemedText numberOfLines={3}>{item.description || item.body || ''}</ThemedText>
            </ThemedView>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
});
