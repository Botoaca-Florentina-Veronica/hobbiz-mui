import React, { useCallback, useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Dialog, 
  DialogContent, 
  DialogActions, 
  TextField, 
  CircularProgress,
  Divider,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminContactFallbacks from './AdminContactFallbacks';
import AdminReportsSection from './AdminReportsSection';
import { 
  getPendingVerifications, 
  verifyDocument, 
  getUserDocumentsAdmin,
  toggleUserVerification,
  getAnnouncementReports,
  getContactFallbacks
} from '../api/api';
import './AccountSettings.css';
import './AdminVerifications.css';

const getCloudinaryDownloadUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/fl_attachment/');
};

export default function AdminVerifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('verifications');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [processingDocId, setProcessingDocId] = useState(null);
  const [badgeProcessing, setBadgeProcessing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [targetDoc, setTargetDoc] = useState(null);

  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [openContactsCount, setOpenContactsCount] = useState(0);

  const fetchContactsCount = useCallback(async () => {
    try {
      const response = await getContactFallbacks('open');
      setOpenContactsCount(response.data.items?.length || 0);
    } catch (error) {
      console.error('Error fetching contacts count:', error);
    }
  }, []);

  const fetchReportsCount = useCallback(async () => {
    try {
      const response = await getAnnouncementReports('open');
      setOpenReportsCount(response.data.items?.length || 0);
    } catch (error) {
      console.error('Error fetching reports count:', error);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPendingVerifications();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      if (window.showToast) window.showToast(t('verification.messages.fetchError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { 
    fetchPending(); 
    fetchReportsCount();
    fetchContactsCount();
  }, [fetchPending, fetchReportsCount, fetchContactsCount]);

  const handleOpenUserDocs = async (user) => {
    try {
      setLoadingUserId(user._id);
      const response = await getUserDocumentsAdmin(user._id);
      setSelectedUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user docs:', error);
    } finally {
      setLoadingUserId(null);
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
      setProcessingDocId(docId);
      await verifyDocument(userId, docId, { status, rejectionReason: reason });
      if (window.showToast) {
        window.showToast(status === 'verified' ? t('verification.admin.verifySuccess') : t('verification.admin.rejectSuccess'), 'success');
      }
      setRejectionModalOpen(false);
      if (selectedUser?._id === userId) {
        const response = await getUserDocumentsAdmin(userId);
        setSelectedUser(response.data.user);
      }
      await fetchPending();
    } catch (error) {
      console.error('Error verifying doc:', error);
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleToggleBadge = async (userId, currentStatus) => {
    try {
      setBadgeProcessing(true);
      await toggleUserVerification(userId, { isVerified: !currentStatus });
      if (window.showToast) window.showToast(t('verification.admin.badgeSuccess'), 'success');
      setSelectedUser((prev) => {
        if (!prev || prev._id !== userId) return prev;
        return { ...prev, isVerified: !currentStatus };
      });
      await fetchPending();
    } catch (error) {
      console.error('Error toggling badge:', error);
    } finally {
      setBadgeProcessing(false);
    }
  };

  const getInitials = (user) =>
    user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '?';

  return (
    <div className="av-page">
      <Container maxWidth="lg" className="av-container">

        {/* Mobile Header (similar to VerificationDocuments) */}
        <div className="mobile-header">
          <IconButton
            onClick={() => navigate(-1)}
            className="mobile-back-btn"
            disableRipple
            aria-label="Înapoi"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title" sx={{ fontFamily: 'Poppins, sans-serif !important' }}>
            {t('header.adminVerifications')}
          </Typography>
        </div>

        <h1 className="av-title">{t('header.adminVerifications')}</h1>

        <div className="av-sections">
          <button
            type="button"
            className={`av-section-btn ${activeSection === 'verifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('verifications')}
          >
            {t('verification.admin.sections.verifications')}
            {!loading && <span className="av-count-badge">{users.length}</span>}
          </button>
          <button
            type="button"
            className={`av-section-btn ${activeSection === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveSection('contacts')}
          >
            {t('verification.admin.sections.contacts')}
            {openContactsCount > 0 && <span className="av-count-badge">{openContactsCount}</span>}
          </button>
          <button
            type="button"
            className={`av-section-btn ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            {t('verification.admin.sections.reports')}
            {openReportsCount > 0 && <span className="av-count-badge">{openReportsCount}</span>}
          </button>
        </div>

        {activeSection === 'verifications' ? (
          <>
            <Typography sx={{ mb: 2, color: 'text.secondary' }}>
              {t('verification.admin.pendingTitle')}
            </Typography>

            {loading ? (
              <div className="av-loader">
                <CircularProgress size={40} thickness={4} className="av-spinner" />
              </div>
            ) : users.length === 0 ? (
              <div className="av-empty">
                <VerifiedIcon className="av-empty-icon" />
                <Typography className="av-empty-text">{t('verification.admin.noPending')}</Typography>
              </div>
            ) : (
              <div className="av-grid">
                {users.map((user) => (
                  <div key={user._id} className="av-card" onClick={() => navigate(`/profil/${user._id}`)}>
                    <div className="av-card-left">
                      <Avatar
                        src={user.avatar}
                        className="av-avatar"
                      >
                        {!user.avatar && getInitials(user)}
                      </Avatar>
                      <div className="av-card-info">
                        <span className="av-card-name">{user.firstName} {user.lastName}</span>
                        <span className="av-card-email">{user.email}</span>
                        <div className="av-card-badges">
                          {user.isVerified && (
                            <span className="av-badge av-badge--verified">
                              <VerifiedIcon style={{ fontSize: 12 }} />
                              {t('verification.admin.colVerified')}
                            </span>
                          )}
                          {(user.pendingDocuments?.length > 0) && (
                            <span className="av-badge av-badge--pending">
                              <HourglassEmptyIcon style={{ fontSize: 12 }} />
                              {user.pendingDocuments.length} {t('verification.admin.colDocuments').toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="contained"
                      size="small"
                      className="av-view-btn"
                      startIcon={loadingUserId === user._id ? <CircularProgress size={14} /> : <VisibilityIcon />}
                      onClick={(e) => { e.stopPropagation(); handleOpenUserDocs(user); }}
                      disabled={loadingUserId === user._id}
                    >
                      {t('verification.admin.view')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeSection === 'contacts' ? (
          <Box sx={{ mt: 1 }}>
            <AdminContactFallbacks embedded onContactsChange={fetchContactsCount} />
          </Box>
        ) : (
          <AdminReportsSection onReportsChange={fetchReportsCount} />
        )}
      </Container>
      {/* Documents Dialog */}
      <Dialog
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        fullWidth
        maxWidth="sm"
        className="av-dialog"
        PaperProps={{ className: 'av-dialog-paper' }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0,0,0,0.45)'
          }
        }}
      >
        {/* Dialog Header */}
        <div className="av-dialog-header">
          <div className="av-dialog-user">
            <Avatar src={selectedUser?.avatar} className="av-dialog-avatar">
              {!selectedUser?.avatar && getInitials(selectedUser)}
            </Avatar>
            <div>
              <Typography className="av-dialog-name">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </Typography>
              <Typography className="av-dialog-email">{selectedUser?.email}</Typography>
            </div>
          </div>

          {/* Badge Toggle */}
          <div className="av-badge-toggle">
            <Button
              variant={selectedUser?.isVerified ? 'contained' : 'outlined'}
              className={`av-badge-btn ${selectedUser?.isVerified ? 'av-badge-btn--active' : ''}`}
              startIcon={<VerifiedIcon />}
              size="small"
              onClick={() => handleToggleBadge(selectedUser._id, selectedUser.isVerified)}
              disabled={badgeProcessing}
            >
              {selectedUser?.isVerified ? t('verification.admin.badgeActive') : t('verification.admin.grantBadge')}
            </Button>
            {selectedUser?.isVerified && (
              <Button
                variant="outlined"
                className="av-badge-btn av-badge-btn--remove"
                startIcon={<CloseIcon />}
                size="small"
                onClick={() => handleToggleBadge(selectedUser._id, selectedUser.isVerified)}
                disabled={badgeProcessing}
              >
                {t('verification.admin.removeBadge')}
              </Button>
            )}
          </div>
          <IconButton className="av-dialog-close" onClick={() => setSelectedUser(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <Divider className="av-dialog-divider" />

        {/* Document List */}
        <DialogContent className="av-dialog-content">
          {!selectedUser?.documents?.length ? (
            <div className="av-no-docs">
              <DescriptionOutlinedIcon className="av-no-docs-icon" />
              <Typography className="av-no-docs-text">{t('verification.admin.noDocuments')}</Typography>
            </div>
          ) : (
            <div className="av-doc-list">
              {selectedUser.documents.map((doc) => (
                <div key={doc._id} className={`av-doc-card av-doc-card--${doc.status}`}>
                  <div className="av-doc-card-top">
                    <div className="av-doc-icon-wrap">
                      <DescriptionOutlinedIcon className="av-doc-icon" />
                    </div>
                    <div className="av-doc-info">
                      <span className="av-doc-name">{doc.name}</span>
                      <span className="av-doc-type">{t(`verification.types.${doc.type}`)}</span>
                      {doc.description && (
                        <span className="av-doc-desc">{doc.description}</span>
                      )}
                    </div>
                    <div className="av-doc-status-wrap">
                      {doc.status === 'pending' ? (
                        <span className="av-doc-status av-doc-status--pending">
                          <HourglassEmptyIcon style={{ fontSize: 13 }} />
                          {t('verification.status.pending')}
                        </span>
                      ) : (
                        <span className={`av-doc-status av-doc-status--${doc.status}`}>
                          {doc.status === 'verified' ? <CheckIcon style={{ fontSize: 13 }} /> : <CloseIcon style={{ fontSize: 13 }} />}
                          {t(`verification.status.${doc.status}`)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="av-doc-card-actions">
                    <div className="av-doc-links">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="av-doc-link"
                      >
                        <OpenInNewIcon style={{ fontSize: 14 }} />
                        {t('verification.admin.viewDocument')}
                      </a>
                      <a
                        href={getCloudinaryDownloadUrl(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="av-doc-link av-doc-link--download"
                      >
                        <FileDownloadIcon style={{ fontSize: 15 }} />
                        {t('verification.admin.downloadDocument')}
                      </a>
                    </div>
                    {doc.status === 'pending' && (
                      <div className="av-doc-action-btns">
                        <button
                          className="av-action-btn av-action-btn--approve"
                          onClick={() => handleVerifyAction(selectedUser._id, doc._id, 'verified')}
                          disabled={processingDocId === doc._id}
                        >
                          <CheckIcon style={{ fontSize: 15 }} />
                          {t('verification.status.verified')}
                        </button>
                        <button
                          className="av-action-btn av-action-btn--reject"
                          onClick={() => handleVerifyAction(selectedUser._id, doc._id, 'rejected')}
                          disabled={processingDocId === doc._id}
                        >
                          <CloseIcon style={{ fontSize: 15 }} />
                          {t('verification.admin.reject')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: 'av-dialog-paper av-reject-paper' }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }
        }}
      >
        <div className="av-reject-header">
          <div className="av-reject-icon-wrap">
            <CloseIcon className="av-reject-icon" />
          </div>
          <div>
            <Typography className="av-reject-title">{t('verification.admin.rejectionTitle')}</Typography>
            <Typography className="av-reject-subtitle">{t('verification.admin.rejectionReason')}</Typography>
          </div>
        </div>
        <DialogContent className="av-reject-content">
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={t('verification.admin.rejectionPlaceholder')}
            className="av-reject-field"
          />
        </DialogContent>
        <DialogActions className="av-reject-actions">
          <Button
            className="av-reject-cancel"
            onClick={() => setRejectionModalOpen(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            className="av-reject-confirm"
            variant="contained"
            onClick={() => targetDoc && performVerification(targetDoc.userId, targetDoc.docId, 'rejected', rejectionReason)}
            disabled={!rejectionReason.trim() || processingDocId === targetDoc?.docId}
            startIcon={processingDocId === targetDoc?.docId ? <CircularProgress size={14} /> : <CloseIcon />}
          >
            {t('verification.admin.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
