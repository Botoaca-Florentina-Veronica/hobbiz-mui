import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useLocale } from '../src/context/LocaleContext';
import { normalizeLocale } from '../src/i18n';
import api from '../src/services/api';
import { getRegisterChallenge, registerWithCredentials, saveToken } from '../src/services/auth';

export const options = { headerShown: false };

// ─── translations ────────────────────────────────────────────────────────────
const COPY = {
  ro: {
    title: 'Creează cont',
    firstName: 'Prenume',
    lastName: 'Nume',
    email: 'Adresa de email',
    password: 'Parolă',
    phone: 'Telefon (opțional)',
    cta: 'Creează cont',
    haveAccount: 'Ai deja cont?',
    login: 'Intră în cont',
    successTitle: 'Succes',
    successMsg: 'Cont creat cu succes! Te poți autentifica.',
    hints: {
      title: 'Parola trebuie să conțină:',
      minLength: 'Minim 8 caractere',
      lowercase: 'O literă mică',
      uppercase: 'O literă mare',
      digit: 'O cifră',
      special: 'Un caracter special',
      strong: 'Parolă puternică!',
    },
    errors: {
      emailExists: 'Există deja un cont cu această adresă de email.',
      phoneExists: 'Există deja un cont cu acest număr de telefon.',
      emailDisposable: 'Nu acceptăm adrese de email temporare.',
      recentlyDeleted: 'Cont șters recent. Poți crea un cont nou după {days} zile.',
      generic: 'Eroare la înregistrare. Încearcă din nou.',
    },
  },
  en: {
    title: 'Create account',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email address',
    password: 'Password',
    phone: 'Phone (optional)',
    cta: 'Create account',
    haveAccount: 'Already have an account?',
    login: 'Sign in',
    successTitle: 'Success',
    successMsg: 'Account created! You can now sign in.',
    hints: {
      title: 'Password must contain:',
      minLength: 'At least 8 characters',
      lowercase: 'A lowercase letter',
      uppercase: 'An uppercase letter',
      digit: 'A number',
      special: 'A special character',
      strong: 'Strong password!',
    },
    errors: {
      emailExists: 'An account with this email already exists.',
      phoneExists: 'An account with this phone number already exists.',
      emailDisposable: 'Temporary email addresses are not accepted.',
      recentlyDeleted: 'Account recently deleted. You can register again in {days} days.',
      generic: 'Registration error. Please try again.',
    },
  },
  es: {
    title: 'Crear cuenta',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    password: 'Contraseña',
    phone: 'Teléfono (opcional)',
    cta: 'Crear cuenta',
    haveAccount: '¿Ya tienes cuenta?',
    login: 'Iniciar sesión',
    successTitle: 'Éxito',
    successMsg: '¡Cuenta creada! Ya puedes iniciar sesión.',
    hints: {
      title: 'La contraseña debe contener:',
      minLength: 'Mínimo 8 caracteres',
      lowercase: 'Una letra minúscula',
      uppercase: 'Una letra mayúscula',
      digit: 'Un número',
      special: 'Un carácter especial',
      strong: '¡Contraseña fuerte!',
    },
    errors: {
      emailExists: 'Ya existe una cuenta con este correo.',
      phoneExists: 'Ya existe una cuenta con este teléfono.',
      emailDisposable: 'No aceptamos correos temporales.',
      recentlyDeleted: 'Cuenta eliminada recientemente. Podrás registrarte en {days} días.',
      generic: 'Error de registro. Inténtalo de nuevo.',
    },
  },
} as const;

type Locale = keyof typeof COPY;

// ─── password strength bar + hints ──────────────────────────────────────────
const BAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

function PasswordStrength({ password, t }: { password: string; t: typeof COPY['ro'] }) {
  const { tokens, isDark } = useAppTheme();

  const rules = useMemo(() => [
    { key: 'minLength', ok: password.length >= 8,    label: t.hints.minLength },
    { key: 'lowercase', ok: /[a-z]/.test(password),  label: t.hints.lowercase },
    { key: 'uppercase', ok: /[A-Z]/.test(password),  label: t.hints.uppercase },
    { key: 'digit',     ok: /\d/.test(password),     label: t.hints.digit },
    { key: 'special',   ok: /[^A-Za-z0-9]/.test(password), label: t.hints.special },
  ], [password, t]);

  const metCount = rules.filter(r => r.ok).length;
  const level = password ? Math.min(4, Math.ceil(metCount * 4 / 5)) : 0;
  const allMet = metCount === rules.length;
  const barColor = level > 0 ? BAR_COLORS[level - 1] : (isDark ? '#333' : '#e5e7eb');
  const mutedColor = isDark ? '#555' : '#d1d5db';
  const ruleOkColor = '#22c55e';
  const ruleMissingColor = isDark ? '#888' : '#9ca3af';

  if (!password) return null;

  return (
    <View style={strengthStyles.container}>
      {/* 4-segment strength bar */}
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= level ? barColor : mutedColor },
            ]}
          />
        ))}
      </View>

      {/* hints */}
      {allMet ? (
        <View style={strengthStyles.allMetRow}>
          <Ionicons name="checkmark-circle" size={14} color={ruleOkColor} />
          <ThemedText style={[strengthStyles.allMetText, { color: ruleOkColor }]}>
            {t.hints.strong}
          </ThemedText>
        </View>
      ) : (
        <View style={strengthStyles.rulesGrid}>
          {rules.map(rule => (
            <View key={rule.key} style={strengthStyles.ruleRow}>
              <ThemedText style={[strengthStyles.ruleIcon, { color: rule.ok ? ruleOkColor : ruleMissingColor }]}>
                {rule.ok ? '✓' : '○'}
              </ThemedText>
              <ThemedText style={[strengthStyles.ruleText, { color: rule.ok ? ruleOkColor : ruleMissingColor }]}>
                {rule.label}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────
export default function SignupScreen() {
  const { tokens, isDark } = useAppTheme();
  const { restore } = useAuth();
  const { locale } = useLocale();
  const lang = normalizeLocale(locale) as Locale;
  const t = COPY[lang] ?? COPY.ro;
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [firstName, setFirstName]   = useState('');
  const [lastName,  setLastName]    = useState('');
  const [email,     setEmail]       = useState('');
  const [password,  setPassword]    = useState('');
  const [phone,     setPhone]       = useState('');
  const [showPwd,   setShowPwd]     = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState('');

  const formTokenRef = useRef<{ token: string; fetchedAt: number } | null>(null);

  useEffect(() => {
    getRegisterChallenge()
      .then(token => { formTokenRef.current = { token, fetchedAt: Date.now() }; })
      .catch(() => {});
  }, []);

  const isSmall  = width < 600;
  const isMedium = width >= 600 && width < 900;

  const rs = {
    titleSize:    isSmall ? 26 : isMedium ? 30 : 34,
    inputPad:     isSmall ? 13 : 15,
    inputFont:    isSmall ? 15 : 16,
    btnPad:       isSmall ? 15 : 17,
    btnFont:      isSmall ? 15 : 16,
    cardPad:      isSmall ? 20 : isMedium ? 28 : 32,
    cardGap:      isSmall ? 14 : 16,
    linkFont:     isSmall ? 13 : 14,
  };

  const inputStyle = (extra?: object) => [
    styles.input,
    {
      borderColor: tokens.colors.border,
      backgroundColor: isDark ? tokens.colors.elev ?? tokens.colors.surface : '#fafafa',
      color: tokens.colors.text,
      paddingHorizontal: 14,
      paddingVertical: rs.inputPad,
      fontSize: rs.inputFont,
    },
    extra,
  ];

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      // Fetch or refresh the form challenge token (backend anti-bot requirement)
      const TOKEN_MAX_AGE_MS = 14 * 60 * 1000;
      let tokenData = formTokenRef.current;
      if (!tokenData || Date.now() - tokenData.fetchedAt > TOKEN_MAX_AGE_MS) {
        const token = await getRegisterChallenge();
        tokenData = { token, fetchedAt: Date.now() };
        formTokenRef.current = tokenData;
      }
      // Backend requires >= 2s between token issuance and use
      const age = Date.now() - tokenData.fetchedAt;
      if (age < 2100) {
        await new Promise<void>(resolve => setTimeout(resolve, 2100 - age));
      }

      const res = await registerWithCredentials({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        phone:     phone.trim() || undefined,
        _formToken: tokenData.token,
      });

      const token = (res as any)?.token as string | undefined;
      if (token) {
        await saveToken(token);
        (api.defaults.headers as any).Authorization = `Bearer ${token}`;
        await restore();
        router.replace('/(tabs)');
        return;
      }
      Alert.alert(t.successTitle, t.successMsg, [{ text: 'OK', onPress: () => router.replace('/login') }]);
    } catch (e: any) {
      const code: string = e?.code || e?.response?.data?.code || '';
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setError(t.errors.emailExists);
      } else if (code === 'PHONE_ALREADY_EXISTS') {
        setError(t.errors.phoneExists);
      } else if (code === 'EMAIL_DISPOSABLE') {
        setError(t.errors.emailDisposable);
      } else if (code === 'ACCOUNT_RECENTLY_DELETED') {
        const days = e?.daysLeft ?? '?';
        setError(t.errors.recentlyDeleted.replace('{days}', String(days)));
      } else {
        setError(e?.message || t.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!firstName.trim() && !!lastName.trim() && !!email.trim() && !!password;

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
        <View
          style={[
            styles.card,
            {
              width: isSmall ? '100%' : isMedium ? '85%' : '70%',
              maxWidth: 520,
              padding: rs.cardPad,
              gap: rs.cardGap,
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={tokens.colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: tokens.colors.text, fontSize: rs.titleSize }]}>
              {t.title}
            </ThemedText>
            <View style={styles.backBtn} />
          </View>

          {/* Name row — side by side on wider screens */}
          <View style={[styles.nameRow, isSmall && styles.nameRowStacked]}>
            <ThemedTextInput
              style={inputStyle({ flex: 1 })}
              placeholder={t.firstName}
              placeholderTextColor={tokens.colors.placeholder}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
            />
            <ThemedTextInput
              style={inputStyle({ flex: 1 })}
              placeholder={t.lastName}
              placeholderTextColor={tokens.colors.placeholder}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
            />
          </View>

          {/* Email */}
          <ThemedTextInput
            style={inputStyle()}
            placeholder={t.email}
            placeholderTextColor={tokens.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={(v) => { setEmail(v); if (error) setError(''); }}
          />

          {/* Password + strength */}
          <View style={{ gap: 8 }}>
            <View style={styles.passwordWrapper}>
              <ThemedTextInput
                style={inputStyle(styles.passwordInput)}
                placeholder={t.password}
                placeholderTextColor={tokens.colors.placeholder}
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={(v) => { setPassword(v); if (error) setError(''); }}
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowPwd(s => !s)}
                activeOpacity={0.7}
                style={styles.eyeBtn}
                accessibilityLabel={showPwd ? 'Ascunde parola' : 'Arată parola'}
              >
                <Ionicons
                  name={showPwd ? 'eye-off' : 'eye'}
                  size={20}
                  color={tokens.colors.muted || '#888'}
                />
              </TouchableOpacity>
            </View>
            <PasswordStrength password={password} t={t} />
          </View>

          {/* Phone */}
          <ThemedTextInput
            style={inputStyle()}
            placeholder={t.phone}
            placeholderTextColor={tokens.colors.placeholder}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2', borderColor: '#fca5a5' }]}>
              <Ionicons name="alert-circle-outline" size={15} color="#ef4444" style={{ marginTop: 1 }} />
              <ThemedText style={[styles.errorText, { fontSize: rs.linkFont }]}>{error}</ThemedText>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            disabled={loading || !canSubmit}
            style={[
              styles.submitBtn,
              {
                backgroundColor: tokens.colors.primary,
                paddingVertical: rs.btnPad,
                opacity: loading || !canSubmit ? 0.6 : 1,
              },
            ]}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={tokens.colors.primaryContrast} />
            ) : (
              <ThemedText style={[styles.submitText, { color: tokens.colors.primaryContrast, fontSize: rs.btnFont }]}>
                {t.cta}
              </ThemedText>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.linksRow}>
            <ThemedText style={[styles.muted, { color: tokens.colors.muted, fontSize: rs.linkFont }]}>
              {t.haveAccount}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.85}>
              <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: rs.linkFont }]}>
                {t.login}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1 },
  scrollContent:  { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, minHeight: '100%' },
  card:           { borderWidth: 1, borderRadius: 16, alignSelf: 'center' },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  title:          { fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  nameRow:        { flexDirection: 'row', gap: 10 },
  nameRowStacked: { flexDirection: 'column' },
  input:          { borderWidth: 1, borderRadius: 10 },
  passwordWrapper:{ position: 'relative' },
  passwordInput:  { paddingRight: 50 },
  eyeBtn:         { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center' },
  errorBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  errorText:      { color: '#ef4444', flex: 1, lineHeight: 18 },
  submitBtn:      { borderRadius: 10, alignItems: 'center' },
  submitText:     { fontWeight: '700' },
  linksRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  link:           { fontWeight: '600' },
  muted:          { fontWeight: '400' },
});

const strengthStyles = StyleSheet.create({
  container:   { gap: 8 },
  bars:        { flexDirection: 'row', gap: 4, height: 4 },
  bar:         { flex: 1, borderRadius: 2 },
  allMetRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  allMetText:  { fontSize: 12, fontWeight: '600' },
  rulesGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ruleRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, width: '48%' },
  ruleIcon:    { fontSize: 11, width: 12 },
  ruleText:    { fontSize: 11, flexShrink: 1 },
});
