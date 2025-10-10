import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';

export const options = {
  headerShown: false,
};

export default function LoginScreen() {
  const { tokens } = useAppTheme();
  const { login, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    try {
      const ok = await login(email.trim(), password);
      if (!ok) {
        setError('Date de autentificare invalide');
        return;
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Eroare la autentificare');
    }
  }

  if (isAuthenticated) {
    // Already logged; redirect silently
    setTimeout(() => router.replace('/(tabs)'), 0);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
        <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Intră în cont</ThemedText>
        <View style={styles.socialGroup}>
          <TouchableOpacity style={[styles.socialBtn, styles.googleBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]} activeOpacity={0.85} onPress={() => {/* TODO: implement Google OAuth for mobile */}}>
            <Image source={{ uri: 'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_64dp.png' }} style={styles.googleImage} />
            <ThemedText style={[styles.socialText, { color: tokens.colors.text }]}>Continuă cu Google</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.facebookBtn, { backgroundColor: '#1877f2' }]} activeOpacity={0.85} onPress={() => {/* placeholder */}}>
            <Ionicons name="logo-facebook" size={18} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast }]}>Continuă cu Facebook</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.appleBtn, { backgroundColor: '#000000' }]} activeOpacity={0.85} onPress={() => {/* placeholder */}}>
            <Ionicons name="logo-apple" size={18} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast }]}>Continuă cu Apple</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.dividerWrap}>
          <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
          <ThemedText style={[styles.dividerText, { color: tokens.colors.muted }]}>SAU</ThemedText>
          <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
        </View>
        <TextInput
          style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
          placeholder="Adresa ta de email"
          placeholderTextColor={tokens.colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[styles.input, styles.passwordInput, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
            placeholder="Parola"
            placeholderTextColor={tokens.colors.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            activeOpacity={0.7}
            style={styles.eyeBtn}
            accessibilityLabel={showPassword ? 'Ascunde parola' : 'Arată parola'}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={tokens.colors.muted || '#666'} />
          </TouchableOpacity>
        </View>
        {error ? <ThemedText style={[styles.error, { color: tokens.colors.primary }]}>{error}</ThemedText> : null}
        <TouchableOpacity
          disabled={loading}
          style={[styles.loginBtn, { backgroundColor: tokens.colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={tokens.colors.primaryContrast} /> : <ThemedText style={[styles.loginText, { color: tokens.colors.primaryContrast }]}>Intră în cont</ThemedText>}
        </TouchableOpacity>
        <View style={styles.linksRow}>
          <TouchableOpacity><ThemedText style={[styles.link, { color: tokens.colors.primary }]}>Ai uitat parola?</ThemedText></TouchableOpacity>
          <TouchableOpacity><ThemedText style={[styles.link, { color: tokens.colors.primary }]}>Creează cont</ThemedText></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'flex-start' },
  card: { borderWidth: 1, borderRadius: 14, padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  socialGroup: { gap: 12 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingVertical: 14, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  socialIcon: { marginRight: 10 },
  socialText: { fontSize: 14, fontWeight: '600' },
  googleBtn: { backgroundColor: '#fff', borderColor: '#e0e0e0' },
  googleImage: { width: 20, height: 20, marginRight: 12 },
  googleText: { color: '#000' },
  facebookBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, borderBottomWidth: 1 },
  dividerText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center', padding: 6 },
  error: { fontSize: 12, marginTop: -4 },
  loginBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { fontSize: 13, fontWeight: '500' },
});
