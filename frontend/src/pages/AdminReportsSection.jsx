import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import {
  deleteAnnouncementReport,
  getAnnouncementReports,
  resolveAnnouncementReport,
} from '../api/api';

const getReasonColor = (reason) => {
  if (reason === 'spam') return 'av-report-badge--spam';
  if (reason === 'fake') return 'av-report-badge--fake';
  if (reason === 'abusive') return 'av-report-badge--abusive';
  if (reason === 'wrong_category') return 'av-report-badge--wrong-category';
  return 'av-report-badge--other';
};

export default function AdminReportsSection() {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const statusLabel = useMemo(
    () => ({
      open: t('verification.admin.reports.status.open'),
      resolved: t('verification.admin.reports.status.resolved'),
    }),
    [t]
  );

  const reasonLabel = useMemo(
    () => ({
      spam: t('verification.admin.reports.reasons.spam'),
      fake: t('verification.admin.reports.reasons.fake'),
      abusive: t('verification.admin.reports.reasons.abusive'),
      wrong_category: t('verification.admin.reports.reasons.wrong_category'),
      other: t('verification.admin.reports.reasons.other'),
    }),
    [t]
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getAnnouncementReports(statusFilter);
      setReports(response.data.items || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (window.showToast) window.showToast(t('verification.admin.reports.messages.fetchError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (reportId) => {
    try {
      setProcessingId(reportId);
      await resolveAnnouncementReport(reportId);
      if (window.showToast) window.showToast(t('verification.admin.reports.messages.resolveSuccess'), 'success');
      await fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      if (window.showToast) window.showToast(t('verification.admin.reports.messages.resolveError'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      setProcessingId(reportId);
      await deleteAnnouncementReport(reportId);
      if (window.showToast) window.showToast(t('verification.admin.reports.messages.deleteSuccess'), 'success');
      setSelectedReport((prev) => (prev?._id === reportId ? null : prev));
      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      if (window.showToast) window.showToast(t('verification.admin.reports.messages.deleteError'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="av-reports-wrap">
      <Typography className="av-reports-subtitle">
        {t('verification.admin.reports.title')}
      </Typography>

      <div className="av-reports-filters">
        <Button
          variant={statusFilter === 'open' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter('open')}
          className="av-report-filter-btn"
        >
          {t('verification.admin.reports.filters.open')}
        </Button>
        <Button
          variant={statusFilter === 'resolved' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter('resolved')}
          className="av-report-filter-btn"
        >
          {t('verification.admin.reports.filters.resolved')}
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter('all')}
          className="av-report-filter-btn"
        >
          {t('verification.admin.reports.filters.all')}
        </Button>
      </div>

      {loading ? (
        <div className="av-loader">
          <CircularProgress size={40} thickness={4} className="av-spinner" />
        </div>
      ) : reports.length === 0 ? (
        <div className="av-empty av-empty--reports">
          <Typography className="av-empty-text">{t('verification.admin.reports.empty')}</Typography>
        </div>
      ) : (
        <div className="av-grid av-reports-grid">
          {reports.map((item) => {
            const announcementId = item.announcement?._id || item.announcement;
            const reporterName = `${item.reporter?.firstName || ''} ${item.reporter?.lastName || ''}`.trim() || t('common.user');
            const ownerName = `${item.announcementOwner?.firstName || ''} ${item.announcementOwner?.lastName || ''}`.trim() || t('common.user');
            const isResolving = processingId === item._id;

            return (
              <div key={item._id} className="av-card av-report-card">
                <div className="av-report-head">
                  <Typography className="av-report-title">
                    {item.announcement?.title || t('verification.admin.reports.announcementDeleted')}
                  </Typography>
                  <div className="av-card-badges av-card-badges--reports">
                    <span className={`av-badge ${getReasonColor(item.reason)}`}>
                      {reasonLabel[item.reason] || reasonLabel.other}
                    </span>
                    <span
                      className={`av-badge ${item.status === 'resolved' ? 'av-badge--verified' : 'av-badge--pending'}`}
                    >
                      {statusLabel[item.status] || statusLabel.open}
                    </span>
                  </div>
                </div>

                <Typography className="av-report-meta">
                  {t('verification.admin.reports.labels.reporter')}: {reporterName} ({item.reporter?.email || '—'})
                </Typography>
                <Typography className="av-report-meta">
                  {t('verification.admin.reports.labels.listedBy')}: {ownerName}
                </Typography>

                <div className="av-report-actions">
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    variant="outlined"
                    onClick={() => setSelectedReport(item)}
                    className="av-report-action-btn"
                  >
                    {t('verification.admin.reports.actions.details')}
                  </Button>

                  {!!announcementId && (
                    <Button
                      size="small"
                      startIcon={<OpenInNewIcon />}
                      variant="outlined"
                      href={`/anunt/${announcementId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="av-report-action-btn"
                    >
                      {t('verification.admin.reports.actions.openAnnouncement')}
                    </Button>
                  )}

                  {item.status !== 'resolved' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={isResolving}
                      onClick={() => handleResolve(item._id)}
                      startIcon={isResolving ? <CircularProgress size={14} /> : <CheckIcon />}
                      className="av-report-action-btn av-report-action-btn--resolve"
                    >
                      {t('verification.admin.reports.actions.resolve')}
                    </Button>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={isResolving}
                    onClick={() => handleDelete(item._id)}
                    startIcon={isResolving ? <CircularProgress size={14} /> : <DeleteOutlineIcon />}
                    className="av-report-action-btn av-report-action-btn--delete"
                  >
                    {t('verification.admin.reports.actions.delete')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        fullWidth
        maxWidth="sm"
        className="av-dialog"
        PaperProps={{ className: 'av-dialog-paper av-reports-dialog-paper' }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0,0,0,0.45)',
          },
        }}
      >
        <DialogTitle className="av-reports-dialog-title">{t('verification.admin.reports.dialog.title')}</DialogTitle>
        <DialogContent className="av-reports-dialog-content">
          <Typography className="av-report-meta">
            {t('verification.admin.reports.labels.reason')}: {reasonLabel[selectedReport?.reason] || reasonLabel.other}
          </Typography>
          <Typography className="av-report-meta" sx={{ mb: 1.5 }}>
            {t('verification.admin.reports.labels.createdAt')}: {selectedReport?.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : '—'}
          </Typography>
          <Typography className="av-report-detail-label">
            {t('verification.admin.reports.labels.details')}
          </Typography>
          <div className="av-report-details-box">
            <Typography variant="body2">
              {selectedReport?.details || t('verification.admin.reports.noDetails')}
            </Typography>
          </div>

          {!!selectedReport?.adminNote && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography className="av-report-detail-label">
                {t('verification.admin.reports.labels.adminNote')}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }} className="av-report-meta">
                {selectedReport.adminNote}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions className="av-reports-dialog-actions">
          <Button onClick={() => setSelectedReport(null)} className="av-reject-cancel">{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
