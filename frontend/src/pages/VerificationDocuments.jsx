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
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  CircularProgress,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoIcon from '@mui/icons-material/Info';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { 
  getUserDocuments, 
  uploadVerificationDocument, 
  deleteUserDocument 
} from '../api/api';
import './VerificationDocuments.css';
import './AccountSettings.css'; // Reuse some layout styles

export default function VerificationDocuments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const poppinsFont = { fontFamily: 'Poppins, sans-serif' };
  const floatingLabelSx = {
    ...poppinsFont,
    px: 1,
    backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : '#fff',
    transformOrigin: 'top left',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -6px) scale(0.75)',
    },
  };
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('certificate');
  const [docDescription, setDocDescription] = useState('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getUserDocuments();
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (window.showToast) {
        window.showToast(t('verification.messages.fetchError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!docName.trim()) {
      if (window.showToast) window.showToast(t('verification.messages.enterName'), 'info');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', docName);
    formData.append('type', docType);
    if (docDescription) {
      formData.append('description', docDescription);
    }

    try {
      setUploading(true);
      await uploadVerificationDocument(formData);
      if (window.showToast) window.showToast(t('verification.messages.uploadSuccess'), 'success');
      setUploadModalOpen(false);
      setSelectedFile(null);
      setDocName('');
      setDocType('certificate');
      setDocDescription('');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      if (window.showToast) window.showToast(t('verification.messages.uploadError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUserDocument(deleteId);
      if (window.showToast) window.showToast(t('verification.messages.deleteSuccess'), 'success');
      setDeleteDialogOpen(false);
      setDeleteId(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      if (window.showToast) window.showToast(t('verification.messages.deleteError'), 'error');
    }
  };

  const getStatusChip = (status) => {
    const baseSx = {
      ...poppinsFont,
      fontWeight: 600,
      textTransform: 'none',
      borderRadius: 999,
    };

    switch (status) {
      case 'verified':
        return (
          <Chip
            icon={<VerifiedIcon />}
            label={t('verification.status.verified')}
            size="small"
            variant="outlined"
            sx={{
              ...baseSx,
              color: '#4caf50',
              borderColor: '#4caf50',
            }}
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<ErrorOutlineIcon />}
            label={t('verification.status.rejected')}
            size="small"
            variant="outlined"
            sx={{
              ...baseSx,
              color: '#f44336',
              borderColor: '#f44336',
            }}
          />
        );
      case 'pending':
      default:
        return (
          <Chip
            icon={<PendingIcon />}
            label={t('verification.status.pending')}
            size="small"
            variant="outlined"
            sx={{
              ...baseSx,
              color: '#ff9800',
              borderColor: '#ff9800',
            }}
          />
        );
    }
  };

  return (
    <div className="account-settings-page-container">
      <Container maxWidth="lg" className="notification-settings-container">
        <div className="mobile-header">
          <IconButton
            onClick={() => navigate(-1)}
            className="mobile-back-btn"
            disableRipple
            aria-label="Înapoi"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title" sx={poppinsFont}>{t('verification.title')}</Typography>
        </div>

        <h1 className="notification-title" style={{ fontFamily: 'Poppins, sans-serif' }}>{t('verification.title')}</h1>

        <Paper 
          elevation={0} 
          className="info-card-paper" 
          sx={{ 
            marginBottom: '24px', 
            padding: '20px', 
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(74, 123, 176, 0.15)' 
              : 'rgba(11, 45, 90, 0.05)', 
            borderLeft: (theme) => theme.palette.mode === 'dark' 
              ? '4px solid #4a7bb0' 
              : '4px solid #0B2D5A'
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon color="primary" />
            <Typography variant="h6" color="primary" sx={poppinsFont}>{t('verification.infoTitle')}</Typography>
          </Box>
          <Typography variant="body2" sx={{ ...poppinsFont, marginTop: '8px' }}>
            {t('verification.infoText')}
          </Typography>
        </Paper>

        <Box mb={3} display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => setUploadModalOpen(true)}
            className="upload-doc-btn"
            sx={{
              ...poppinsFont,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#4a7bb0' : '#0B2D5A',
              color: '#fff',
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#5a8bc0' : '#0a2550'
              }
            }}
          >
            {t('verification.uploadButton')}
          </Button>
        </Box>

        <Paper elevation={0} className="settings-paper">
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography color="textSecondary" sx={poppinsFont}>{t('verification.noDocuments')}</Typography>
            </Box>
          ) : (
            <List>
              {documents.map((doc, index) => (
                <React.Fragment key={doc._id}>
                  <ListItem className="doc-list-item">
                    <Box mr={2}>
                      <FilePresentIcon color="action" fontSize="large" />
                    </Box>
                    <ListItemText 
                      primary={doc.name} 
                      primaryTypographyProps={{ sx: poppinsFont }}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block" sx={poppinsFont}>
                            {t(`verification.types.${doc.type}`)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </Typography>
                          {doc.description && (
                            <Typography variant="body2" color="textSecondary" sx={{ ...poppinsFont, marginTop: '4px' }}>
                              {doc.description}
                            </Typography>
                          )}
                          {doc.status === 'rejected' && doc.rejectionReason && (
                            <Typography variant="body2" color="error" sx={{ ...poppinsFont, marginTop: '4px', fontWeight: 'bold' }}>
                              {t('verification.admin.rejectionReason')}: {doc.rejectionReason}
                            </Typography>
                          )}
                          <Box mt={1} display="flex" alignItems="center" gap={2}>
                            {getStatusChip(doc.status)}
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<VisibilityIcon />}
                              onClick={() => window.open(doc.url, '_blank')}
                              sx={{ ...poppinsFont, textTransform: 'none' }}
                            >
                              {t('verification.viewDocument') || 'Vezi Document'}
                            </Button>
                          </Box>
                        </Box>
                      }
                      secondaryTypographyProps={{ sx: poppinsFont }}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={t('common.delete')} placement="top" arrow>
                        <IconButton edge="end" onClick={() => { setDeleteId(doc._id); setDeleteDialogOpen(true); }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < documents.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadModalOpen} 
        onClose={() => !uploading && setUploadModalOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            backgroundImage: 'none',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : 'white',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : 'none',
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
        <DialogTitle sx={{ fontWeight: 700, pt: 3, ...poppinsFont }}>{t('verification.uploadTitle')}</DialogTitle>
        <DialogContent sx={{ ...poppinsFont }}>
          <Box
            sx={{
              ...poppinsFont,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 1,
            }}
          >
            <Button
              variant="outlined"
              component="label"
              fullWidth
              disabled={uploading}
              startIcon={<FilePresentIcon />}
              sx={{
                ...poppinsFont,
                padding: '12px',
                borderStyle: 'dashed',
                textTransform: 'none',
              }}
            >
              {selectedFile ? selectedFile.name : t('verification.messages.pickError')}
              <input type="file" hidden onChange={handleFileChange} accept=".pdf,image/*" />
            </Button>
            
            <TextField
              label={t('verification.documentName')}
              variant="outlined"
              fullWidth
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              disabled={uploading}
              InputLabelProps={{ sx: floatingLabelSx }}
              sx={{ ...poppinsFont }}
            />

            <FormControl fullWidth variant="outlined" sx={{ ...poppinsFont }}>
              <InputLabel sx={floatingLabelSx}>{t('verification.documentType')}</InputLabel>
              <Select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                label={t('verification.documentType')}
                disabled={uploading}
                sx={poppinsFont}
              >
                <MenuItem sx={poppinsFont} value="certificate">{t('verification.types.certificate')}</MenuItem>
                <MenuItem sx={poppinsFont} value="diploma">{t('verification.types.diploma')}</MenuItem>
                <MenuItem sx={poppinsFont} value="authorization">{t('verification.types.authorization')}</MenuItem>
                <MenuItem sx={poppinsFont} value="license">{t('verification.types.license')}</MenuItem>
                <MenuItem sx={poppinsFont} value="other">{t('verification.types.other')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={t('verification.description')}
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
              disabled={uploading}
              InputLabelProps={{ sx: floatingLabelSx }}
              sx={{ ...poppinsFont }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ ...poppinsFont }}>
          <Button sx={{ ...poppinsFont, textTransform: 'none' }} onClick={() => setUploadModalOpen(false)} disabled={uploading}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            disabled={!selectedFile || !docName.trim() || uploading}
            sx={{ 
              ...poppinsFont,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#4a7bb0' : '#0B2D5A',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#5a8bc0' : '#0a2550'
              }
            }}
          >
            {uploading ? <CircularProgress size={24} color="inherit" /> : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('verification.deleteConfirm.title')}
        description={t('verification.deleteConfirm.message')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  );
}
