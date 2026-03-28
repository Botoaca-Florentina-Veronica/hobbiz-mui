import React, { useEffect, useMemo, useState } from 'react';
import { Platform, 
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
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

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = getAdminVerificationsTranslations(locale);
  const dateLocale = locale?.startsWith('es') ? 'es-ES' : locale?.startsWith('en') ? 'en-US' : 'ro-RO';

  // Helper to normalize image URLs for web compatibility
  const getImageSrc = (img?: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    return `${base}/uploads/${img}`;
  };

  const [activeSection, setActiveSection] = useState<AdminSection>('verifications');

  // Verifications section
  const [users, setUsers] = useState<UserWithDocuments[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [processingVerification, setProcessingVerification] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDocuments | null>(null);

  // Contacts section
  const [contactFilter, setContactFilter] = useState<AdminListStatus>('open');
  const [contacts, setContacts] = useState<ContactFallbackItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [processingContactId, setProcessingContactId] = useState<string | null>(null);

  // Reports section
  const [reportFilter, setReportFilter] = useState<AdminListStatus>('open');
  const [reports, setReports] = useState<AnnouncementReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [processingReportId, setProcessingReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AnnouncementReportItem | null>(null);

  // Counters for section badges
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [openContactsCount, setOpenContactsCount] = useState(0);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Confirmation Dialog states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmIcon, setConfirmIcon] = useState('alert-circle-outline');
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Rejection Modal states (for document rejection)
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
    setConfirmColor(currentStatus ? '#F44336' : tokens.colors.primary);
    setConfirmAction(() => async () => {
      try {
        setProcessingVerification(true);
        await toggleUserVerification(userId, !currentStatus);

        showToast(
          !currentStatus ? t.badgeGrantSuccess : t.badgeRemoveSuccess,
          !currentStatus ? 'success' : 'info'
        );

        if (selectedUser?._id === userId) {
          setSelectedUser({ ...selectedUser, isVerified: !currentStatus });
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
    setConfirmColor('#F44336');
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
    setConfirmColor('#F44336');
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
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
      default:
        return '#FF9800';
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top + 10,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    content: {
      flex: 1,
    },
    sectionsRow: {
      flexDirection: 'row',
      marginTop: 16,
      marginHorizontal: 16,
      marginBottom: 4,
      gap: 8,
    },
    sectionButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    sectionButtonActive: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    sectionButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    sectionButtonTextActive: {
      color: '#fff',
    },
    sectionCount: {
      minWidth: 20,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionCountText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    filterRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 12,
      gap: 8,
    },
    filterButton: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: tokens.colors.surface,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    filterButtonActive: {
      backgroundColor: tokens.colors.primary,
      borderColor: tokens.colors.primary,
    },
    filterButtonText: {
      fontSize: 12,
      color: tokens.colors.text,
      fontWeight: '600',
    },
    filterButtonTextActive: {
      color: '#fff',
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: tokens.colors.primary + '30',
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    userEmail: {
      fontSize: 14,
      color: tokens.colors.muted,
      marginTop: 2,
    },
    pendingCount: {
      fontSize: 12,
      color: '#FF9800',
      marginTop: 4,
      fontWeight: '600',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF5020',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    verifiedText: {
      fontSize: 12,
      color: '#4CAF50',
      fontWeight: '600',
      marginLeft: 4,
    },
    sectionCard: {
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: tokens.colors.text,
    },
    cardSubTitle: {
      marginTop: 2,
      fontSize: 13,
      color: tokens.colors.muted,
    },
    cardMetaRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    cardStatusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    cardStatusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    cardDateText: {
      fontSize: 12,
      color: tokens.colors.muted,
      flexShrink: 1,
      textAlign: 'right',
    },
    cardMessage: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 20,
      color: tokens.colors.text,
    },
    cardError: {
      marginTop: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#F4433680',
      backgroundColor: '#F4433620',
      padding: 10,
    },
    cardErrorText: {
      color: '#B71C1C',
      fontSize: 12,
      lineHeight: 16,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionBtn: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      backgroundColor: tokens.colors.surface,
    },
    actionBtnPrimary: {
      borderColor: '#2E7D32',
      backgroundColor: '#4CAF5020',
    },
    actionBtnDanger: {
      borderColor: '#C62828',
      backgroundColor: '#F4433620',
    },
    actionBtnNeutral: {
      borderColor: tokens.colors.primary,
      backgroundColor: tokens.colors.primary + '15',
    },
    actionBtnText: {
      fontWeight: '700',
      fontSize: 12,
      color: tokens.colors.text,
    },
    actionBtnTextPrimary: {
      color: '#2E7D32',
    },
    actionBtnTextDanger: {
      color: '#C62828',
    },
    actionBtnTextNeutral: {
      color: tokens.colors.primary,
    },
    documentCard: {
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    documentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    documentName: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
      marginBottom: 4,
    },
    documentType: {
      fontSize: 14,
      color: tokens.colors.muted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    documentActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border,
    },
    verificationActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    approveButton: {
      backgroundColor: '#4CAF5020',
    },
    rejectButton: {
      backgroundColor: '#F4433620',
    },
    verificationActionText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    approveButtonText: {
      color: '#4CAF50',
    },
    rejectButtonText: {
      color: '#F44336',
    },
    badgeControl: {
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    badgeControlHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: tokens.colors.text,
      marginBottom: 12,
    },
    badgeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
    },
    grantBadgeButton: {
      backgroundColor: '#4CAF50',
    },
    revokeBadgeButton: {
      backgroundColor: '#F44336',
    },
    badgeButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: tokens.colors.muted,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 220,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      borderTopWidth: 1,
      borderColor: tokens.colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: tokens.colors.text,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 16,
      color: tokens.colors.text,
    },
    modalInput: {
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: tokens.colors.text,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    rejectConfirmButton: {
      borderRadius: 12,
      alignItems: 'center',
    },
    rejectConfirmButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    reportDetailsBox: {
      marginTop: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: tokens.colors.border,
      backgroundColor: isDark ? '#1f1f1f' : '#f8fafc',
      padding: 12,
    },
    reportDetailsText: {
      fontSize: 14,
      lineHeight: 20,
      color: tokens.colors.text,
    },
  });

  const renderSectionButtons = () => (
    <View style={styles.sectionsRow}>
      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'verifications' && styles.sectionButtonActive]}
        onPress={() => setActiveSection('verifications')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'verifications' && styles.sectionButtonTextActive]}>
          {t.sectionVerifications}
        </Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{users.length}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'contacts' && styles.sectionButtonActive]}
        onPress={() => setActiveSection('contacts')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'contacts' && styles.sectionButtonTextActive]}>
          {t.sectionContacts}
        </Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{openContactsCount}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.sectionButton, activeSection === 'reports' && styles.sectionButtonActive]}
        onPress={() => setActiveSection('reports')}
      >
        <Text style={[styles.sectionButtonText, activeSection === 'reports' && styles.sectionButtonTextActive]}>
          {t.sectionReports}
        </Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{openReportsCount}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderVerificationsList = () => {
    if (loadingVerifications) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={tokens.colors.muted} />
          <ThemedText style={styles.emptyStateText}>{t.emptyPending}</ThemedText>
        </View>
      );
    }

    return users.map((user) => (
      <TouchableOpacity
        key={user._id}
        style={styles.userCard}
        onPress={() => handleViewUserDocuments(user)}
        disabled={processingVerification}
      >
        {user.avatar ? (
          <Image source={{ uri: getImageSrc(user.avatar) || undefined }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={tokens.colors.primary} style={{ alignSelf: 'center', marginTop: 10 }} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.pendingCount}>
            {t.pendingDocumentsCount.replace('{count}', String(user.pendingDocuments?.length || 0))}
          </Text>
        </View>
        {user.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.verifiedText}>{t.statusVerified}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={24} color={tokens.colors.muted} />
      </TouchableOpacity>
    ));
  };

  const renderContactsSection = () => (
    <>
      <View style={styles.filterRow}>
        {(['open', 'resolved', 'all'] as AdminListStatus[]).map((status) => {
          const active = contactFilter === status;
          const label = status === 'open' ? t.filterOpen : status === 'resolved' ? t.filterResolved : t.filterAll;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, active && styles.filterButtonActive]}
              onPress={() => setContactFilter(status)}
            >
              <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loadingContacts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-unread-outline" size={64} color={tokens.colors.muted} />
          <ThemedText style={styles.emptyStateText}>{t.contactsEmpty}</ThemedText>
        </View>
      ) : (
        contacts.map((item) => {
          const isBusy = processingContactId === item._id;
          return (
            <View key={item._id} style={styles.sectionCard}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubTitle}>{item.email}</Text>

              <View style={styles.cardMetaRow}>
                <View
                  style={[
                    styles.cardStatusBadge,
                    { backgroundColor: item.status === 'resolved' ? '#4CAF50' : '#FF9800' },
                  ]}
                >
                  <Text style={styles.cardStatusText}>{item.status === 'resolved' ? t.statusResolved : t.statusOpen}</Text>
                </View>
                <Text style={styles.cardDateText}>{formatDate(item.createdAt, dateLocale)}</Text>
              </View>

              <Text style={styles.cardMessage}>{item.message}</Text>

              {item.ip ? <Text style={[styles.cardSubTitle, { marginTop: 8 }]}>{t.ipLabel}: {item.ip}</Text> : null}

              {item.mailError?.message ? (
                <View style={styles.cardError}>
                  <Text style={styles.cardErrorText}>{t.mailErrorLabel}: {item.mailError.message}</Text>
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => handleResolveContact(item._id)}
                  disabled={item.status === 'resolved' || isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color="#2E7D32" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>{t.contactsResolveAction}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => handleDeleteContact(item._id)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color="#C62828" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#C62828" />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>{t.contactsDeleteAction}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  const renderReportsSection = () => (
    <>
      <View style={styles.filterRow}>
        {(['open', 'resolved', 'all'] as AdminListStatus[]).map((status) => {
          const active = reportFilter === status;
          const label = status === 'open' ? t.filterOpen : status === 'resolved' ? t.filterResolved : t.filterAll;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, active && styles.filterButtonActive]}
              onPress={() => setReportFilter(status)}
            >
              <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loadingReports ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={64} color={tokens.colors.muted} />
          <ThemedText style={styles.emptyStateText}>{t.reportsEmpty}</ThemedText>
        </View>
      ) : (
        reports.map((item) => {
          const announcementObj = typeof item.announcement === 'object' ? item.announcement : null;
          const announcementId = announcementObj?._id || (typeof item.announcement === 'string' ? item.announcement : undefined);
          const reporterName = `${item.reporter?.firstName || ''} ${item.reporter?.lastName || ''}`.trim() || t.defaultUser;
          const listedByName = `${item.announcementOwner?.firstName || ''} ${item.announcementOwner?.lastName || ''}`.trim() || t.defaultUser;
          const isBusy = processingReportId === item._id;
          const reasonColor = REPORT_REASON_COLORS[item.reason] || REPORT_REASON_COLORS.other;

          return (
            <View key={item._id} style={styles.sectionCard}>
              <Text style={styles.cardTitle}>{announcementObj?.title || t.deletedAnnouncement}</Text>
              <View style={styles.cardMetaRow}>
                <View style={[styles.cardStatusBadge, { backgroundColor: reasonColor }]}>
                  <Text style={styles.cardStatusText}>{reportReasonLabel[item.reason] || reportReasonLabel.other}</Text>
                </View>
                <View
                  style={[
                    styles.cardStatusBadge,
                    { backgroundColor: item.status === 'resolved' ? '#4CAF50' : '#FF9800' },
                  ]}
                >
                  <Text style={styles.cardStatusText}>{item.status === 'resolved' ? t.statusResolved : t.statusOpen}</Text>
                </View>
              </View>

              <Text style={[styles.cardSubTitle, { marginTop: 8 }]}>
                {t.reporterLabel}: {reporterName}{item.reporter?.email ? ` (${item.reporter.email})` : ''}
              </Text>
              <Text style={styles.cardSubTitle}>{t.listedByLabel}: {listedByName}</Text>
              <Text style={styles.cardSubTitle}>{t.createdAtLabel}: {formatDate(item.createdAt, dateLocale)}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnNeutral]}
                  onPress={() => setSelectedReport(item)}
                  disabled={isBusy}
                >
                  <Ionicons name="eye-outline" size={16} color={tokens.colors.primary} />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextNeutral]}>{t.reportsDetailsAction}</Text>
                </TouchableOpacity>

                {announcementId ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnNeutral]}
                    onPress={() => router.push({ pathname: '/announcement-details', params: { id: announcementId } })}
                    disabled={isBusy}
                  >
                    <Ionicons name="open-outline" size={16} color={tokens.colors.primary} />
                    <Text style={[styles.actionBtnText, styles.actionBtnTextNeutral]}>{t.reportsOpenAnnouncement}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                {item.status !== 'resolved' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => handleResolveReport(item._id)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#2E7D32" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done-outline" size={16} color="#2E7D32" />
                        <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>{t.reportsResolveAction}</Text>
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
                >
                  {isBusy ? (
                    <ActivityIndicator size="small" color="#C62828" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#C62828" />
                      <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>{t.reportsDeleteAction}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  if (selectedUser) {
    return (
      <ThemedView style={[styles.container, Platform.OS === 'web' ? { height: '100%', overflow: 'hidden' } : undefined]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedUser(null)}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.userDocumentsHeader}</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.userCard}>
            {selectedUser.avatar ? (
              <Image source={{ uri: getImageSrc(selectedUser.avatar) || undefined }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={30} color={tokens.colors.primary} style={{ alignSelf: 'center', marginTop: 10 }} />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <Text style={styles.userEmail}>{selectedUser.email}</Text>
            </View>
            {selectedUser.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>{t.statusVerified}</Text>
              </View>
            )}
          </View>

          <View style={styles.badgeControl}>
            <Text style={styles.badgeControlHeader}>{t.badgeHeader}</Text>
            <TouchableOpacity
              style={[
                styles.badgeButton,
                selectedUser.isVerified ? styles.revokeBadgeButton : styles.grantBadgeButton,
              ]}
              onPress={() => handleToggleVerificationBadge(selectedUser._id, selectedUser.isVerified)}
              disabled={processingVerification}
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
                  <Text style={styles.badgeButtonText}>{selectedUser.isVerified ? t.removeBadge : t.grantBadge}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {(selectedUser.documents || []).map((doc) => (
            <View key={doc._id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentType}>{doc.type}</Text>
                  <Text style={[styles.documentType, { marginTop: 4 }]}> 
                    {t.uploadedLabel}: {new Date(doc.uploadedAt).toLocaleDateString(dateLocale)}
                  </Text>

                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 10,
                      backgroundColor: tokens.colors.primary + '15',
                      padding: 8,
                      borderRadius: 6,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => Linking.openURL(doc.url)}
                  >
                    <Ionicons name="eye-outline" size={18} color={tokens.colors.primary} />
                    <Text style={{ color: tokens.colors.primary, marginLeft: 6, fontWeight: '600', fontSize: 13 }}>
                      {t.viewFile}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getVerificationStatusColor(doc.status) }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#fff' }]} />
                  <Text style={styles.statusText}>{getVerificationStatusLabel(doc.status)}</Text>
                </View>
              </View>

              {doc.status === 'pending' && (
                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={[styles.verificationActionButton, styles.approveButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'verified')}
                    disabled={processingVerification}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.verificationActionText, styles.approveButtonText]}>{t.approve}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.verificationActionButton, styles.rejectButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'rejected')}
                    disabled={processingVerification}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                    <Text style={[styles.verificationActionText, styles.rejectButtonText]}>{t.reject}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {doc.rejectionReason && (
                <ThemedText style={{ marginTop: 8, fontSize: 14, color: '#F44336' }}>
                  {t.rejectionReasonLabel}: {doc.rejectionReason}
                </ThemedText>
              )}
            </View>
          ))}
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

        <Modal
          visible={rejectionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>{t.rejectionTitle}</ThemedText>
                <TouchableOpacity onPress={() => setRejectionModalVisible(false)}>
                  <Ionicons name="close" size={24} color={tokens.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 20, paddingBottom: 40 }}>
                <ThemedText style={styles.inputLabel}>{t.rejectionPrompt}</ThemedText>
                <ThemedTextInput
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder={t.rejectionPlaceholder}
                  placeholderTextColor={tokens.colors.muted}
                  multiline
                  numberOfLines={4}
                  style={[styles.modalInput, styles.textArea, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
                />

                <TouchableOpacity
                  style={[
                    styles.rejectConfirmButton,
                    {
                      backgroundColor: '#F44336',
                      marginTop: 20,
                      justifyContent: 'center',
                      paddingVertical: 14,
                    },
                  ]}
                  onPress={confirmRejection}
                  disabled={processingVerification}
                >
                  {processingVerification ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.rejectConfirmButtonText, { color: '#fff' }]}>{t.confirmRejection}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>

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

  return (
    <ThemedView style={[styles.container, Platform.OS === 'web' ? { height: '100%', overflow: 'hidden' } : undefined]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.pendingHeader}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {renderSectionButtons()}

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

      <Modal
        visible={rejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t.rejectionTitle}</ThemedText>
              <TouchableOpacity onPress={() => setRejectionModalVisible(false)}>
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20, paddingBottom: 40 }}>
              <ThemedText style={styles.inputLabel}>{t.rejectionPrompt}</ThemedText>
              <ThemedTextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder={t.rejectionPlaceholder}
                placeholderTextColor={tokens.colors.muted}
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.textArea, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}
              />

              <TouchableOpacity
                style={[
                  styles.rejectConfirmButton,
                  {
                    backgroundColor: '#F44336',
                    marginTop: 20,
                    justifyContent: 'center',
                    paddingVertical: 14,
                  },
                ]}
                onPress={confirmRejection}
                disabled={processingVerification}
              >
                {processingVerification ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.rejectConfirmButtonText, { color: '#fff' }]}>{t.confirmRejection}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t.reportsDetailsTitle}</ThemedText>
              <TouchableOpacity onPress={() => setSelectedReport(null)}>
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <ThemedText style={[styles.cardSubTitle, { marginTop: 14 }]}> 
                {t.reasonLabel}:{' '}
                {selectedReport ? reportReasonLabel[selectedReport.reason] || reportReasonLabel.other : ''}
              </ThemedText>
              <ThemedText style={styles.cardSubTitle}>
                {t.createdAtLabel}: {selectedReport ? formatDate(selectedReport.createdAt, dateLocale) : '—'}
              </ThemedText>

              <View style={styles.reportDetailsBox}>
                <ThemedText style={styles.reportDetailsText}>
                  {selectedReport?.details || t.reportNoDetails}
                </ThemedText>
              </View>

              {selectedReport?.adminNote ? (
                <View style={styles.reportDetailsBox}>
                  <ThemedText style={[styles.cardTitle, { fontSize: 14, marginBottom: 6 }]}>{t.adminNoteLabel}</ThemedText>
                  <ThemedText style={styles.reportDetailsText}>{selectedReport.adminNote}</ThemedText>
                </View>
              ) : null}

              <View style={styles.cardActions}>
                {selectedReport?.status !== 'resolved' ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => selectedReport?._id && handleResolveReport(selectedReport._id)}
                    disabled={processingReportId === selectedReport?._id}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color="#2E7D32" />
                    <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>{t.reportsResolveAction}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => selectedReport?._id && handleDeleteReport(selectedReport._id)}
                  disabled={processingReportId === selectedReport?._id}
                >
                  <Ionicons name="trash-outline" size={16} color="#C62828" />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>{t.reportsDeleteAction}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

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
