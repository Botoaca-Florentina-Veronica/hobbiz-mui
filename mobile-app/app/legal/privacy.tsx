import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Politica de confidențialitate</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
          <ThemedText style={[styles.paragraph, { color: tokens.colors.text }]}>Aceasta este o pagină de politică a confidențialității. Conținutul real poate fi adăugat aici.</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  paragraph: { fontSize: 14, lineHeight: 20 },
});
