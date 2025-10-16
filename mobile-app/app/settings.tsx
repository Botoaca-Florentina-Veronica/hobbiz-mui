import React, { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import { updateEmail, updatePassword } from '../src/services/auth';

type SettingRow = { key: string; label: string; icon?: string; expandable?: boolean };

export default function SettingsScreen() {
  const { tokens } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Eroare', 'Toate câmpurile sunt obligatorii');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Eroare', 'Parola nouă trebuie să aibă cel puțin 6 caractere');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      Alert.alert('Succes', 'Parola a fost schimbată cu succes!');
      setCurrentPassword('');
      setNewPassword('');
      setExpandedSection(null);
    } catch (error: any) {
      Alert.alert('Eroare', error.message || 'Nu s-a putut schimba parola');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !confirmPassword) {
      Alert.alert('Eroare', 'Toate câmpurile sunt obligatorii');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Eroare', 'Format email invalid');
      return;
    }

    setIsLoading(true);
    try {
      await updateEmail(newEmail, confirmPassword);
      Alert.alert('Succes', 'Email-ul a fost actualizat cu succes!');
      setNewEmail('');
      setConfirmPassword('');
      setExpandedSection(null);
    } catch (error: any) {
      Alert.alert('Eroare', error.message || 'Nu s-a putut actualiza email-ul');
    } finally {
      setIsLoading(false);
    }
  };

  const settings: SettingRow[] = [
    { key: 'change-password', label: 'Schimbă parola', icon: 'key-outline', expandable: true },
    { key: 'change-email', label: 'Schimbă email-ul', icon: 'mail-outline', expandable: true },
    { key: 'announcements', label: 'Anunțuri', icon: 'megaphone-outline' },
    { key: 'notifications', label: 'Setează notificările', icon: 'notifications-outline' },
    { key: 'billing', label: 'Date de facturare', icon: 'document-text-outline' },
    { key: 'logout-devices', label: 'Ieși din cont de pe toate dispozitivele', icon: 'phone-portrait-outline' },
    { key: 'delete-account', label: 'Șterge contul', icon: 'trash-outline' },
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
                  { backgroundColor: tokens.colors.surface },
                  index === settings.length - 1 && !expandedSection && styles.lastRow,
                ]}
                onPress={() => (item.expandable ? toggleSection(item.key) : null)}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: tokens.colors.elev }]}> 
                    <Ionicons name={item.icon as any} size={20} color={tokens.colors.text} />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{item.label}</ThemedText>
                </View>
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
                    onPress={handleChangePassword}
                    disabled={isLoading}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}>
                      {isLoading ? 'Se salvează...' : 'Salvează'}
                    </ThemedText>
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
                    onPress={handleChangeEmail}
                    disabled={isLoading}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}>
                      {isLoading ? 'Se salvează...' : 'Salvează'}
                    </ThemedText>
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
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastRow: { marginBottom: 0 },
  rowLabel: { fontSize: 15, fontWeight: '500', flexShrink: 1 },
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
