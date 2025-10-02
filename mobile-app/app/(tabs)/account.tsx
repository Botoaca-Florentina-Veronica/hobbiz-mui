import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Modal, Text } from 'react-native';
import { useRouter } from 'expo-router';

type RowSpec = { key: string; label: string; icon: string; action?: () => void; type?: 'switch' | 'danger' };

export default function AccountScreen() {
  const { isDark, setMode, tokens } = useAppTheme();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [confirmVisible, setConfirmVisible] = React.useState(false);

  const rows: RowSpec[] = [
    { key: 'settings', label: 'Setări', icon: 'settings-outline', action: () => router.push('/settings') },
    { key: 'my-ads', label: 'Anunțurile mele', icon: 'megaphone-outline' },
    { key: 'profile', label: 'Profil', icon: 'person-outline', action: () => router.push('/profile') },
    { key: 'notifications', label: 'Notificări', icon: 'notifications-outline' },
    { key: 'legal', label: 'Informații legale', icon: 'document-text-outline', action: () => router.push('/legal') },
    { key: 'about', label: 'Despre noi', icon: 'information-circle-outline', action: () => router.push('/about') },
    { key: 'darkmode', label: 'Mod întunecat', icon: 'moon-outline', type: 'switch' },
  ];

  const logoutRow: RowSpec = { key: 'logout', label: 'Deconectează-te', icon: 'log-out-outline', type: 'danger' };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </View>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Contul tău</ThemedText>
        </View>

        <View style={styles.group}>          
          {rows.map((r) => {
            if (r.type === 'switch') {
              return (
                <View key={r.key} style={[styles.row, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>                  
                  <View style={styles.rowLeft}>                    
                    <Ionicons name={r.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
                    <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                    thumbColor={isDark ? tokens.colors.primaryContrast : '#fff'}
                    trackColor={{ false: tokens.colors.border, true: tokens.colors.primaryHover }}
                  />
                </View>
              );
            }
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.7}
                style={[styles.row, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                onPress={r.action}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name={r.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
                  <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                </View>
                  {/* chevron on the right for tappable rows */}
                  <Ionicons name="chevron-forward" size={18} color={tokens.colors.muted} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.group}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.row, styles.logoutButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.primary }]}
            onPress={() => setConfirmVisible(true)}
          >
            <View style={styles.rowLeft}>
              <Ionicons name={logoutRow.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
              <ThemedText style={[styles.rowLabel, { color: tokens.colors.primary, fontWeight: '700' }]}>{logoutRow.label}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Confirmation modal */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}> 
            <View style={[styles.modalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>Ești sigur(ă) că vrei să te deconectezi?</ThemedText>
              <ThemedText style={[styles.modalMessage, { color: tokens.colors.muted }]}>Te poți reconecta oricând folosind datele tale.</ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <Text style={{ color: tokens.colors.text }}>Anulează</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: tokens.colors.primary }]}
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
                  <Text style={{ color: tokens.colors.primaryContrast }}>Deconectează-te</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '600' },
  group: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  dangerRow: { },
  dangerLabel: { color: '#355070', fontWeight: '600' },
  logoutButton: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 12, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalMessage: { fontSize: 14, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  modalBtnCancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' },
  modalBtnConfirm: { paddingHorizontal: 16, borderRadius: 10 },
});
