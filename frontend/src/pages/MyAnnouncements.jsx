// =============================================================================
// IMPORTS
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import { 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Apps as AppsIcon,
  Archive as ArchiveIcon,
  SwapVert as SwapVertIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import './MyAnnouncements.css';

// =============================================================================
// MY ANNOUNCEMENTS COMPONENT
// =============================================================================
export default function MyAnnouncements() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLocale = i18n.language || 'ro';
  
  // ---------------------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(currentLocale === 'en' ? 'All' : 'Toate');
  const [sortFilter, setSortFilter] = useState(currentLocale === 'en' ? 'mostRecent' : 'cea mai recenta');
  const [activePickerType, setActivePickerType] = useState(null); // 'category' | 'sort' | null
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  
  const [archiveDialogVisible, setArchiveDialogVisible] = useState(false);
  const [announcementToArchive, setAnnouncementToArchive] = useState(null);

  // ---------------------------------------------------------------------------
  // 2. COMPUTED VALUES (useMemo)
  // ---------------------------------------------------------------------------
  
  const uniqueCategories = useMemo(() => {
    const categories = announcements.map(a => a.category).filter(Boolean);
    const allLabel = currentLocale === 'en' ? 'All' : 'Toate';
    return [allLabel, ...Array.from(new Set(categories))];
  }, [announcements, currentLocale]);

  const filteredAndSortedAnnouncements = useMemo(() => {
    const allLabel = currentLocale === 'en' ? 'All' : 'Toate';
    
    let filtered = announcements.filter(a => {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
      let matchesSearch = true;

      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase();
        const idText = a._id?.toLowerCase() || '';
        const locationText = a.location?.toLowerCase() || '';

        matchesSearch = searchWords.every(sw =>
          titleWords.includes(sw) || idText.includes(sw) || locationText.includes(sw)
        );
      }

      const matchesCategory = categoryFilter === allLabel || a.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortFilter) {
        case 'oldest':
        case 'cea mai veche':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'mostRecent':
        case 'cea mai recenta':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'titleAZ':
        case 'titlu_a_z':
          return a.title.localeCompare(b.title, currentLocale === 'en' ? 'en' : 'ro');
        case 'titleZA':
        case 'titlu_z_a':
          return b.title.localeCompare(a.title, currentLocale === 'en' ? 'en' : 'ro');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [announcements, searchTerm, categoryFilter, sortFilter, currentLocale]);

  // ---------------------------------------------------------------------------
  // 3. EFFECTS
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/users/my-announcements');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. EVENT HANDLERS
  // ---------------------------------------------------------------------------
  
  const handleEdit = (announcement) => {
    navigate(`/edit-announcement`, { state: { announcement } });
  };

  const handleDelete = (id) => {
    setAnnouncementToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await apiClient.delete(`/api/users/my-announcements/${announcementToDelete}`);
      setAnnouncements(announcements.filter(a => a._id !== announcementToDelete));
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      window.showToast?.(t('myAnnouncements.deleteSuccess'), 'success');
    } catch (e) {
      console.error('Delete error:', e);
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      window.showToast?.(t('myAnnouncements.deleteError'), 'error');
    }
  };

  const handleArchive = (announcement) => {
    setAnnouncementToArchive(announcement._id);
    setArchiveDialogVisible(true);
  };

  const confirmArchive = async () => {
    if (!announcementToArchive) return;

    try {
      await apiClient.put(`/api/users/my-announcements/${announcementToArchive}/archive`);
      setAnnouncements(announcements.filter(a => a._id !== announcementToArchive));
      setArchiveDialogVisible(false);
      setAnnouncementToArchive(null);
      window.showToast?.(t('myAnnouncements.archiveSuccess'), 'success');
    } catch (e) {
      console.error('Archive error:', e);
      setArchiveDialogVisible(false);
      setAnnouncementToArchive(null);
      window.showToast?.(t('myAnnouncements.archiveError'), 'error');
    }
  };

  const handleRefresh = (announcement) => {
    window.showToast?.(t('myAnnouncements.refreshInfo'), 'info');
  };

  const getImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads')) return img;
    if (img.startsWith('uploads/')) return `/${img}`;
    return `/uploads/${img.replace(/^.*[\\/]/, '')}`;
  };

  // ---------------------------------------------------------------------------
  // 5. RENDER HELPERS
  // ---------------------------------------------------------------------------
  
  if (loading) {
    return (
      <div className="ma-loading-container">
        <CircularProgress size={48} sx={{ color: 'var(--ma-btn-p-color)' }} />
        <div className="ma-loading-text">{t('myAnnouncements.loading')}</div>
      </div>
    );
  }

  const allLabel = currentLocale === 'en' ? 'All' : 'Toate';
  
  const sortOptions = [
    { value: currentLocale === 'en' ? 'mostRecent' : 'cea mai recenta', label: t('myAnnouncements.sortNewest'), icon: 'arrow-down' },
    { value: currentLocale === 'en' ? 'oldest' : 'cea mai veche', label: t('myAnnouncements.sortOldest'), icon: 'arrow-up' },
    { value: currentLocale === 'en' ? 'titleAZ' : 'titlu_a_z', label: t('myAnnouncements.sortTitleAz'), icon: 'text' },
    { value: currentLocale === 'en' ? 'titleZA' : 'titlu_z_a', label: t('myAnnouncements.sortTitleZa'), icon: 'text' },
  ];

  return (
    <div className="ma-container">
      <div className="ma-scroll-view">
        {/* Header */}
        <div className="ma-header">
          <div className="ma-header-content">
            <IconButton
              onClick={() => navigate(-1)}
              className="ma-back-button"
              disableRipple
            >
              <ArrowBackIcon />
            </IconButton>
            <div className="ma-header-title">{t('myAnnouncements.title')}</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button onClick={() => navigate('/archived-announcements')} variant="outlined" size="small">{t('myAnnouncements.archived')}</Button>
          </div>
        </div>

        {/* Mobile header shown only on small screens */}
        <div className="ma-mobile-header">
          <IconButton
            onClick={() => navigate(-1)}
            className="ma-mobile-back"
            disableRipple
            aria-label="Back"
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
          <div className="ma-mobile-title">{t('myAnnouncements.title')}</div>
          {/* spacer keeps title visually centered when a left back button is present */}
          <div className="ma-mobile-spacer" aria-hidden="true" />
        </div>

        <h1 className="ma-page-title">{t('myAnnouncements.title')}</h1>

        {/* Search and Filter Section */}
        {announcements.length > 0 && (
          <div className="ma-search-section">
            {/* Search Bar */}
            <div className="ma-search-bar">
              <SearchIcon className="ma-search-icon" />
              <input
                className="ma-search-input"
                placeholder={t('myAnnouncements.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Row */}
            <div className="ma-filter-row">
              {/* Category Filter */}
              <button
                className={`ma-filter-button ${activePickerType === 'category' ? 'active' : ''}`}
                onClick={() => setActivePickerType(activePickerType === 'category' ? null : 'category')}
              >
                <AppsIcon className="ma-filter-icon" />
                <span className="ma-filter-text">
                  {categoryFilter === allLabel ? t('myAnnouncements.categoryLabel') : categoryFilter}
                </span>
                <svg className="ma-filter-chevron" viewBox="0 0 24 24" fill="currentColor">
                  <path d={activePickerType === 'category' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                </svg>
              </button>

              {/* Sort Filter */}
              <button
                className={`ma-filter-button ${activePickerType === 'sort' ? 'active' : ''}`}
                onClick={() => setActivePickerType(activePickerType === 'sort' ? null : 'sort')}
              >
                <SwapVertIcon className="ma-filter-icon" />
                <span className="ma-filter-text">{t('myAnnouncements.sortLabel')}</span>
                <svg className="ma-filter-chevron" viewBox="0 0 24 24" fill="currentColor">
                  <path d={activePickerType === 'sort' ? 'M7 14l5-5 5 5z' : 'M7 10l5 5 5-5z'} />
                </svg>
              </button>

              {/* Results Count */}
              <div className="ma-results-count">
                <span className="ma-results-text">
                  {filteredAndSortedAnnouncements.length} {t('myAnnouncements.results')}
                </span>
              </div>
            </div>

            {/* Active Filters */}
            {(searchTerm || categoryFilter !== allLabel) && (
              <div className="ma-active-filters">
                {searchTerm && (
                  <div className="ma-chip">
                    <span className="ma-chip-text">
                      {t('myAnnouncements.searchChip')}: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                    </span>
                    <CloseIcon className="ma-chip-close" onClick={() => setSearchTerm('')} />
                  </div>
                )}
                {categoryFilter !== allLabel && (
                  <div className="ma-chip">
                    <span className="ma-chip-text">{t('myAnnouncements.categoryChip')}: {categoryFilter}</span>
                    <CloseIcon className="ma-chip-close" onClick={() => setCategoryFilter(allLabel)} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Announcements List */}
        {filteredAndSortedAnnouncements.length === 0 ? (
          <div className="ma-empty-state">
            <ImageIcon className="ma-empty-icon" />
            <div className="ma-empty-text">
              {searchTerm || categoryFilter !== allLabel
                ? t('myAnnouncements.noResultsFiltered')
                : t('myAnnouncements.noAnnouncements')}
            </div>
          </div>
        ) : (
          filteredAndSortedAnnouncements.map((announcement) => {
            const imageUri = announcement.images?.[0] ? getImageSrc(announcement.images[0]) : null;

            return (
              <div key={announcement._id} className="ma-card">
                {/* Image - Left side */}
                <div
                  className="ma-card-image"
                  onClick={() => navigate(`/announcement/${announcement._id}`)}
                >
                  {imageUri ? (
                    <img src={imageUri} alt={announcement.title} className="ma-image" />
                  ) : (
                    <div className="ma-image ma-placeholder-image">
                      <ImageIcon className="ma-placeholder-icon" />
                    </div>
                  )}
                </div>

                {/* Content - Right side */}
                <div className="ma-card-content">
                  {/* Top section: Title + ID */}
                  <div onClick={() => navigate(`/announcement/${announcement._id}`)}>
                    <div className="ma-card-top-row">
                      <div className="ma-card-title">{announcement.title}</div>
                      <div className="ma-id-badge">
                        <span className="ma-id-text">ID: {announcement._id?.slice(-8) || ''}</span>
                      </div>
                    </div>

                    {/* Category badge */}
                    <div className="ma-category-badge">
                      <span className="ma-category-text">{announcement.category}</span>
                    </div>

                    {/* Placeholder spacing */}
                    <div className="ma-location-placeholder" />
                  </div>

                  {/* Action buttons - single row: 4 equal buttons on wider screens, wrap on small screens */}
                  <div className="ma-actions-grid ma-actions-single-row">
                    <button
                      className="ma-action-button ma-primary-button"
                      onClick={() => handleEdit(announcement)}
                    >
                      {t('myAnnouncements.edit')}
                    </button>

                    <button
                      className="ma-action-button ma-secondary-button"
                      onClick={() => handleArchive(announcement)}
                    >
                      {t('myAnnouncements.archive')}
                    </button>

                    <button
                      className="ma-action-button ma-danger-button"
                      onClick={() => handleDelete(announcement._id)}
                    >
                      {t('myAnnouncements.delete')}
                    </button>

                    <button
                      className="ma-action-button ma-secondary-button ma-refresh-button"
                      onClick={() => handleRefresh(announcement)}
                    >
                      {t('myAnnouncements.refresh')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Picker Modal Overlay */}
      {activePickerType && (
        <div className="ma-modal-overlay" onClick={() => setActivePickerType(null)}>
          <div className="ma-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ma-modal-header">
              <div className="ma-modal-title">
                {activePickerType === 'category' ? t('myAnnouncements.selectCategory') : t('myAnnouncements.sortBy')}
              </div>
              <IconButton onClick={() => setActivePickerType(null)} className="ma-modal-close-button">
                <CloseIcon />
              </IconButton>
            </div>

            <div className="ma-modal-scroll">
              {activePickerType === 'category' ? (
                // Category options
                uniqueCategories.map((cat) => (
                  <div
                    key={cat}
                    className={`ma-modal-option ${categoryFilter === cat ? 'selected' : ''}`}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setActivePickerType(null);
                    }}
                  >
                    <div className="ma-modal-option-left">
                      <AppsIcon className="ma-modal-option-icon" />
                      <span className="ma-modal-option-text">{cat}</span>
                    </div>
                    {categoryFilter === cat && (
                      <CheckCircleIcon className="ma-modal-option-check" />
                    )}
                  </div>
                ))
              ) : (
                // Sort options
                sortOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`ma-modal-option ${sortFilter === option.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSortFilter(option.value);
                      setActivePickerType(null);
                    }}
                  >
                    <div className="ma-modal-option-left">
                      <SwapVertIcon className="ma-modal-option-icon" />
                      <span className="ma-modal-option-text">{option.label}</span>
                    </div>
                    {sortFilter === option.value && (
                      <CheckCircleIcon className="ma-modal-option-check" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">{t('myAnnouncements.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('myAnnouncements.deleteMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogVisible(false)}>{t('myAnnouncements.cancel')}</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            {t('myAnnouncements.deleteBtn')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialogVisible}
        onClose={() => setArchiveDialogVisible(false)}
        aria-labelledby="archive-dialog-title"
        PaperProps={{ className: 'ma-confirm-dialog-paper' }}
      >
        <div className="ma-confirm-dialog-content">
          <div className="ma-dialog-icon">
            <ArchiveIcon />
          </div>

          <div className="ma-dialog-title">{t('myAnnouncements.archiveTitle')}</div>

          <div className="ma-dialog-message">{t('myAnnouncements.archiveMessage')}</div>

          <div className="ma-confirm-dialog-actions">
            <Button
              onClick={() => setArchiveDialogVisible(false)}
              className="ma-dialog-cancel"
            >
              {t('myAnnouncements.no')}
            </Button>

            <Button
              onClick={confirmArchive}
              className="ma-dialog-confirm"
              autoFocus
            >
              {t('myAnnouncements.yes')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
