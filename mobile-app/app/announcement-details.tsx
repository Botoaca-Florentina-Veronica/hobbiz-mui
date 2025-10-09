import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Linking, Platform, Modal, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  images?: string[];
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string; avatar?: string };
}

export default function AnnouncementDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [viewerScale, setViewerScale] = useState(1);
  const viewerScrollRef = useRef<any>(null);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const width = Dimensions.get('window').width;
  const isLarge = width >= 768;

  const fetchAnnouncement = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
  setFetchError(null);
  // Use public announcement endpoint so details can be viewed for any announcement
  const res = await api.get(`/api/announcements/${id}`);
      setAnnouncement(res.data);
      // after loading announcement, check if it's in user's favorites
      try {
        const favRes = await api.get('/api/favorites');
        const favIds = favRes?.data?.favoriteIds || favRes?.data?.favorites || [];
        if (Array.isArray(favIds)) {
          setFavorited(favIds.some((f: any) => String(f) === String(id)));
        }
      } catch (favErr) {
        // ignore if not authenticated or any error
      }
    } catch (e: any) {
      console.error('Error loading announcement details:', e?.message || e);
      setFetchError('Nu am putut încărca anunțul.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  // Ascund header-ul implicit al navigatorului (evit bara neagră de sus)
  useEffect(() => {
    try {
      // @ts-ignore
      navigation.setOptions?.({ headerShown: false });
    } catch (e) {
      // nu blochează execuția dacă nu e disponibil
    }
  }, [navigation]);

  // Nu mai avem nevoie de geocodare sau MapView nativ — folosim iframe Google Maps pe toate platformele (funcționează în Expo Go)

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    // ensure baseURL has no trailing slash
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    // handle "uploads/xxx.jpg" or bare filenames
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  const images = announcement?.images || [];
  const currentImage = fallbackImage || (images[imgIndex] ? getImageSrc(images[imgIndex]) : null);

  const initials = () => {
    const f = announcement?.user?.firstName?.[0] || '';
    const l = announcement?.user?.lastName?.[0] || '';
    return (f + l || 'U').toUpperCase();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 40 }]}>        
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={[styles.loadingMessage, { color: tokens.colors.muted, marginTop: 12 }]}>Se încarcă anunțul...</Text>
      </View>
    );
  }

  if (fetchError || !announcement) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 40 }]}>        
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.errorTitle, { color: tokens.colors.text }]}>Eroare</Text>
        <Text style={[styles.errorMessage, { color: tokens.colors.muted }]}>{fetchError || 'Anunțul nu a fost găsit.'}</Text>
        <TouchableOpacity onPress={fetchAnnouncement} style={[styles.retryBtn, { backgroundColor: tokens.colors.primary }]}>          
          <Text style={styles.retryText}>Reîncearcă</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: tokens.colors.bg }} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Header: circular back button + 'înapoi' text on left, placeholder right for balance */}
      <View style={[styles.headerSpacer, { paddingTop: insets.top + 12 }]}>        
        <View style={[styles.headerRow, { alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.backText, { color: tokens.colors.text, marginLeft: 12 }]}>înapoi</Text>
          </View>

          {/* Placeholder to keep layout balanced */}
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Image area */}
      <View style={[styles.imageCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
        {currentImage ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              // Diagnostic log: show resolved URL in Expo console
              try {
                // eslint-disable-next-line no-console
                console.log('[announcement-details] Open image:', currentImage, 'api.baseURL=', api.defaults.baseURL);
              } catch (e) {}
              setViewerVisible(true);
              setViewerScale(1);
            }}
          >
            <Image
              source={{ uri: currentImage }}
              resizeMode="contain"
              style={isLarge ? styles.heroImageLarge : styles.heroImage}
              onError={(e) => {
                try {
                  // try alternative URL forms once
                  const original = images[imgIndex] || '';
                  const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
                  const alt1 = original.startsWith('/') ? `${base}${original}` : `${base}/uploads/${original.replace(/^.*[\\\\/]/, '')}`;
                  if (alt1 !== currentImage) {
                    // eslint-disable-next-line no-console
                    console.warn('[announcement-details] image load failed, trying fallback:', currentImage, '->', alt1);
                    setFallbackImage(alt1);
                    return;
                  }
                } catch (er) {
                  // ignore
                }
                // final fallback: show placeholder (handled by conditional render)
              }}
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: tokens.colors.elev }]}>            
            <Ionicons name="image-outline" size={64} color={tokens.colors.placeholder} />
          </View>
        )}
        {/* Image counter / nav */}
        {images.length > 1 && (
          <View style={styles.carouselControls}>            
            <TouchableOpacity onPress={() => setImgIndex(i => i > 0 ? i - 1 : images.length - 1)} style={[styles.navBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>              
              <Ionicons name="chevron-back" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.counter, { color: tokens.colors.text }]}>{imgIndex + 1} / {images.length}</Text>
            <TouchableOpacity onPress={() => setImgIndex(i => i < images.length - 1 ? i + 1 : 0)} style={[styles.navBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>              
              <Ionicons name="chevron-forward" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Card */}
      <View style={[styles.mainCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
        {/* Action buttons (favorite, share) top-right */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={async () => {
              try {
                if (!favorited) {
                  const r = await api.post(`/api/favorites/${id}`);
                  setFavorited(true);
                  if (r?.data?.favoritesCount !== undefined) {
                    setAnnouncement(prev => prev ? { ...prev, favoritesCount: r.data.favoritesCount } : prev);
                  }
                } else {
                  const r = await api.delete(`/api/favorites/${id}`);
                  setFavorited(false);
                  if (r?.data?.favoritesCount !== undefined) {
                    setAnnouncement(prev => prev ? { ...prev, favoritesCount: r.data.favoritesCount } : prev);
                  }
                }
              } catch (err) {
                console.warn('Favorite toggle failed', err);
              }
            }}
            style={styles.actionCircle}
            accessibilityLabel="Favorite"
          >
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={24} color={favorited ? '#E0245E' : tokens.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                const shareUrl = `${api.defaults.baseURL}/announcements/${id}`;
                await Share.share({ message: `${announcement.title}\n\n${announcement.description}\n\n${shareUrl}` });
              } catch (e) {
                console.warn('Share error', e);
              }
            }}
            style={styles.actionCircle}
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social" size={24} color={tokens.colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.postedAt, { color: tokens.colors.muted }]}>Postat {new Date(announcement.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
        <Text style={[styles.title, { color: tokens.colors.text }]}>{announcement.title}</Text>
        <View style={styles.badgeRow}>          
          <View style={[styles.categoryBadge, { backgroundColor: tokens.colors.elev }]}>            
            <Text style={[styles.categoryText, { color: tokens.colors.primary }]}>{announcement.category}</Text>
          </View>
        </View>
        <Text style={[styles.sectionHeading, { color: tokens.colors.text }]}>Descriere</Text>
        <Text style={[styles.description, { color: tokens.colors.muted }]}>{announcement.description}</Text>
        <View style={[styles.divider, { borderBottomColor: tokens.colors.border }]} />
        <View style={styles.metaRow}>          
          <Text style={[styles.metaItem, { color: tokens.colors.muted }]}>ID: {announcement._id.slice(-8)}</Text>
          {!!announcement.views && <Text style={[styles.metaItem, { color: tokens.colors.muted }]}>{announcement.views} vizualizări</Text>}
        </View>
      </View>

      {/* Seller Card */}
      <View style={[styles.sellerCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
        <Text style={[styles.sellerHeading, { color: tokens.colors.text }]}>Informații vânzător</Text>
        <View style={styles.sellerRow}>          
          <View style={[styles.avatar, { backgroundColor: tokens.colors.elev, overflow: 'hidden' }]}>            
            {announcement.user?.avatar ? (
              <Image
                source={{ uri: getImageSrc(announcement.user.avatar) || undefined }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.avatarText, { color: tokens.colors.text }]}>{initials()}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sellerName, { color: tokens.colors.text }]}>{announcement.user?.firstName} {announcement.user?.lastName}</Text>
            <Text style={[styles.sellerSub, { color: tokens.colors.muted }]}>nu există review-uri</Text>
            <Text style={[styles.contactLabel, { color: tokens.colors.muted }]}>Persoană de contact:</Text>
            <Text style={[styles.contactValue, { color: tokens.colors.text }]}>{announcement.contactPerson}</Text>
          </View>
        </View>
        <Text style={[styles.ownBadge, { color: tokens.colors.muted }]}>Acesta este anunțul tău</Text>
      </View>

      {/* Location Card */}
      <View style={[styles.locationCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
        <Text style={[styles.locationHeading, { color: tokens.colors.text }]}>Locație</Text>
        {/* Map embed: iframe pe web, WebView pe mobile (funcționează în Expo Go) */}
        <View style={[styles.mapWrapper, { backgroundColor: tokens.colors.elev }]}>          
          {announcement.location ? (
            (() => {
              const encoded = encodeURIComponent(announcement.location);
              // Try to read key from Expo constants (extra) or env var
              const key = (Constants?.expoConfig?.extra?.VITE_GOOGLE_MAPS_KEY as string) || (Constants?.manifest?.extra?.VITE_GOOGLE_MAPS_KEY as string) || process.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY || process.env?.VITE_GOOGLE_MAPS_KEY;
              const mapUrl = key
                ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encoded}`
                : `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;

              if (Platform.OS === 'web') {
                // Web: folosește iframe direct
                return (
                  <View style={styles.mapInnerWrapper}>
                    <iframe title="Locație" src={mapUrl} style={{ border: 0, width: '100%', height: '100%' }} loading="lazy" />
                  </View>
                );
              }

              // Mobile (iOS/Android): folosește WebView cu HTML care conține iframe
              try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { WebView } = require('react-native-webview');
                
                // Creăm o pagină HTML simplă cu iframe-ul Google Maps
                const htmlContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      html, body { width: 100%; height: 100%; overflow: hidden; }
                      iframe { border: 0; width: 100%; height: 100%; display: block; }
                    </style>
                  </head>
                  <body>
                    <iframe src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                  </body>
                  </html>
                `;
                
                return (
                  <View style={styles.mapInnerWrapper}>
                    <WebView
                      source={{ html: htmlContent }}
                      style={styles.mapWebview}
                      startInLoadingState
                      javaScriptEnabled
                      domStorageEnabled
                      renderLoading={() => (
                        <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                          <ActivityIndicator size="small" color={tokens.colors.primary} />
                        </View>
                      )}
                    />
                  </View>
                );
              } catch (err: any) {
                console.warn('WebView not available:', err?.message || err);
                return (
                  <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                    <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} style={{ marginBottom: 8 }} />
                    <Text style={{ color: tokens.colors.muted, fontSize: 13, textAlign: 'center' }}>Harta nu este disponibilă</Text>
                  </View>
                );
              }
            })()
          ) : (
            <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>          
              <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} />
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="pin" size={16} color={tokens.colors.primary} />
          <Text style={[styles.locationText, { color: tokens.colors.text, flex: 1 }]}>{announcement.location}</Text>
          <TouchableOpacity
            onPress={() => {
              if (!announcement.location) return;
              const q = encodeURIComponent(announcement.location);
              const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
              Linking.openURL(url);
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="open-outline" size={20} color={tokens.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Image Viewer Modal */}
      <Modal visible={viewerVisible} animationType="fade" onRequestClose={() => setViewerVisible(false)} transparent>
        <View style={styles.viewerOverlay}> 
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={[styles.viewerCloseBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              <Ionicons name="close" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewerBody}>
            <ScrollView
              ref={(r) => { viewerScrollRef.current = r; }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              pinchGestureEnabled={true}
            >
              <Image source={{ uri: currentImage || undefined }} style={styles.viewerImage} resizeMode="contain" />
            </ScrollView>
          </View>

          <View style={styles.viewerFooter}>
            <TouchableOpacity onPress={() => { setViewerScale(s => Math.max(1, s - 0.5)); }} style={[styles.viewerControl, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              <Ionicons name="remove" size={18} color={tokens.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setViewerScale(1); viewerScrollRef.current?.scrollTo({ x: 0, y: 0, animated: true }); }} style={[styles.viewerControl, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              <Ionicons name="refresh" size={18} color={tokens.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setViewerScale(s => Math.min(3, s + 0.5)); }} style={[styles.viewerControl, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              <Ionicons name="add" size={18} color={tokens.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMessage: { fontSize: 14, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700' },
  errorMessage: { fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  headerSpacer: { paddingHorizontal: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { marginLeft: 8, fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  imageCard: { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  heroImage: { width: '100%', height: 320 },
  heroImageLarge: { width: '100%', height: 480 },
  heroPlaceholder: { width: '100%', height: 320, justifyContent: 'center', alignItems: 'center' },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerHeader: { position: 'absolute', top: 28, right: 16, zIndex: 20 },
  viewerCloseBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  viewerBody: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerFooter: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  viewerControl: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  carouselControls: { position: 'absolute', left: 0, right: 0, bottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  navBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  counter: { fontSize: 13, fontWeight: '600' },
  cardActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 12 },
  actionCircle: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 0, backgroundColor: 'transparent' },
  mainCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 20, gap: 12 },
  postedAt: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  categoryText: { fontSize: 13, fontWeight: '600' },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, lineHeight: 20 },
  divider: { borderBottomWidth: 1, marginVertical: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { fontSize: 11, fontWeight: '500' },
  sellerCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 20, gap: 16 },
  sellerHeading: { fontSize: 18, fontWeight: '700' },
  sellerRow: { flexDirection: 'row', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  sellerName: { fontSize: 16, fontWeight: '700' },
  sellerSub: { fontSize: 13, fontWeight: '500' },
  contactLabel: { fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
  contactValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  ownBadge: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 12 },
  locationCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 40, gap: 16 },
  locationHeading: { fontSize: 18, fontWeight: '700' },
  locationMapPlaceholder: { width: '100%', height: 180, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mapWrapper: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden' },
  mapInnerWrapper: { flex: 1, overflow: 'hidden' },
  mapWebview: { flex: 1, backgroundColor: 'transparent' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 14, fontWeight: '600' },
});
