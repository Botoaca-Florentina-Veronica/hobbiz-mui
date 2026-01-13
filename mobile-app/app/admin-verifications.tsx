import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { ThemedView } from '../components/themed-view';
import { ThemedText } from '../components/themed-text';
import { 
  getPendingVerifications, 
  verifyDocument, 
  toggleUserVerification,
  getUserDocumentsAdmin,
  type UserWithDocuments,
  type VerificationDocument 
} from '../src/services/verificationService';

export default function AdminVerificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useAppTheme();
  
  const [users, setUsers] = useState<UserWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDocuments | null>(null);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();
      setUsers(response.users || []);
    } catch (error: any) {
      console.error('Error fetching pending verifications:', error);
      if (error?.response?.status === 403) {
        Alert.alert('Acces refuzat', 'Nu ai permisiuni de administrator.');
        router.back();
      } else {
        Alert.alert('Eroare', 'Nu s-au putut încărca verificările pendinte.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (userId: string, documentId: string, status: 'verified' | 'rejected') => {
    if (status === 'rejected') {
      Alert.prompt(
        'Motiv respingere',
        'Introdu motivul pentru care respingi acest document:',
        async (reason) => {
          if (!reason) return;
          await performVerification(userId, documentId, status, reason);
        }
      );
    } else {
      await performVerification(userId, documentId, status);
    }
  };

  const performVerification = async (
    userId: string, 
    documentId: string, 
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      setProcessing(true);
      await verifyDocument(userId, documentId, status, rejectionReason);
      Alert.alert(
        'Succes', 
        `Document ${status === 'verified' ? 'verificat' : 'respins'} cu succes.`
      );
      fetchPendingVerifications();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error verifying document:', error);
      Alert.alert('Eroare', 'Nu s-a putut procesa documentul.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleVerificationBadge = async (userId: string, currentStatus: boolean) => {
    Alert.alert(
      'Confirmare',
      `Sigur vrei să ${currentStatus ? 'elimini' : 'acorzi'} badge-ul de verificare acestui utilizator?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Confirmă',
          onPress: async () => {
            try {
              setProcessing(true);
              await toggleUserVerification(userId, !currentStatus);
              Alert.alert('Succes', `Badge ${!currentStatus ? 'acordat' : 'eliminat'} cu succes.`);
              fetchPendingVerifications();
            } catch (error) {
              console.error('Error toggling verification badge:', error);
              Alert.alert('Eroare', 'Nu s-a putut actualiza badge-ul.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleViewUserDocuments = async (user: UserWithDocuments) => {
    try {
      setProcessing(true);
      const response = await getUserDocumentsAdmin(user._id);
      setSelectedUser(response.user);
    } catch (error) {
      console.error('Error fetching user documents:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca documentele utilizatorului.');
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
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
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
    actionButton: {
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
    actionButtonText: {
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
    },
    backToListButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tokens.colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: tokens.colors.border,
    },
    backToListText: {
      fontSize: 14,
      color: tokens.colors.primary,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificări Pendinte</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (selectedUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedUser(null)}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documente Utilizator</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.userCard}>
            {selectedUser.avatar ? (
              <Image source={{ uri: selectedUser.avatar }} style={styles.avatar} />
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
                <Text style={styles.verifiedText}>Verificat</Text>
              </View>
            )}
          </View>

          <View style={styles.badgeControl}>
            <Text style={styles.badgeControlHeader}>Badge de Verificare</Text>
            <TouchableOpacity
              style={[
                styles.badgeButton,
                selectedUser.isVerified ? styles.revokeBadgeButton : styles.grantBadgeButton
              ]}
              onPress={() => handleToggleVerificationBadge(selectedUser._id, selectedUser.isVerified)}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={selectedUser.isVerified ? "close-circle" : "checkmark-circle"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.badgeButtonText}>
                    {selectedUser.isVerified ? 'Elimină Badge' : 'Acordă Badge'}
                  </Text>
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
                    Încărcat: {new Date(doc.uploadedAt).toLocaleDateString('ro-RO')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(doc.status) }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#fff' }]} />
                  <Text style={styles.statusText}>{getStatusLabel(doc.status)}</Text>
                </View>
              </View>

              {doc.status === 'pending' && (
                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'verified')}
                    disabled={processing}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    <Text style={[styles.actionButtonText, styles.approveButtonText]}>
                      Aprobă
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleVerifyDocument(selectedUser._id, doc._id, 'rejected')}
                    disabled={processing}
                  >
                    <Ionicons name="close-circle" size={20} color="#F44336" />
                    <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                      Respinge
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {doc.rejectionReason && (
                <ThemedText style={{ marginTop: 8, fontSize: 14, color: '#F44336' }}>
                  Motiv respingere: {doc.rejectionReason}
                </ThemedText>
              )}
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificări Pendinte</Text>
      </View>

      <ScrollView style={styles.content}>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={tokens.colors.muted} />
            <ThemedText style={styles.emptyStateText}>
              Nu există verificări pendinte.
            </ThemedText>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user._id}
              style={styles.userCard}
              onPress={() => handleViewUserDocuments(user)}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
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
                  {user.pendingDocuments?.length || 0} documente pendinte
                </Text>
              </View>
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verificat</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={24} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}
