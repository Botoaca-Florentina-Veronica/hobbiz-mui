import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFavoritesCount } from '../../src/context/FavoritesContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLocale } from '../../src/context/LocaleContext';
import api from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { GuestModeRestriction } from '../../src/components/GuestModeRestriction';
import { translateCategory, getCategoryKeyByLabel } from '../../src/constants/categories';
import { getFavoritesTranslations } from '../../src/i18n/favorites';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  price?: number;
  images?: string[];
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string };
}


export default function FavoritesScreen() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getFavoritesTranslations(locale);
  // Dark-mode palette (from attachment): use only these surface tints + pink primary and white for contrast
  const darkPalette = {
    bg: '#121212', // a10
    surface: '#282828', // a20
    elev: '#3f3f3f', // a30 (elevated surface)
    border: '#575757', // a40
    placeholder: '#717171', // a50
    muted: '#8b8b8b', // a60
    text: '#FFFFFF',
    primary: '#f51866', // tint a10 (accent)
    // Pink tints for accents/gradients
    pink2: '#fa4875', // a20
    pink3: '#fe6585', // a30
    pink4: '#ff7e95', // a40
    pink5: '#ff96a6', // a50
    pink6: '#ffabb7', // a60
  } as const;
  const colors = isDark ? darkPalette : tokens.colors;
  const { isAuthenticated } = useAuth();
  const { incrementFavoritesCount, decrementFavoritesCount, setFavoritesCount } = useFavoritesCount();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTwoColumn = width > 700;

  const [favorites, setFavorites] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Track items removed during this session (they should remain visible but button updates)
  const [removedFavorites, setRemovedFavorites] = useState<Set<string>>(new Set());
  // Track IDs currently being processed to disable button / show spinner
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/api/favorites');
      const list = res.data?.favorites || [];
      setFavorites(list);
      // reset local optimistic state on fresh fetch
      setRemovedFavorites(new Set());
      setRemovingIds(new Set());
      // Sync the global tab-bar badge to the authoritative server count
      setFavoritesCount(list.length);
    } catch (e) {
      console.error('Error fetching favorites:', e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setFavoritesCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  // Fetch favorites only when screen comes into focus (user navigates to this tab)
  // This allows removed items to stay visible until page refresh or navigation away
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  // Toggle: if currently removed (user previously unfavorited in this session),
  // re-add to favorites. Otherwise, remove. The item stays visible in either
  // case until the next page refresh / focus-effect.
  const handleToggleFavorite = async (id: string) => {
    const wasRemoved = removedFavorites.has(id);

    setRemovingIds(prev => new Set(Array.from(prev).concat(id)));

    // Optimistic local update so the heart icon flips immediately
    setRemovedFavorites(prev => {
      const next = new Set(prev);
      if (wasRemoved) next.delete(id); else next.add(id);
      return next;
    });

    // Sync the global tab-bar badge optimistically
    if (wasRemoved) incrementFavoritesCount(); else decrementFavoritesCount();

    try {
      if (wasRemoved) {
        await api.post(`/api/favorites/${id}`);
      } else {
        await api.delete(`/api/favorites/${id}`);
      }
    } catch (e) {
      console.error('Error toggling favorite:', e);
      // revert optimistic update on failure
      setRemovedFavorites(prev => {
        const next = new Set(prev);
        if (wasRemoved) next.add(id); else next.delete(id);
        return next;
      });
      if (wasRemoved) decrementFavoritesCount(); else incrementFavoritesCount();
      try { Alert.alert('Error', 'Could not update favorite.'); } catch (_) {}
    } finally {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#ffffff', paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={isDark ? '#f51866' : tokens.colors.primary} />
        <ThemedText style={[styles.loadingText, { color: isDark ? '#8b8b8b' : tokens.colors.muted }]}>{t.loading}</ThemedText>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#000000' : '#ffffff', paddingTop: insets.top }]}>
        <Ionicons name="heart-outline" size={64} color={isDark ? '#3f3f3f' : tokens.colors.placeholder} />
        <ThemedText style={[styles.emptyTitle, { color: isDark ? '#ffffff' : tokens.colors.text }]}>{t.loginRequired}</ThemedText>
        <ThemedText style={[styles.emptyMessage, { color: isDark ? '#8b8b8b' : tokens.colors.muted }]}>{t.loginMessage}</ThemedText>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: isDark ? '#f51866' : tokens.colors.primary }]}
          onPress={() => router.replace('/login')}
        >
          <ThemedText style={{ color: '#ffffff', fontWeight: '600' }}>{t.goToLogin}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <GuestModeRestriction allowedRoutes={[]}>
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
      {/* Header */}
      <View style={[styles.header, { 
        paddingTop: insets.top + 12, 
        backgroundColor: isDark ? '#000000' : '#ffffff',
        borderBottomWidth: 0
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backButton, { 
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                borderWidth: 0
              }]}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#ffffff' : tokens.colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: isDark ? '#ffffff' : tokens.colors.text }]}>
              {t.favorites}
            </ThemedText>
          </View>
          <ThemedText style={[styles.countBadge, { color: isDark ? '#f51866' : '#E0245E' }]}>
            {favorites.length - removedFavorites.size}/150
          </ThemedText>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTwoColumn && styles.scrollContentTwoColumn
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDark ? '#f51866' : tokens.colors.primary} 
          />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={require('../../assets/images/gumballSiDarwin.png')} 
              style={styles.emptyImage} 
              resizeMode="contain" 
            />
            <ThemedText style={[styles.emptyTitle, { color: isDark ? '#ffffff' : tokens.colors.text }]}>
              {t.noFavorites}
            </ThemedText>
            <ThemedText style={[styles.emptyMessage, { color: isDark ? '#8b8b8b' : tokens.colors.muted }]}>
              {t.noFavoritesMessage}
            </ThemedText>
          </View>
        ) : (
          favorites.map((ann) => {
            const firstImage = ann.images?.[0] ? getImageSrc(ann.images[0]) : null;
            const categoryKey = getCategoryKeyByLabel(ann.category);
            const translatedCategory = categoryKey ? translateCategory(categoryKey, locale) : ann.category;

            return (
              <TouchableOpacity
                key={ann._id}
                activeOpacity={0.9}
                onPress={() => router.push(`/announcement-details?id=${ann._id}`)}
                style={[
                  styles.card,
                  isTwoColumn ? styles.cardTwoColumn : styles.cardMobile
                ]}
              >
                {/* Image Background */}
                <View style={styles.imageContainer}>
                  {firstImage ? (
                    <Image 
                      source={{ uri: firstImage }} 
                      style={styles.cardImage} 
                      resizeMode="cover" 
                    />
                  ) : (
                    <View style={[styles.cardImagePlaceholder, { 
                      backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' 
                    }]}>
                      <Ionicons 
                        name="image-outline" 
                        size={64} 
                        color={isDark ? '#3f3f3f' : '#bdbdbd'} 
                      />
                    </View>
                  )}
                  
                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                    style={styles.gradientOverlay}
                  />

                  {/* Content Over Image */}
                  <View style={styles.cardContent}>
                    {/* Category Badge */}
                    <View style={styles.categoryContainer}>
                      <View style={[styles.categoryBadge, { 
                        backgroundColor: isDark ? 'rgba(245, 24, 102, 0.9)' : 'rgba(245, 24, 102, 0.85)'
                      }]}>
                        <Text style={styles.categoryText}>
                          {translatedCategory.toUpperCase()}
                        </Text>
                      </View>
                      {ann.location && (
                        <View style={[styles.locationBadge, { 
                          backgroundColor: isDark ? 'rgba(40, 40, 40, 0.9)' : 'rgba(50, 50, 50, 0.85)'
                        }]}>
                          <Text style={styles.locationText}>
                            {ann.location.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {ann.title}
                    </Text>
                  </View>

                  {/* Favorite Button */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(ann._id);
                    }}
                    style={styles.favoriteButton}
                    activeOpacity={0.7}
                    disabled={removingIds.has(ann._id)}
                  >
                    {removingIds.has(ann._id) ? (
                      <ActivityIndicator size="small" color="#f51866" />
                    ) : (
                      <Ionicons
                        name={removedFavorites.has(ann._id) ? 'heart-outline' : 'heart'}
                        size={22}
                        color={removedFavorites.has(ann._id) ? (isDark ? '#ffffff' : '#9e9e9e') : '#f51866'}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
      </GuestModeRestriction>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 24 
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 60, 
    paddingHorizontal: 24 
  },
  emptyImage: { 
    width: 220, 
    height: 180, 
    marginTop: 28, 
    marginBottom: -52 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 16 
  },
  emptyMessage: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8 
  },
  header: { 
    paddingHorizontal: 16, 
    paddingBottom: 16
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700',
    letterSpacing: 0.3
  },
  countBadge: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingBottom: 104, 
    gap: 16 
  },
  scrollContentTwoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // New Card Design (Image Overlay Style)
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 280,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardTwoColumn: {
    width: '48.5%',
  },
  cardMobile: {
    height: 220,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  locationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  loginButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
