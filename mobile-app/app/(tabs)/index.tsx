import React, { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
import api from '../../src/services/api';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Text } from 'react-native';

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

export default function HomeScreen() {
  const { tokens } = useAppTheme();
  const { columnsForCategories, width: screenWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [popular, setPopular] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  // Configure notifications behavior and Android channel once
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  const loadCount = useCallback(async () => {
    try {
      if (!isAuthenticated || !user?.id) { setNotifCount(0); return; }
      const res = await api.get(`/api/notifications/${user.id}`);
      const list = Array.isArray(res.data) ? res.data : [];
      // Considerăm ne-citit orice element cu read === false
      const unread = list.filter((n: any) => n && n.read === false).length;
      setNotifCount(unread);
    } catch (e) {
      setNotifCount(0);
    }
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCount();
      loadPopular();
    }, [loadCount])
  );

  const loadPopular = useCallback(async () => {
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
    } catch (e) {
      setPopular([]);
    } finally {
      setPopularLoading(false);
    }
  }, []);

  return (
  <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}> 
      <MobileHeader 
        notificationCount={notifCount}
        onSearchFocus={() => console.log('Search focused')}
        onNotificationClick={() => router.push('/notifications')}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContent, { backgroundColor: tokens.colors.surface }]}>
          <ThemedText style={[styles.mainText, { color: tokens.colors.text }]}>
            Găsește-ți hobbyul perfect și conectează-te cu pasionați din toată țara!
          </ThemedText>
          {(() => {
            const maxHeight = 640;
            const computed = Math.round((screenWidth || 360) * 0.8);
            const heroHeight = Math.min(Math.max(computed, 320), maxHeight);
             // make the actual image narrower so it fits vertically (contain)
             const heroImageWidth = Math.round((screenWidth || 360) * 0.85);

            return (
                <View style={[styles.mainHeroWrap, { height: heroHeight, marginBottom: -22 }]}> 
                  <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                      source={require('../../assets/images/hobby_img.jpg')}
                      style={[styles.mainHeroImage, { width: heroImageWidth, height: heroHeight - 20 }]} 
                      resizeMode="contain"
                    />
                  </View>
                </View>
            );
          })()}
          <View style={[styles.callToAction, { backgroundColor: tokens.colors.surface }]}>
            <ThemedText style={[styles.ctaText, { color: tokens.colors.text }]}>
              Descoperă talente locale pentru pasiunile tale
            </ThemedText>
          </View>
        </View>

        {/* Popular announcements */}
        <View style={[styles.popularSection, { backgroundColor: tokens.colors.surface }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText style={[styles.popularTitle, { color: tokens.colors.text }]}>Anunțuri populare</ThemedText>
            <TouchableOpacity onPress={() => router.push('/announcement-details?sort=popular') }>
              <Text style={{ color: tokens.colors.primary }}>Vezi tot</Text>
            </TouchableOpacity>
          </View>
          {popularLoading ? (
            <Text style={{ color: tokens.colors.muted }}>Se încarcă...</Text>
          ) : (
            (() => {
              const cols = screenWidth && screenWidth < 360 ? 1 : 2;
              const horizontalPadding = 32; // padding from container (16 + 16)
              const gap = 12; // marginRight between cards
              const cardWidth = Math.floor((Math.max(screenWidth || 360, 360) - horizontalPadding - (cols - 1) * gap) / cols);
              return (
                <FlatList
                  data={popular}
                  key={cols} // force re-render when cols change
                  numColumns={cols}
                  nestedScrollEnabled
                  scrollEnabled={false}
                  columnWrapperStyle={cols > 1 ? { justifyContent: 'flex-start' } : undefined}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  keyExtractor={(it) => it._id}
                  renderItem={({ item, index }) => {
                    const isLastInRow = cols > 1 && ((index % cols) === (cols - 1));
                    const itemStyle = [styles.popularCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, width: cardWidth, marginRight: isLastInRow ? 0 : gap, marginBottom: 12 }];
                    return (
                      <TouchableOpacity activeOpacity={0.8} style={itemStyle} onPress={() => router.push(`/announcement-details?id=${item._id}`)}>
                          <Image source={{ uri: item.images && item.images[0] ? item.images[0] : undefined }} style={styles.popularImage} />
                          <Text numberOfLines={2} style={[styles.popularLabel, { color: tokens.colors.text }]}>{item.title || item.description || 'Anunț'}</Text>
                          <View style={styles.popularMetaWrap}>
                            <Text numberOfLines={1} style={[styles.popularMetaText, { color: tokens.colors.muted }]}>{item.location || ''}</Text>
                            <Text numberOfLines={1} style={[styles.popularMetaText, { color: tokens.colors.muted }]}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</Text>
                          </View>
                        </TouchableOpacity>
                    );
                  }}
                />
              );
            })()
          )}
        </View>

        <View style={[styles.categoriesSection, { backgroundColor: tokens.colors.surface }]}>
          <ThemedText style={[styles.categoriesTitle, { color: tokens.colors.text }]}>
            Explorează categorii
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
                    onPress={() => router.push(`/category-announcements?category=${encodeURIComponent(category.description)}`)}
                  >
                    <View style={[styles.imageContainer, { backgroundColor: `${category.color}20` }]}>
                      <Image 
                        source={category.image} 
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    </View>
                    <ThemedText style={[styles.categoryLabel, { color: tokens.colors.muted }]}>
                      {category.description}
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
  scrollContent: { paddingBottom: 100 },
  mainContent: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
  },
  mainImagePlaceholder: {
    width: '100%',
    maxWidth: 280,
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
  },
  mainHeroImage: {
    width: '100%',
    height: 280,
    marginBottom: 24,
    // resizeMode is applied via Image component props/style in RN; use contain visually
  },
  mainHeroWrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: 300,
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
    marginBottom: 16,
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
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
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
    width: 140,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 12,
    paddingBottom: 44, // reserve extra space for the bottom-left meta
    minHeight: 180,
    // subtle elevation for a button-like look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  popularImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginBottom: 10,
    resizeMode: 'cover' as any,
  },
  popularLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 26, // increased spacing between title and meta overlay
  },
  popularMetaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  popularMetaWrap: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    right: 8,
    // Background semi-transparent to ensure readability on images
    // backgroundColor: 'rgba(0,0,0,0.02)',
  },
});
