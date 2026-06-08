import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import { getSearchTranslations } from '../src/i18n/search';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../src/services/searchHistory';
import { CATEGORY_DEFS, translateCategory } from '../src/constants/categories';

interface SearchSuggestion {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  price?: number;
  images?: string[];
}

interface MobileHeaderProps {
  notificationCount?: number;
  onSearchSubmit?: (query: string) => void;
  onSearchChange?: (query: string) => void;
  onNotificationClick?: () => void;
  onSuggestionClick?: (id: string) => void;
  onCategoryClick?: (categoryKey: string) => void;
  searchValue?: string;
  searchSuggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  isSearching?: boolean;
}

// Highlight matched portion of a string in bold. Case + diacritics insensitive.
function highlightMatch(text: string, query: string, baseColor: string, accentColor: string) {
  const q = (query || '').trim();
  if (!q || !text) {
    return (
      <ThemedText style={[styles.suggestionTitle, { color: baseColor }]} numberOfLines={1}>
        {text}
      </ThemedText>
    );
  }
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const haystack = normalize(text);
  const needle = normalize(q);
  const idx = haystack.indexOf(needle);
  if (idx < 0) {
    return (
      <ThemedText style={[styles.suggestionTitle, { color: baseColor }]} numberOfLines={1}>
        {text}
      </ThemedText>
    );
  }
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <ThemedText style={[styles.suggestionTitle, { color: baseColor }]} numberOfLines={1}>
      {before}
      <ThemedText style={[styles.suggestionTitle, styles.suggestionTitleMatch, { color: accentColor }]}>
        {match}
      </ThemedText>
      {after}
    </ThemedText>
  );
}

export default function MobileHeader({
  notificationCount = 0,
  onNotificationClick,
  onSearchSubmit,
  onSearchChange,
  onSuggestionClick,
  onCategoryClick,
  searchValue,
  searchSuggestions = [],
  showSuggestions = false,
  isSearching = false,
}: MobileHeaderProps) {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getSearchTranslations(locale);
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Sync external value (so parent can reset)
  useEffect(() => {
    if (searchValue !== undefined && searchValue !== query) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  const loadRecents = useCallback(async () => {
    const list = await getRecentSearches();
    setRecents(list);
  }, []);

  useEffect(() => { void loadRecents(); }, [loadRecents]);

  const openModal = useCallback(() => {
    setModalVisible(true);
    void loadRecents();
    // Defer focus so the modal animation can settle
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [loadRecents]);

  const closeModal = useCallback(() => {
    Keyboard.dismiss();
    setModalVisible(false);
  }, []);

  const submitSearch = useCallback(async (raw: string) => {
    const q = (raw || '').trim();
    if (q.length > 0) {
      await addRecentSearch(q);
      void loadRecents();
    }
    Keyboard.dismiss();
    setModalVisible(false);
    if (onSearchSubmit) onSearchSubmit(q);
  }, [onSearchSubmit, loadRecents]);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (onSearchChange) onSearchChange(text);
  }, [onSearchChange]);

  const handleClear = useCallback(() => {
    setQuery('');
    if (onSearchChange) onSearchChange('');
    inputRef.current?.focus();
  }, [onSearchChange]);

  const handleRecentPress = useCallback((q: string) => {
    setQuery(q);
    if (onSearchChange) onSearchChange(q);
    void submitSearch(q);
  }, [onSearchChange, submitSearch]);

  const handleRemoveRecent = useCallback(async (q: string) => {
    await removeRecentSearch(q);
    void loadRecents();
  }, [loadRecents]);

  const handleClearAllRecents = useCallback(async () => {
    await clearRecentSearches();
    setRecents([]);
  }, []);

  const handleCategoryPress = useCallback((key: string) => {
    Keyboard.dismiss();
    setModalVisible(false);
    if (onCategoryClick) onCategoryClick(key);
  }, [onCategoryClick]);

  const handleSuggestionPress = useCallback(async (id: string) => {
    const q = (query || '').trim();
    if (q.length > 0) await addRecentSearch(q);
    Keyboard.dismiss();
    setModalVisible(false);
    if (onSuggestionClick) onSuggestionClick(id);
  }, [query, onSuggestionClick]);

  const hasQuery = query.trim().length > 0;
  const hasLiveResults = showSuggestions && hasQuery && query.trim().length >= 2;

  const accent = tokens.colors.primary;
  const surface = tokens.colors.surface;
  const border = tokens.colors.border;
  const text = tokens.colors.text;
  const muted = tokens.colors.muted;
  const bg = tokens.colors.bg;
  const subtleSurface = isDark ? '#161616' : '#F4F5F7';
  const inputBg = isDark ? (tokens.colors.darkModeContainer || surface) : '#F4F5F7';

  const popularCategories = useMemo(() => CATEGORY_DEFS.slice(0, 8), []);

  return (
    <>
      {/* Compact header: tappable fake search + notification */}
      <View style={[styles.headerContainer, { backgroundColor: bg }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={openModal}
            style={({ pressed }) => [
              styles.searchPill,
              { backgroundColor: inputBg, borderColor: isDark ? border : '#E5E7EB' },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="search" size={20} color={muted} style={styles.searchIcon} />
            <ThemedText style={[styles.searchPillText, { color: hasQuery ? text : muted }]} numberOfLines={1}>
              {hasQuery ? query : t.placeholder}
            </ThemedText>
          </Pressable>

          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: surface, borderColor: isDark ? border : '#E6E8EE' }]}
            onPress={onNotificationClick}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={text} />
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <View style={styles.badgeInner} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-screen search modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={closeModal}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
        <View style={[styles.modalRoot, { backgroundColor: bg, paddingTop: insets.top + 8 }]}>
          {/* Modal header */}
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity
              onPress={closeModal}
              style={[styles.iconBtn, { backgroundColor: subtleSurface }]}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={text} />
            </TouchableOpacity>

            <View style={[styles.modalSearchBar, { backgroundColor: inputBg, borderColor: accent }]}>
              <Ionicons name="search" size={20} color={accent} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={[styles.modalSearchInput, { color: text }]}
                placeholder={t.placeholder}
                placeholderTextColor={muted}
                value={query}
                onChangeText={handleChangeText}
                returnKeyType="search"
                onSubmitEditing={() => submitSearch(query)}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {hasQuery ? (
                <TouchableOpacity onPress={handleClear} hitSlop={8} style={styles.clearBtn} activeOpacity={0.7}>
                  <View style={[styles.clearCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                    <Ionicons name="close" size={14} color={isDark ? '#fff' : '#333'} />
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Modal content */}
          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {hasLiveResults ? (
              isSearching ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={accent} />
                  <ThemedText style={[styles.statusText, { color: muted }]}>{t.searching}</ThemedText>
                </View>
              ) : searchSuggestions.length === 0 ? (
                <View style={styles.emptyResults}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: subtleSurface }]}>
                    <Ionicons name="search-outline" size={36} color={muted} />
                  </View>
                  <ThemedText style={[styles.emptyResultsTitle, { color: text }]}>{t.noResultsTitle}</ThemedText>
                  <ThemedText style={[styles.emptyResultsHint, { color: muted }]}>{t.noResultsHint}</ThemedText>
                </View>
              ) : (
                <View style={styles.suggestionsList}>
                  {searchSuggestions.slice(0, 10).map((suggestion, i) => (
                    <Pressable
                      key={suggestion._id}
                      onPress={() => handleSuggestionPress(suggestion._id)}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        i !== Math.min(searchSuggestions.length, 10) - 1 && {
                          borderBottomColor: border,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                        },
                        pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                      ]}
                    >
                      <View style={[styles.suggestionThumb, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EEF1F6' }]}>
                        {suggestion.images && suggestion.images.length > 0 ? (
                          <Image source={{ uri: suggestion.images[0] }} style={styles.suggestionImage} resizeMode="cover" />
                        ) : (
                          <Ionicons name="image-outline" size={20} color={muted} />
                        )}
                      </View>
                      <View style={styles.suggestionInfo}>
                        {highlightMatch(suggestion.title || suggestion.description || '', query, text, accent)}
                        <View style={styles.suggestionMetaRow}>
                          {suggestion.category && (
                            <View style={[styles.suggestionChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF1F6' }]}>
                              <ThemedText style={[styles.suggestionChipText, { color: muted }]} numberOfLines={1}>
                                {suggestion.category}
                              </ThemedText>
                            </View>
                          )}
                          {suggestion.location && (
                            <View style={styles.suggestionLocation}>
                              <Ionicons name="location-outline" size={11} color={muted} />
                              <ThemedText style={[styles.suggestionLocationText, { color: muted }]} numberOfLines={1}>
                                {suggestion.location}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons name="arrow-up-outline" size={18} color={muted} style={styles.suggestionArrow} />
                    </Pressable>
                  ))}

                  <TouchableOpacity
                    onPress={() => submitSearch(query)}
                    activeOpacity={0.85}
                    style={[styles.seeAllRow, { borderTopColor: border }]}
                  >
                    <Ionicons name="search" size={18} color={accent} />
                    <ThemedText style={[styles.seeAllText, { color: accent }]} numberOfLines={1}>
                      {t.seeAllResults} "{query.trim()}"
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={18} color={accent} />
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <>
                {recents.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <ThemedText style={[styles.sectionTitle, { color: text }]}>{t.recent}</ThemedText>
                      <TouchableOpacity onPress={handleClearAllRecents} hitSlop={6}>
                        <ThemedText style={[styles.clearAllText, { color: muted }]}>{t.clearAll}</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.chipsWrap}>
                      {recents.map((r) => (
                        <View
                          key={r}
                          style={[
                            styles.recentChip,
                            {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F7',
                              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E6E9EF',
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => handleRecentPress(r)}
                            activeOpacity={0.7}
                            style={styles.recentChipBody}
                          >
                            <Ionicons name="time-outline" size={14} color={muted} />
                            <ThemedText style={[styles.recentChipText, { color: text }]} numberOfLines={1}>
                              {r}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRemoveRecent(r)} hitSlop={6} style={styles.recentChipClose}>
                            <Ionicons name="close" size={14} color={muted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <ThemedText style={[styles.sectionTitle, { color: text, marginBottom: 14 }]}>{t.popularCategories}</ThemedText>
                  <View style={styles.categoriesGrid}>
                    {popularCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => handleCategoryPress(cat.key)}
                        activeOpacity={0.7}
                        style={styles.categoryItem}
                      >
                        <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
                          <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                        </View>
                        <ThemedText style={[styles.categoryLabel, { color: text }]} numberOfLines={1}>
                          {translateCategory(cat.key, locale)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Compact header
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchPillText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  searchIcon: {
    marginRight: 10,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  // Modal
  modalRoot: {
    flex: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  clearBtn: {
    paddingLeft: 8,
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },

  // Sections
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  recentChipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 200,
  },
  recentChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recentChipClose: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Categories grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 16,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Status + empty + suggestions
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyResultsTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyResultsHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  suggestionsList: {
    paddingTop: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  suggestionThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  suggestionInfo: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionTitleMatch: {
    fontWeight: '800',
  },
  suggestionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  suggestionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  suggestionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  suggestionLocationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  suggestionArrow: {
    transform: [{ rotate: '45deg' }],
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  seeAllText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
});
