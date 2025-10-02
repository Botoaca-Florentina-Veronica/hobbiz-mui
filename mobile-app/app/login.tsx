import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { tokens } = useAppTheme();
  const { login, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          <TouchableOpacity style={[styles.socialBtn, styles.googleBtn]} activeOpacity={0.85} onPress={() => {/* TODO: implement Google OAuth for mobile */}}>
            <Image source={{ uri: 'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_64dp.png' }} style={styles.googleImage} />
            <ThemedText style={[styles.socialText, styles.googleText]}>Continuă cu Google</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.facebookBtn]} activeOpacity={0.85} onPress={() => {/* placeholder */}}>
            <Ionicons name="logo-facebook" size={18} color="#fff" style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: '#fff' }]}>Continuă cu Facebook</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, styles.appleBtn]} activeOpacity={0.85} onPress={() => {/* placeholder */}}>
            <Ionicons name="logo-apple" size={18} color="#fff" style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: '#fff' }]}>Continuă cu Apple</ThemedText>
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
        <TextInput
          style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
          placeholder="Parola"
          placeholderTextColor={tokens.colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <ThemedText style={[styles.error, { color: '#d33' }]}>{error}</ThemedText> : null}
        <TouchableOpacity
          disabled={loading}
          style={[styles.loginBtn, { backgroundColor: '#2f9e44', opacity: loading ? 0.7 : 1 }]}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.loginText}>Intră în cont</ThemedText>}
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
  error: { fontSize: 12, marginTop: -4 },
  loginBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { fontSize: 13, fontWeight: '500' },
});
