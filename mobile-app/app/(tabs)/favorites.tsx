import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  images?: string[];
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string };
}

export default function FavoritesScreen() {
  const { tokens } = useAppTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/api/favorites');
      setFavorites(res.data?.favorites || []);
    } catch (e) {
      console.error('Error fetching favorites:', e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (id: string) => {
    try {
      await api.delete(`/api/favorites/${id}`);
      setFavorites(prev => prev.filter(f => f._id !== id));
    } catch (e) {
      console.error('Error removing favorite:', e);
    }
  };

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads')) return `${api.defaults.baseURL}${img}`;
    return `${api.defaults.baseURL}/uploads/${img.replace(/^.*[\\/]/, '')}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă favorite...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
        <Ionicons name="heart-outline" size={64} color={tokens.colors.placeholder} />
        <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>Autentifică-te</Text>
        <Text style={[styles.emptyMessage, { color: tokens.colors.muted }]}>Pentru a vedea anunțurile tale favorite</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: tokens.colors.bg, borderBottomColor: tokens.colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Favorite</Text>
        </View>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: tokens.colors.text }]}>Anunțuri favorite ({favorites.length}/150)</Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={tokens.colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>Niciun favorit</Text>
            <Text style={[styles.emptyMessage, { color: tokens.colors.muted }]}>Explorează anunțurile și adaugă-le la favorite</Text>
          </View>
        ) : (
          favorites.map((ann) => {
            const firstImage = ann.images?.[0] ? getImageSrc(ann.images[0]) : null;
            const sellerName = ann.user ? `${ann.user.firstName || ''} ${ann.user.lastName || ''}`.trim() : 'Anonim';
            return (
              <TouchableOpacity
                key={ann._id}
                style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                onPress={() => router.push(`/announcement-details?id=${ann._id}`)}
                activeOpacity={0.8}
              >
                {/* Image */}
                <View style={styles.cardImageWrapper}>
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: tokens.colors.elev }]}>
                      <Ionicons name="image-outline" size={32} color={tokens.colors.placeholder} />
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardDate, { color: tokens.colors.muted }]}>
                      Postat {new Date(ann.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { color: tokens.colors.text }]} numberOfLines={2}>{ann.title}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: tokens.colors.elev }]}>
                    <Text style={[styles.categoryText, { color: tokens.colors.primary }]}>{ann.category}</Text>
                  </View>
                  <Text style={[styles.cardSeller, { color: tokens.colors.primary }]}>{sellerName}</Text>
                </View>

                {/* Favorite button */}
                <TouchableOpacity
                  onPress={() => handleRemoveFavorite(ann._id)}
                  style={styles.favoriteButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart" size={22} color="#E0245E" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyMessage: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '600' },
  subtitleContainer: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 12, gap: 12 },
  cardImageWrapper: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, justifyContent: 'space-between' },
  cardHeader: { marginBottom: 4 },
  cardDate: { fontSize: 11, fontWeight: '500' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  cardSeller: { fontSize: 13, fontWeight: '600' },
  favoriteButton: { position: 'absolute', top: 12, right: 12 },
});
