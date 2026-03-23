import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView, Image, Platform, useWindowDimensions, Modal, Text, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLocale } from '../../src/context/LocaleContext';
import { getAccountTranslations } from '../../src/i18n/account';
import { normalizeLocale } from '../../src/i18n';
import api from '../../src/services/api';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { GuestModeRestriction } from '../../src/components/GuestModeRestriction';
import { Toast } from '../../components/ui/Toast';
import Constants from 'expo-constants';

type RowSpec = { key: string; label: string; icon: string; action?: () => void; type?: 'switch' | 'danger' };

export default function AccountScreen() {
  const { isDark, setMode, tokens } = useAppTheme();
  const { locale, setLocale: setGlobalLocale } = useLocale();
  const normalizedLocale = normalizeLocale(locale);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [languageModalOpen, setLanguageModalOpen] = React.useState(false);
  const [contactModalOpen, setContactModalOpen] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [contactForm, setContactForm] = React.useState({ name: '', email: '', message: '' });
  const [contactError, setContactError] = React.useState('');
  const [contactSending, setContactSending] = React.useState(false);

  const t = getAccountTranslations(locale);

  const accountRows: RowSpec[] = [
    { key: 'settings', label: t.settings, icon: 'settings-outline', action: () => router.push('/settings') },
    { key: 'my-ads', label: t.myAds, icon: 'megaphone-outline', action: () => router.push('/my-announcements') },
    { key: 'profile', label: t.profile, icon: 'person-outline', action: () => router.push('/profile') },
    { key: 'darkmode', label: t.darkMode, icon: 'moon-outline', type: 'switch' },
    { key: 'contact', label: t.contact, icon: 'mail-outline', action: () => setContactModalOpen(true) },
    { key: 'language', label: t.language, icon: 'language-outline', action: () => setLanguageModalOpen(true) },
  ];

  const infoRows: RowSpec[] = [
    { key: 'about', label: t.aboutUs, icon: 'information-circle-outline', action: () => router.push('/about') },
    { key: 'howItWorks', label: t.howItWorks, icon: 'help-circle-outline', action: () => router.push('/how-it-works') },
    { key: 'legal', label: t.legalInfo, icon: 'document-text-outline', action: () => router.push('/legal') },
  ];

  // Combine primary and accent for a pleasing gradient (left: primary -> right: accent)
  // const primaryColor = '#355070';
  // const accent = '#F8B195';
  // const accentLight = '#FCEDE6';

  // Centralized per-screen palette so dark-mode tweaks are simple in one place
  const palette = React.useMemo(() => ({
    // Header background (use blue in light mode, pink in dark mode)
    headerBgStart: isDark ? '#f51866' : tokens.colors.primary,
    headerBgEnd: isDark ? tokens.colors.primaryHover : tokens.colors.primaryHover,
    headerText: '#ffffff',
    // Name accent color within header greeting
    nameAccent: isDark ? '#ffffff' : '#000000',
    // Background for circular icons on rows
    iconBg: isDark ? tokens.colors.elev : '#F3F5F6',
  // Icon color (pink in dark mode)
  iconColor: isDark ? '#f51866' : tokens.colors.text,
    // Track ON color for the dark mode switch and generic confirm buttons
    emphasisBg: isDark ? tokens.colors.primary : tokens.colors.primary,
    // Logout color accent
    danger: isDark ? '#ff5566' : '#ff2d2d',
  }), [isDark, tokens]);

  const displayName = user?.firstName || user?.lastName ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : t.user;
  const { width } = useWindowDimensions();
  // Treat widths less than 768px as phone-sized devices
  const isPhone = width < 768;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const isExpoGo = (Constants as any).appOwnership === 'expo' || (Constants as any).executionEnvironment === 'storeClient';
  // How much of the sun should remain visible when we push it into the status bar area.
  // Increase this value to show more of the sun (pixels). We use a modest default so it still overlaps but not too much.
  const sunOverlap = 28;
  // Small device-specific nudge to ensure the sun reaches the very top on phones where a thin gap appears.
  const sunTopNudge = Platform.select({ android: 8, ios: 4, default: 6 });
  // On web safe-area insets are usually 0 which would produce a positive top (gap).
  // Use the web formula in Expo Go as well so the header composition matches web.
  const sunTop = Platform.OS === 'web' || isExpoGo
    ? -Math.round(sunOverlap / 2)
    : -insets.top + sunOverlap - (sunTopNudge as number);

  const openContactModal = () => {
    setContactError('');
    setContactForm((prev) => {
      const next = { ...prev };
      if (!next.name) next.name = displayName || '';
      if (!next.email) next.email = user?.email || '';
      return next;
    });
    setContactModalOpen(true);
  };

  const handleContactChange = (key: 'name' | 'email' | 'message', value: string) => {
    setContactForm((prev) => ({ ...prev, [key]: value }));
    if (contactError) setContactError('');
  };

  const handleContactSubmit = async () => {
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const message = contactForm.message.trim();
    if (!name || !email || !message) {
      setContactError(t.contactErrorRequired);
      return;
    }

    setContactSending(true);
    setContactError('');
    try {
      await api.post('/api/contact', { name, email, message });
      setContactModalOpen(false);
      setContactForm({ name: '', email: '', message: '' });
      setToastMessage(t.contactSuccess);
      setToastVisible(true);
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error;
      setContactError(apiMessage || t.contactErrorGeneric);
    } finally {
      setContactSending(false);
    }
  };

  return (
    <ProtectedRoute>
      <GuestModeRestriction allowedRoutes={[]}>
        <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>      
      <ScrollView contentContainerStyle={[styles.scrollContent, { position: 'relative' }]} showsVerticalScrollIndicator={false}>
        {/* Decorative sun image stuck to the very top-right (overlaps status bar) but is part of scroll content so it will scroll away. */}
        <View
          style={[styles.sunWrapper, { position: 'absolute', top: sunTop, right: 0 }, (Platform.OS === 'web' || isExpoGo) ? { pointerEvents: 'none' } : undefined]}
          {...((Platform.OS !== 'web' && !isExpoGo) ? { pointerEvents: 'none' } : {})}
        > 
          <Image
            source={isDark ? require('../../assets/images/night.png') : require('../../assets/images/sun.png')}
            resizeMode="contain"
            style={[styles.sunImage, isDark && styles.nightShift]}
          />
        </View>
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={[palette.headerBgStart, palette.headerBgEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >            
              <Ionicons name="arrow-back" size={24} color={palette.headerText} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>{t.profile}</ThemedText>
          </View>
          {/* Greeting placed in the blue header. Name is pulled from user and colored yellow. */}
          <View style={styles.greetingContainer}>
            {/* Render greeting differently on phones vs larger devices:
                - On phones: "Ceau <Prenume>\n<Nume>!"
                - On larger devices: "Ceau <Prenume> <Nume>!" all on one line
            */}
            <ThemedText style={[styles.greetingText, { color: palette.headerText }]}>
              {t.greeting}{' '}
              {isPhone ? (
                <>
                  <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{firstName || t.user}</ThemedText>
                  {lastName ? <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{' \n'}{lastName}</ThemedText> : null}
                  <ThemedText style={[styles.greetingText, { color: palette.headerText }]}>{' '}</ThemedText>
                  <ThemedText style={[styles.greetingText, { color: palette.headerText }]}>{'!'}</ThemedText>
                  <ThemedText style={[styles.greetingText, { color: palette.headerText }]} accessibilityLabel="emoji-hand">👋</ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : t.user}!👋</ThemedText>
              )}
            </ThemedText>
          </View>
         </LinearGradient>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.avatarContainer}>
              <View style={styles.avatarOuter}>
              <View style={[styles.halfTop, { backgroundColor: isDark ? 'rgb(40, 40, 40)' : '#ffffff' }]} />
              <View style={[styles.halfBottom, { backgroundColor: isDark ? 'rgb(40, 40, 40)' : '#ffffff' }]} />
              <View style={[styles.avatarInner, { backgroundColor: tokens.colors.surface }]}> 
                {user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.surface }]}>
                    <Ionicons name="person" size={50} color={palette.iconColor} />
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <ThemedText style={[styles.userName, { color: tokens.colors.text }]}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : t.user}
          </ThemedText>

          {user?.isAdmin && (
            <View style={[styles.adminBadge, { borderColor: palette.emphasisBg }]}> 
              <Ionicons name="shield-checkmark" size={14} color={palette.emphasisBg} />
              <ThemedText style={[styles.adminBadgeText, { color: palette.emphasisBg }]}>{t.adminBadge}</ThemedText>
            </View>
          )}
          
          {user?.email && (
            <ThemedText style={[styles.userInfo, { color: tokens.colors.muted }]}>
              {user.email}
            </ThemedText>
          )}
        </View>

        {/* Account Options Group */}
        <View style={styles.section}>          
          {accountRows.map((r) => {
            if (r.type === 'switch') {
              return (
                <View key={r.key} style={[styles.row, { backgroundColor: tokens.colors.surface }]}>                  
                  <View style={styles.rowLeft}>                    
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? tokens.colors.elev : '#F3F5F6' }]}>
                      <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                    </View>
                    <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                    thumbColor={'#ffffff'}
                    trackColor={{ false: tokens.colors.border, true: '#f51866' }}
                  />
                </View>
              );
            }
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.7}
                style={[styles.row, { backgroundColor: tokens.colors.surface }]}
                onPress={r.key === 'contact' ? openContactModal : r.action}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
                    <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {r.key === 'language' && (
                    <ThemedText style={{ color: tokens.colors.muted }}>
                      {normalizedLocale === 'en' ? 'English' : normalizedLocale === 'es' ? 'Espanol' : 'Romana'}
                    </ThemedText>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={tokens.colors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Options Group */}
        <View style={styles.section}>
          {infoRows.map((r) => (
            <TouchableOpacity
              key={r.key}
              activeOpacity={0.7}
              style={[styles.row, { backgroundColor: tokens.colors.surface }]}
              onPress={r.action}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
                  <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                </View>
                <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutTextContainer}
            onPress={() => setConfirmVisible(true)}
          >
            <ThemedText style={[styles.logoutTextRed, { color: palette.danger }]}>{t.logout}</ThemedText>
            <View style={[styles.logoutUnderline, { backgroundColor: palette.danger }]} />
          </TouchableOpacity>
        </View>

        {/* Confirmation modal */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setConfirmVisible(false)}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 1000 }]}
          >
            <View style={[styles.logoutModalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <View style={[styles.modalIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}> 
                <Ionicons name="log-out-outline" size={32} color={palette.danger} />
              </View>

              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>{t.logoutConfirmTitle}</ThemedText>
              <ThemedText style={[styles.modalMessage, { color: tokens.colors.muted }]}>{t.logoutConfirmMessage}</ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg, borderColor: tokens.colors.border }]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <ThemedText style={[styles.modalButtonText, { color: tokens.colors.text }]}>{t.cancel}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: palette.emphasisBg }]}
                  onPress={async () => {
                    try {
                      await logout();
                      setConfirmVisible(false);
                      router.replace('/login');
                    } catch (e) {
                      console.warn('Logout failed', e);
                      setConfirmVisible(false);
                    }
                  }}
                >
                  <ThemedText style={[styles.modalButtonText, { color: '#ffffff', fontWeight: '700' }]}>{t.confirmLogout}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
        {/* Language selector modal */}
        <Modal
          visible={languageModalOpen}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setLanguageModalOpen(false)}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 1000 }]}
          >
            <View style={[styles.logoutModalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <TouchableOpacity style={styles.closeButton} onPress={() => setLanguageModalOpen(false)}>
                <Ionicons name="close" size={20} color={tokens.colors.muted} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>{t.selectLanguage}</ThemedText>
              <View style={{ marginTop: 8, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { marginBottom: 8, backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
                  onPress={async () => {
                    await setGlobalLocale('ro');
                    setLanguageModalOpen(false);
                    // Wait for modal close animation to complete before showing toast
                    setTimeout(() => {
                      setToastMessage(getAccountTranslations('ro').languageChanged);
                      setToastVisible(true);
                    }, 300);
                  }}
                >
                  <ThemedText style={{ color: tokens.colors.text, fontSize: 16 }}>Română</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { marginBottom: 8, backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
                  onPress={async () => {
                    await setGlobalLocale('en');
                    setLanguageModalOpen(false);
                    // Wait for modal close animation to complete before showing toast
                    setTimeout(() => {
                      setToastMessage(getAccountTranslations('en').languageChanged);
                      setToastVisible(true);
                    }, 300);
                  }}
                >
                  <ThemedText style={{ color: tokens.colors.text, fontSize: 16 }}>English</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}
                  onPress={async () => {
                    await setGlobalLocale('es');
                    setLanguageModalOpen(false);
                    setTimeout(() => {
                      setToastMessage(getAccountTranslations('es').languageChanged);
                      setToastVisible(true);
                    }, 300);
                  }}
                >
                  <ThemedText style={{ color: tokens.colors.text, fontSize: 16 }}>Español</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Contact modal */}
        <Modal
          visible={contactModalOpen}
          transparent
          animationType="fade"
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setContactModalOpen(false)}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 1000 }]}
          >
            <View style={[styles.logoutModalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <TouchableOpacity style={styles.closeButton} onPress={() => setContactModalOpen(false)}>
                <Ionicons name="close" size={20} color={tokens.colors.muted} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>{t.contactTitle}</ThemedText>
              <ThemedText style={[styles.modalMessage, { color: tokens.colors.muted }]}>{t.contactSubtitle}</ThemedText>

              <View style={{ marginTop: 16, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: tokens.colors.muted }]}>{t.contactNameLabel}</Text>
                <TextInput
                  style={[styles.inputField, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                  value={contactForm.name}
                  onChangeText={(value) => handleContactChange('name', value)}
                  autoCapitalize="words"
                  placeholder={t.contactNameLabel}
                  placeholderTextColor={tokens.colors.placeholder}
                />

                <Text style={[styles.inputLabel, { color: tokens.colors.muted }]}>{t.contactEmailLabel}</Text>
                <TextInput
                  style={[styles.inputField, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                  value={contactForm.email}
                  onChangeText={(value) => handleContactChange('email', value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder={t.contactEmailLabel}
                  placeholderTextColor={tokens.colors.placeholder}
                />

                <Text style={[styles.inputLabel, { color: tokens.colors.muted }]}>{t.contactMessageLabel}</Text>
                <TextInput
                  style={[styles.textArea, { color: tokens.colors.text, borderColor: tokens.colors.border }]}
                  value={contactForm.message}
                  onChangeText={(value) => handleContactChange('message', value)}
                  multiline
                  textAlignVertical="top"
                  placeholder={t.contactMessageLabel}
                  placeholderTextColor={tokens.colors.placeholder}
                />

                {!!contactError && (
                  <ThemedText style={[styles.errorText, { color: '#dc3545' }]}>{contactError}</ThemedText>
                )}
              </View>

              <View style={[styles.modalButtons, { marginTop: 20 }]}> 
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg, borderColor: tokens.colors.border }]}
                  onPress={() => setContactModalOpen(false)}
                  disabled={contactSending}
                >
                  <ThemedText style={[styles.modalButtonText, { color: tokens.colors.text }]}>{t.contactCancel}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: palette.emphasisBg, opacity: contactSending ? 0.7 : 1 }]}
                  onPress={handleContactSubmit}
                  disabled={contactSending}
                >
                  <ThemedText style={[styles.modalButtonText, { color: '#ffffff', fontWeight: '700' }]}> 
                    {contactSending ? '...' : t.contactSend}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </ScrollView>
      
      {/* Toast notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
      </GuestModeRestriction>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingBottom: 90,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // keep content left-aligned; title will sit to the right of the back button
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 28,
    marginBottom: 54,
    paddingHorizontal: 4,
  },
  greetingText: 
  {
    fontSize: 40,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    lineHeight: 44,
  },
  profileCard: {
    marginTop: -80,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 70,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatarContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#2ecc71',
  },
  // Two-tone avatar outer ring
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  halfBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 16, 
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { 
    fontSize: 16, 
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  modalCard: { 
    width: '100%', 
    maxWidth: 340, 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 10,
  },
  modalMessage: { 
    fontSize: 15, 
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalButtons: { 
    flexDirection: 'row', 
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1.5,
  },
  modalButtonConfirm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  logoutTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
    backgroundColor: 'transparent',
  },
  logoutTextRed: {
    color: '#ff2d2d',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  logoutUnderline: {
    marginTop: 6,
    width: 56,
    height: 4,
    backgroundColor: '#ff2d2d',
    borderRadius: 2,
  },
  adminBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Sun decoration in top-right corner
  sunWrapper: {
    position: 'absolute',
    width: 128,
    height: 128,
    zIndex: 50,
    elevation: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunImage: {
    width: '100%',
    height: '100%',
  },
  nightShift: {
    transform: [{ translateY: 8 }],
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
