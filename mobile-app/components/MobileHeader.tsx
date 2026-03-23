import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTextInput } from './themed-text-input';
import { ThemedText } from './themed-text';
import { useAppTheme } from '../src/context/ThemeContext';

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
  onSearchFocus?: () => void;
  onSearchSubmit?: (query: string) => void;
  onSearchChange?: (query: string) => void;
  onNotificationClick?: () => void;
  onSuggestionClick?: (id: string) => void;
  searchValue?: string;
  searchSuggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  isSearching?: boolean;
}

export default function MobileHeader({ 
  notificationCount = 0, 
  onSearchFocus, 
  onNotificationClick,
  onSearchSubmit,
  onSearchChange,
  onSuggestionClick,
  searchValue,
  searchSuggestions = [],
  showSuggestions = false,
  isSearching = false,
}: MobileHeaderProps) {
  const { tokens, isDark } = useAppTheme();
  const webBox = (tokens as any)?.shadow?.elev1?.boxShadow;
  const [query, setQuery] = React.useState('');
  const [searchContainerLayout, setSearchContainerLayout] = React.useState<{ x: number; width: number } | null>(null);
  
  // Sync with external value
  React.useEffect(() => {
    if (searchValue !== undefined && searchValue !== query) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  return (
    <View style={[styles.headerContainer, { backgroundColor: tokens.colors.bg }]}>
    <View style={[styles.header, { backgroundColor: tokens.colors.bg }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}
        onLayout={(event) => {
          const { x, width } = event.nativeEvent.layout;
          setSearchContainerLayout({ x, width });
        }}
      >
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: tokens.colors.surface,
            borderColor: isDark ? tokens.colors.border : '#E0E0E0',
          },
          // Use boxShadow on web to avoid deprecated RN shadow props being forwarded
          (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : { shadowColor: '#000' }
        ]}>
          <View style={styles.searchIconWrapper}>
            <Ionicons name="search-outline" size={20} color={tokens.colors.muted} />
          </View>
          <ThemedTextInput
            style={[
              styles.searchInput,
              { color: tokens.colors.text }
            ]}
            placeholder="Ce anume cauți?"
            placeholderTextColor={tokens.colors.muted}
            onFocus={onSearchFocus}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (onSearchChange) onSearchChange(text);
            }}
            returnKeyType="search"
            onSubmitEditing={() => {
              const q = (query || '').trim();
              if (onSearchSubmit) onSearchSubmit(q);
            }}
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: tokens.colors.primary }]}
            activeOpacity={0.85}
            onPress={() => {
              const q = (query || '').trim();
              if (onSearchSubmit) onSearchSubmit(q);
            }}
          >
            <Ionicons name="search" size={22} color={tokens.colors.primaryContrast} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Button */}
      <TouchableOpacity
        style={[
          styles.notificationButton,
          {
            backgroundColor: tokens.colors.surface,
            borderColor: isDark ? tokens.colors.border : '#E6E8EE',
          },
        ]}
        onPress={onNotificationClick}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="notifications-outline" 
          size={26} 
          color={tokens.colors.text} 
        />
        {notificationCount > 0 && (
          <View style={[styles.badge, { backgroundColor: tokens.colors.primary }]}>
            <View style={styles.badgeInner} />
          </View>
        )}
      </TouchableOpacity>
    </View>
    
    {/* Search Suggestions Dropdown */}
    {showSuggestions && query.trim().length >= 2 && searchContainerLayout && (
      <View style={[
        styles.suggestionsDropdown,
        {
          left: searchContainerLayout.x,
          width: searchContainerLayout.width,
        },
        { 
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
        }
      ]}>
        {isSearching ? (
          <View style={styles.suggestionItem}>
            <ThemedText style={{ color: tokens.colors.muted }}>Se caută...</ThemedText>
          </View>
        ) : searchSuggestions.length === 0 ? (
          <View style={styles.suggestionItem}>
            <ThemedText style={{ color: tokens.colors.muted }}>Nu am găsit rezultate</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.suggestionsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {searchSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion._id}
                style={[styles.suggestionItem, { borderBottomColor: tokens.colors.border }]}
                onPress={() => {
                  if (onSuggestionClick) onSuggestionClick(suggestion._id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionImageContainer}>
                  {suggestion.images && suggestion.images.length > 0 ? (
                    <Image 
                      source={{ uri: suggestion.images[0] }} 
                      style={styles.suggestionImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.noImagePlaceholder, { backgroundColor: tokens.colors.bg }]}>
                      <Ionicons name="image-outline" size={20} color={tokens.colors.muted} />
                    </View>
                  )}
                </View>
                <View style={styles.suggestionContent}>
                  <ThemedText 
                    style={styles.suggestionTitle} 
                    numberOfLines={1}
                  >
                    {suggestion.title || suggestion.description}
                  </ThemedText>
                  <View style={styles.suggestionMeta}>
                    {suggestion.category && (
                      <ThemedText style={[styles.suggestionMetaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {suggestion.category}
                      </ThemedText>
                    )}
                    {suggestion.location && (
                      <>
                        <ThemedText style={{ color: tokens.colors.muted }}>•</ThemedText>
                        <ThemedText style={[styles.suggestionMetaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                          {suggestion.location}
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>
                {suggestion.price !== undefined && (
                  <View style={styles.suggestionPriceContainer}>
                    <ThemedText style={[styles.suggestionPrice, { color: tokens.colors.primary }]}>
                      {suggestion.price === 0 ? 'Gratuit' : `${suggestion.price} RON`}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    zIndex: 40,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 12,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 66,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1001,
  },
  suggestionsScroll: {
    maxHeight: 400,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  suggestionMetaText: {
    fontSize: 12,
  },
  suggestionPriceContainer: {
    alignItems: 'flex-end',
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    maxWidth: '85%',
  },  searchIconWrapper: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },  searchBar: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    height: 50,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 46,
    paddingRight: 10,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  searchButton: {
    marginRight: 4,
    borderRadius: 14,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  notificationButton: {
    padding: 10,
    borderRadius: 16,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

