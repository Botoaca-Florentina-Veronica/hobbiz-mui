import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import miel1 from '../assets/images/miel1.png';
import { useTranslation } from 'react-i18next';
import './MyAnnouncements.css';
import './AnnouncementsByCategory.css';

export default function AnnouncementsBySubcategory() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { subcategory } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isAppLike = viewportWidth <= 1024;

  const decodedSubcategory = decodeURIComponent(subcategory || '');

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
          <h1 className="abc-mobile-header-title">{decodedSubcategory}</h1>
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
            {decodedSubcategory}
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
                  0 {t('allAnnouncements.results')}
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

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ mb: 2 }}>
            <img
              src={miel1}
              alt=""
              style={{ maxWidth: 220, width: '100%', borderRadius: 12, opacity: 0.85 }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{ color: theme.palette.mode === 'light' ? '#021C38' : 'text.secondary' }}
          >
            {t('allAnnouncements.noCategoryAnnouncements')}
          </Typography>
        </Box>
      </div>
    </div>
  );
}
