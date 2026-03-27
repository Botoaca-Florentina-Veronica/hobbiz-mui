import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Chip, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getContactFallbacks, resolveContactFallback, deleteContactFallback } from '../api/api';
import './AccountSettings.css';
import './AdminContactFallbacks.css';

const formatDate = (value, locale) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminContactFallbacks({ embedded = false }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');
  const locale = i18n?.language?.startsWith('ro') ? 'ro-RO' : 'en-GB';

  const fetchItems = async (status = statusFilter) => {
    try {
      setLoading(true);
      const response = await getContactFallbacks(status);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching contact fallbacks:', error);
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.fetchError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(statusFilter);
  }, [statusFilter]);

  const handleResolve = async (id) => {
    try {
      setProcessingId(id);
      await resolveContactFallback(id);
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.resolveSuccess'), 'success');
      setItems((prev) => prev.map((item) => {
        if (item._id !== id) return item;
        return {
          ...item,
          status: 'resolved',
          resolvedAt: item.resolvedAt || new Date().toISOString()
        };
      }));

      if (statusFilter === 'open') {
        setItems((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error('Error resolving fallback:', error);
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.resolveError'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteContactFallback(id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.deleteSuccess'), 'success');
    } catch (error) {
      console.error('Error deleting fallback:', error);
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.deleteError'), 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const content = (
    <>

        <div className="acf-title-row">
          <h1 className="acf-title">{t('adminContactFallbacks.title')}</h1>
          <div className="acf-filter">
            <Button
              size="small"
              className={`acf-filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
              onClick={() => setStatusFilter('open')}
            >
              {t('adminContactFallbacks.filters.open')}
            </Button>
            <Button
              size="small"
              className={`acf-filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
            >
              {t('adminContactFallbacks.filters.resolved')}
            </Button>
            <Button
              size="small"
              className={`acf-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              {t('adminContactFallbacks.filters.all')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="acf-loader">
            <CircularProgress size={40} thickness={4} className="acf-spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="acf-empty">
            <EmailOutlinedIcon className="acf-empty-icon" />
            <Typography className="acf-empty-text">{t('adminContactFallbacks.empty')}</Typography>
          </div>
        ) : (
          <div className="acf-grid">
            {items.map((item) => (
              <div key={item._id} className="acf-card">
                <div className="acf-card-header">
                  <div className="acf-card-title">
                    <span className="acf-name">{item.name}</span>
                    <span className="acf-email">{item.email}</span>
                  </div>
                  <Chip
                    size="small"
                    className={`acf-chip ${item.status === 'resolved' ? 'resolved' : 'open'}`}
                    label={item.status === 'resolved'
                      ? t('adminContactFallbacks.status.resolved')
                      : t('adminContactFallbacks.status.open')}
                  />
                </div>

                <div className="acf-meta">
                  <span>{formatDate(item.createdAt, locale)}</span>
                  {item.ip && <span>{t('adminContactFallbacks.ipLabel')} {item.ip}</span>}
                </div>

                <div className="acf-message">{item.message}</div>

                {item.mailError?.message && (
                  <Box className="acf-error">
                    <strong>{t('adminContactFallbacks.mailErrorLabel')}</strong> {item.mailError.message}
                  </Box>
                )}

                <div className="acf-actions">
                  <Button
                    variant="contained"
                    className="acf-resolve-btn"
                    startIcon={processingId === item._id ? <CircularProgress size={14} /> : <CheckCircleOutlineIcon />}
                    disabled={item.status === 'resolved' || processingId === item._id || deletingId === item._id}
                    onClick={() => handleResolve(item._id)}
                  >
                    {t('adminContactFallbacks.resolveButton')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    className="acf-delete-btn"
                    startIcon={deletingId === item._id ? <CircularProgress size={14} /> : <DeleteOutlineIcon />}
                    disabled={processingId === item._id || deletingId === item._id}
                    onClick={() => setConfirmDeleteId(item._id)}
                  >
                    {t('adminContactFallbacks.deleteButton')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      <Dialog
        open={Boolean(confirmDeleteId)}
        onClose={() => {
          if (!deletingId) setConfirmDeleteId(null);
        }}
        classes={{ paper: 'acf-dialog-paper' }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(8, 12, 20, 0.5)'
                : 'rgba(20, 30, 45, 0.3)'
          }
        }}
      >
        <DialogTitle className="acf-dialog-title">
          {t('adminContactFallbacks.confirmDialog.title')}
        </DialogTitle>
        <DialogContent className="acf-dialog-content">
          <DialogContentText className="acf-dialog-text">
            {t('adminContactFallbacks.deleteConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="acf-dialog-actions">
          <Button
            onClick={() => setConfirmDeleteId(null)}
            disabled={Boolean(deletingId)}
            className="acf-dialog-cancel"
          >
            {t('adminContactFallbacks.confirmDialog.cancel')}
          </Button>
          <Button
            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            color="error"
            variant="contained"
            disabled={Boolean(deletingId)}
            className="acf-dialog-confirm"
            startIcon={Boolean(deletingId) ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {t('adminContactFallbacks.confirmDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <div className="acf-page">
      <Container maxWidth="lg" className="acf-container">
        <div className="acf-back-row">
          <IconButton className="acf-back-btn" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
        </div>
        {content}
      </Container>
    </div>
  );
}
