import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import api from '../src/services/api';

export default function ProfileScreen() {
  const { tokens } = useAppTheme();
  // Page-level accent aligned with theme primary (dark: #f51866)
  const pageAccent = tokens.colors.primary;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [publicProfile, setPublicProfile] = React.useState<any | null>(null);
  const [loadingPublic, setLoadingPublic] = React.useState(false);
  const [currentAvatar, setCurrentAvatar] = React.useState<string | undefined>(undefined);
  const [avatarUploading, setAvatarUploading] = React.useState(false);

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

  // keep a local displayed avatar so we can optimistically update after upload
  React.useEffect(() => {
    const active = publicProfile || user;
    setCurrentAvatar(active?.avatar || undefined);
  }, [publicProfile, user]);

  const isViewingOwnProfile = !publicProfile || (user && String(user.id) === String(publicProfile?.id));

  // local asset for empty-location illustration (shown when own profile has no location)
  // Metro will bundle this image because we use require()
  const anaisImg = require('../assets/images/anais.png');

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permisiune', 'Trebuie să permiți accesul la galerie pentru a schimba poza de profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
      // expo-image-picker v13 returns { canceled, assets }
      if ((result as any).canceled) return;
      const asset: any = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || !asset.uri) return;

      // Ask for confirmation before uploading
      Alert.alert(
        'Schimbă poza de profil',
        'Ești sigur că vrei să modifica poza de profil a contului?',
        [
          { text: 'Anulează', style: 'cancel' },
          {
            text: 'Confirmă',
            onPress: async () => {
              // proceed to upload
              const uri = asset.uri;
              const fileName = asset.fileName || uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
              const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
              const ext = extMatch ? extMatch[1] : 'jpg';
              const mimeType = asset.type ? `${asset.type}/${ext}` : `image/${ext}`;
              const form = new FormData();
              // @ts-ignore
              form.append('avatar', { uri, name: fileName, type: mimeType });
              try {
                setAvatarUploading(true);
                const res = await api.post('/api/users/avatar', form as any, { headers: { 'Content-Type': 'multipart/form-data' } });
                // server should return the updated avatar URL; fall back to local uri
                const newAvatar = res?.data?.avatar || res?.data?.url || uri;
                setCurrentAvatar(newAvatar);
                // If viewing a publicProfile (which should be oneself), update it too
                if (publicProfile) setPublicProfile((p: any) => ({ ...(p || {}), avatar: newAvatar }));
                Alert.alert('Actualizat', 'Poza de profil a fost actualizată');
              } catch (err) {
                console.error('Avatar upload error:', err);
                Alert.alert('Eroare', 'Nu s-a putut încărca poza. Încearcă din nou');
              } finally {
                setAvatarUploading(false);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('handlePickAvatar error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea imaginii');
    }
  };

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
            onPress={() => {
              try {
                // Prefer router.back() from expo-router which works across navigation modes
                router.back();
              } catch (e) {
                // Fallback to pushing to root if no history is available
                try {
                  router.push('/');
                } catch (_) {}
              }
            }}
            activeOpacity={0.7}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>

          <View style={styles.titleWrapper} pointerEvents="none">
            <ThemedText style={[styles.titleText, { color: tokens.colors.text }]}>{publicProfile ? `${publicProfile.firstName || ''} ${publicProfile.lastName || ''}`.trim() || 'Profil' : 'Profilul meu'}</ThemedText>
          </View>

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
            {currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                <Ionicons name="person" size={32} color={pageAccent} />
              </View>
            )}

            {isViewingOwnProfile && (
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]} onPress={handlePickAvatar} activeOpacity={0.8}>
                {avatarUploading ? (
                  <ActivityIndicator size="small" color={tokens.colors.primary} />
                ) : (
                  <Ionicons name="camera" size={18} color={tokens.colors.text} />
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={tokens.colors.primary} />
              <ThemedText style={[styles.ratingText, { color: tokens.colors.text }]}>4.7</ThemedText>
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
                {isViewingOwnProfile ? (
                  <Image source={anaisImg} style={styles.anaisImage} resizeMode="contain" />
                ) : (
                  <Ionicons name="map" size={48} color={tokens.colors.muted} />
                )}
                <ThemedText style={[styles.mapText, { color: tokens.colors.muted, marginTop: 8 }]}>Nu ți-ai setat încă locația, dc?</ThemedText>
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
              <Ionicons name="call-outline" size={20} color={tokens.colors.primary} />
              <View style={styles.infoItemContent}>
                <ThemedText style={[styles.infoItemLabel, { color: tokens.colors.muted }]}>Telefon</ThemedText>
                <ThemedText style={[styles.infoItemValue, { color: tokens.colors.text }]}>
                  {profileToShow?.phone || 'N/A'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.infoItem, { borderColor: tokens.colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={tokens.colors.primary} />
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
              <ThemedText style={[styles.statValue, { color: tokens.colors.primary }]}>6</ThemedText>
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

  titleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
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
    position: 'relative',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarPlaceholder: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40,
    overflow: 'hidden',
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
    // color injected at runtime from tokens
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
  anaisImage: {
    width: 100,
    height: 100,
    marginBottom: -12,
  },
});
