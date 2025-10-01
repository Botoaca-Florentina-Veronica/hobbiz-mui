import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useRouter } from 'expo-router';

type RowSpec = { key: string; label: string; icon: string; action?: () => void; type?: 'switch' | 'danger' };

export default function AccountScreen() {
  const { isDark, setMode, tokens } = useAppTheme();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const rows: RowSpec[] = [
    { key: 'settings', label: 'Setări', icon: 'settings-outline', action: () => router.push('/settings') },
    { key: 'my-ads', label: 'Anunțurile mele', icon: 'megaphone-outline' },
    { key: 'profile', label: 'Profil', icon: 'person-outline' },
    { key: 'notifications', label: 'Notificări', icon: 'notifications-outline' },
    { key: 'payments', label: 'Plăți', icon: 'card-outline' },
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
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.group}>          
          <TouchableOpacity activeOpacity={0.7} style={[styles.row, styles.dangerRow, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <View style={styles.rowLeft}>
              <Ionicons name={logoutRow.icon as any} size={18} color={tokens.colors.primary} style={styles.rowIcon} />
              <ThemedText style={[styles.rowLabel, styles.dangerLabel]}>{logoutRow.label}</ThemedText>
            </View>
          </TouchableOpacity>
        </View>
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
});
