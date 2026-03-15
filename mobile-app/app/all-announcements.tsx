import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import api from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { translateCategory, getCategoryKeyByLabel } from '../src/constants/categories';
import { getAllAnnouncementsTranslations } from '../src/i18n/all-announcements';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  price?: number;
  images?: string[];
  createdAt: string;
  description?: string;
  user?: { _id: string; firstName?: string; lastName?: string };
}


export default function AllAnnouncements() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getAllAnnouncementsTranslations(locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTwoColumn = width > 700;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();
  const qParam = (params.q as string) || '';
  const [searchTerm, setSearchTerm] = useState(qParam || '');

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      const data = Array.isArray(res.data) ? res.data : [];
      // sort by views (desc) then createdAt desc
      data.sort((a: any, b: any) => {
        const av = (a.views || a.viewsCount || 0);
        const bv = (b.views || b.viewsCount || 0);
        if (bv !== av) return bv - av;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(data);
    } catch (e) {
      console.error('Error loading announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    if (qParam && qParam !== searchTerm) setSearchTerm(qParam);
  }, [qParam]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length === 0) return announcements;
    const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return announcements.filter((a) => {
      const title = (a.title || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const hay = `${title} ${desc}`;
      return words.every(w => hay.includes(w));
    });
  }, [announcements, searchTerm]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }, [fetchAnnouncements]);

  const renderAnnouncement = useCallback(({ item: ann }: { item: Announcement }) => {
    const firstImage = ann.images?.[0] ? getImageSrc(ann.images[0]) : null;
    const categoryKey = getCategoryKeyByLabel(ann.category);
    const translatedCategory = categoryKey ? translateCategory(categoryKey, locale) : ann.category;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/announcement-details?id=${ann._id}`)}
        style={[
          styles.card,
          isTwoColumn ? styles.cardTwoColumn : styles.cardMobile,
          styles.cardSpacing,
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
            <View style={[
              styles.cardImagePlaceholder,
              { backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0' }
            ]}>
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
              <View style={[
                styles.categoryBadge,
                { backgroundColor: isDark ? 'rgba(245, 24, 102, 0.9)' : 'rgba(245, 24, 102, 0.85)' }
              ]}>
                <Text style={styles.categoryText}>
                  {translatedCategory.toUpperCase()}
                </Text>
              </View>
              {ann.location && (
                <View style={[
                  styles.locationBadge,
                  { backgroundColor: isDark ? 'rgba(40, 40, 40, 0.9)' : 'rgba(50, 50, 50, 0.85)' }
                ]}>
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
        </View>
      </TouchableOpacity>
    );
  }, [isTwoColumn, isDark, locale, router]);

  const getItemLayout = useCallback((_: ArrayLike<Announcement> | null | undefined, index: number) => {
    const cardHeight = isTwoColumn ? 280 : 220;
    const rowIndex = isTwoColumn ? Math.floor(index / 2) : index;
    const rowHeight = cardHeight + 16; // spacing
    return { length: rowHeight, offset: rowHeight * rowIndex, index };
  }, [isTwoColumn]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000000' : '#ffffff', paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={isDark ? '#f51866' : tokens.colors.primary} />
        <ThemedText style={[styles.loadingText, { color: isDark ? '#8b8b8b' : tokens.colors.muted }]}>{t.loading}</ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
                {t.title}
              </ThemedText>
            </View>
            <ThemedText style={[styles.countBadge, { color: isDark ? '#f51866' : '#E0245E' }]}>
              {filteredAnnouncements.length}
            </ThemedText>
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={(item) => item._id}
          renderItem={renderAnnouncement}
          numColumns={isTwoColumn ? 2 : 1}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          columnWrapperStyle={isTwoColumn ? styles.columnWrapper : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#f51866' : tokens.colors.primary}
            />
          }
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          getItemLayout={getItemLayout}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={64} color={isDark ? '#3f3f3f' : tokens.colors.placeholder} />
              <ThemedText style={[styles.emptyTitle, { color: isDark ? '#ffffff' : tokens.colors.text }]}>
                {t.noAnnouncements}
              </ThemedText>
            </View>
          }
        />
      </View>
    </>
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
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 60, 
    paddingHorizontal: 24 
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 16 
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
    paddingBottom: 24, 
    paddingTop: 0,
  },
  columnWrapper: { justifyContent: 'space-between' },
  cardSpacing: { marginBottom: 16 },
  
  // Card Design (Image Overlay Style)
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
});

