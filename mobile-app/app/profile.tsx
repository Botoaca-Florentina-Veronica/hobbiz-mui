import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import api from '../src/services/api';

export default function ProfileScreen() {
  const { tokens } = useAppTheme();
  // Page-level accent requested by user
  const pageAccent = '#100e9aff';
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [publicProfile, setPublicProfile] = React.useState<any | null>(null);
  const [loadingPublic, setLoadingPublic] = React.useState(false);

  // If userId present in query, fetch public profile for that user
  React.useEffect(() => {
    const fetchPublic = async () => {
      if (!userId) {
        setPublicProfile(null);
        return;
      }
      try {
        setLoadingPublic(true);
        const res = await api.get(`/api/users/profile/${encodeURIComponent(String(userId))}`);
        setPublicProfile(res.data);
      } catch (e) {
        console.error('Error loading public profile:', e);
        setPublicProfile(null);
      } finally {
        setLoadingPublic(false);
      }
    };
    fetchPublic();
  }, [userId]);

  // Format member since date
  const formatMemberDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const profileToShow = publicProfile || user;

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button and title */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              try {
                // Try native navigation first
                // @ts-ignore
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  // @ts-ignore
                  navigation.goBack();
                  return;
                }
              } catch (e) {
                // ignore and fallback to router
              }
              // fallback to router.back(); if that doesn't navigate, push to root
              try {
                router.back();
              } catch (e) {
                router.push('/');
              }
            }}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{publicProfile ? `${publicProfile.firstName || ''} ${publicProfile.lastName || ''}`.trim() || 'Profil' : 'My Profile'}</ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
            style={[styles.settingsButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          >
            <Ionicons name="settings-outline" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Header Card - Avatar + Rating + Name */}
        <View style={[styles.profileHeaderCard, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.avatarContainer}>
            {profileToShow?.avatar ? (
              <Image source={{ uri: profileToShow.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#E8F0FE' }]}>
                <Ionicons name="person" size={32} color={pageAccent} />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <ThemedText style={styles.ratingText}>4.7</ThemedText>
            </View>

            <ThemedText style={[styles.userName, { color: tokens.colors.text }]}>
              {profileToShow?.firstName && profileToShow?.lastName ? `${profileToShow.firstName} ${profileToShow.lastName}` : 'Utilizator'}
            </ThemedText>
            
            <ThemedText style={[styles.registerDate, { color: tokens.colors.muted }]}>
              Membru din {formatMemberDate(profileToShow?.createdAt)}
            </ThemedText>
          </View>
        </View>

        {/* My Location Section */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>My Location</ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.specifyLink, { color: tokens.colors.muted }]}>Specify Location</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.mapContainer, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            {profileToShow?.localitate ? (
              (() => {
                const encoded = encodeURIComponent(profileToShow.localitate);
                const key = (Constants?.expoConfig?.extra?.VITE_GOOGLE_MAPS_KEY as string) || (Constants?.manifest?.extra?.VITE_GOOGLE_MAPS_KEY as string) || process.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY || process.env?.VITE_GOOGLE_MAPS_KEY;
                const mapUrl = key
                  ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encoded}`
                  : `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;

                if (Platform.OS === 'web') {
                  return (
                    <View style={styles.mapInnerWrapper}>
                      <iframe title="Locație" src={mapUrl} style={{ border: 0, width: '100%', height: '100%' }} loading="lazy" />
                    </View>
                  );
                }

                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const { WebView } = require('react-native-webview');
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
                  // WebView not available or failed
                  // fallback to simple placeholder
                  return (
                    <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>          
                      <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} style={{ marginBottom: 8 }} />
                    </View>
                  );
                }
              })()
            ) : (
              <View style={[styles.mapPlaceholder, { alignItems: 'center', justifyContent: 'center' }]}>                
                <Ionicons name="map" size={48} color={tokens.colors.muted} />
                <ThemedText style={[styles.mapText, { color: tokens.colors.muted, marginTop: 8 }]}>Locația ta va apărea aici</ThemedText>
              </View>
            )}
            {/* map pin removed as requested */}
          </View>
        </View>

        {/* Contact Info Dashboard */}
        <View style={[styles.dashboardCard, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.dashboardHeader}>
            <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>Informații de Contact</ThemedText>
            <TouchableOpacity>
              <Ionicons name="arrow-forward" size={20} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { borderColor: tokens.colors.border }]}>
              <Ionicons name="call-outline" size={20} color={pageAccent} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>Telefon</ThemedText>
                <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]}>
                  {profileToShow?.phone || 'N/A'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.infoItem, { borderColor: tokens.colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={pageAccent} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>Email</ThemedText>
                <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]} numberOfLines={1}>
                  {profileToShow?.email || 'N/A'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Announcements Dashboard */}
        <View style={[styles.dashboardCard, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.dashboardHeader}>
            <ThemedText style={[styles.dashboardTitle, { color: tokens.colors.text }]}>Anunțurile Mele</ThemedText>
            <TouchableOpacity>
              <Ionicons name="arrow-forward" size={20} color={tokens.colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.announcementStats}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: pageAccent }]}>6</ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>Active</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tokens.colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tokens.colors.text }]}>12</ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>Total</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tokens.colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: tokens.colors.text }]}>89</ThemedText>
              <ThemedText style={[styles.statLabel, { color: tokens.colors.muted }]}>Views</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1 
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
    pointerEvents: 'none', // allow touches to pass through the centered title so underlying buttons are tappable
    // RN Text does not support pointerEvents on all platforms reliably, so ensure hitSlop on buttons as well
    // leave as-is; semantic comment only
  },
  
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  
  // Profile Header Card
  profileHeaderCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: { 
    width: 80, 
    height: 80,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
  },
  avatarPlaceholder: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  registerDate: {
    fontSize: 12,
  },

  // Location Section
  locationSection: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  specifyLink: {
    fontSize: 13,
  },
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: {
    fontSize: 14,
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },

  // Dashboard Cards
  dashboardCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Info Grid
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoItemContent: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Announcement Stats
  announcementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  // Map wrappers for WebView/iframe
  mapInnerWrapper: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  mapWebview: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  locationMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
