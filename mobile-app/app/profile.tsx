import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { tokens } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Format member since date
  const formatMemberDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>            
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Profil</ThemedText>
        </View>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.primary }]}>
                  <Ionicons name="person" size={40} color={tokens.colors.primaryContrast} />
                </View>
              )}
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: tokens.colors.primary }]}>
                <Ionicons name="camera" size={16} color={tokens.colors.primaryContrast} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileHeaderRight}>
              <View style={[styles.badge, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
                <ThemedText style={[styles.badgeText, { color: tokens.colors.muted }]}>CONT PRIVAT</ThemedText>
              </View>
              <TouchableOpacity style={[styles.editButton, { borderColor: tokens.colors.primary }]}>
                <ThemedText style={[styles.editButtonText, { color: tokens.colors.primary }]}>Editează-ți profilul</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewProfileLink}>
                <Ionicons name="eye-outline" size={16} color={tokens.colors.primary} />
                <ThemedText style={[styles.viewProfileText, { color: tokens.colors.primary }]}>Vezi cum îți văd alții profilul</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Base info section */}
          <View style={[styles.infoSection, { borderTopColor: tokens.colors.border }]}>
            <View style={styles.infoHeader}>
              <ThemedText style={[styles.infoTitle, { color: tokens.colors.text }]}>INFORMAȚII DE BAZĂ</ThemedText>
              <TouchableOpacity style={[styles.infoEditButton, { borderColor: tokens.colors.primary }]}>
                <Ionicons name="pencil" size={14} color={tokens.colors.primary} />
                <ThemedText style={[styles.infoEditText, { color: tokens.colors.primary }]}>Editează</ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="person" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Nume</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{user?.firstName || 'N/A'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Prenume</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{user?.lastName || 'N/A'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Membru din</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{formatMemberDate(user?.createdAt)}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Localitate</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{user?.localitate || 'N/A'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Număr de telefon</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{user?.phone || 'N/A'}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail" size={18} color={tokens.colors.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: tokens.colors.primary }]}>Email</ThemedText>
                <ThemedText style={[styles.infoValue, { color: tokens.colors.text }]}>{user?.email || 'N/A'}</ThemedText>
              </View>
            </View>
          </View>

          {/* Announcements section placeholder */}
          <View style={[styles.announcementsSection, { borderTopColor: tokens.colors.border }]}>
            <ThemedText style={[styles.announcementsTitle, { color: tokens.colors.text }]}>Anunțurile mele (6)</ThemedText>
            <View style={styles.announcementGrid}>
              {/* Placeholder for announcements - will be implemented with actual data */}
              <ThemedText style={[styles.placeholderText, { color: tokens.colors.muted }]}>Anunțurile tale vor apărea aici</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '600' },
  profileCard: { borderWidth: 1, borderRadius: 14, padding: 20 },
  profileHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  avatarContainer: { position: 'relative', width: 90, height: 90 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  profileHeaderRight: { flex: 1, gap: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  editButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  editButtonText: { fontSize: 14, fontWeight: '600' },
  viewProfileLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  viewProfileText: { fontSize: 13, fontWeight: '500' },
  infoSection: { borderTopWidth: 1, paddingTop: 20, gap: 16 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  infoTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  infoEditButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  infoEditText: { fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { marginTop: 2 },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 14 },
  announcementsSection: { borderTopWidth: 1, paddingTop: 20, marginTop: 20 },
  announcementsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  announcementGrid: { gap: 12 },
  placeholderText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
