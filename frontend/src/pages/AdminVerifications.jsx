import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress,
  Chip,
  Tooltip,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  getPendingVerifications, 
  verifyDocument, 
  getUserDocumentsAdmin,
  toggleUserVerification 
} from '../api/api';
import './AccountSettings.css';
import './AdminVerifications.css';

export default function AdminVerifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Rejection State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [targetDoc, setTargetDoc] = useState(null); // { userId, docId }

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      if (window.showToast) {
        window.showToast(t('verification.messages.fetchError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDocs = async (user) => {
    try {
      setProcessing(true);
      const response = await getUserDocumentsAdmin(user._id);
      setSelectedUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user docs:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAction = async (userId, docId, status) => {
    if (status === 'rejected') {
      setTargetDoc({ userId, docId });
      setRejectionReason('');
      setRejectionModalOpen(true);
    } else {
      performVerification(userId, docId, 'verified');
    }
  };

  const performVerification = async (userId, docId, status, reason = '') => {
    try {
      setProcessing(true);
      await verifyDocument(userId, docId, { status, rejectionReason: reason });
      if (window.showToast) {
        window.showToast(status === 'verified' ? t('verification.admin.verifySuccess') : t('verification.admin.rejectSuccess'), 'success');
      }
      setRejectionModalOpen(false);
      // Refresh
      if (selectedUser) {
        const response = await getUserDocumentsAdmin(selectedUser._id);
        setSelectedUser(response.data.user);
      }
      fetchPending();
    } catch (error) {
      console.error('Error verifying doc:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleBadge = async (userId, currentStatus) => {
    try {
      setProcessing(true);
      await toggleUserVerification(userId, { isVerified: !currentStatus });
      if (window.showToast) {
        window.showToast(t('verification.admin.badgeSuccess'), 'success');
      }
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isVerified: !currentStatus });
      }
      fetchPending();
    } catch (error) {
      console.error('Error toggling badge:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="account-settings-page-container">
      <Container maxWidth="lg" className="notification-settings-container">
        <div className="mobile-header">
          <IconButton onClick={() => navigate(-1)} className="mobile-back-btn">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title">{t('verification.admin.pendingTitle')}</Typography>
        </div>

        <h1 className="notification-title">{t('verification.admin.pendingTitle')}</h1>

        <Paper elevation={0} className="settings-paper">
          {loading ? (
            <Box p={4} textAlign="center"><CircularProgress /></Box>
          ) : users.length === 0 ? (
            <Box p={4} textAlign="center"><Typography color="textSecondary">Nu există verificări în așteptare.</Typography></Box>
          ) : (
            <TableContainer component={Box}>
              <Table>
                <TableHead>
                  <TableRow className="admin-table-header">
                    <TableCell className="admin-table-header-cell">Utilizator</TableCell>
                    <TableCell align="center" className="admin-table-header-cell">Documente</TableCell>
                    <TableCell align="center" className="admin-table-header-cell">Verificat</TableCell>
                    <TableCell align="right" className="admin-table-header-cell">Acțiuni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow 
                      key={user._id}
                      onClick={() => navigate(`/profil/${user._id}`)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: (theme) => theme.palette.action.hover } }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{user.firstName} {user.lastName}</Typography>
                            <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={user.pendingDocuments?.length || 0} size="small" color="warning" />
                      </TableCell>
                      <TableCell align="center">
                        {user.isVerified ? <VerifiedIcon color="success" /> : <CloseIcon color="disabled" />}
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<VisibilityIcon />} 
                          onClick={(e) => { e.stopPropagation(); handleOpenUserDocs(user); }}
                        >
                          Vezi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* User Documents Modal */}
      <Dialog 
        open={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        fullWidth 
        maxWidth="md"
        className="admin-verification-dialog"
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none !important',
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? '#121212 !important' 
              : '#ffffff !important',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.6)' 
              : '0 20px 60px rgba(0,0,0,0.1)'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pt: 3 }}>
          Documente: {selectedUser?.firstName} {selectedUser?.lastName}
          {selectedUser && (
            <Box mt={1} display="flex" gap={1}>
              <Button 
                variant={selectedUser.isVerified ? "contained" : "outlined"} 
                color={selectedUser.isVerified ? "success" : "primary"}
                onClick={() => handleToggleBadge(selectedUser._id, selectedUser.isVerified)}
                startIcon={<VerifiedIcon />}
                size="small"
              >
                {selectedUser.isVerified ? "Verificat (Badge Activ)" : "Acordă Badge"}
              </Button>
              {selectedUser.isVerified && (
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => handleToggleBadge(selectedUser._id, selectedUser.isVerified)}
                  startIcon={<CloseIcon />}
                  size="small"
                >
                  Șterge Badge
                </Button>
              )}
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser?.documents?.length === 0 ? (
            <Typography>Niciun document încărcat.</Typography>
          ) : (
            <List>
              {selectedUser?.documents?.map((doc, idx) => (
                <React.Fragment key={doc._id}>
                  <ListItem>
                    <ListItemText 
                      primary={doc.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">{t(`verification.types.${doc.type}`)}</Typography>
                          {doc.description && <Typography variant="body2">{doc.description}</Typography>}
                          <Box mt={1}>
                            <Button 
                              size="small" 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener"
                              variant="text"
                              startIcon={<VisibilityIcon />}
                            >
                              Vezi Document
                            </Button>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {doc.status === 'pending' ? (
                        <Box display="flex" gap={1}>
                          <IconButton color="success" onClick={() => handleVerifyAction(selectedUser._id, doc._id, 'verified')}>
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleVerifyAction(selectedUser._id, doc._id, 'rejected')}>
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Chip 
                          label={t(`verification.status.${doc.status}`)} 
                          color={doc.status === 'verified' ? 'success' : 'error'} 
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < selectedUser.documents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedUser(null)}>Închide</Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog 
        open={rejectionModalOpen} 
        onClose={() => setRejectionModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : 'none',
            p: 1,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 20px 60px rgba(0,0,0,0.6)' 
              : '0 20px 60px rgba(0,0,0,0.1)'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(0, 0, 0, 0.4)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{t('verification.admin.rejectionTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('verification.admin.rejectionReason')}
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t('verification.admin.rejectionPlaceholder')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionModalOpen(false)}>Anulează</Button>
          <Button 
            onClick={() => performVerification(targetDoc.userId, targetDoc.docId, 'rejected', rejectionReason)} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim() || processing}
          >
            Respinge
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
