import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  ButtonGroup,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import miel1 from '../assets/images/miel1.png';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import translateCategory from '../utils/translateCategory';
import './MyAnnouncements.css';
import './AnnouncementsByCategory.css';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

export default function AnnouncementsByLocation() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { location } = useParams();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? getEffectiveViewportWidth() : 1200,
  );
  useEffect(() => {
    const handleResize = () => setViewportWidth(getEffectiveViewportWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isAppLike = viewportWidth <= 1024;

  const decodedLocation = decodeURIComponent(location || '');

  // Fetch anunțuri filtrate după locație.
  useEffect(() => {
    let cancelled = false;
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/api/announcements?location=${encodeURIComponent(decodedLocation)}`,
        );
        if (!cancelled) setAnnouncements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Eroare la fetch anunțuri după locație:', err);
        if (!cancelled) setAnnouncements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAnnouncements();
    return () => { cancelled = true; };
  }, [decodedLocation]);

  // Categoriile unice din rezultate (pentru filtru categorie).
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    announcements.forEach((a) => { if (a.category) set.add(a.category); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'));
  }, [announcements]);

  // Filtrare + sortare locală.
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.slice();
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }
    if (priceFilter !== 'all') {
      filtered = filtered.filter((a) => {
        const p = parseFloat(a.price) || 0;
        if (priceFilter === 'free') return p === 0;
        if (priceFilter === 'under50') return p > 0 && p < 50;
        if (priceFilter === 'under100') return p > 0 && p < 100;
        if (priceFilter === 'over100') return p >= 100;
        return true;
      });
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case 'price-desc':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'recent':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return filtered;
  }, [announcements, searchTerm, sortBy, priceFilter, categoryFilter]);

  if (loading) {
    return <div style={{ padding: '80px 24px' }}>{t('allAnnouncements.loading')}</div>;
  }

  return (
    <div className={`my-announcements-container announcements-by-category ${isAppLike ? 'abc-applike' : ''}`}>
      {isAppLike ? (
        <div className="abc-mobile-header">
          <button
            className="abc-mobile-back-btn"
            onClick={() => window.history.back()}
            aria-label={t('common.back')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="abc-mobile-header-title">{decodedLocation}</h1>
        </div>
      ) : (
        <div
          className="mobile-back-container"
          onClick={() => window.history.back()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && window.history.back()}
        >
          <button className="mobile-back-btn" aria-label={t('common.back')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="#23484a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="mobile-back-label">{t('common.back')}</span>
        </div>
      )}

      <div className="abc-align-container">
        {!isAppLike && (
          <Typography variant="h4" className="my-announcements-title" gutterBottom>
            {decodedLocation}
          </Typography>
        )}

        <div className="abc-searchbar">
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder={t('allAnnouncements.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="medium"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={showFilters ? 'contained' : 'outlined'}
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={
                    showFilters
                      ? { backgroundColor: '#f51866', color: '#ffffff', borderColor: '#f51866', '&:hover': { backgroundColor: '#d71558', borderColor: '#d71558' } }
                      : { color: '#f51866', borderColor: '#f51866', '&:hover': { backgroundColor: 'rgba(245,24,102,0.08)', borderColor: '#f51866' } }
                  }
                >
                  {showFilters ? t('allAnnouncements.hideFilters') : t('allAnnouncements.showFilters')}
                </Button>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>{t('myAnnouncements.sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    label={t('myAnnouncements.sortBy')}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="recent">{t('allAnnouncements.recent')}</MenuItem>
                    <MenuItem value="price-asc">{t('allAnnouncements.priceLow')}</MenuItem>
                    <MenuItem value="price-desc">{t('allAnnouncements.priceHigh')}</MenuItem>
                    <MenuItem value="title">{t('allAnnouncements.titleSort')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredAndSortedAnnouncements.length} {t('allAnnouncements.results')}
                </Typography>
                <ButtonGroup size="small">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    sx={{ color: viewMode === 'grid' ? '#f51866' : 'text.secondary', '&:hover': { color: '#f51866' } }}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <GridViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    sx={{ color: viewMode === 'list' ? '#f51866' : 'text.secondary', '&:hover': { color: '#f51866' } }}
                    aria-pressed={viewMode === 'list'}
                  >
                    <ListViewIcon />
                  </IconButton>
                </ButtonGroup>
              </Box>
            </Box>
            {showFilters && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>{t('common.category', 'Categorie')}</InputLabel>
                  <Select
                    value={categoryFilter}
                    label={t('common.category', 'Categorie')}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="all">{t('allAnnouncements.allCategories', 'Toate categoriile')}</MenuItem>
                    {uniqueCategories.map((c) => (
                      <MenuItem key={c} value={c}>{translateCategory(c, t)}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('allAnnouncements.priceLabel')}</InputLabel>
                  <Select
                    value={priceFilter}
                    label={t('allAnnouncements.priceLabel')}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  >
                    <MenuItem value="all">{t('allAnnouncements.allPrices')}</MenuItem>
                    <MenuItem value="free">{t('allAnnouncements.free')}</MenuItem>
                    <MenuItem value="under50">{t('allAnnouncements.under50')}</MenuItem>
                    <MenuItem value="under100">{t('allAnnouncements.under100')}</MenuItem>
                    <MenuItem value="over100">{t('allAnnouncements.over100')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Stack>
        </div>

        {filteredAndSortedAnnouncements.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {announcements.length === 0 && (
              <Box sx={{ mb: 2 }}>
                <img src={miel1} alt="" style={{ maxWidth: 220, width: '100%', borderRadius: 12, opacity: 0.85 }} />
              </Box>
            )}
            <Typography
              variant="h6"
              sx={{
                color: announcements.length === 0
                  ? (theme.palette.mode === 'light' ? '#021C38' : 'text.secondary')
                  : 'text.secondary',
              }}
            >
              {announcements.length === 0
                ? t('allAnnouncements.noCategoryAnnouncements')
                : t('allAnnouncements.noFilteredAnnouncements')}
            </Typography>
          </Box>
        ) : (
          <div className={`favorite-announcements-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {filteredAndSortedAnnouncements.map((a) => (
              <div
                key={a._id}
                className="abc-announcement-card my-announcement-card"
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => navigate(`/announcement/${a._id}`)}
              >
                <div className="my-announcement-image">
                  {a.images && a.images[0] ? (
                    <img
                      src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
                      alt={t('allAnnouncements.mainImageAlt')}
                      className="my-announcement-img"
                    />
                  ) : (
                    <div className="my-announcement-img" style={{ background: '#eee' }} />
                  )}
                </div>
                <div className="my-announcement-info">
                  <div className="my-announcement-header">
                    <div>
                      <h2 className="my-announcement-title">{a.title}</h2>
                      <div className="my-announcement-category">{translateCategory(a.category, t)}</div>
                      <div className="my-announcement-location">{a.location}</div>
                      {a.price !== undefined && a.price !== null && a.price !== '' && (
                        <div className="my-announcement-price">{a.price} RON</div>
                      )}
                      {Array.isArray(a.tags) && a.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {a.tags.slice(0, 4).map((tk) => (
                            <Chip
                              key={tk}
                              label={t(`categoryTags.tags.${tk}`, tk)}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.72rem' }}
                            />
                          ))}
                        </Box>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
