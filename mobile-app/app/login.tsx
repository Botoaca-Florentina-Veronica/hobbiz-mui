import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { ThemedTextInput } from '../components/themed-text-input';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useLocale } from '../src/context/LocaleContext';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../src/services/api';
import { saveToken } from '../src/services/auth';
import type { LoginError } from '../src/services/auth';

WebBrowser.maybeCompleteAuthSession();

export const options = {
  headerShown: false,
};

const TRANSLATIONS = {
  ro: {
    title: 'Intră în cont',
    emailPlaceholder: 'Adresa ta de email',
    passwordPlaceholder: 'Parolă',
    signIn: 'Intră în cont',
    connecting: 'Se conectează...',
    forgotPassword: 'Ai uitat parola?',
    createAccount: 'Creează cont',
    or: 'SAU',
    continueWithGoogle: 'Continuă cu Google',
    continueWithFacebook: 'Continuă cu Facebook',
    continueWithApple: 'Continuă cu Apple',
    socialAuthNotice: 'Autentificarea socială este disponibilă momentan doar cu Google. Facebook și Apple sunt în curs de implementare.',
    showPassword: 'Arată parola',
    hidePassword: 'Ascunde parola',
    invalidCredentials: 'Email sau parolă incorecte.',
    attemptsLeft: (n: number) =>
      n === 1
        ? `Atenție: mai ai 1 încercare înainte de blocare.`
        : `Atenție: mai ai ${n} încercări înainte de blocare.`,
    warningLastAttempt: 'Ultima șansă! O parolă greșită în plus și contul va fi blocat 1 oră.',
    accountLocked: (minutes: number) =>
      `Prea multe încercări. Încearcă din nou în ${minutes} ${minutes === 1 ? 'minut' : 'minute'}.`,
    authError: 'Eroare la autentificare',
    googleAuthError: 'Eroare la autentificarea cu Google',
  },
  en: {
    title: 'Sign in',
    emailPlaceholder: 'Your email address',
    passwordPlaceholder: 'Password',
    signIn: 'Sign in',
    connecting: 'Connecting...',
    forgotPassword: 'Forgot password?',
    createAccount: 'Create account',
    or: 'OR',
    continueWithGoogle: 'Continue with Google',
    continueWithFacebook: 'Continue with Facebook',
    continueWithApple: 'Continue with Apple',
    socialAuthNotice: 'Social login is currently available only with Google. Facebook and Apple are in progress.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    invalidCredentials: 'Incorrect email or password.',
    attemptsLeft: (n: number) =>
      n === 1
        ? `Warning: 1 attempt remaining before lockout.`
        : `Warning: ${n} attempts remaining before lockout.`,
    warningLastAttempt: 'Last chance! One more wrong password and your account will be locked for 1 hour.',
    accountLocked: (minutes: number) =>
      `Too many failed attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    authError: 'Authentication error',
    googleAuthError: 'Error during Google authentication',
  },
  es: {
    title: 'Iniciar sesión',
    emailPlaceholder: 'Tu dirección de correo',
    passwordPlaceholder: 'Contraseña',
    signIn: 'Iniciar sesión',
    connecting: 'Conectando...',
    forgotPassword: '¿Olvidaste tu contraseña?',
    createAccount: 'Crear cuenta',
    or: 'O',
    continueWithGoogle: 'Continuar con Google',
    continueWithFacebook: 'Continuar con Facebook',
    continueWithApple: 'Continuar con Apple',
    socialAuthNotice: 'El inicio de sesión social está disponible por ahora solo con Google. Facebook y Apple están en desarrollo.',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    attemptsLeft: (n: number) =>
      n === 1
        ? `Atención: te queda 1 intento antes del bloqueo.`
        : `Atención: te quedan ${n} intentos antes del bloqueo.`,
    warningLastAttempt: '¡Última oportunidad! Una contraseña incorrecta más y tu cuenta será bloqueada 1 hora.',
    accountLocked: (minutes: number) =>
      `Demasiados intentos fallidos. Inténtalo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`,
    authError: 'Error de autenticación',
    googleAuthError: 'Error en la autenticación con Google',
  },
} as const;

type ErrorState = {
  type: 'error' | 'warning' | 'locked';
  message: string;
  attemptsLeft?: number;
  lockedUntil?: Date;
} | null;

export default function LoginScreen() {
  const { tokens } = useAppTheme();
  const { login, loading, isAuthenticated, restore } = useAuth();
  const { locale } = useLocale();
  const tr = TRANSLATIONS[locale] ?? TRANSLATIONS.ro;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const getCardWidth = (): number | string => {
    if (width < 600) return '100%';
    if (width < 900) return '80%';
    if (width < 1200) return '50%';
    return '40%';
  };

  const isSmallDevice = width < 600;
  const isMediumDevice = width >= 600 && width < 900;
  const isLargeDevice = width >= 900 && width < 1200;

  const responsiveSizes = {
    titleSize: isSmallDevice ? 26 : isMediumDevice ? 30 : isLargeDevice ? 34 : 38,
    inputPadding: isSmallDevice ? 12 : 16,
    inputFontSize: isSmallDevice ? 15 : 17,
    buttonPadding: isSmallDevice ? 14 : isMediumDevice ? 18 : isLargeDevice ? 18 : 20,
    buttonFontSize: isSmallDevice ? 15 : 17,
    cardPadding: isSmallDevice ? 24 : isMediumDevice ? 28 : isLargeDevice ? 32 : 36,
    cardGap: isSmallDevice ? 16 : isMediumDevice ? 18 : isLargeDevice ? 20 : 22,
    socialButtonGap: isSmallDevice ? 12 : isMediumDevice ? 16 : 18,
    iconSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
    linkFontSize: isSmallDevice ? 13 : isMediumDevice ? 16 : 15,
  };

  const cardStyle = {
    width: getCardWidth() as any,
    maxWidth: 650,
    alignSelf: 'center' as const,
    padding: responsiveSizes.cardPadding,
    gap: responsiveSizes.cardGap,
  };

  const clearError = () => {
    setErrorState(null);
    setCountdown('');
  };

  useEffect(() => {
    if (errorState?.type !== 'locked' || !errorState.lockedUntil) {
      setCountdown('');
      return;
    }
    const until = errorState.lockedUntil;
    const tick = () => {
      const diff = until.getTime() - Date.now();
      if (diff <= 0) {
        clearError();
        return;
      }
      const totalSecs = Math.ceil(diff / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setCountdown(`${mins}:${String(secs).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorState?.type, errorState?.lockedUntil]);

  async function onSubmit() {
    clearError();
    try {
      const ok = await login(email.trim(), password);
      if (!ok) {
        setErrorState({ type: 'error', message: tr.invalidCredentials });
        return;
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      const err = e as LoginError;
      const code = err.code;

      if (code === 'warning_last_attempt') {
        setErrorState({ type: 'warning', message: tr.warningLastAttempt });
      } else if (code === 'account_locked') {
        const until = err.lockedUntil
          ? new Date(err.lockedUntil)
          : new Date(Date.now() + 60 * 60 * 1000);
        const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
        setErrorState({ type: 'locked', message: tr.accountLocked(minutes), lockedUntil: until });
      } else {
        const attemptsLeft = typeof err.attemptsLeft === 'number' ? err.attemptsLeft : undefined;
        setErrorState({
          type: 'error',
          message: tr.invalidCredentials,
          attemptsLeft,
        });
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated) router.replace('/(tabs)');
  }, [isAuthenticated, router]);

  const onForgotPassword = () => router.push('/forgot-password');

  const handleOAuthRedirectUrl = async (url?: string) => {
    if (!url) return false;
    const parsed = Linking.parse(url);
    const token = (parsed?.queryParams as any)?.token as string | undefined;
    if (token) {
      await saveToken(token);
      (api.defaults.headers as any).Authorization = `Bearer ${token}`;
      await restore();
      router.replace('/(tabs)');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const handler = async (event: { url: string }) => {
      try {
        await handleOAuthRedirectUrl(event.url || '');
      } catch (e: any) {
        Alert.alert(tr.title, e?.message || tr.authError);
      } finally {
        setSocialLoading(false);
      }
    };
    const sub = Linking.addEventListener('url', handler);
    return () => { try { sub.remove(); } catch {} };
  }, [restore, router]);

  async function onGoogleLogin() {
    try {
      clearError();
      setSocialLoading(true);
      let rawBase = '';
      try { rawBase = String((api.defaults as any).baseURL || ''); } catch {}
      const baseURL = (rawBase || 'https://hobbiz-mui.onrender.com').replace(/\/+$/, '');

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.location.href = `${baseURL}/auth/google?state=web`;
        setSocialLoading(false);
        return;
      }

      const redirectUrl = (Linking.createURL && typeof Linking.createURL === 'function')
        ? Linking.createURL('oauth')
        : 'mobileapp://oauth';
      const authUrl = `${baseURL}/auth/google?state=mobile&mobile=1&redirect=${encodeURIComponent(redirectUrl)}`;

      let result;
      try {
        result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, { showInRecents: true, createTask: true });
      } catch (e) {
        throw e;
      }
      if (result && 'url' in result && result.url) {
        const finished = await handleOAuthRedirectUrl(result.url);
        if (finished) return;
      }
    } catch (e: any) {
      setErrorState({ type: 'error', message: e?.message || tr.googleAuthError });
      setSocialLoading(false);
    }
  }

  // Culori pentru stările de eroare (light/dark mode)
  const errorColors = {
    error: {
      bg: tokens.colors.errorBg ?? (tokens.colors.isDark ? '#2d0000' : '#fff0f0'),
      border: tokens.colors.errorBorder ?? (tokens.colors.isDark ? '#661111' : '#ffcccc'),
      text: tokens.colors.errorText ?? (tokens.colors.isDark ? '#ff7070' : '#cc0000'),
    },
    warning: {
      bg: tokens.colors.warningBg ?? (tokens.colors.isDark ? '#2e2000' : '#fff8e1'),
      border: tokens.colors.warningBorder ?? '#ffc107',
      text: tokens.colors.warningText ?? (tokens.colors.isDark ? '#ffd54f' : '#7a5500'),
    },
    locked: {
      bg: tokens.colors.errorBg ?? (tokens.colors.isDark ? '#2d0000' : '#fff0f0'),
      border: tokens.colors.errorBorder ?? (tokens.colors.isDark ? '#661111' : '#ffcccc'),
      text: tokens.colors.errorText ?? (tokens.colors.isDark ? '#ff7070' : '#cc0000'),
    },
  };

  const isLocked = errorState?.type === 'locked';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, cardStyle, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <ThemedText style={[styles.title, { color: tokens.colors.text, fontSize: responsiveSizes.titleSize }]}>
            {tr.title}
          </ThemedText>

          {/* Butoane sociale */}
          <View style={[styles.socialGroup, { gap: responsiveSizes.socialButtonGap }]}>
            <TouchableOpacity
              style={[styles.socialBtn, styles.googleBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border, opacity: socialLoading ? 0.7 : 1, paddingVertical: responsiveSizes.buttonPadding }]}
              activeOpacity={0.85}
              onPress={socialLoading ? undefined : onGoogleLogin}
            >
              {socialLoading ? (
                <ActivityIndicator style={{ marginRight: 12 }} />
              ) : (
                <Image
                  source={{ uri: 'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_64dp.png' }}
                  style={[styles.googleImage, { width: responsiveSizes.iconSize + 2, height: responsiveSizes.iconSize + 2 }]}
                />
              )}
              <ThemedText style={[styles.socialText, { color: tokens.colors.text, fontSize: responsiveSizes.buttonFontSize }]}>
                {socialLoading ? tr.connecting : tr.continueWithGoogle}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, styles.facebookBtn, { paddingVertical: responsiveSizes.buttonPadding, opacity: 0.6 }]}
              activeOpacity={0.85}
              disabled
            >
              <Ionicons name="logo-facebook" size={responsiveSizes.iconSize} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
              <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
                {tr.continueWithFacebook}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn, { paddingVertical: responsiveSizes.buttonPadding, opacity: 0.6 }]}
              activeOpacity={0.85}
              disabled
            >
              <Ionicons name="logo-apple" size={responsiveSizes.iconSize} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
              <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
                {tr.continueWithApple}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Notice social auth */}
          <View style={[styles.socialNotice, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surfaceSecondary || tokens.colors.surface }]}>
            <Ionicons name="information-circle-outline" size={18} color={tokens.colors.primary} style={styles.socialNoticeIcon} />
            <ThemedText style={[styles.socialNoticeText, { color: tokens.colors.muted }]}>
              {tr.socialAuthNotice}
            </ThemedText>
          </View>

          {/* Separator */}
          <View style={styles.dividerWrap}>
            <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
            <ThemedText style={[styles.dividerText, { color: tokens.colors.muted }]}>{tr.or}</ThemedText>
            <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
          </View>

          {/* Câmpuri */}
          <ThemedTextInput
            style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text, paddingHorizontal: 14, paddingVertical: responsiveSizes.inputPadding, fontSize: responsiveSizes.inputFontSize }]}
            placeholder={tr.emailPlaceholder}
            placeholderTextColor={tokens.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(v) => { setEmail(v); clearError(); }}
          />
          <View style={styles.passwordWrapper}>
            <ThemedTextInput
              style={[styles.input, styles.passwordInput, { borderColor: tokens.colors.border, color: tokens.colors.text, paddingHorizontal: 14, paddingVertical: responsiveSizes.inputPadding, fontSize: responsiveSizes.inputFontSize }]}
              placeholder={tr.passwordPlaceholder}
              placeholderTextColor={tokens.colors.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => { setPassword(v); clearError(); }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(s => !s)}
              activeOpacity={0.7}
              style={styles.eyeBtn}
              accessibilityLabel={showPassword ? tr.hidePassword : tr.showPassword}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={tokens.colors.muted || '#666'} />
            </TouchableOpacity>
          </View>

          {/* Mesaj eroare / avertisment / blocat */}
          {errorState && (
            <View style={[
              styles.errorBox,
              {
                backgroundColor: errorColors[errorState.type].bg,
                borderColor: errorColors[errorState.type].border,
              }
            ]}>
              <ThemedText style={[styles.errorIcon]}>
                {errorState.type === 'warning' ? '⚠️' : errorState.type === 'locked' ? '🔒' : ''}
              </ThemedText>
              <View style={styles.errorTextWrap}>
                <ThemedText style={[styles.errorText, { color: errorColors[errorState.type].text }]}>
                  {errorState.message}
                  {errorState.type === 'locked' && countdown ? (
                    <ThemedText style={[styles.countdown, { color: errorColors.locked.text }]}>
                      {' '}({countdown})
                    </ThemedText>
                  ) : null}
                </ThemedText>
                {errorState.type === 'error' && typeof errorState.attemptsLeft === 'number' && errorState.attemptsLeft <= 3 && errorState.attemptsLeft > 0 && (
                  <ThemedText style={[styles.attemptsLeft, { color: errorColors.error.text }]}>
                    {tr.attemptsLeft(errorState.attemptsLeft)}
                  </ThemedText>
                )}
              </View>
            </View>
          )}

          {/* Buton login */}
          <TouchableOpacity
            disabled={loading || isLocked}
            style={[styles.loginBtn, { backgroundColor: tokens.colors.primary, opacity: (loading || isLocked) ? 0.6 : 1, paddingVertical: responsiveSizes.buttonPadding }]}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={tokens.colors.primaryContrast} />
            ) : (
              <ThemedText style={[styles.loginText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
                {tr.signIn}
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <TouchableOpacity onPress={onForgotPassword}>
              <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
                {tr.forgotPassword}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
                {tr.createAccount}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, minHeight: '100%' },
  card: { borderWidth: 1, borderRadius: 14, width: '100%' },
  title: { fontWeight: '700' },
  socialGroup: {},
  socialBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  socialIcon: { marginRight: 10 },
  socialText: { fontWeight: '600' },
  googleBtn: {},
  googleImage: { marginRight: 12 },
  facebookBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  socialNotice: { marginTop: -2, marginBottom: 2, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'flex-start' },
  socialNoticeIcon: { marginRight: 8, marginTop: 1 },
  socialNoticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, borderBottomWidth: 1 },
  dividerText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 8 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center', padding: 6 },
  errorBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorIcon: { fontSize: 15, lineHeight: 20 },
  errorTextWrap: { flex: 1 },
  errorText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  attemptsLeft: { fontSize: 12, lineHeight: 16, marginTop: 3, opacity: 0.85 },
  countdown: { fontSize: 12, fontVariant: ['tabular-nums'] },
  loginBtn: { borderRadius: 8, alignItems: 'center' },
  loginText: { fontWeight: '600' },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { fontWeight: '500' },
});
