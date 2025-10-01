import React, { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

type SettingRow = { key: string; label: string; expandable?: boolean };

export default function SettingsScreen() {
  const { tokens } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const settings: SettingRow[] = [
    { key: 'change-password', label: 'Schimbă parola', expandable: true },
    { key: 'change-email', label: 'Schimbă email-ul', expandable: true },
    { key: 'announcements', label: 'Anunțuri' },
    { key: 'notifications', label: 'Setează notificările' },
    { key: 'billing', label: 'Date de facturare' },
    { key: 'logout-devices', label: 'Ieși din cont de pe toate dispozitivele' },
    { key: 'delete-account', label: 'Șterge contul' },
  ];

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Setări</ThemedText>
        </View>

        {/* Settings List */}
        <View style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          {settings.map((item, index) => (
            <View key={item.key}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.row,
                  { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border },
                  index === settings.length - 1 && !expandedSection && styles.lastRow,
                ]}
                onPress={() => item.expandable ? toggleSection(item.key) : null}
              >
                <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{item.label}</ThemedText>
              </TouchableOpacity>

              {/* Expanded content for Change Password */}
              {expandedSection === 'change-password' && item.key === 'change-password' && (
                <View style={[styles.expandedContent, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Parola curentă</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="Introduceți parola curentă"
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Parola nouă</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="Introduceți noua parolă"
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}>Salvează</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Expanded content for Change Email */}
              {expandedSection === 'change-email' && item.key === 'change-email' && (
                <View style={[styles.expandedContent, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Email nou</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="Introduceți noul email"
                      placeholderTextColor={tokens.colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newEmail}
                      onChangeText={setNewEmail}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>Confirmă parola</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="Introduceți parola pentru confirmare"
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}>Salvează</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '600' },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  lastRow: { marginBottom: 0 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  expandedContent: {
    marginTop: 12,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
  },
  formGroup: {
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
