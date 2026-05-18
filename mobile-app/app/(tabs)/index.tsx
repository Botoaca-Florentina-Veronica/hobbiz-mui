import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Platform, Dimensions, InteractionManager } from 'react-native';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useResponsive } from '../../src/theme/responsive';
import MobileHeader from '@/components/MobileHeader';
import LegalFooter from '@/components/LegalFooter';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useNotifications } from '../../src/context/NotificationContext';
import api from '../../src/services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '../../src/services/storage';
import { useLocale } from '../../src/context/LocaleContext';
import { rankSearchSuggestions, type SearchIndexItem } from '../../src/utils/search';
import { getHomeTranslations } from '../../src/i18n/home';


const categories = [
  { description: 'Fotografie', color: '#FF6B6B', image: require('../../assets/images/camera.png') },
  { description: 'Prajituri', color: '#4ECDC4', image: require('../../assets/images/bake.png') },
  { description: 'Muzica', color: '#45B7D1', image: require('../../assets/images/guitar.png') },
  { description: 'Reparații', color: '#96CEB4', image: require('../../assets/images/pipe.png') },
  { description: 'Dans', color: '#FFEAA7', image: require('../../assets/images/salsa.png') },
  { description: 'Curățenie', color: '#DDA0DD', image: require('../../assets/images/cleaning.png') },
  { description: 'Gradinarit', color: '#98D8C8', image: require('../../assets/images/gardening-logo.jpg') },
  { description: 'Sport', color: '#F7DC6F', image: require('../../assets/images/tennis.png') },
  { description: 'Arta', color: '#BB8FCE', image: require('../../assets/images/arta.png') },
  { description: 'Tehnologie', color: '#85C1E9', image: require('../../assets/images/laptop.png') },
  { description: 'Auto', color: '#F8C471', image: require('../../assets/images/car.png') },
  { description: 'Meditații', color: '#82E0AA', image: require('../../assets/images/carte.png') },
];

const HERO_PHONE_SOURCE = require('../../assets/images/imp.png');
const HERO_TABLET_SOURCE = require('../../assets/images/hobbiz-wide.png');
const HERO_PHONE_ASPECT_RATIO = 1.72;
const HERO_TABLET_ASPECT_RATIO = 1.5;

// Design colors
const DESIGN_BLUE = '#034e84ff';
// deep blue for announcement titles (matches mock)
const TITLE_BLUE = '#1a3b7eff';

// ==================== CONFIGURARE DIMENSIUNI IMAGINII HERO ====================
// Editează aceste valori pentru a schimba rapid dimensiunea imaginii principale
const HERO_IMAGE_CONFIG = {
  // Aspect ratio (lățime / înălțime) al imaginii
  aspectRatio: 1.5,
  
  // Înălțime minimă (px) - pentru telefoane mici
  minHeight: 260,
  
  // Înălțime maximă (px) - pentru dispozitive foarte mari
  maxHeight: 800,
  
  // Procent din înălțimea ecranului (0.34 = 34%)
  screenHeightPercent: 0.34,
  
  // Border radius (colțuri rotunjite)
  borderRadius: 16,
  
  // Padding orizontal (spațiu la margini)
  horizontalPadding: 24,
  // Suprascrieri specifice telefoanelor (opțional)
  phoneOverrides: {
    // Menține un raport landscape pe telefoane pentru a evita spațiile goale sus/jos
    aspectRatio: 1.5,
    minHeight: 220,
    screenHeightPercent: 0.30,
    // Mai puțin padding pe mobile pentru a profita de lățimea ecranului
    horizontalPadding: 16,
  },
};
// ============================================================================

export default function HomeScreen() {
  const POPULAR_STALE_MS = 120000;
  const SEARCH_INDEX_STALE_MS = 300000;
  const { tokens, isDark } = useAppTheme();
  // shared border style for inner container-like cards (used in popular cards)
  // In light mode: black border; in dark mode: white border
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0.5, borderColor: isDark ? '#ffffff' : '#000000' } as const;
  const { columnsForCategories, width: screenWidth, isPhone, isTablet, isLargeTablet, scale } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { unreadNotificationCount, refreshNotificationCount } = useNotifications();
  const [popular, setPopular] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [imageAspects, setImageAspects] = useState<Record<string, number>>({});
  const { locale } = useLocale();

  // Default aspect ratio (width / height) when image dimensions are not yet known.
  // Slightly portrait — matches typical announcement photos.
  const DEFAULT_POPULAR_ASPECT = 0.82;
  // Clamp range to avoid extreme card heights.
  const MIN_POPULAR_ASPECT = 0.6;  // taller than this -> too narrow / very tall card
  const MAX_POPULAR_ASPECT = 1.4;  // wider than this -> too flat card
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const searchSeqRef = useRef(0);
  const lastPopularLoadRef = useRef(0);
  const lastSearchIndexLoadRef = useRef(0);

  const t = getHomeTranslations(locale);

  // helper: convert hex #RRGGBB to rgba(r,g,b,a)
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    try {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
      return hex; // fallback
    }
  }, []);

  // Checkered background grid component for dark mode
  const checkeredBackground = React.useMemo(() => {
    if (!isDark) return null;
    
    return (
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
        pointerEvents="none"
      >
        {/* Create grid pattern using semi-transparent lines */}
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 32,
              height: 1,
              backgroundColor: 'rgba(79, 79, 79, 0.18)',
            }}
          />
        ))}
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * 32,
              width: 1,
              backgroundColor: 'rgba(79, 79, 79, 0.18)',
            }}
          />
        ))}
      </View>
    );
  }, [isDark]);



  const loadSearchIndex = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && searchIndex.length > 0 && now - lastSearchIndexLoadRef.current < SEARCH_INDEX_STALE_MS) {
      return;
    }
    try {
      const res = await api.get('/api/announcements/search-index?limit=800');
      const data = Array.isArray(res.data) ? res.data : [];
      setSearchIndex(data);
      lastSearchIndexLoadRef.current = now;
    } catch (e) {
      // Fallback to full fetch (older servers) so autocomplete keeps working.
      try {
        const res = await api.get('/api/announcements');
        const data = Array.isArray(res.data) ? res.data : [];
        setSearchIndex(data);
        lastSearchIndexLoadRef.current = now;
      } catch {
        setSearchIndex([]);
      }
    }
  }, [searchIndex.length]);

  const loadPopular = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && popular.length > 0 && now - lastPopularLoadRef.current < POPULAR_STALE_MS) {
      return;
    }
    setPopularLoading(true);
    try {
      // Fetch all announcements and sort client-side by favoritesCount desc, then createdAt desc
      const res = await api.get('/api/announcements');
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a: any, b: any) => {
        const fa = (a.favoritesCount || 0);
        const fb = (b.favoritesCount || 0);
        if (fb !== fa) return fb - fa;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPopular(data);
      lastPopularLoadRef.current = now;
    } catch (e) {
      setPopular([]);
    } finally {
      setPopularLoading(false);
    }
  }, [popular.length]);

  // Stable callbacks for MobileHeader to prevent re-renders on every keystroke
  const handleSearchChange = useCallback((text: string) => setSearchTerm(text), []);
  const handleSearchSubmit = useCallback((q: string) => {
    if (q && q.trim()) {
      router.push(`/all-announcements?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/all-announcements');
    }
  }, [router]);
  const handleSuggestionClick = useCallback((id: string) => {
    setSearchTerm('');
    setSearchResults([]);
    router.push(`/announcement-details?id=${id}`);
  }, [router]);
  const handleNotificationClick = useCallback(() => router.push('/notifications'), [router]);
  const handleSeeAll = useCallback(() => {
    try { router.push({ pathname: '/all-announcements' }); } catch (e) { router.push('/all-announcements'); }
  }, [router]);
  const handleCategoryPress = useCallback((description: string) => {
    router.push(`/category-announcements?category=${encodeURIComponent(description)}`);
  }, [router]);

  // Layout computations for popular grid — only recalculate on screen width change
  const popularLayout = useMemo(() => {
    const cols = screenWidth && screenWidth < 360 ? 1 : 2;
    const sectionPadding = 32; // popularSection padding (16 left + 16 right)
    const gap = 12;
    const cardWidth = Math.floor((Math.max(screenWidth || 360, 360) - sectionPadding - (cols - 1) * gap) / cols);
    return { cols, cardWidth, gap };
  }, [screenWidth]);

  // Pre-fetch image dimensions so we can build a stable masonry layout.
  // ExpoImage's onLoad will also fill in any aspects that this misses.
  useEffect(() => {
    const items = (Array.isArray(popular) ? popular : []).slice(0, 8);
    items.forEach((item: any) => {
      if (!item?._id) return;
      if (imageAspects[item._id] !== undefined) return;
      const url = item?.images?.[0];
      if (!url) return;
      Image.getSize(
        url,
        (w, h) => {
          if (w > 0 && h > 0) {
            setImageAspects(prev =>
              prev[item._id] !== undefined ? prev : { ...prev, [item._id]: w / h }
            );
          }
        },
        () => {
          // Failure: leave undefined, default aspect will be used.
        }
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popular]);

  // Masonry distribution: place each item into the currently shortest column.
  // Card height = image height (cardWidth / clampedAspect) + ~110px content area.
  const popularColumns = useMemo(() => {
    const { cols, cardWidth, gap } = popularLayout;
    const items: any[] = Array.isArray(popular) ? popular.slice(0, 8) : [];
    const result: any[][] = Array.from({ length: cols }, () => []);
    if (items.length === 0) return result;

    if (cols === 1) {
      result[0] = [...items];
      if (popular.length > 8) result[0].push({ _id: 'placeholder-show-all', placeholder: true });
      return result;
    }

    const heights = new Array(cols).fill(0);
    const estimateCardHeight = (item: any) => {
      const raw = imageAspects[item._id] ?? DEFAULT_POPULAR_ASPECT;
      const aspect = Math.max(MIN_POPULAR_ASPECT, Math.min(raw, MAX_POPULAR_ASPECT));
      const imgH = Math.round(cardWidth / aspect);
      return imgH + 110; // ≈ title + meta pills + details button + paddings
    };

    for (const item of items) {
      let minIdx = 0;
      for (let i = 1; i < cols; i++) if (heights[i] < heights[minIdx]) minIdx = i;
      result[minIdx].push(item);
      heights[minIdx] += estimateCardHeight(item) + gap;
    }

    if (popular.length > 8) {
      let minIdx = 0;
      for (let i = 1; i < cols; i++) if (heights[i] < heights[minIdx]) minIdx = i;
      result[minIdx].push({ _id: 'placeholder-show-all', placeholder: true });
    }

    return result;
  }, [popular, imageAspects, popularLayout]);

  const renderPopularCard = useCallback((item: any) => {
    const { cardWidth } = popularLayout;
    const rawAspect = imageAspects[item._id] ?? DEFAULT_POPULAR_ASPECT;
    const aspect = Math.max(MIN_POPULAR_ASPECT, Math.min(rawAspect, MAX_POPULAR_ASPECT));
    const computedImageHeight = Math.round(cardWidth / aspect);

    const cardBaseStyle = [
      styles.popularCard,
      {
        backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface,
        width: cardWidth,
        ...containerBorderStyle,
      },
    ];

    if (item && item.placeholder) {
      return (
        <TouchableOpacity
          key={item._id}
          activeOpacity={0.85}
          style={[...cardBaseStyle, { minHeight: 140 }]}
          onPress={handleSeeAll}
        >
          <View style={styles.placeholderBox}>
            <ThemedText style={[styles.placeholderText, { color: tokens.colors.primary }]}>
              {t.showAllAnnouncements}
            </ThemedText>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item._id}
        activeOpacity={0.9}
        style={cardBaseStyle}
        onPress={() => router.push(`/announcement-details?id=${item._id}`)}
      >
        <View style={[styles.popularImageWrap, { height: computedImageHeight }]}>
          <ExpoImage
            source={{ uri: item.images && item.images[0] ? item.images[0] : undefined }}
            style={styles.popularImage}
            contentFit="cover"
            transition={220}
            onLoad={(event: any) => {
              const w = event?.source?.width ?? 0;
              const h = event?.source?.height ?? 0;
              if (w > 0 && h > 0) {
                setImageAspects(prev =>
                  prev[item._id] !== undefined ? prev : { ...prev, [item._id]: w / h }
                );
              }
            }}
          />
        </View>
        <View style={styles.popularContent}>
          <ThemedText numberOfLines={2} style={[styles.popularLabel, { color: isDark ? '#c81553ff' : TITLE_BLUE }]}>
            {item.title || item.description || t.announcement}
          </ThemedText>
          {(item.location || item.createdAt) ? (
            <View style={styles.popularMetaRow}>
              {item.location ? (
                <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F2F4FF' }]}>
                  <ThemedText numberOfLines={1} style={[styles.metaPillText, { color: tokens.colors.muted }]}>
                    {item.location}
                  </ThemedText>
                </View>
              ) : null}
              {item.createdAt ? (
                <View style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F2F4FF' }]}>
                  <ThemedText numberOfLines={1} style={[styles.metaPillText, { color: tokens.colors.muted }]}>
                    {new Date(item.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/announcement-details?id=${item._id}`)}
            style={[styles.detailsButton, { backgroundColor: isDark ? '#f51866' : DESIGN_BLUE }]}
          >
            <ThemedText style={styles.detailsButtonText}>{t.seeDetails}</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [popularLayout, imageAspects, tokens, isDark, containerBorderStyle, router, t, handleSeeAll]);

  useFocusEffect(
    useCallback(() => {
      const interactionTask = InteractionManager.runAfterInteractions(() => {
        void refreshNotificationCount();
        // Keep back navigation smooth by scheduling list refreshes after transition animation.
        void loadPopular(false);
        void loadSearchIndex(false);
      });

      return () => {
        interactionTask.cancel();
      };
    }, [refreshNotificationCount, loadPopular, loadSearchIndex])
  );
  
  // Search effect with debounce (local fuzzy suggestions)
  useEffect(() => {
    const q = (searchTerm || '').trim();

    if (q.length >= 2) {
      setIsSearching(true);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      const mySeq = ++searchSeqRef.current;
      searchTimeoutRef.current = setTimeout(() => {
        if (mySeq !== searchSeqRef.current) return;

        // Prefer local fuzzy ranking over a cached index.
        if (searchIndex.length > 0) {
          const ranked = rankSearchSuggestions(searchIndex, q, { limit: 20 });
          setSearchResults(ranked);
          setIsSearching(false);
          return;
        }

        // If index isn't available, keep old behavior (server suggestions).
        (async () => {
          try {
            const res = await api.get(`/api/announcements/search?q=${encodeURIComponent(q)}`);
            if (mySeq !== searchSeqRef.current) return;
            setSearchResults(Array.isArray(res.data) ? res.data : []);
          } catch (error) {
            if (mySeq !== searchSeqRef.current) return;
            console.error('Error searching announcements:', error);
            setSearchResults([]);
          } finally {
            if (mySeq === searchSeqRef.current) setIsSearching(false);
          }
        })();
      }, 120);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchIndex]);

  return (
  <ThemedView style={[styles.container, { backgroundColor: isDark ? '#0b0b0b' : tokens.colors.bg, paddingTop: insets.top }]}> 
      {checkeredBackground}
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <MobileHeader
        notificationCount={unreadNotificationCount}
        searchValue={searchTerm}
        searchSuggestions={searchResults}
        showSuggestions={searchTerm.trim().length >= 2}
        isSearching={isSearching}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSuggestionClick={handleSuggestionClick}
        onCategoryClick={handleCategoryPress}
        onNotificationClick={handleNotificationClick}
      />
  <View style={[styles.mainContent, { backgroundColor: isDark ? 'transparent' : tokens.colors.surface, zIndex: 1 }]}> 
          {
            t.mainTitle ? (
              (() => {
                // Determină dimensiunea titlului în mod responsive
                // Slightly smaller sizes to make the headline unimportant
                const titleSize = isPhone ? Math.round(scale(20)) : isTablet ? Math.round(scale(30)) : isLargeTablet ? Math.round(scale(40)) : Math.round(scale(24));
                return (
                  <ThemedText style={[styles.mainText, { color: tokens.colors.text, fontSize: titleSize, fontWeight: '800', lineHeight: Math.round(titleSize * 1.05) }]}> 
                    {t.mainTitle}
                  </ThemedText>
                );
              })()
            ) : null
          }
          {(() => {
            // Calculăm dimensiunile imaginii hero folosind configurația de mai sus
            const window = Dimensions.get('window');
            const screenH = window.height || 800;

            // Aplicăm suprascrierile pentru telefoane dacă sunt definite
            const cfg = isPhone && HERO_IMAGE_CONFIG.phoneOverrides && Object.keys(HERO_IMAGE_CONFIG.phoneOverrides).length
              ? { ...HERO_IMAGE_CONFIG, ...HERO_IMAGE_CONFIG.phoneOverrides }
              : HERO_IMAGE_CONFIG;

            const heroSource = isPhone ? HERO_PHONE_SOURCE : HERO_TABLET_SOURCE;
            const assetAspectRatio = isPhone ? HERO_PHONE_ASPECT_RATIO : HERO_TABLET_ASPECT_RATIO;

            const availableWidth = Math.max(320, (screenWidth || 360) - cfg.horizontalPadding);

            // Calculăm înălțimea pe baza lățimii și aspect ratio
            const heightFromWidth = Math.round(availableWidth / assetAspectRatio);
            // Calculăm înălțimea pe baza procentului din înălțimea ecranului
            const heightFromScreen = Math.round(screenH * cfg.screenHeightPercent);

            // Alegem înălțimea mai mare dintre cele două, apoi aplicăm limitele min/max
            let calculatedHeight = Math.max(heightFromWidth, heightFromScreen);
            calculatedHeight = Math.max(
              cfg.minHeight,
              Math.min(calculatedHeight, cfg.maxHeight)
            );

            // Calculăm lățimea finală păstrând aspect ratio-ul
            let imageWidth = Math.min(availableWidth, Math.round(calculatedHeight * assetAspectRatio));
            const imageHeight = Math.round(imageWidth / assetAspectRatio);

            const heroWidth = imageWidth;
            const heroHeight = imageHeight;
            return (
              <View style={[styles.mainHeroWrap, { width: heroWidth, height: heroHeight, marginTop: 0, marginBottom: 8 }]}>
                <Image
                  // Afișăm `imp.png` pe telefoane și `hobbiz-wide.png` pe tablete
                  source={heroSource}
                  style={{ 
                    width: heroWidth,
                    height: heroHeight,
                    borderRadius: cfg.borderRadius,
                  }}
                  resizeMode="contain"
                />
              </View>
            );
          })()}
          {t.ctaText ? (
            <View style={[styles.callToAction, { backgroundColor: tokens.colors.surface }]}> 
              {(() => {
                // Use same bold style as the main title, slightly smaller
                const ctaSize = isPhone ? Math.round(scale(18)) : isTablet ? Math.round(scale(30)) : isLargeTablet ? Math.round(scale(40)) : Math.round(scale(22));
                return (
                  <ThemedText style={[styles.ctaText, { color: tokens.colors.text, fontSize: ctaSize, fontWeight: '800', lineHeight: Math.round(ctaSize * 1.05) }]}> 
                    {t.ctaText}
                  </ThemedText>
                );
              })()}
            </View>
          ) : null}
        </View>

  {/* Popular announcements */}
  <View style={[styles.popularSection, { backgroundColor: isDark ? 'transparent' : tokens.colors.surface, zIndex: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText style={[styles.popularTitle, { color: tokens.colors.text }]}>{t.popularTitle}</ThemedText>
            <TouchableOpacity
              onPress={handleSeeAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <ThemedText style={{ color: tokens.colors.primary }}>{t.seeAll}</ThemedText>
            </TouchableOpacity>
          </View>
          {popularLoading ? (
            <ThemedText style={{ color: tokens.colors.muted }}>{t.loading}</ThemedText>
          ) : (
            <View style={{ flexDirection: 'row', gap: popularLayout.gap, paddingVertical: 4 }}>
              {popularColumns.map((column, colIdx) => (
                <View key={`popular-col-${colIdx}`} style={{ flex: 1, gap: popularLayout.gap }}>
                  {column.map(item => renderPopularCard(item))}
                </View>
              ))}
            </View>
          )}
        </View>

  <View style={[styles.categoriesSection, { backgroundColor: isDark ? 'transparent' : tokens.colors.surface, zIndex: 1 }]}>
          <ThemedText style={[styles.categoriesTitle, { color: tokens.colors.text }]}>
            {t.exploreCategories}
          </ThemedText>
          {(() => {
            const minCardWidth = 140;
            const gap = 12;
            const horizontalPadding = 32; // padding from section container (16 + 16)
            const avail = Math.max(screenWidth || 360, 320) - horizontalPadding;
            const tentative = Math.floor((avail + gap) / (minCardWidth + gap));
            const maxPossibleCols = Math.max(1, Math.min(tentative, 6));
            const minCols = (screenWidth || 0) >= 400 ? 3 : 1;

            // Build candidate cols range between minCols and maxPossibleCols
            const candidates: number[] = [];
            for (let c = minCols; c <= maxPossibleCols; c++) candidates.push(c);

            // Prefer the largest candidate that divides the total number of categories
            let cols = minCols;
            const totalItems = categories.length;
            if (candidates.length === 1) {
              cols = candidates[0];
            } else {
              const divisors = candidates.filter(c => totalItems % c === 0);
              if (divisors.length) {
                cols = Math.max(...divisors);
              } else {
                // If none divides evenly, pick candidate that minimizes leftover (tie -> larger cols)
                let best = candidates[0];
                let bestRem = totalItems % best;
                for (const c of candidates) {
                  const rem = totalItems % c;
                  if (rem < bestRem || (rem === bestRem && c > best)) { best = c; bestRem = rem; }
                }
                cols = best;
              }
            }

            const cardWidth = Math.floor((avail - (cols - 1) * gap) / cols);
            return (
              <View style={[styles.categoriesGrid, { gap }]}> 
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: tokens.colors.surface,
                        borderColor: tokens.colors.border,
                        width: cardWidth,
                      },
                    ]}
                    onPress={() => handleCategoryPress(category.description)}
                  >
                    {/* Gradient fade background overlay (theme-aware intensity) */}
                    <LinearGradient
                      colors={[
                        // Higher opacity in light mode, softer in dark mode
                        hexToRgba(category.color, isDark ? 0.18 : 0.35),
                        hexToRgba(category.color, isDark ? 0.08 : 0.15),
                        hexToRgba(category.color, 0),
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
                    />
                    <View style={[styles.imageContainer, { backgroundColor: 'transparent' }]}>
                      <Image 
                        source={category.image} 
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    </View>
                    <ThemedText style={[styles.categoryLabel, { color: tokens.colors.muted }]}>
                      {t && (t.categories && t.categories[index]) ? t.categories[index] : category.description}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}
        </View>

  {/* Legal Footer (hide 'Legal' section in Explore) */}
  <LegalFooter hideLegalSection />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Keep extra bottom padding so the last category cards are not hidden by the floating tab bar
  scrollContent: { paddingBottom: 120 },
  mainContent: {
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  mainImagePlaceholder: {
    width: '100%',
    maxWidth: 280,
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
  },
  mainHeroImage: {
    width: '100%',
    height: '100%',
  },
  mainHeroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  callToAction: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 17,
    textAlign: 'center',
  },
  categoriesSection: {
    padding: 16,
    // No bottom margin: we want the page to end right after this section
    marginBottom: 0,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 60,
    width: 60,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  categoryImage: {
    width: 50,
    height: 50,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  popularSection: {
    padding: 16,
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  popularCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // soft elevation for modern card feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  popularImageWrap: {
    width: '100%',
    // height is computed dynamically per card
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },

  /* star button removed */
  popularImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fafafa',
    resizeMode: 'cover' as any,
  },
  popularContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  popularLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  popularMetaText: {
    fontSize: 11,
    lineHeight: 14,
  },
  popularMetaRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  metaPillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 8,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 11.5,
    letterSpacing: 0.1,
  },
});

