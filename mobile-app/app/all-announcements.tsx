import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  TextInput,
  Pressable,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { translateCategory, getCategoryKeyByLabel, CATEGORY_DEFS } from '../src/constants/categories';
import { getSearchTranslations } from '../src/i18n/search';
import { addRecentSearch, getRecentSearches } from '../src/services/searchHistory';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  price?: number;
  images?: string[];
  createdAt: string;
  description?: string;
  views?: number;
  viewsCount?: number;
  user?: { _id: string; firstName?: string; lastName?: string };
}

type SortMode = 'relevance' | 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

const ACCENT_PINK = '#F51866';
const SKELETON_COUNT = 6;

const TIME_AGO = (date: string, locale: string): string => {
  try {
    const diff = Date.now() - new Date(date).getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (locale === 'en') {
      if (sec < 60) return 'just now';
      if (min < 60) return `${min}m`;
      if (hr < 24) return `${hr}h`;
      if (day < 7) return `${day}d`;
      return new Date(date).toLocaleDateString('en-GB');
    }
    if (locale === 'es') {
      if (sec < 60) return 'ahora';
      if (min < 60) return `${min}m`;
      if (hr < 24) return `${hr}h`;
      if (day < 7) return `${day}d`;
      return new Date(date).toLocaleDateString('es-ES');
    }
    if (sec < 60) return 'acum';
    if (min < 60) return `${min} min`;
    if (hr < 24) return `${hr} h`;
    if (day < 7) return `${day} z`;
    return new Date(date).toLocaleDateString('ro-RO');
  } catch {
    return '';
  }
};

// ============================================================================
// SkeletonCard — animated placeholder shown while data is loading
// ============================================================================
const SkeletonCard = React.memo(({ isDark, cardWidth }: { isDark: boolean; cardWidth: number }) => {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const blockColor = isDark ? '#1f1f1f' : '#EAECEF';
  const lineColor = isDark ? '#262626' : '#DFE2E7';

  return (
    <View style={[styles.skeletonCard, { width: cardWidth, backgroundColor: isDark ? '#141414' : '#ffffff' }]}>
      <Animated.View style={[styles.skeletonImage, { backgroundColor: blockColor, opacity: pulse }]} />
      <View style={styles.skeletonBody}>
        <Animated.View style={[styles.skeletonLine, { width: '85%', backgroundColor: lineColor, opacity: pulse }]} />
        <Animated.View style={[styles.skeletonLine, { width: '55%', marginTop: 6, backgroundColor: lineColor, opacity: pulse }]} />
        <View style={{ flex: 1 }} />
        <Animated.View style={[styles.skeletonLine, { width: '40%', height: 14, backgroundColor: lineColor, opacity: pulse }]} />
        <Animated.View style={[styles.skeletonLine, { width: '70%', marginTop: 6, height: 10, backgroundColor: lineColor, opacity: pulse }]} />
      </View>
    </View>
  );
});
SkeletonCard.displayName = 'SkeletonCard';

// ============================================================================
// FavoriteButton — heart toggle with optimistic UI + pop animation
// ============================================================================
interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: () => void;
}
const FavoriteButton = React.memo(({ isFavorited, onToggle }: FavoriteButtonProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(isFavorited);

  useEffect(() => {
    if (prev.current !== isFavorited) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]).start();
      prev.current = isFavorited;
    }
  }, [isFavorited, scale]);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.favoriteButton,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorited ? ACCENT_PINK : '#ffffff'}
        />
      </Animated.View>
    </Pressable>
  );
});
FavoriteButton.displayName = 'FavoriteButton';

// ============================================================================
// ResultCard — grid card (2 col on phones, 3 col on tablets)
// ============================================================================
interface ResultCardProps {
  ann: Announcement;
  isDark: boolean;
  locale: string;
  tokens: any;
  cardWidth: number;
  isFavorited: boolean;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const ResultCard = React.memo(({ ann, isDark, locale, tokens, cardWidth, isFavorited, onPress, onToggleFavorite }: ResultCardProps) => {
  const firstImage = ann.images?.[0];
  const categoryKey = getCategoryKeyByLabel(ann.category);
  const translatedCategory = categoryKey ? translateCategory(categoryKey, locale) : ann.category;
  const timeText = TIME_AGO(ann.createdAt, locale);

  const handlePress = useCallback(() => onPress(ann._id), [ann._id, onPress]);
  const handleFavorite = useCallback(() => onToggleFavorite(ann._id), [ann._id, onToggleFavorite]);

  const priceLabel = useMemo(() => {
    if (ann.price === undefined || ann.price === null) return null;
    if (ann.price === 0) return locale === 'en' ? 'Free' : locale === 'es' ? 'Gratis' : 'Gratuit';
    return `${ann.price.toLocaleString(locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'ro-RO')} RON`;
  }, [ann.price, locale]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          backgroundColor: isDark ? '#141414' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EDEFF3',
        },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.cardImageWrap}>
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: isDark ? '#262626' : '#F4F5F7' }]}>
            <Ionicons name="image-outline" size={40} color={isDark ? '#555' : '#bdbdbd'} />
          </View>
        )}

        <FavoriteButton isFavorited={isFavorited} onToggle={handleFavorite} />

        {translatedCategory ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {translatedCategory}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <ThemedText style={[styles.cardTitle, { color: tokens.colors.text }]} numberOfLines={2}>
          {ann.title}
        </ThemedText>

        <View style={{ flex: 1 }} />

        {priceLabel !== null && (
          <ThemedText style={[styles.priceText, { color: tokens.colors.primary }]} numberOfLines={1}>
            {priceLabel}
          </ThemedText>
        )}

        <View style={styles.cardMetaRow}>
          {ann.location ? (
            <>
              <Ionicons name="location-outline" size={11} color={tokens.colors.muted} />
              <ThemedText style={[styles.metaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                {ann.location}
              </ThemedText>
            </>
          ) : null}
          {timeText ? (
            <>
              {ann.location ? <Text style={[styles.metaDot, { color: tokens.colors.muted }]}>·</Text> : null}
              <ThemedText style={[styles.metaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                {timeText}
              </ThemedText>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
ResultCard.displayName = 'ResultCard';

// ============================================================================
// AllAnnouncements — main screen
// ============================================================================
export default function AllAnnouncements() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const t = getSearchTranslations(locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Grid sizing
  const numColumns = width >= 900 ? 3 : 2;
  const HORIZONTAL_PADDING = 16;
  const GAP = 12;
  const cardWidth = useMemo(
    () => Math.floor((width - HORIZONTAL_PADDING * 2 - GAP * (numColumns - 1)) / numColumns),
    [width, numColumns]
  );

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const params = useLocalSearchParams();
  const qParam = (params.q as string) || '';
  const categoryParam = (params.category as string) || '';

  const [searchTerm, setSearchTerm] = useState(qParam || '');
  const [editingQuery, setEditingQuery] = useState(qParam || '');
  const [editMode, setEditMode] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [sort, setSort] = useState<SortMode>('relevance');
  const [popularSuggestions, setPopularSuggestions] = useState<string[]>([]);

  // Header scroll fade
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerShadowOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const getImageSrc = useCallback((img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      const data = Array.isArray(res.data) ? res.data : [];
      setAnnouncements(data);
    } catch (e) {
      console.error('Error loading announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const res = await api.get('/api/favorites');
      const list = res.data?.favorites || [];
      const ids = new Set<string>(list.map((a: any) => a._id).filter(Boolean));
      setFavoriteIds(ids);
    } catch (e) {
      // Silent — favorites are best-effort UX
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  useEffect(() => {
    if (qParam !== undefined && qParam !== searchTerm) {
      setSearchTerm(qParam);
      setEditingQuery(qParam);
    }
  }, [qParam]);

  useEffect(() => {
    void (async () => {
      const recents = await getRecentSearches();
      if (recents.length > 0) {
        setPopularSuggestions(recents.slice(0, 6));
      } else {
        setPopularSuggestions(CATEGORY_DEFS.slice(0, 6).map((c) => translateCategory(c.key, locale)));
      }
    })();
  }, [locale]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = announcements;

    if (categoryParam && categoryParam.trim().length > 0) {
      const target = categoryParam.toLowerCase();
      list = list.filter((a) => (a.category || '').toLowerCase() === target);
    }

    if (searchTerm && searchTerm.trim().length > 0) {
      const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const words = normalize(searchTerm).trim().split(/\s+/).filter(Boolean);
      list = list.filter((a) => {
        const hay = normalize(`${a.title || ''} ${a.description || ''} ${a.category || ''} ${a.location || ''}`);
        return words.every((w) => hay.includes(w));
      });
    }

    const sorted = [...list];
    switch (sort) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'priceAsc':
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case 'priceDesc':
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case 'relevance':
      default:
        sorted.sort((a, b) => {
          const av = a.views || a.viewsCount || 0;
          const bv = b.views || b.viewsCount || 0;
          if (bv !== av) return bv - av;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
    }
    return sorted;
  }, [announcements, searchTerm, categoryParam, sort]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAnnouncements(), fetchFavorites()]);
    setRefreshing(false);
  }, [fetchAnnouncements, fetchFavorites]);

  const handleCardPress = useCallback((id: string) => {
    router.push(`/announcement-details?id=${id}`);
  }, [router]);

  const handleToggleFavorite = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      Alert.alert(
        locale === 'en' ? 'Login required' : locale === 'es' ? 'Inicia sesión' : 'Autentifică-te',
        locale === 'en' ? 'Log in to save favorites.' : locale === 'es' ? 'Inicia sesión para guardar favoritos.' : 'Conectează-te pentru a salva favorite.',
        [
          { text: locale === 'en' ? 'Cancel' : locale === 'es' ? 'Cancelar' : 'Anulează', style: 'cancel' },
          { text: 'OK', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    const wasFavorited = favoriteIds.has(id);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (wasFavorited) {
        await api.delete(`/api/favorites/${id}`);
      } else {
        await api.post(`/api/favorites/${id}`);
      }
    } catch (e) {
      // Revert on error
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }, [favoriteIds, isAuthenticated, locale, router]);

  const renderItem = useCallback(({ item }: { item: Announcement }) => (
    <ResultCard
      ann={{ ...item, images: item.images?.map((i) => getImageSrc(i) || i).filter(Boolean) as string[] }}
      isDark={isDark}
      locale={locale}
      tokens={tokens}
      cardWidth={cardWidth}
      isFavorited={favoriteIds.has(item._id)}
      onPress={handleCardPress}
      onToggleFavorite={handleToggleFavorite}
    />
  ), [isDark, locale, tokens, cardWidth, favoriteIds, handleCardPress, handleToggleFavorite, getImageSrc]);

  // Search editing
  const submitEdit = useCallback(async () => {
    const q = editingQuery.trim();
    setSearchTerm(q);
    setEditMode(false);
    if (q.length > 0) await addRecentSearch(q);
  }, [editingQuery]);

  const startEdit = useCallback(() => {
    setEditMode(true);
    setEditingQuery(searchTerm);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchTerm]);

  const clearSearch = useCallback(() => {
    setEditingQuery('');
    inputRef.current?.focus();
  }, []);

  const handleSuggestionTap = useCallback((s: string) => {
    setSearchTerm(s);
    setEditingQuery(s);
  }, []);

  const filterChips: { key: SortMode; label: string; icon?: keyof typeof Ionicons.glyphMap }[] = useMemo(() => [
    { key: 'relevance', label: t.filterAll, icon: 'sparkles-outline' },
    { key: 'newest', label: t.filterNewest, icon: 'time-outline' },
    { key: 'oldest', label: t.filterOldest },
    { key: 'priceAsc', label: t.filterPriceAsc },
    { key: 'priceDesc', label: t.filterPriceDesc },
  ], [t]);

  const accent = tokens.colors.primary;
  const surfaceColor = tokens.colors.bg;
  const subtleSurface = isDark ? '#1a1a1a' : '#F2F4F7';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E6E8EE';
  const text = tokens.colors.text;
  const muted = tokens.colors.muted;

  // Header context line ("for X" / "in category Y")
  const contextLabel = useMemo(() => {
    if (searchTerm.length > 0) return `${t.resultsFor} "${searchTerm}"`;
    if (categoryParam) {
      const key = getCategoryKeyByLabel(categoryParam);
      return key ? translateCategory(key, locale) : categoryParam;
    }
    return '';
  }, [searchTerm, categoryParam, locale, t]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: surfaceColor }]}>
        {/* Header */}
        <Animated.View
          style={[
            styles.headerWrap,
            {
              paddingTop: insets.top + 8,
              backgroundColor: surfaceColor,
              borderBottomColor: borderColor,
              shadowOpacity: Platform.OS === 'ios' ? headerShadowOpacity : 0,
            },
          ]}
        >
          {/* Top row: back + search + filter */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconBtn, { backgroundColor: subtleSurface }]}
              activeOpacity={0.7}
              hitSlop={6}
            >
              <Ionicons name="chevron-back" size={22} color={text} />
            </TouchableOpacity>

            {editMode ? (
              <View style={[styles.searchEditBar, { backgroundColor: subtleSurface, borderColor: accent }]}>
                <Ionicons name="search" size={18} color={accent} style={{ marginRight: 8 }} />
                <TextInput
                  ref={inputRef}
                  value={editingQuery}
                  onChangeText={setEditingQuery}
                  onSubmitEditing={submitEdit}
                  onBlur={submitEdit}
                  returnKeyType="search"
                  placeholder={t.placeholder}
                  placeholderTextColor={muted}
                  style={[styles.searchEditInput, { color: text }]}
                  autoFocus
                  autoCorrect={false}
                />
                {editingQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} hitSlop={8} style={{ paddingLeft: 6 }}>
                    <View style={[styles.clearCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)' }]}>
                      <Ionicons name="close" size={13} color={isDark ? '#fff' : '#333'} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Pressable
                onPress={startEdit}
                style={({ pressed }) => [
                  styles.searchPill,
                  { backgroundColor: subtleSurface, borderColor },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="search" size={18} color={muted} style={{ marginRight: 8 }} />
                <ThemedText style={[styles.searchPillText, { color: searchTerm ? text : muted }]} numberOfLines={1}>
                  {searchTerm || t.placeholder}
                </ThemedText>
              </Pressable>
            )}
          </View>

          {/* Title + result count */}
          {!loading && (
            <View style={styles.titleBlock}>
              <ThemedText style={[styles.bigTitle, { color: text }]} numberOfLines={1}>
                {t.resultsCount(filtered.length)}
              </ThemedText>
              {contextLabel ? (
                <ThemedText style={[styles.contextLabel, { color: muted }]} numberOfLines={1}>
                  {contextLabel}
                </ThemedText>
              ) : null}
            </View>
          )}

          {/* Filter chips */}
          {!loading && filtered.length > 0 && (
            <FlatList
              data={filterChips}
              horizontal
              keyExtractor={(it) => it.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRowContent}
              style={styles.chipRow}
              renderItem={({ item }) => {
                const active = sort === item.key;
                return (
                  <TouchableOpacity
                    onPress={() => setSort(item.key)}
                    activeOpacity={0.85}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? accent : subtleSurface,
                        borderColor: active ? accent : borderColor,
                      },
                    ]}
                  >
                    {item.icon && (
                      <Ionicons
                        name={item.icon}
                        size={13}
                        color={active ? '#fff' : muted}
                        style={{ marginRight: 5 }}
                      />
                    )}
                    <ThemedText style={[styles.chipText, { color: active ? '#fff' : text }]}>
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Animated.View>

        {/* Body */}
        {loading ? (
          <View style={[styles.skeletonGrid, { paddingHorizontal: HORIZONTAL_PADDING }]}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonCard key={i} isDark={isDark} cardWidth={cardWidth} />
            ))}
          </View>
        ) : (
          <Animated.FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            numColumns={numColumns}
            key={`cols-${numColumns}`}
            columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(120, insets.bottom + 100), paddingHorizontal: HORIZONTAL_PADDING },
            ]}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
            }
            removeClippedSubviews
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={9}
            updateCellsBatchingPeriod={50}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: subtleSurface }]}>
                  <Ionicons name="search-outline" size={44} color={muted} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: text }]}>{t.emptyStateTitle}</ThemedText>
                {searchTerm.length > 0 && (
                  <ThemedText style={[styles.emptyQuery, { color: muted }]} numberOfLines={1}>
                    “{searchTerm}”
                  </ThemedText>
                )}
                <ThemedText style={[styles.emptyHint, { color: muted }]}>{t.emptyStateHint}</ThemedText>

                {popularSuggestions.length > 0 && (
                  <View style={styles.suggestionsBlock}>
                    <ThemedText style={[styles.suggestionsTitle, { color: muted }]}>
                      {t.suggestedSearches}
                    </ThemedText>
                    <View style={styles.suggestionChipsWrap}>
                      {popularSuggestions.map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => handleSuggestionTap(s)}
                          activeOpacity={0.75}
                          style={[styles.suggestionChip, { backgroundColor: subtleSurface, borderColor }]}
                        >
                          <ThemedText style={[styles.suggestionChipText, { color: text }]}>{s}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // === Header ===
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchPillText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  searchEditBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchEditInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // === Title block ===
  titleBlock: {
    marginTop: 14,
    marginBottom: 2,
  },
  bigTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  contextLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  // === Chips ===
  chipRow: {
    marginTop: 12,
    marginHorizontal: -16,
  },
  chipRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // === List ===
  listContent: {
    paddingTop: 14,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // === Card (grid) ===
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  cardImageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
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
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    maxWidth: '78%',
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 11,
    minHeight: 96,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 1,
  },

  // === Skeleton ===
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  skeletonCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
  },
  skeletonBody: {
    padding: 11,
    minHeight: 96,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
  },

  // === Empty state ===
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  emptyQuery: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyHint: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  suggestionsBlock: {
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  suggestionChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
