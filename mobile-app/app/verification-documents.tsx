import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { useAuth } from '../src/context/AuthContext';
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
  const { tokens } = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // Check if this is admin view
  const isAdminView = params.adminView === 'true';
  const targetUserId = params.userId as string | undefined;
  
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [targetUser, setTargetUser] = useState<UserWithDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Document type options
  const documentTypes = [
    { value: 'certificate', label: 'Certificat' },
    { value: 'diploma', label: 'Diplomă' },
    { value: 'authorization', label: 'Autorizație' },
    { value: 'license', label: 'Licență' },
    { value: 'other', label: 'Altele' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

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
      Alert.alert('Eroare', 'Nu s-au putut încărca documentele.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const uri = await pickDocument();
      if (!uri) return;

      // Show dialog to select type and enter name
      Alert.prompt(
        'Nume document',
        'Introdu un nume pentru acest document:',
        async (name) => {
          if (!name) return;
          
          Alert.alert(
            'Tip document',
            'Selectează tipul documentului:',
            documentTypes.map(type => ({
              text: type.label,
              onPress: async () => {
                try {
                  setUploading(true);
                  await uploadDocument(uri, type.value, name);
                  Alert.alert('Succes', 'Document încărcat cu succes și trimis spre verificare.');
                  fetchDocuments();
                } catch (error) {
                  console.error('Error uploading document:', error);
                  Alert.alert('Eroare', 'Nu s-a putut încărca documentul.');
                } finally {
                  setUploading(false);
                }
              },
            })).concat([{ text: 'Anulează' } as any])
          );
        }
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Eroare', 'Nu s-a putut selecta documentul.');
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    // Only allow deletion if not in admin view
    if (isAdminView) {
      Alert.alert('Info', 'Doar utilizatorul poate șterge propriile documente.');
      return;
    }
    
    Alert.alert(
      'Confirmare',
      'Sigur vrei să ștergi acest document?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(documentId);
              Alert.alert('Succes', 'Document șters cu succes.');
              fetchDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Eroare', 'Nu s-a putut șterge documentul.');
            }
          },
        },
      ]
    );
  };

  const handleVerifyDocumentAdmin = async (documentId: string, status: 'verified' | 'rejected') => {
    if (!isAdminView || !targetUserId) return;
    
    if (status === 'rejected') {
      Alert.prompt(
        'Motiv respingere',
        'Introdu motivul pentru care respingi acest document:',
        async (reason) => {
          if (!reason) return;
          await performVerification(documentId, status, reason);
        }
      );
    } else {
      Alert.alert(
        'Confirmare',
        'Sigur vrei să verifici acest document ca fiind autentic?',
        [
          { text: 'Anulează', style: 'cancel' },
          { text: 'Verifică', onPress: () => performVerification(documentId, status) }
        ]
      );
    }
  };

  const performVerification = async (
    documentId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    if (!targetUserId) return;
    
    try {
      setProcessing(true);
      await verifyDocument(targetUserId, documentId, status, rejectionReason);
      Alert.alert(
        'Succes',
        `Document ${status === 'verified' ? 'verificat' : 'respins'} cu succes.`
      );
      fetchDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      Alert.alert('Eroare', 'Nu s-a putut procesa documentul.');
    } finally {
      setProcessing(false);
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
        return 'Verificat';
      case 'rejected':
        return 'Respins';
      case 'pending':
      default:
        return 'În așteptare';
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
      backgroundColor: tokens.colors.primary + '20',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: tokens.colors.primary,
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
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documente de Verificare</Text>
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
          {isAdminView ? `Documente - ${targetUser?.firstName || 'Utilizator'}` : 'Documente de Verificare'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {isAdminView && targetUser && (
          <View style={[styles.infoCard, { backgroundColor: '#FF980020', borderLeftColor: '#FF9800' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color="#FF9800" style={{ marginRight: 8 }} />
              <ThemedText style={[styles.infoText, { fontWeight: '600' }]}>
                Mod Administrator
              </ThemedText>
            </View>
            <ThemedText style={styles.infoText}>
              Vizualizezi documentele utilizatorului {targetUser.firstName} {targetUser.lastName}.
              {'\n'}Status verificare: {targetUser.isVerified ? '✅ Verificat' : '❌ Neverificat'}
            </ThemedText>
          </View>
        )}

        {!isAdminView && (
          <>
            <View style={styles.infoCard}>
              <ThemedText style={styles.infoText}>
                Încarcă documente care atestă abilitățile tale profesionale (certificate, diplome, autorizații, etc.). 
                Administratorul platformei va verifica autenticitatea acestora. După verificare, vei primi un badge de verificare pe profil.
              </ThemedText>
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
                  <Text style={styles.uploadButtonText}>Încarcă Document</Text>
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
                Nu ai încărcat încă niciun document.{'\n'}
                Apasă butonul de mai sus pentru a începe.
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
                      Încărcat: {new Date(doc.uploadedAt).toLocaleDateString('ro-RO')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) }]}>
                    <View style={[styles.statusDot, { backgroundColor: '#fff' }]} />
                    <Text style={styles.statusText}>{getStatusLabel(doc.status)}</Text>
                  </View>
                </View>

                {doc.status === 'rejected' && doc.rejectionReason && (
                  <View style={styles.rejectionReason}>
                    <Text style={styles.rejectionLabel}>Motiv respingere:</Text>
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
                        <Text style={[styles.deleteButtonText, { color: '#4CAF50' }]}>Aprobă</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleVerifyDocumentAdmin(doc._id, 'rejected')}
                        disabled={processing}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                        <Text style={styles.deleteButtonText}>Respinge</Text>
                      </TouchableOpacity>
                    </>
                  ) : !isAdminView ? (
                    // User delete button (only for their own documents)
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDocument(doc._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                      <Text style={styles.deleteButtonText}>Șterge</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
