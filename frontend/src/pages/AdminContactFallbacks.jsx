import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Chip, CircularProgress, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getContactFallbacks, resolveContactFallback } from '../api/api';
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

export default function AdminContactFallbacks() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
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
      await fetchItems(statusFilter);
    } catch (error) {
      console.error('Error resolving fallback:', error);
      if (window.showToast) window.showToast(t('adminContactFallbacks.messages.resolveError'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="acf-page">
      <Container maxWidth="lg" className="acf-container">
        <div className="acf-back-row">
          <IconButton className="acf-back-btn" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
        </div>

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
                    disabled={item.status === 'resolved' || processingId === item._id}
                    onClick={() => handleResolve(item._id)}
                  >
                    {t('adminContactFallbacks.resolveButton')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
