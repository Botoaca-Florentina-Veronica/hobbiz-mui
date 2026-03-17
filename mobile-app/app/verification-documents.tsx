import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { useAuth } from '../src/context/AuthContext';
import { Toast } from '../components/ui/Toast';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getVerificationDocumentsTranslations } from '../src/i18n/verification-documents';
import { 
  getUserDocuments, 
  getUserDocumentsAdmin,
  uploadDocument, 
  deleteDocument,
  verifyDocument,
  pickDocument,
  type VerificationDocument,
  type UserWithDocuments
} from '../src/services/verificationService';

export default function VerificationDocumentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const t = getVerificationDocumentsTranslations(locale);
  const dateLocale = locale?.startsWith('es') ? 'es-ES' : locale?.startsWith('en') ? 'en-US' : 'ro-RO';
  
  // Check if this is admin view
  const isAdminView = params.adminView === 'true';
  const targetUserId = params.userId as string | undefined;
  
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [targetUser, setTargetUser] = useState<UserWithDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Modal states for Upload
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('certificate');
  const [newDocDesc, setNewDocDesc] = useState('');

  // Modal states for Admin Rejection
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Confirmation Dialog states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmIcon, setConfirmIcon] = useState('alert-circle-outline');
  const [confirmColor, setConfirmColor] = useState<string | undefined>(undefined);

  // Document type options
  const documentTypes = [
    { value: 'certificate', label: t.documentTypes.certificate },
    { value: 'diploma', label: t.documentTypes.diploma },
    { value: 'authorization', label: t.documentTypes.authorization },
    { value: 'license', label: t.documentTypes.license },
    { value: 'other', label: t.documentTypes.other },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      if (isAdminView && targetUserId) {
        // Admin viewing another user's documents
        const response = await getUserDocumentsAdmin(targetUserId);
        setTargetUser(response.user);
        setDocuments(response.user.documents || []);
      } else {
        // User viewing their own documents
        const response = await getUserDocuments();
        setDocuments(response.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast(t.loadError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const uri = await pickDocument();
      if (!uri) return;

      setPickedUri(uri);
      setNewDocName('');
      setNewDocDesc('');
      setUploadModalVisible(true);
    } catch (error) {
      console.error('Error picking document:', error);
      showToast(t.pickError, 'error');
    }
  };

  const confirmUpload = async () => {
    if (!pickedUri) return;
    if (!newDocName.trim()) {
      showToast(t.nameRequired, 'info');
      return;
    }

    try {
      setUploading(true);
      await uploadDocument(pickedUri, newDocType, newDocName, newDocDesc);
      setUploadModalVisible(false);
      showToast(t.uploadSuccess);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast(t.uploadError, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    // Only allow deletion if not in admin view
    if (isAdminView) {
      showToast(t.deleteNotAllowed, 'info');
      return;
    }
    
    setConfirmTitle(t.deleteTitle);
    setConfirmMessage(t.deleteMessage);
    setConfirmIcon('trash-outline');
    setConfirmColor('#F44336');
    setConfirmAction(() => async () => {
      try {
        await deleteDocument(documentId);
        showToast(t.deleteSuccess, 'info');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        showToast(t.deleteError, 'error');
      } finally {
        setConfirmVisible(false);
      }
    });
    setConfirmVisible(true);
  };

  const handleVerifyDocumentAdmin = async (documentId: string, status: 'verified' | 'rejected') => {
    if (!isAdminView || !targetUserId) return;
    
    if (status === 'rejected') {
      setRejectingDocId(documentId);
      setRejectionReason('');
      setRejectionModalVisible(true);
    } else {
      setConfirmTitle(t.verifyTitle);
      setConfirmMessage(t.verifyMessage);
      setConfirmIcon('checkmark-shield-outline');
      setConfirmColor(tokens.colors.primary);
      setConfirmAction(() => () => performVerification(documentId, status));
      setConfirmVisible(true);
    }
  };

  const confirmRejection = async () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      showToast(t.rejectionReasonRequired, 'info');
      return;
    }
    await performVerification(rejectingDocId, 'rejected', rejectionReason);
    setRejectionModalVisible(false);
  };

  const performVerification = async (
    documentId: string,
    status: 'verified' | 'rejected',
    rejectionReasonText?: string
  ) => {
    if (!targetUserId) return;
    
    try {
      setProcessing(true);
      await verifyDocument(targetUserId, documentId, status, rejectionReasonText);
      showToast(
        status === 'verified' ? t.verifySuccessVerified : t.verifySuccessRejected,
        status === 'verified' ? 'success' : 'info'
      );
      fetchDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      showToast(t.verifyError, 'error');
    } finally {
      setProcessing(false);
      setConfirmVisible(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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
    infoCard: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: tokens.colors.primary,
    },
    infoIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    infoCardTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    infoText: {
      fontSize: 14,
      color: tokens.colors.text,
      lineHeight: 20,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: tokens.colors.primary,
      borderRadius: 12,
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    documentsList: {
      padding: 16,
      paddingTop: 0,
    },
    documentCard: {
      backgroundColor: tokens.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    documentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    documentInfo: {
      flex: 1,
      marginRight: 12,
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
      marginBottom: 4,
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
    documentDate: {
      fontSize: 12,
      color: tokens.colors.muted,
      marginTop: 4,
    },
    documentActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: '#F4433620',
      borderRadius: 8,
    },
    deleteButtonText: {
      color: '#F44336',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 4,
    },
    rejectionReason: {
      marginTop: 8,
      padding: 12,
      backgroundColor: '#F4433610',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#F44336',
    },
    rejectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: '#F44336',
      marginBottom: 4,
    },
    rejectionText: {
      fontSize: 14,
      color: tokens.colors.text,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
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
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? tokens.colors.surface : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? tokens.colors.border : '#E0E0E0',
      backgroundColor: isDark ? tokens.colors.surface : '#F8F9FA',
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
      color: isDark ? tokens.colors.text : '#2C3E50',
    },
    modalInput: {
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      backgroundColor: isDark ? '#333' : '#F5F5F5',
      color: tokens.colors.text,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#E0E0E0',
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? tokens.colors.border : '#D0D0D0',
      backgroundColor: isDark ? 'transparent' : '#FFFFFF',
    },
    typeOptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: tokens.colors.text,
    },
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.documentsHeader}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isAdminView ? `${t.documentsHeaderAdminPrefix} - ${targetUser?.firstName || t.user}` : t.documentsHeader}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {isAdminView && targetUser && (
          <View style={[styles.infoCard, isDark ? { backgroundColor: tokens.colors.surface } : { backgroundColor: tokens.colors.primary + '10' }, { borderLeftColor: tokens.colors.primary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={tokens.colors.primary} style={{ marginRight: 8 }} />
              <ThemedText style={[styles.infoText, { fontWeight: '600' }]}>
                {t.adminModeTitle}
              </ThemedText>
            </View>
            <ThemedText style={styles.infoText}>
              {t.adminViewing} {targetUser.firstName} {targetUser.lastName}.
              {'\n'}{t.verificationStatus}: {targetUser.isVerified ? `✅ ${t.verifiedLabel}` : `❌ ${t.notVerifiedLabel}`}
            </ThemedText>
          </View>
        )}

        {!isAdminView && (
          <>
            <View style={[styles.infoCard, isDark ? { backgroundColor: tokens.colors.surface } : { backgroundColor: '#F7FAFB' }, { borderLeftColor: tokens.colors.primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={[styles.infoIconWrap, { borderColor: tokens.colors.primary, backgroundColor: tokens.colors.primary + '10' }]}>
                  <Ionicons name="information-circle-outline" size={20} color={tokens.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={[styles.infoCardTitle, { color: tokens.colors.text }]}>{t.verifyWhyTitle}</ThemedText>
                  <View style={{ height: 6 }} />
                  <ThemedText style={[styles.infoText, { color: tokens.colors.muted }]}>{t.verifyWhyBody}</ThemedText>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={handleUploadDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#fff" />
                  <Text style={styles.uploadButtonText}>{t.uploadButtonText}</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.documentsList}>
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={tokens.colors.muted} />
              <ThemedText style={styles.emptyStateText}>
                {t.emptyStateLine1}{'\n'}
                {t.emptyStateLine2}
              </ThemedText>
            </View>
          ) : (
            documents.map((doc) => (
              <View key={doc._id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <Text style={styles.documentType}>
                      {documentTypes.find(t => t.value === doc.type)?.label || doc.type}
                    </Text>
                    <Text style={styles.documentDate}>
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
                        alignSelf: 'flex-start'
                      }}
                      onPress={() => Linking.openURL(doc.url)}
                    >
                      <Ionicons name="eye-outline" size={18} color={tokens.colors.primary} />
                      <Text style={{ color: tokens.colors.primary, marginLeft: 6, fontWeight: '600', fontSize: 13 }}>
                        {t.viewFile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#fff' }]} />
                    <Text style={styles.statusText}>{getStatusLabel(doc.status)}</Text>
                  </View>
                </View>

                {doc.status === 'rejected' && doc.rejectionReason && (
                  <View style={styles.rejectionReason}>
                    <Text style={styles.rejectionLabel}>{t.rejectionTitle}:</Text>
                    <ThemedText style={styles.rejectionText}>{doc.rejectionReason}</ThemedText>
                  </View>
                )}

                {doc.description && (
                  <ThemedText style={[styles.documentType, { marginTop: 8 }]}>
                    {doc.description}
                  </ThemedText>
                )}

                <View style={styles.documentActions}>
                  {isAdminView && doc.status === 'pending' ? (
                    // Admin action buttons for pending documents
                    <>
                      <TouchableOpacity 
                        style={[styles.deleteButton, { backgroundColor: '#4CAF5020', marginRight: 8 }]}
                        onPress={() => handleVerifyDocumentAdmin(doc._id, 'verified')}
                        disabled={processing}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                        <Text style={[styles.deleteButtonText, { color: '#4CAF50' }]}>{t.approve}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleVerifyDocumentAdmin(doc._id, 'rejected')}
                        disabled={processing}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                        <Text style={styles.deleteButtonText}>{t.reject}</Text>
                      </TouchableOpacity>
                    </>
                  ) : !isAdminView ? (
                    // User delete button (only for their own documents)
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDocument(doc._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                        <Text style={styles.deleteButtonText}>{t.delete}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Document Details Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t.documentDetailsTitle}</ThemedText>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={24} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <ThemedText style={styles.inputLabel}>{t.documentNameLabel}</ThemedText>
              <ThemedTextInput
                value={newDocName}
                onChangeText={setNewDocName}
                placeholder={t.documentNamePlaceholder}
                placeholderTextColor={isDark ? tokens.colors.muted : '#999999'}
                style={styles.modalInput}
              />

              <ThemedText style={styles.inputLabel}>{t.documentTypeLabel}</ThemedText>
              <View style={styles.typeSelector}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      newDocType === type.value && { backgroundColor: tokens.colors.primary, borderColor: tokens.colors.primary }
                    ]}
                    onPress={() => setNewDocType(type.value)}
                  >
                    <ThemedText style={[
                      styles.typeOptionText,
                      newDocType === type.value && { color: '#fff' }
                    ]}>
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={styles.inputLabel}>{t.documentDescLabel}</ThemedText>
              <ThemedTextInput
                value={newDocDesc}
                onChangeText={setNewDocDesc}
                placeholder={t.documentDescPlaceholder}
                placeholderTextColor={isDark ? tokens.colors.muted : '#999999'}
                multiline
                numberOfLines={3}
                style={[styles.modalInput, styles.textArea]}
              />

              <TouchableOpacity
                style={[
                  styles.uploadButton, 
                  { 
                    marginHorizontal: 0, 
                    marginTop: 20,
                    shadowColor: tokens.colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }
                ]}
                onPress={confirmUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadButtonText}>{t.confirmUpload}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Admin Rejection Reason Modal */}
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

            <View style={{ padding: 20 }}>
              <ThemedText style={styles.inputLabel}>{t.rejectionPrompt}</ThemedText>
              <ThemedTextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder={t.rejectionPlaceholder}
                placeholderTextColor={isDark ? tokens.colors.muted : '#999999'}
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.textArea]}
              />

              <TouchableOpacity
                style={[styles.deleteButton, { 
                  backgroundColor: '#F44336', 
                  marginTop: 20, 
                  justifyContent: 'center',
                  paddingVertical: 14 
                }]}
                onPress={confirmRejection}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.deleteButtonText, { color: '#fff' }]}>{t.confirmRejection}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
      <ConfirmDialog
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        icon={confirmIcon}
        confirmColor={confirmColor}
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmVisible(false)}
      />

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