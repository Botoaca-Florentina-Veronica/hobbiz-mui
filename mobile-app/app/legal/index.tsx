import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';
import { useLocale } from '../../src/context/LocaleContext';
import { normalizeLocale } from '../../src/i18n';

export default function LegalMenu() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale } = useLocale();
  const normalizedLocale = normalizeLocale(locale);

  const labels = {
    title: {
      ro: 'Informații legale',
      en: 'Legal information',
      es: 'Informacion legal',
    },
    terms: {
      ro: 'Termeni și condiții',
      en: 'Terms and Conditions',
      es: 'Terminos y condiciones',
    },
    cookies: {
      ro: 'Cookie policy',
      en: 'Cookie Policy',
      es: 'Politica de cookies',
    },
    privacy: {
      ro: 'Politica de confidențialitate',
      en: 'Privacy Policy',
      es: 'Politica de privacidad',
    },
  };

  const items = [
    { key: 'terms', label: labels.terms[normalizedLocale], route: '/legal/terms', icon: 'document-text-outline' },
    { key: 'cookies', label: labels.cookies[normalizedLocale], route: '/legal/cookies', icon: 'logo-chrome' },
    { key: 'privacy', label: labels.privacy[normalizedLocale], route: '/legal/privacy', icon: 'shield-checkmark-outline' },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{labels.title[normalizedLocale]}</ThemedText>
        </View>

        <View style={styles.group}>
          {items.map((it) => (
            <TouchableOpacity
              key={it.key}
              activeOpacity={0.75}
              style={[styles.row, { backgroundColor: tokens.colors.surface }]}
              onPress={() => router.push(it.route as any)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={it.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
                <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{it.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  group: { marginTop: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {},
  rowLabel: { fontSize: 15, fontWeight: '600' },
});
