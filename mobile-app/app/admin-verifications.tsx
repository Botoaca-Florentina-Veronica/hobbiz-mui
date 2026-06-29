import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { Toast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getAdminVerificationsTranslations } from '../src/i18n/admin-verifications';
import api from '../src/services/api';
import {
  getPendingVerifications,
  searchVerificationUsers,
  verifyDocument,
  toggleUserVerification,
  getUserDocumentsAdmin,
  type UserWithDocuments,
} from '../src/services/verificationService';
import {
  deleteAnnouncementReport,
  deleteContactFallback,
  getAnnouncementReports,
  getContactFallbacks,
  resolveAnnouncementReport,
  resolveContactFallback,
  type AdminListStatus,
  type AnnouncementReportItem,
  type ContactFallbackItem,
} from '../src/services/adminService';

type AdminSection = 'verifications' | 'contacts' | 'reports';

// Semantic colors used across status pills and action buttons
const SUCCESS = '#16A34A';
const WARNING = '#F59E0B';
const DANGER = '#DC2626';
const INFO = '#2563EB';

const REPORT_REASON_COLORS: Record<string, string> = {
  spam: '#F59E0B',
  fake: '#EF4444',
  abusive: '#D946EF',
  wrong_category: '#2563EB',
  other: '#6B7280',
};

const formatDate = (value?: string | null, locale: string = 'ro-RO') => {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
};

const hexWithAlpha = (hex: string, alphaHex: string) => `${hex}${alphaHex}`;

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getAdminVerificationsTranslations(locale);
  const dateLocale = locale?.startsWith('es') ? 'es-ES' : locale?.startsWith('en') ? 'en-US' : 'ro-RO';

  const getImageSrc = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    return `${base}/uploads/${img}`;
  };

  const [activeSection, setActiveSection] = useState<AdminSection>('verifications');

  // Verifications
  const [users, setUsers] = useState<UserWithDocuments[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [processingVerification, setProcessingVerification] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDocuments | null>(null);

  // Căutare — regăsește un utilizator ale cărui documente au fost deja tratate
  // (verificate/respinse) și care nu mai apare în lista de "verificări în așteptare".
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithDocuments[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Contacts
  const [contactFilter, setContactFilter] = useState<AdminListStatus>('open');
  const [contacts, setContacts] = useState<ContactFallbackItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [processingContactId, setProcessingContactId] = useState<string | null>(null);

  // Reports
  const [reportFilter, setReportFilter] = useState<AdminListStatus>('open');
  const [reports, setReports] = useState<AnnouncementReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AnnouncementReportItem | null>(null);

  // Section badge counters
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [openContactsCount, setOpenContactsCount] = useState(0);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Confirm dialog
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmIcon, setConfirmIcon] = useState('alert-circle-outline');
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Rejection modal
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [targetDoc, setTargetDoc] = useState<{ userId: string; docId: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const loadSectionBadges = async () => {
    try {
      const [contactsResponse, reportsResponse] = await Promise.all([
        getContactFallbacks('open'),
        getAnnouncementReports('open'),
      ]);
      setOpenContactsCount(contactsResponse.items?.length || 0);
      setOpenReportsCount(reportsResponse.items?.length || 0);
    } catch (_) {
      // Counter failures should not block admin page rendering
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
    loadSectionBadges();
  }, []);

  useEffect(() => {
    if (activeSection === 'contacts') {
      fetchContactFallbacks(contactFilter);
    }
  }, [activeSection, contactFilter]);

  useEffect(() => {
    if (activeSection === 'reports') {
      fetchReports(reportFilter);
    }
  }, [activeSection, reportFilter]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await searchVerificationUsers(query);
        setSearchResults(response.users || []);
      } catch (error) {
        console.error('Error searching verification users:', error);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchPendingVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const response = await getPendingVerifications();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error fetching pending verifications:', error);
      if (error?.response?.status === 403) {
        showToast(t.adminPermissionError, 'error');
        router.back();
      } else {
        showToast(t.loadPendingError, 'error');
      }
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchContactFallbacks = async (status: AdminListStatus) => {
    try {
      setLoadingContacts(true);
      const response = await getContactFallbacks(status);
      setContacts(response.items || []);
    } catch (error) {
      console.error('Error loading contact fallbacks:', error);
      showToast(t.contactsLoadError, 'error');
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchReports = async (status: AdminListStatus) => {
    try {
      setLoadingReports(true);
      const response = await getAnnouncementReports(status);
      setReports(response.items || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      showToast(t.reportsLoadError, 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleVerifyDocument = async (userId: string, documentId: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected') {
      setTargetDoc({ userId, docId: documentId });
      setRejectionReason('');
      setRejectionModalVisible(true);
    } else {
      setConfirmTitle(t.verifyTitle);
      setConfirmMessage(t.verifyMessage);
      setConfirmIcon('checkmark-shield-outline');
      setConfirmColor(tokens.colors.primary);
      setConfirmAction(() => () => performVerification(userId, documentId, status));
      setConfirmVisible(true);
    }
  };

  const confirmRejection = async () => {
    if (!targetDoc || !rejectionReason.trim()) {
      showToast(t.rejectionReasonRequired, 'info');
      return;
    }
    await performVerification(targetDoc.userId, targetDoc.docId, 'rejected', rejectionReason);
    setRejectionModalVisible(false);
  };

  const performVerification = async (
    userId: string,
    documentId: string,
    status: 'verified' | 'rejected',
    rejectionReasonText?: string
  ) => {
    try {
      setProcessingVerification(true);
      await verifyDocument(userId, documentId, status, rejectionReasonText);
      showToast(
        status === 'verified' ? t.verifySuccessVerified : t.verifySuccessRejected,
        status === 'verified' ? 'success' : 'info'
      );

      if (selectedUser?._id === userId) {
        const response = await getUserDocumentsAdmin(userId);
        setSelectedUser(response.user);
      }
      await fetchPendingVerifications();
    } catch (error) {
      console.error('Error verifying document:', error);
      showToast(t.verifyError, 'error');
    } finally {
      setProcessingVerification(false);
      setConfirmVisible(false);
    }
  };

  const handleToggleVerificationBadge = async (userId: string, currentStatus: boolean) => {
    setConfirmTitle(currentStatus ? t.badgeRemoveTitle : t.badgeGrantTitle);
    setConfirmMessage(currentStatus ? t.badgeRemoveMessage : t.badgeGrantMessage);
    setConfirmIcon(currentStatus ? 'close-circle-outline' : 'checkmark-circle-outline');
    setConfirmColor(currentStatus ? DANGER : tokens.colors.primary);
    setConfirmAction(() => async () => {
      try {
        setProcessingVerification(true);
        await toggleUserVerification(userId, !currentStatus);

        showToast(
          !currentStatus ? t.badgeGrantSuccess : t.badgeRemoveSuccess,
          !currentStatus ? 'success' : 'info'
        );

        if (selectedUser?._id === userId) {
          const response = await getUserDocumentsAdmin(userId);
          setSelectedUser(response.user);
        }

        await fetchPendingVerifications();
      } catch (error) {
        console.error('Error toggling verification badge:', error);
        showToast(t.badgeError, 'error');
      } finally {
        setProcessingVerification(false);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleViewUserDocuments = async (user: UserWithDocuments) => {
    try {
      setProcessingVerification(true);
      const response = await getUserDocumentsAdmin(user._id);
      setSelectedUser(response.user);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      showToast(t.userDocsLoadError, 'error');
    } finally {
      setProcessingVerification(false);
    }
  };

  const handleResolveContact = (id: string) => {
    setConfirmTitle(t.contactsResolveTitle);
    setConfirmMessage(t.contactsResolveMessage);
    setConfirmIcon('checkmark-done-outline');
    setConfirmColor(tokens.colors.primary);
    setConfirmAction(() => async () => {
      try {
        setProcessingContactId(id);
        await resolveContactFallback(id);
        showToast(t.contactsResolveSuccess, 'success');
        await fetchContactFallbacks(contactFilter);
        await loadSectionBadges();
      } catch (error) {
        console.error('Error resolving contact fallback:', error);
        showToast(t.contactsResolveError, 'error');
      } finally {
        setProcessingContactId(null);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleDeleteContact = (id: string) => {
    setConfirmTitle(t.contactsDeleteTitle);
    setConfirmMessage(t.contactsDeleteMessage);
    setConfirmIcon('trash-outline');
    setConfirmColor(DANGER);
    setConfirmAction(() => async () => {
      try {
        setProcessingContactId(id);
        await deleteContactFallback(id);
        showToast(t.contactsDeleteSuccess, 'success');
        await fetchContactFallbacks(contactFilter);
        await loadSectionBadges();
      } catch (error) {
        console.error('Error deleting contact fallback:', error);
        showToast(t.contactsDeleteError, 'error');
      } finally {
        setProcessingContactId(null);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleResolveReport = (id: string) => {
    setConfirmTitle(t.reportsResolveTitle);
    setConfirmMessage(t.reportsResolveMessage);
    setConfirmIcon('checkmark-done-outline');
    setConfirmColor(tokens.colors.primary);
    setConfirmAction(() => async () => {
      try {
        setProcessingReportId(id);
        await resolveAnnouncementReport(id);
        showToast(t.reportsResolveSuccess, 'success');
        await fetchReports(reportFilter);
        await loadSectionBadges();
      } catch (error) {
        console.error('Error resolving report:', error);
        showToast(t.reportsResolveError, 'error');
      } finally {
        setProcessingReportId(null);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleDeleteReport = (id: string) => {
    setConfirmTitle(t.reportsDeleteTitle);
    setConfirmMessage(t.reportsDeleteMessage);
    setConfirmIcon('trash-outline');
    setConfirmColor(DANGER);
    setConfirmAction(() => async () => {
      try {
        setProcessingReportId(id);
        await deleteAnnouncementReport(id);
        showToast(t.reportsDeleteSuccess, 'success');
        setSelectedReport((prev) => (prev?._id === id ? null : prev));
        await fetchReports(reportFilter);
        await loadSectionBadges();
      } catch (error) {
        console.error('Error deleting report:', error);
        showToast(t.reportsDeleteError, 'error');
      } finally {
        setProcessingReportId(null);
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return SUCCESS;
      case 'rejected':
        return DANGER;
      case 'pending':
      default:
        return WARNING;
    }
  };

  const getVerificationStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return t.statusVerified;
      case 'rejected':
        return t.statusRejected;
      case 'pending':
      default:
        return t.statusPending;
    }
  };

  const reportReasonLabel = useMemo(
    () => ({
      spam: t.reportReasonSpam,
      fake: t.reportReasonFake,
      abusive: t.reportReasonAbusive,
      wrong_category: t.reportReasonWrongCategory,
      other: t.reportReasonOther,
    }),
    [t]
  );

  const headerSubtitle = useMemo(() => {
    if (activeSection === 'verifications') {
      return users.length === 0 ? t.emptyPending : `${users.length} · ${t.sectionVerifications.toLowerCase()}`;
    }
    if (activeSection === 'contacts') {
      return `${openContactsCount} · ${t.statusOpen.toLowerCase()}`;
    }
    return `${openReportsCount} · ${t.statusOpen.toLowerCase()}`;
  }, [activeSection, users.length, openContactsCount, openReportsCount, t]);

  // === Theme-derived surfaces ===
  const bg = tokens.colors.bg;
  const surface = isDark ? '#181818' : '#ffffff';
  const subtleSurface = isDark ? '#1f1f1f' : '#F4F6F9';
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#E6E8EE';
  const text = tokens.colors.text;
  const muted = tokens.colors.muted;
  const accent = tokens.colors.primary;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },

    // === Header ===
    header: {
      paddingHorizontal: 16,
      paddingTop: Math.max(insets.top, 24) + 16,
      paddingBottom: 14,
      backgroundColor: bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    backCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: subtleSurface,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: 'Poppins-Bold',
      letterSpacing: -0.4,
      color: text,
      paddingTop: 6,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: muted,
      marginTop: 2,
    },

    // === Segmented section tabs ===
    segmented: {
      flexDirection: 'row',
      backgroundColor: subtleSurface,
      borderRadius: 14,
      padding: 4,
      marginHorizontal: 16,
      marginTop: 14,
      gap: 4,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 10,
      gap: 5,
    },
    segmentActive: {
      backgroundColor: surface,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 2,
    },
    segmentText: {
      fontSize: 12,
      fontWeight: '600',
      color: muted,
    },
    segmentTextActive: {
      color: text,
      fontWeight: '700',
    },
    segmentBadge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexWithAlpha(accent, '22'),
    },
    segmentBadgeActive: {
      backgroundColor: accent,
    },
    segmentBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: accent,
    },
    segmentBadgeTextActive: {
      color: '#fff',
    },

    // === Filter chips (open/resolved/all) ===
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 14,
    },
    filterChip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
    },
    filterChipActive: {
      backgroundColor: accent,
      borderColor: accent,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: muted,
    },
    filterChipTextActive: {
      color: '#fff',
    },

    // === Verification list row ===
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
    },
    avatarWrap: {
      position: 'relative',
      marginRight: 14,
    },
    avatarRing: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarRingPending: { borderColor: WARNING },
    avatarRingVerified: { borderColor: SUCCESS },
    avatarRingNeutral: { borderColor: border },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: hexWithAlpha(accent, '20'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImage: { width: 48, height: 48, borderRadius: 24 },
    avatarBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: surface,
    },
    userBody: { flex: 1, minWidth: 0 },
    userName: {
      fontSize: 15,
      fontWeight: '700',
      color: text,
      letterSpacing: -0.2,
    },
    userEmail: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },
    pendingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: hexWithAlpha(WARNING, '1A'),
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 6,
      gap: 4,
    },
    pendingChipText: {
      fontSize: 11,
      color: WARNING,
      fontWeight: '700',
    },
    neutralChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: hexWithAlpha(accent, '14'),
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 6,
      gap: 4,
    },
    neutralChipText: {
      fontSize: 11,
      color: accent,
      fontWeight: '700',
    },

    // === Search field ===
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: subtleSurface,
      marginHorizontal: 16,
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 999,
      gap: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    searchBarFocused: {
      backgroundColor: surface,
      borderColor: accent,
    },
    searchInput: {
      flex: 1,
      fontSize: 13.5,
      color: text,
      padding: 0,
    },

    // === Granted/reviewed-by meta caption ===
    byAdminText: {
      fontSize: 11,
      color: muted,
      marginTop: 3,
    },

    // === Generic data card (contacts / reports) ===
    dataCard: {
      backgroundColor: surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      overflow: 'hidden',
    },
    dataCardInner: {
      padding: 14,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: text,
      flex: 1,
      letterSpacing: -0.2,
    },
    cardSecondary: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
      fontWeight: '500',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },

    metaList: {
      marginTop: 10,
      gap: 6,
    },
    metaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      color: muted,
      fontWeight: '500',
      flex: 1,
    },
    metaTextStrong: {
      color: text,
      fontWeight: '600',
    },

    messageBox: {
      marginTop: 12,
      backgroundColor: subtleSurface,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    messageText: {
      fontSize: 13,
      lineHeight: 19,
      color: text,
    },

    errorBox: {
      marginTop: 10,
      borderRadius: 10,
      backgroundColor: hexWithAlpha(DANGER, '12'),
      borderLeftWidth: 3,
      borderLeftColor: DANGER,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    errorBoxText: {
      color: DANGER,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '500',
    },

    // === Reason chip (reports) ===
    reasonChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    reasonDot: { width: 7, height: 7, borderRadius: 3.5 },
    reasonText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    // === Action buttons ===
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    actionBtnPrimary: {
      borderColor: hexWithAlpha(SUCCESS, '40'),
      backgroundColor: hexWithAlpha(SUCCESS, '14'),
    },
    actionBtnDanger: {
      borderColor: hexWithAlpha(DANGER, '40'),
      backgroundColor: hexWithAlpha(DANGER, '12'),
    },
    actionBtnNeutral: {
      borderColor: hexWithAlpha(accent, '40'),
      backgroundColor: hexWithAlpha(accent, '12'),
    },
    actionBtnGhost: {
      borderColor: border,
      backgroundColor: subtleSurface,
    },
    actionText: { fontSize: 12.5, fontWeight: '700' },
    actionTextPrimary: { color: SUCCESS },
    actionTextDanger: { color: DANGER },
    actionTextNeutral: { color: accent },
    actionTextMuted: { color: text },

    // === Empty / loading ===
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 48,
      paddingBottom: 32,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: subtleSurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: text,
      textAlign: 'center',
    },
    skeletonWrap: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
    skeletonBlock: {
      backgroundColor: subtleSurface,
      borderRadius: 16,
      height: 96,
    },

    // === Detail view (user documents) ===
    heroCard: {
      backgroundColor: surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      alignItems: 'center',
    },
    heroAvatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: hexWithAlpha(accent, '20'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroAvatarImage: { width: 72, height: 72, borderRadius: 36 },
    heroName: {
      fontSize: 18,
      fontWeight: '800',
      color: text,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    heroEmail: {
      fontSize: 13,
      color: muted,
      marginTop: 3,
      textAlign: 'center',
    },
    heroStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
    },
    heroStatusVerified: {
      backgroundColor: hexWithAlpha(SUCCESS, '18'),
    },
    heroStatusPending: {
      backgroundColor: hexWithAlpha(WARNING, '18'),
    },
    heroStatusText: { fontSize: 12, fontWeight: '700' },

    badgeSection: {
      marginHorizontal: 16,
      marginTop: 14,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 4,
    },
    badgeBtnLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    badgeBtnGrant: { backgroundColor: SUCCESS },
    badgeBtnRevoke: { backgroundColor: DANGER },
    badgeBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },

    // === Document card ===
    docCard: {
      backgroundColor: surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
    },
    docHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    docIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: hexWithAlpha(accent, '14'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    docInfo: { flex: 1, minWidth: 0 },
    docName: {
      fontSize: 14,
      fontWeight: '700',
      color: text,
      letterSpacing: -0.1,
    },
    docType: { fontSize: 12, color: muted, marginTop: 2 },
    docDate: { fontSize: 11, color: muted, marginTop: 2 },
    docViewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      alignSelf: 'flex-start',
      backgroundColor: hexWithAlpha(accent, '14'),
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 999,
    },
    docViewBtnText: {
      fontSize: 12,
      color: accent,
      fontWeight: '700',
    },
    docRejectionBox: {
      marginTop: 10,
      backgroundColor: hexWithAlpha(DANGER, '10'),
      borderLeftWidth: 3,
      borderLeftColor: DANGER,
      paddingVertical: 9,
      paddingHorizontal: 11,
      borderRadius: 8,
    },
    docRejectionText: {
      fontSize: 12,
      color: DANGER,
      lineHeight: 17,
    },

    // === Modals (bottom sheet style) ===
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '88%',
      paddingBottom: insets.bottom + 8,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: border,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: text,
      letterSpacing: -0.3,
      flex: 1,
    },
    sheetClose: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: subtleSurface,
    },
    sheetBody: { paddingHorizontal: 20, paddingTop: 4 },
    sheetLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    sheetTextarea: {
      minHeight: 110,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: text,
      backgroundColor: subtleSurface,
      borderWidth: 1,
      borderColor: border,
      textAlignVertical: 'top',
    },
    sheetPrimaryBtn: {
      marginTop: 18,
      marginBottom: 8,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: DANGER,
    },
    sheetPrimaryBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    // Report-details sheet specifics
    reportInfoBlock: {
      backgroundColor: subtleSurface,
      borderRadius: 12,
      padding: 12,
      marginTop: 10,
    },
    reportInfoText: {
      fontSize: 13,
      lineHeight: 19,
      color: text,
    },
  });

  // ============================================================================
  // Render helpers
  // ============================================================================

  const renderHeader = (title: string, onBack: () => void, subtitle?: string) => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backCircle} activeOpacity={0.7} hitSlop={6}>
          <Ionicons name="chevron-back" size={22} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</ThemedText>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderSectionTabs = () => {
    const tabs: { key: AdminSection; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
      { key: 'verifications', label: t.sectionVerifications, icon: 'shield-checkmark-outline', count: users.length },
      { key: 'contacts', label: t.sectionContacts, icon: 'mail-outline', count: openContactsCount },
      { key: 'reports', label: t.sectionReports, icon: 'flag-outline', count: openReportsCount },
    ];

    return (
      <View style={styles.segmented}>
        {tabs.map((tab) => {
          const active = activeSection === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveSection(tab.key)}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Ionicons name={tab.icon} size={14} color={active ? accent : muted} />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.segmentBadge, active && styles.segmentBadgeActive]}>
                  <Text style={[styles.segmentBadgeText, active && styles.segmentBadgeTextActive]}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderFilterChips = (current: AdminListStatus, onChange: (status: AdminListStatus) => void) => (
    <View style={styles.filterRow}>
      {(['open', 'resolved', 'all'] as AdminListStatus[]).map((status) => {
        const active = current === status;
        const label = status === 'open' ? t.filterOpen : status === 'resolved' ? t.filterResolved : t.filterAll;
        return (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={() => onChange(status)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSkeleton = (count = 3) => (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.skeletonBlock} />
      ))}
    </View>
  );

  const renderEmpty = (icon: keyof typeof Ionicons.glyphMap, message: string) => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={muted} />
      </View>
      <ThemedText style={styles.emptyTitle}>{message}</ThemedText>
    </View>
  );

  const renderStatusPill = (kind: 'open' | 'resolved' | 'pending' | 'verified' | 'rejected', label: string) => {
    const colorMap = {
      open: WARNING,
      pending: WARNING,
      resolved: SUCCESS,
      verified: SUCCESS,
      rejected: DANGER,
    };
    const bgColor = colorMap[kind];
    return (
      <View style={[styles.statusPill, { backgroundColor: bgColor }]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusPillText}>{label}</Text>
      </View>
    );
  };

  // ============================================================================
  // Section: Verifications
  // ============================================================================
  const renderSearchBar = () => (
    <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
      <Ionicons name="search-outline" size={16} color={searchFocused ? accent : muted} />
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={muted}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searching ? (
        <ActivityIndicator size="small" color={accent} />
      ) : searchQuery ? (
        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderVerificationsList = () => {
    const isSearchMode = searchResults !== null;
    const displayedUsers = isSearchMode ? searchResults : users;

    if (loadingVerifications && !isSearchMode) return renderSkeleton(3);

    if (displayedUsers.length === 0) {
      return renderEmpty(
        isSearchMode ? 'search-outline' : 'checkmark-done-circle-outline',
        isSearchMode ? t.noSearchResults : t.emptyPending
      );
    }

    return displayedUsers.map((user) => {
      const pendingCount = user.pendingDocuments?.length || 0;
      const totalCount = user.totalDocuments ?? user.documents?.length ?? 0;
      const ringStyle = user.isVerified
        ? styles.avatarRingVerified
        : pendingCount > 0
        ? styles.avatarRingPending
        : styles.avatarRingNeutral;

      return (
        <Pressable
          key={user._id}
          style={({ pressed }) => [
            styles.userRow,
            pressed && { transform: [{ scale: 0.99 }], opacity: 0.94 },
          ]}
          onPress={() => handleViewUserDocuments(user)}
          disabled={processingVerification}
        >
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, ringStyle]}>
              {user.avatar ? (
                <Image
                  source={{ uri: getImageSrc(user.avatar) || undefined }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color={accent} />
                </View>
              )}
            </View>
            {user.isVerified && (
              <View style={[styles.avatarBadge, { backgroundColor: SUCCESS }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.userBody}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
            {pendingCount > 0 ? (
              <View style={styles.pendingChip}>
                <Ionicons name="time-outline" size={11} color={WARNING} />
                <Text style={styles.pendingChipText}>
                  {t.pendingDocumentsCount.replace('{count}', String(pendingCount))}
                </Text>
              </View>
            ) : totalCount > 0 && (
              <View style={styles.neutralChip}>
                <Ionicons name="document-text-outline" size={11} color={accent} />
                <Text style={styles.neutralChipText}>
                  {t.documentsCount.replace('{count}', String(totalCount))}
                </Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color={muted} />
        </Pressable>
      );
    });
  };

  // ============================================================================
  // Section: Contacts
  // ============================================================================
  const renderContactsSection = () => (
    <>
      {renderFilterChips(contactFilter, setContactFilter)}

      {loadingContacts ? (
        renderSkeleton(3)
      ) : contacts.length === 0 ? (
        renderEmpty('mail-unread-outline', t.contactsEmpty)
      ) : (
        contacts.map((item) => {
          const isBusy = processingContactId === item._id;
          const isResolved = item.status === 'resolved';

          return (
            <View key={item._id} style={styles.dataCard}>
              <View style={styles.dataCardInner}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.metaLine, { marginTop: 4 }]}>
                      <Ionicons name="mail-outline" size={12} color={muted} />
                      <Text style={[styles.metaText, styles.metaTextStrong]} numberOfLines={1}>{item.email}</Text>
                    </View>
                  </View>
                  {renderStatusPill(isResolved ? 'resolved' : 'open', isResolved ? t.statusResolved : t.statusOpen)}
                </View>

                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>

                <View style={styles.metaList}>
                  <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={12} color={muted} />
                    <Text style={styles.metaText}>{formatDate(item.createdAt, dateLocale)}</Text>
                  </View>
                  {item.ip ? (
                    <View style={styles.metaLine}>
                      <Ionicons name="globe-outline" size={12} color={muted} />
                      <Text style={styles.metaText}>{t.ipLabel}: {item.ip}</Text>
                    </View>
                  ) : null}
                </View>

                {item.mailError?.message ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorBoxText}>
                      {t.mailErrorLabel}: {item.mailError.message}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary, isResolved && { opacity: 0.5 }]}
                    onPress={() => handleResolveContact(item._id)}
                    disabled={isResolved || isBusy}
                    activeOpacity={0.85}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={SUCCESS} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={15} color={SUCCESS} />
                        <Text style={[styles.actionText, styles.actionTextPrimary]}>
                          {t.contactsResolveAction}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => handleDeleteContact(item._id)}
                    disabled={isBusy}
                    activeOpacity={0.85}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={DANGER} />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={15} color={DANGER} />
                        <Text style={[styles.actionText, styles.actionTextDanger]}>
                          {t.contactsDeleteAction}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  // ============================================================================
  // Section: Reports
  // ============================================================================
  const renderReportsSection = () => (
    <>
      {renderFilterChips(reportFilter, setReportFilter)}

      {loadingReports ? (
        renderSkeleton(3)
      ) : reports.length === 0 ? (
        renderEmpty('shield-checkmark-outline', t.reportsEmpty)
      ) : (
        reports.map((item) => {
          const announcementObj = typeof item.announcement === 'object' ? item.announcement : null;
          const announcementId =
            announcementObj?._id ||
            (typeof item.announcement === 'string' ? item.announcement : undefined);
          const reporterName = `${item.reporter?.firstName || ''} ${item.reporter?.lastName || ''}`.trim() || t.defaultUser;
          const listedByName = `${item.announcementOwner?.firstName || ''} ${item.announcementOwner?.lastName || ''}`.trim() || t.defaultUser;
          const isBusy = processingReportId === item._id;
          const isResolved = item.status === 'resolved';
          const reasonColor = REPORT_REASON_COLORS[item.reason] || REPORT_REASON_COLORS.other;

          return (
            <View key={item._id} style={styles.dataCard}>
              <View style={styles.dataCardInner}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {announcementObj?.title || t.deletedAnnouncement}
                    </Text>
                    <View style={[styles.reasonChip, { backgroundColor: hexWithAlpha(reasonColor, '1A') }]}>
                      <View style={[styles.reasonDot, { backgroundColor: reasonColor }]} />
                      <Text style={[styles.reasonText, { color: reasonColor }]}>
                        {reportReasonLabel[item.reason] || reportReasonLabel.other}
                      </Text>
                    </View>
                  </View>
                  {renderStatusPill(isResolved ? 'resolved' : 'open', isResolved ? t.statusResolved : t.statusOpen)}
                </View>

                <View style={styles.metaList}>
                  <View style={styles.metaLine}>
                    <Ionicons name="person-outline" size={12} color={muted} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      <Text style={styles.metaTextStrong}>{t.reporterLabel}: </Text>
                      {reporterName}{item.reporter?.email ? ` (${item.reporter.email})` : ''}
                    </Text>
                  </View>
                  <View style={styles.metaLine}>
                    <Ionicons name="storefront-outline" size={12} color={muted} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      <Text style={styles.metaTextStrong}>{t.listedByLabel}: </Text>{listedByName}
                    </Text>
                  </View>
                  <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={12} color={muted} />
                    <Text style={styles.metaText}>{formatDate(item.createdAt, dateLocale)}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnNeutral]}
                    onPress={() => setSelectedReport(item)}
                    disabled={isBusy}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="eye-outline" size={15} color={accent} />
                    <Text style={[styles.actionText, styles.actionTextNeutral]}>{t.reportsDetailsAction}</Text>
                  </TouchableOpacity>

                  {announcementId ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnGhost]}
                      onPress={() => router.push({ pathname: '/announcement-details', params: { id: announcementId } })}
                      disabled={isBusy}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="open-outline" size={15} color={text} />
                      <Text style={[styles.actionText, styles.actionTextMuted]}>{t.reportsOpenAnnouncement}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.actionRow}>
                  {!isResolved ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => handleResolveReport(item._id)}
                      disabled={isBusy}
                      activeOpacity={0.85}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={SUCCESS} />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done-outline" size={15} color={SUCCESS} />
                          <Text style={[styles.actionText, styles.actionTextPrimary]}>
                            {t.reportsResolveAction}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => handleDeleteReport(item._id)}
                    disabled={isBusy}
                    activeOpacity={0.85}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={DANGER} />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={15} color={DANGER} />
                        <Text style={[styles.actionText, styles.actionTextDanger]}>
                          {t.reportsDeleteAction}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  // ============================================================================
  // Shared modals
  // ============================================================================
  const renderRejectionModal = () => (
    <Modal
      visible={rejectionModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setRejectionModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>{t.rejectionTitle}</ThemedText>
            <TouchableOpacity onPress={() => setRejectionModalVisible(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color={text} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            <ThemedText style={styles.sheetLabel}>{t.rejectionPrompt}</ThemedText>
            <ThemedTextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder={t.rejectionPlaceholder}
              placeholderTextColor={muted}
              multiline
              numberOfLines={4}
              style={styles.sheetTextarea}
            />

            <TouchableOpacity
              style={styles.sheetPrimaryBtn}
              onPress={confirmRejection}
              disabled={processingVerification}
              activeOpacity={0.88}
            >
              {processingVerification ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetPrimaryBtnText}>{t.confirmRejection}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );

  const renderReportDetailsModal = () => (
    <Modal
      visible={!!selectedReport}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedReport(null)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>{t.reportsDetailsTitle}</ThemedText>
            <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color={text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} contentContainerStyle={{ paddingBottom: 24 }}>
            {selectedReport && (
              <>
                <View
                  style={[
                    styles.reasonChip,
                    {
                      backgroundColor: hexWithAlpha(
                        REPORT_REASON_COLORS[selectedReport.reason] || REPORT_REASON_COLORS.other,
                        '1A'
                      ),
                      marginTop: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.reasonDot,
                      { backgroundColor: REPORT_REASON_COLORS[selectedReport.reason] || REPORT_REASON_COLORS.other },
                    ]}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      { color: REPORT_REASON_COLORS[selectedReport.reason] || REPORT_REASON_COLORS.other },
                    ]}
                  >
                    {reportReasonLabel[selectedReport.reason] || reportReasonLabel.other}
                  </Text>
                </View>

                <View style={[styles.metaList, { marginTop: 14 }]}>
                  <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={13} color={muted} />
                    <Text style={styles.metaText}>{formatDate(selectedReport.createdAt, dateLocale)}</Text>
                  </View>
                </View>

                <ThemedText style={[styles.sheetLabel, { marginTop: 18 }]}>{t.reasonLabel}</ThemedText>
                <View style={styles.reportInfoBlock}>
                  <ThemedText style={styles.reportInfoText}>
                    {selectedReport.details || t.reportNoDetails}
                  </ThemedText>
                </View>

                {selectedReport.adminNote ? (
                  <>
                    <ThemedText style={[styles.sheetLabel, { marginTop: 16 }]}>{t.adminNoteLabel}</ThemedText>
                    <View style={styles.reportInfoBlock}>
                      <ThemedText style={styles.reportInfoText}>{selectedReport.adminNote}</ThemedText>
                    </View>
                  </>
                ) : null}

                <View style={[styles.actionRow, { marginTop: 18 }]}>
                  {selectedReport.status !== 'resolved' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => selectedReport?._id && handleResolveReport(selectedReport._id)}
                      disabled={processingReportId === selectedReport?._id}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-done-outline" size={15} color={SUCCESS} />
                      <Text style={[styles.actionText, styles.actionTextPrimary]}>
                        {t.reportsResolveAction}
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnDanger]}
                    onPress={() => selectedReport?._id && handleDeleteReport(selectedReport._id)}
                    disabled={processingReportId === selectedReport?._id}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={15} color={DANGER} />
                    <Text style={[styles.actionText, styles.actionTextDanger]}>
                      {t.reportsDeleteAction}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );

  // ============================================================================
  // === USER DOCUMENTS DETAIL VIEW ===
  // ============================================================================
  if (selectedUser) {
    return (
      <ThemedView style={[styles.container, Platform.OS === 'web' ? { height: '100%', overflow: 'hidden' } : undefined]}>
        {renderHeader(t.userDocumentsHeader, () => setSelectedUser(null))}

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {/* Hero card */}
          <View style={styles.heroCard}>
            {selectedUser.avatar ? (
              <Image
                source={{ uri: getImageSrc(selectedUser.avatar) || undefined }}
                style={styles.heroAvatarImage}
              />
            ) : (
              <View style={styles.heroAvatar}>
                <Ionicons name="person" size={36} color={accent} />
              </View>
            )}
            <ThemedText style={styles.heroName}>
              {selectedUser.firstName} {selectedUser.lastName}
            </ThemedText>
            <ThemedText style={styles.heroEmail}>{selectedUser.email}</ThemedText>
            <View
              style={[
                styles.heroStatus,
                selectedUser.isVerified ? styles.heroStatusVerified : styles.heroStatusPending,
              ]}
            >
              <Ionicons
                name={selectedUser.isVerified ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={selectedUser.isVerified ? SUCCESS : WARNING}
              />
              <Text
                style={[
                  styles.heroStatusText,
                  { color: selectedUser.isVerified ? SUCCESS : WARNING },
                ]}
              >
                {selectedUser.isVerified ? t.statusVerified : t.statusPending}
              </Text>
            </View>
            {selectedUser.isVerified && selectedUser.verifiedBy && (
              <Text style={styles.byAdminText}>
                {t.grantedByLabel.replace(
                  '{name}',
                  `${selectedUser.verifiedBy.firstName} ${selectedUser.verifiedBy.lastName}`
                )}
                {selectedUser.verifiedAt ? ` · ${new Date(selectedUser.verifiedAt).toLocaleDateString(dateLocale)}` : ''}
              </Text>
            )}
          </View>

          {/* Badge control */}
          <View style={styles.badgeSection}>
            <ThemedText style={styles.sectionLabel}>{t.badgeHeader}</ThemedText>
            <TouchableOpacity
              style={[
                styles.badgeBtnLarge,
                selectedUser.isVerified ? styles.badgeBtnRevoke : styles.badgeBtnGrant,
              ]}
              onPress={() => handleToggleVerificationBadge(selectedUser._id, selectedUser.isVerified)}
              disabled={processingVerification}
              activeOpacity={0.88}
            >
              {processingVerification ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={selectedUser.isVerified ? 'close-circle' : 'checkmark-circle'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.badgeBtnText}>
                    {selectedUser.isVerified ? t.removeBadge : t.grantBadge}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Documents */}
          {(selectedUser.documents || []).length > 0 && (
            <ThemedText style={[styles.sectionLabel, { marginTop: 18, marginLeft: 20 }]}>
              {(selectedUser.documents || []).length} {(selectedUser.documents || []).length === 1 ? 'document' : 'documente'}
            </ThemedText>
          )}

          {(selectedUser.documents || []).map((doc) => {
            const statusColor = getVerificationStatusColor(doc.status);
            return (
              <View key={doc._id} style={styles.docCard}>
                <View style={styles.docHeader}>
                  <View style={styles.docIconWrap}>
                    <Ionicons name="document-text-outline" size={22} color={accent} />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.docType}>{doc.type}</Text>
                    <Text style={styles.docDate}>
                      {t.uploadedLabel}: {new Date(doc.uploadedAt).toLocaleDateString(dateLocale)}
                    </Text>
                    {doc.status !== 'pending' && doc.verifiedBy && (
                      <Text style={styles.byAdminText}>
                        {t.reviewedByLabel.replace('{name}', `${doc.verifiedBy.firstName} ${doc.verifiedBy.lastName}`)}
                        {doc.verifiedAt ? ` · ${new Date(doc.verifiedAt).toLocaleDateString(dateLocale)}` : ''}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusPillText}>{getVerificationStatusLabel(doc.status)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.docViewBtn}
                  onPress={() => Linking.openURL(doc.url)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="eye-outline" size={14} color={accent} />
                  <Text style={styles.docViewBtnText}>{t.viewFile}</Text>
                </TouchableOpacity>

                {doc.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnPrimary]}
                      onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'verified')}
                      disabled={processingVerification}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={SUCCESS} />
                      <Text style={[styles.actionText, styles.actionTextPrimary]}>{t.approve}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'rejected')}
                      disabled={processingVerification}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="close-circle-outline" size={16} color={DANGER} />
                      <Text style={[styles.actionText, styles.actionTextDanger]}>{t.reject}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {doc.rejectionReason && (
                  <View style={styles.docRejectionBox}>
                    <Text style={styles.docRejectionText}>
                      <Text style={{ fontWeight: '700' }}>{t.rejectionReasonLabel}: </Text>
                      {doc.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <ConfirmDialog
          visible={confirmVisible}
          title={confirmTitle}
          message={confirmMessage}
          icon={confirmIcon}
          confirmColor={confirmColor}
          onConfirm={() => confirmAction?.()}
          onCancel={() => setConfirmVisible(false)}
        />

        {renderRejectionModal()}

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={5000}
          onHide={() => setToastVisible(false)}
        />
      </ThemedView>
    );
  }

  // ============================================================================
  // === MAIN LIST VIEW ===
  // ============================================================================
  return (
    <ThemedView style={[styles.container, Platform.OS === 'web' ? { height: '100%', overflow: 'hidden' } : undefined]}>
      {renderHeader(t.pendingHeader, () => router.back(), headerSubtitle)}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionTabs()}

        {activeSection === 'verifications' ? renderSearchBar() : null}
        {activeSection === 'verifications' ? renderVerificationsList() : null}
        {activeSection === 'contacts' ? renderContactsSection() : null}
        {activeSection === 'reports' ? renderReportsSection() : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        icon={confirmIcon}
        confirmColor={confirmColor}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmVisible(false)}
      />

      {renderRejectionModal()}
      {renderReportDetailsModal()}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={5000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}
