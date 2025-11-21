import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  Platform,
  Alert,
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { findCategoryByLabel } from '../src/constants/categories';
import { Toast } from '../components/ui/Toast';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  description?: string;
  images?: string[];
  createdAt: string;
}

export default function ArchivedAnnouncementsScreen() {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isLarge = shortestSide >= 600;
  const isNarrowTablet = isLarge && width >= 600 && width < 750;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isDark, tokens } = useAppTheme();
  
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0, borderColor: tokens.colors.borderNeutral } as const;
  const insets = useSafeAreaInsets();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toate');
  const [sortFilter, setSortFilter] = useState('cea mai recenta');
  const [activePickerType, setActivePickerType] = useState<'category' | 'sort' | null>(null);
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [rowWidths, setRowWidths] = useState<Record<string, number>>({});

  // Confirm dialog state for delete
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  // Confirm dialog state for unarchive
  const [unarchiveDialogVisible, setUnarchiveDialogVisible] = useState(false);
  const [announcementToUnarchive, setAnnouncementToUnarchive] = useState<string | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated) {
      fetchArchivedAnnouncements();
    }
  }, [authLoading, isAuthenticated]);

  const fetchArchivedAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/my-announcements/archived');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching archived announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = announcements.map((a) => a.category).filter(Boolean);
    return ['Toate', ...Array.from(new Set(categories))];
  }, [announcements]);

  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter((a) => {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
      let matchesSearch = true;

      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase();
        const idText = a._id?.toLowerCase() || '';
        const locationText = a.location?.toLowerCase() || '';

        matchesSearch = searchWords.every((sw) =>
          titleWords.includes(sw) || idText.includes(sw) || locationText.includes(sw)
        );
      }

      const matchesCategory = categoryFilter === 'Toate' || a.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortFilter) {
        case 'cea mai veche':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'cea mai recenta':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'titlu_a_z':
          return a.title.localeCompare(b.title, 'ro');
        case 'titlu_z_a':
          return b.title.localeCompare(a.title, 'ro');
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [announcements, searchTerm, categoryFilter, sortFilter]);

  const handleDelete = (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await api.delete(`/api/users/my-announcements/${announcementToDelete}`);
      setAnnouncements(announcements.filter((a) => a._id !== announcementToDelete));
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      showToast('Anunțul a fost șters cu succes', 'success');
    } catch (e) {
      console.error('Delete error:', e);
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      showToast('Nu s-a putut șterge anunțul. Încearcă din nou', 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setAnnouncementToDelete(null);
  };

  const handleUnarchive = (announcement: Announcement) => {
    setAnnouncementToUnarchive(announcement._id);
    setUnarchiveDialogVisible(true);
  };

  const confirmUnarchive = async () => {
    if (!announcementToUnarchive) return;

    try {
      await api.put(`/api/users/my-announcements/${announcementToUnarchive}/unarchive`);
      setAnnouncements(announcements.filter((a) => a._id !== announcementToUnarchive));
      setUnarchiveDialogVisible(false);
      setAnnouncementToUnarchive(null);
      showToast('Anunțul a fost dezarhivat cu succes', 'success');
    } catch (e) {
      console.error('Unarchive error:', e);
      setUnarchiveDialogVisible(false);
      setAnnouncementToUnarchive(null);
      showToast('Nu s-a putut dezarhiva anunțul. Încearcă din nou', 'error');
    }
  };

  const cancelUnarchive = () => {
    setUnarchiveDialogVisible(false);
    setAnnouncementToUnarchive(null);
  };

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\/]/, '')}`;
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={styles.loadingText}>Se încarcă anunțurile arhivate...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        {/* Search and Filter Section */}
        {announcements.length > 0 && (
          <View style={[
            styles.searchSection, 
            { 
              backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? tokens.colors.borderNeutral : 'transparent',
              borderRadius: 12,
              overflow: 'hidden',
            }
          ]}> 
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={tokens.colors.muted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: tokens.colors.text }]}
                placeholder="Caută după titlu, ID sau locație..."
                placeholderTextColor={tokens.colors.placeholder}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={tokens.colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: isDark ? '#121212' : tokens.colors.bg }]}
                onPress={() => setActivePickerType('category')}
              >
                <Ionicons name="apps-outline" size={18} color={activePickerType === 'category' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
                <Text style={[styles.filterButtonText, { color: activePickerType === 'category' ? '#fff' : (isDark ? tokens.colors.primary : '#355070') }]} numberOfLines={1}>
                  Categorie
                </Text>
                <Ionicons name={activePickerType === 'category' ? 'chevron-up' : 'chevron-down'} size={16} color={activePickerType === 'category' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: isDark ? '#121212' : tokens.colors.bg }]}
                onPress={() => setActivePickerType('sort')}
              >
                <Ionicons name="swap-vertical" size={18} color={activePickerType === 'sort' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
                <Text style={[styles.filterButtonText, { color: activePickerType === 'sort' ? '#fff' : (isDark ? tokens.colors.primary : '#355070') }]} numberOfLines={1}>
                  Sortare
                </Text>
                <Ionicons name={activePickerType === 'sort' ? 'chevron-up' : 'chevron-down'} size={16} color={activePickerType === 'sort' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
              </TouchableOpacity>
            </View>

            {/* Active filters display */}
            {(categoryFilter !== 'Toate' || sortFilter !== 'cea mai recenta') && (
              <View style={styles.activeFiltersRow}>
                <Text style={[styles.activeFiltersLabel, { color: tokens.colors.muted }]}>Filtre active:</Text>
                <View style={styles.activeFilterChips}>
                  {categoryFilter !== 'Toate' && (
                    <View style={[styles.filterChip, { backgroundColor: isDark ? tokens.colors.elev : '#f0f0f0' }]}>
                      <Text style={[styles.filterChipText, { color: tokens.colors.text }]}>{categoryFilter}</Text>
                      <TouchableOpacity onPress={() => setCategoryFilter('Toate')}>
                        <Ionicons name="close-circle" size={16} color={tokens.colors.muted} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {sortFilter !== 'cea mai recenta' && (
                    <View style={[styles.filterChip, { backgroundColor: isDark ? tokens.colors.elev : '#f0f0f0' }]}>
                      <Text style={[styles.filterChipText, { color: tokens.colors.text }]}>
                        {sortFilter === 'cea mai veche' ? 'Cea mai veche' :
                         sortFilter === 'titlu_a_z' ? 'A-Z' :
                         sortFilter === 'titlu_z_a' ? 'Z-A' : sortFilter}
                      </Text>
                      <TouchableOpacity onPress={() => setSortFilter('cea mai recenta')}>
                        <Ionicons name="close-circle" size={16} color={tokens.colors.muted} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Results count */}
        {announcements.length > 0 && (
          <View style={styles.resultsCountContainer}>
            <Text style={[styles.resultsCountText, { color: tokens.colors.muted }]}>
              {filteredAndSortedAnnouncements.length} {filteredAndSortedAnnouncements.length === 1 ? 'anunț arhivat' : 'anunțuri arhivate'}
            </Text>
          </View>
        )}

        {/* Empty state */}
        {announcements.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={80} color={tokens.colors.border} />
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>Niciun anunț arhivat</Text>
            <Text style={[styles.emptySubtitle, { color: tokens.colors.muted }]}>
              Anunțurile pe care le arhivezi vor apărea aici
            </Text>
          </View>
        )}

        {/* Announcements List */}
        {filteredAndSortedAnnouncements.map((announcement) => {
          const cardHeight = rowHeights[announcement._id] || 0;
          const cardWidth = rowWidths[announcement._id] || 0;
          const firstImage = announcement.images && announcement.images.length > 0 ? announcement.images[0] : null;
          const imageSrc = getImageSrc(firstImage || undefined);

          return (
            <View key={announcement._id} style={styles.announcementWrapper}>
              <View
                style={[
                  styles.announcementCard,
                  {
                    backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface,
                    ...containerBorderStyle,
                  },
                ]}
                onLayout={(e) => {
                  const { width: w, height: h } = e.nativeEvent.layout;
                  setRowHeights((prev) => ({ ...prev, [announcement._id]: h }));
                  setRowWidths((prev) => ({ ...prev, [announcement._id]: w }));
                }}
              >
                {/* Left Image Column */}
                {imageSrc && (
                  <View style={[styles.imageColumn, cardHeight > 0 ? { height: cardHeight } : undefined]}>
                    <Image
                      source={{ uri: imageSrc }}
                      style={[
                        styles.announcementImage,
                        isNarrowTablet && { width: 140 },
                        cardHeight > 0 && { height: cardHeight },
                      ]}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Right Content Column */}
                <View style={[styles.contentColumn, !imageSrc && styles.contentColumnNoImage]}>
                  {/* Header: Title + Category Icon */}
                  <View style={styles.cardHeader}>
                    <Text style={[styles.announcementTitle, { color: tokens.colors.text }]} numberOfLines={2}>
                      {announcement.title}
                    </Text>
                    <View style={styles.categoryIconWrapper}>
                      {(() => {
                        const catDef = findCategoryByLabel(announcement.category);
                        return catDef ? (
                          <Ionicons name={catDef.icon as any} size={22} color={isDark ? tokens.colors.primary : '#355070'} />
                        ) : null;
                      })()}
                    </View>
                  </View>

                  {/* Metadata Row */}
                  <View style={styles.metadataRow}>
                    <View style={styles.metadataItem}>
                      <Ionicons name="location-outline" size={14} color={tokens.colors.muted} />
                      <Text style={[styles.metadataText, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {announcement.location}
                      </Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <Ionicons name="calendar-outline" size={14} color={tokens.colors.muted} />
                      <Text style={[styles.metadataText, { color: tokens.colors.muted }]}>
                        {new Date(announcement.createdAt).toLocaleDateString('ro-RO')}
                      </Text>
                    </View>
                  </View>

                  {/* ID Badge */}
                  <View style={styles.idBadgeRow}>
                    <View style={[styles.idBadge, { backgroundColor: isDark ? tokens.colors.elev : '#f0f0f0' }]}>
                      <Text style={[styles.idBadgeText, { color: tokens.colors.muted }]}>
                        ID: {announcement._id.slice(-6)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    {isLarge ? (
                      <>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.equalButtonTwo, styles.primaryButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleUnarchive(announcement)}
                          >
                            <Text numberOfLines={1} style={styles.primaryButtonText}>Dezarhivează</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.equalButtonTwo, styles.dangerButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDelete(announcement._id)}
                          >
                            <Text numberOfLines={1} style={styles.dangerButtonText}>Șterge</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.fillButton, styles.primaryButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleUnarchive(announcement)}
                          >
                            <Text numberOfLines={1} style={styles.primaryButtonText}>Dezarhivează</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.dangerButton, styles.compactButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDelete(announcement._id)}
                          >
                            <Text numberOfLines={1} style={styles.dangerButtonText}>Șterge</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Șterge anunț"
        message="Ești sigur că vrei să ștergi definitiv acest anunț? Această acțiune nu poate fi anulată."
        confirmText="Șterge"
        cancelText="Anulează"
        icon="trash-outline"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Unarchive confirmation dialog */}
      <ConfirmDialog
        visible={unarchiveDialogVisible}
        title="Dezarhivează anunț"
        message="Ești sigur că vrei să dezarhivezi acest anunț? Va redeveni vizibil în 'Anunțurile mele'."
        confirmText="Da"
        cancelText="Nu"
        icon="folder-open-outline"
        onConfirm={confirmUnarchive}
        onCancel={cancelUnarchive}
      />

      {/* Picker Modal Overlay */}
      {activePickerType && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setActivePickerType(null)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activePickerType === 'category' ? 'Selectează categoria' : 'Sortează după'}
              </Text>
              <TouchableOpacity onPress={() => setActivePickerType(null)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={tokens.colors.muted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activePickerType === 'category' ? (
                uniqueCategories.map((cat) => {
                  const catDef = cat === 'Toate' ? undefined : findCategoryByLabel(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.modalOption,
                        categoryFilter === cat && styles.modalOptionActive,
                      ]}
                      onPress={() => {
                        setCategoryFilter(cat);
                        setActivePickerType(null);
                      }}
                    >
                      {catDef && <Ionicons name={catDef.icon as any} size={20} color={tokens.colors.text} style={{ marginRight: 12 }} />}
                      <Text style={[styles.modalOptionText, { color: tokens.colors.text }]}>{cat}</Text>
                      {categoryFilter === cat && (
                        <Ionicons name="checkmark" size={20} color={tokens.colors.primary} style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                ['cea mai recenta', 'cea mai veche', 'titlu_a_z', 'titlu_z_a'].map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      styles.modalOption,
                      sortFilter === sort && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setSortFilter(sort);
                      setActivePickerType(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: tokens.colors.text }]}>
                      {sort === 'cea mai recenta' ? 'Cea mai recentă' :
                       sort === 'cea mai veche' ? 'Cea mai veche' :
                       sort === 'titlu_a_z' ? 'Titlu (A-Z)' :
                       sort === 'titlu_z_a' ? 'Titlu (Z-A)' : sort}
                    </Text>
                    {sortFilter === sort && (
                      <Ionicons name="checkmark" size={20} color={tokens.colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

// Reuse the same styles from my-announcements
const createStyles = (tokens: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: tokens.colors.muted,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: tokens.colors.bg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeFiltersRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFiltersLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeFilterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsCountContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  announcementWrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  announcementCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageColumn: {
    width: 160,
  },
  announcementImage: {
    width: '100%',
    height: '100%',
  },
  contentColumn: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  contentColumnNoImage: {
    paddingHorizontal: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  announcementTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 12,
  },
  categoryIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
  },
  idBadgeRow: {
    marginBottom: 12,
  },
  idBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fillButton: {
    flex: 1,
  },
  compactButton: {
    minWidth: 100,
  },
  equalButtonTwo: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: tokens.colors.border,
  },
  secondaryButtonText: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderColor: '#ff4444',
  },
  dangerButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  modalOptionActive: {
    backgroundColor: tokens.colors.elev,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
