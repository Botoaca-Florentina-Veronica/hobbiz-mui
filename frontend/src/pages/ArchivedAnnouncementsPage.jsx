import React, { useEffect, useState, useMemo } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import translateCategory from '../utils/translateCategory';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  ButtonGroup,
  Typography,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import apiClient from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import './AllAnnouncements.css';
import './FavoriteAnnouncements.css';

export default function ArchivedAnnouncementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, favorites: authFavorites, toggleFavorite } = useAuth() || {};

  // Data
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & UI
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 12;

  useEffect(() => {
    setLoading(true);
    apiClient.get('/api/users/my-announcements/archived')
      .then(res => {
        setAnnouncements(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading archived announcements', err);
        setLoading(false);
        setAnnouncements([]);
      });
  }, []);

  const uniqueLocations = useMemo(() => {
    const locations = announcements.map(a => a.location).filter(Boolean);
    return [...new Set(locations)];
  }, [announcements]);

  const uniqueCategories = useMemo(() => {
    const categories = announcements.map(a => a.category).filter(Boolean);
    return [...new Set(categories)];
  }, [announcements]);

  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(a => {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

      let matchesSearch = true;
      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase().split(/\s+/);
        const descriptionWords = a.description?.toLowerCase().split(/\s+/) || [];
        const allTextWords = [...titleWords, ...descriptionWords];

        matchesSearch = searchWords.every(searchWord =>
          allTextWords.some(textWord => textWord.includes(searchWord) || searchWord.includes(textWord))
        );
      }

      const matchesLocation = locationFilter === 'all' || a.location === locationFilter;
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;

      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const price = parseFloat(a.price) || 0;
        switch (priceFilter) {
          case 'free': matchesPrice = price === 0; break;
          case 'under50': matchesPrice = price > 0 && price <= 50; break;
          case 'under100': matchesPrice = price > 50 && price <= 100; break;
          case 'over100': matchesPrice = price > 100; break;
          default: matchesPrice = true;
        }
      }

      return matchesSearch && matchesLocation && matchesPrice && matchesCategory;
    });

    switch (sortBy) {
      case 'recent': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'price-low': filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)); break;
      case 'price-high': filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)); break;
      case 'title': filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: break;
    }

    return filtered;
  }, [announcements, searchTerm, sortBy, priceFilter, locationFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredAndSortedAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedAnnouncements.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Favorites (same behavior as AllAnnouncements)
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') return parsed;
      if (Array.isArray(parsed)) return parsed.map(item => item.id).filter(Boolean);
      return [];
    } catch { return []; }
  });

  useEffect(() => {
    if (user) setFavoriteIds(Array.isArray(authFavorites) ? authFavorites : []);
  }, [user, authFavorites]);

  useEffect(() => {
    const handleFavoritesUpdated = () => {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (!stored) { setFavoriteIds([]); return; }
      try {
        const parsed = JSON.parse(stored || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') setFavoriteIds(parsed);
        else if (Array.isArray(parsed)) setFavoriteIds(parsed.map(item => item.id).filter(Boolean));
        else setFavoriteIds([]);
      } catch { setFavoriteIds([]); }
    };

    window.addEventListener('favorites:updated', handleFavoritesUpdated);
    window.addEventListener('storage', handleFavoritesUpdated);
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdated);
      window.removeEventListener('storage', handleFavoritesUpdated);
    };
  }, [FAVORITES_KEY]);

  const handleToggleFavorite = async (announcementId, e) => {
    e.stopPropagation();

    if (!user) {
      let localFavorites = [];
      try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        const parsed = JSON.parse(stored || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') localFavorites = parsed;
        else if (Array.isArray(parsed)) localFavorites = parsed.map(item => item.id).filter(Boolean);
      } catch {}

      const isFav = localFavorites.includes(announcementId);
      const updatedFavorites = isFav ? localFavorites.filter(id => id !== announcementId) : [...localFavorites, announcementId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      setFavoriteIds(updatedFavorites);
      window.dispatchEvent(new Event('favorites:updated'));
      return;
    }

    if (toggleFavorite) await toggleFavorite(announcementId);
  };

  // Unarchive an announcement
  const handleUnarchive = async (announcementId) => {
    try {
      await apiClient.put(`/api/users/my-announcements/${announcementId}/unarchive`);
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
      window.showToast?.(t('myAnnouncements.unarchiveSuccess'), 'success');
    } catch (err) {
      console.error('Unarchive error', err);
      window.showToast?.(t('myAnnouncements.unarchiveError'), 'error');
    }
  };

  // Delete an announcement
  const handleDelete = async (announcementId) => {
    try {
      await apiClient.delete(`/api/users/my-announcements/${announcementId}`);
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
      window.showToast?.(t('myAnnouncements.deleteSuccess'), 'success');
    } catch (err) {
      console.error('Delete error', err);
      window.showToast?.(t('myAnnouncements.deleteError'), 'error');
    }
  };

  return (
    <Box className="my-announcements-page">
      <Box className="mobile-header">
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">{t('myAnnouncements.archivedPageTitle')}</Typography>
      </Box>

      <Box className="all-announcements-wrapper">
        <Box className="page-header">
          <Typography variant="h3">{t('myAnnouncements.archivedPageTitle')}</Typography>
        </Box>

        <Paper elevation={0} className="search-filters-bar">
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder={t('allAnnouncements.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="search-icon" />
                  </InputAdornment>
                ),
              }}
              className="search-input-wrapper"
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'var(--ma-search-input-bg)' }, '& .MuiInputBase-input': { color: 'var(--ma-text-primary)' } }}
            />

            <Box className="filters-controls">
              <Button startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)} className="filters-toggle-btn">
                {showFilters ? t('allAnnouncements.hideFilters') : t('allAnnouncements.showFilters')}
              </Button>

              <ButtonGroup size="small" className="view-mode-toggle">
                <Button onClick={() => setViewMode('grid')} variant={viewMode === 'grid' ? 'contained' : 'outlined'} className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}>
                  <GridViewIcon fontSize="small" />
                </Button>
                <Button onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'contained' : 'outlined'} className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}>
                  <ListViewIcon fontSize="small" />
                </Button>
              </ButtonGroup>
            </Box>

            {showFilters && (
              <Grid container spacing={2} className="filters-grid">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.sortLabel')}</InputLabel>
                    <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label={t('allAnnouncements.sortLabel')} className="filter-select">
                      <MenuItem value="recent">{t('allAnnouncements.recent')}</MenuItem>
                      <MenuItem value="oldest">{t('allAnnouncements.oldest')}</MenuItem>
                      <MenuItem value="price-low">{t('allAnnouncements.priceLow')}</MenuItem>
                      <MenuItem value="price-high">{t('allAnnouncements.priceHigh')}</MenuItem>
                      <MenuItem value="title">{t('allAnnouncements.titleSort')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.categoryLabel')}</InputLabel>
                    <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label={t('allAnnouncements.categoryLabel')} className="filter-select">
                      <MenuItem value="all">{t('allAnnouncements.allCategories')}</MenuItem>
                      {uniqueCategories.map(cat => (<MenuItem key={cat} value={cat}>{translateCategory(cat, t)}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.priceLabel')}</InputLabel>
                    <Select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} label={t('allAnnouncements.priceLabel')} className="filter-select">
                      <MenuItem value="all">{t('allAnnouncements.allPrices')}</MenuItem>
                      <MenuItem value="free">{t('allAnnouncements.free')}</MenuItem>
                      <MenuItem value="under50">{t('allAnnouncements.under50')}</MenuItem>
                      <MenuItem value="under100">{t('allAnnouncements.under100')}</MenuItem>
                      <MenuItem value="over100">{t('allAnnouncements.over100')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.locationLabel')}</InputLabel>
                    <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} label={t('allAnnouncements.locationLabel')} className="filter-select">
                      <MenuItem value="all">{t('allAnnouncements.allLocations')}</MenuItem>
                      {uniqueLocations.map(loc => (<MenuItem key={loc} value={loc}>{loc}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>

              </Grid>
            )}
          </Stack>
        </Paper>

        <Box className="ma-scroll-view">
          {loading ? (
            <div className="ma-loading-container"><div className="ma-loading-text">{t('allAnnouncements.loading') || t('myAnnouncements.loading')}</div></div>
          ) : filteredAndSortedAnnouncements.length === 0 ? (
            <div className="ma-empty-state"><div className="ma-empty-icon">📦</div><div className="ma-empty-text">{t('allAnnouncements.noResults') || t('myAnnouncements.noAnnouncements')}</div></div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="favorite-announcements-list">
                  {currentItems.map((announcement) => (
                    <div
                      key={announcement._id}
                      className="favorite-announcement-card"
                      onClick={e => {
                        if (e.target.closest('.favorite-heart')) return;
                        navigate(`/announcement/${announcement._id}`);
                      }}
                    >
                      <div className="favorite-announcement-image">
                        {announcement.images && announcement.images[0] ? (
                          <img
                            src={announcement.images[0].startsWith('http') || announcement.images[0].startsWith('/uploads')
                              ? announcement.images[0]
                              : `/uploads/${announcement.images[0].replace(/^.*[\\/]/, '')}`}
                            alt="imagine principala"
                            className="favorite-announcement-img"
                          />
                        ) : (
                          <div className="favorite-announcement-img placeholder" />
                        )}
                      </div>
                      <div className="favorite-announcement-info">
                        <div className="favorite-info-top">
                          <span className="favorite-date">
                            {announcement.createdAt
                              ? new Date(announcement.createdAt).toLocaleDateString('ro-RO', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })
                              : ''}
                          </span>

                        </div>
                        <h2 className="favorite-announcement-title">{announcement.title}</h2>
                        <div className="favorite-announcement-category">{translateCategory(announcement.category, t)}</div>
                        <div className="favorite-announcement-location">{announcement.location}</div>
                        {announcement.price && (
                          <div className="favorite-price">{announcement.price} RON</div>
                        )}

                        <div className="favorite-announcement-actions">
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button size="small" variant="outlined" onClick={(ev) => { ev.stopPropagation(); handleUnarchive(announcement._id); }}>{t('myAnnouncements.unarchive')}</Button>
                            <Button size="small" variant="outlined" color="error" onClick={(ev) => { ev.stopPropagation(); if (window.confirm(t('myAnnouncements.confirmDeleteTitle') || 'Delete announcement?')) handleDelete(announcement._id); }}>{t('myAnnouncements.deleteBtn') || t('myAnnouncements.delete')}</Button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="announcement-list">
                  {currentItems.map(announcement => (
                    <div key={announcement._id} className="announcement-list-item" onClick={() => navigate(`/announcement/${announcement._id}`)}>
                      <div className="announcement-list-left">
                        {announcement.images && announcement.images.length > 0 ? (
                          <img src={announcement.images[0]} alt={announcement.title} />
                        ) : (
                          <div className="ma-card-no-image" />
                        )}
                      </div>
                      <div className="announcement-list-right">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 700 }}>{announcement.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--ma-muted)' }}>{new Date(announcement.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ marginTop: 8, color: 'var(--ma-muted)' }}>{announcement.description}</div>
                        <div style={{ marginTop: 12 }}>
                          <div className="ma-card-price">{announcement.price ? `${announcement.price} RON` : ''}</div>
                          <div className="announcement-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                            <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); handleUnarchive(announcement._id); }}>{t('myAnnouncements.unarchive')}</Button>
                            <Button variant="outlined" size="small" color="error" onClick={(e) => { e.stopPropagation(); if (window.confirm(t('myAnnouncements.confirmDeleteTitle') || 'Delete announcement?')) handleDelete(announcement._id); }}>{t('myAnnouncements.deleteBtn') || t('myAnnouncements.delete')}</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>{t('allAnnouncements.previous')}</button>
                  <div className="pagination-numbers">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return <button key={pageNum} className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`} onClick={() => handlePageChange(pageNum)}>{pageNum}</button>;
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="pagination-dots">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>{t('allAnnouncements.next')}</button>
                </div>
              )}

            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
