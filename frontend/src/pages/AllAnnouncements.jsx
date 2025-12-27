import React, { useEffect, useState, useMemo } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export default function AllAnnouncements() {
  const { t } = useTranslation();
  // ============================================
  // ROUTING & CONTEXT
  // ============================================
  const navigate = useNavigate();
  const { user, favorites: authFavorites, toggleFavorite } = useAuth() || {};

  // ============================================
  // STATE: DATA & LOADING
  // ============================================
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // STATE: SEARCH & FILTERS
  // ============================================
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // ============================================
  // STATE: UI & DISPLAY
  // ============================================
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ============================================
  // STATE: FAVORITES & LOCAL STORAGE
  // ============================================
  const itemsPerPage = 12;
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';

  const [favoriteIds, setFavoriteIds] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed;
      } else if (Array.isArray(parsed)) {
        return parsed.map(item => item.id).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  });

  // ============================================
  // EFFECTS: FAVORITES SYNC WITH AUTH
  // ============================================
  useEffect(() => {
    if (user) {
      setFavoriteIds(Array.isArray(authFavorites) ? authFavorites : []);
    }
  }, [user, authFavorites]);

  // ============================================
  // EFFECTS: FAVORITES LOCAL STORAGE LISTENER
  // ============================================
  useEffect(() => {
    const handleFavoritesUpdated = () => {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (!stored) {
        setFavoriteIds([]);
        return;
      }
      try {
        const parsed = JSON.parse(stored || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          setFavoriteIds(parsed);
        } else if (Array.isArray(parsed)) {
          setFavoriteIds(parsed.map(item => item.id).filter(Boolean));
        } else {
          setFavoriteIds([]);
        }
      } catch {
        setFavoriteIds([]);
      }
    };

    window.addEventListener('favorites:updated', handleFavoritesUpdated);
    window.addEventListener('storage', handleFavoritesUpdated);
    return () => {
      window.removeEventListener('favorites:updated', handleFavoritesUpdated);
      window.removeEventListener('storage', handleFavoritesUpdated);
    };
  }, [FAVORITES_KEY]);

  // ============================================
  // EFFECTS: RESET PAGINATION ON FILTER CHANGE
  // ============================================
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, priceFilter, locationFilter, categoryFilter]);

  // ============================================
  // EFFECTS: FETCH ANNOUNCEMENTS
  // ============================================
  useEffect(() => {
    setLoading(true);
    apiClient.get('/api/announcements')
      .then(res => {
        setAnnouncements(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Eroare la încărcarea anunțurilor:', err);
        setLoading(false);
      });
  }, []);

  // ============================================
  // MEMOIZED: UNIQUE LOCATIONS
  // ============================================
  const uniqueLocations = useMemo(() => {
    const locations = announcements.map(a => a.location).filter(Boolean);
    return [...new Set(locations)];
  }, [announcements]);

  // ============================================
  // MEMOIZED: UNIQUE CATEGORIES
  // ============================================
  const uniqueCategories = useMemo(() => {
    const categories = announcements.map(a => a.category).filter(Boolean);
    return [...new Set(categories)];
  }, [announcements]);

  // ============================================
  // MEMOIZED: FILTERED & SORTED ANNOUNCEMENTS
  // ============================================
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(a => {
      // ========== SEARCH FILTERING ==========
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);

      let matchesSearch = true;
      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase().split(/\s+/);
        const descriptionWords = a.description?.toLowerCase().split(/\s+/) || [];
        const allTextWords = [...titleWords, ...descriptionWords];

        matchesSearch = searchWords.every(searchWord =>
          allTextWords.some(textWord =>
            textWord.includes(searchWord) || searchWord.includes(textWord)
          )
        );
      }

      // ========== LOCATION FILTERING ==========
      const matchesLocation = locationFilter === 'all' || a.location === locationFilter;

      // ========== CATEGORY FILTERING ==========
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;

      // ========== PRICE FILTERING ==========
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const price = parseFloat(a.price) || 0;
        switch (priceFilter) {
          case 'free':
            matchesPrice = price === 0;
            break;
          case 'under50':
            matchesPrice = price > 0 && price <= 50;
            break;
          case 'under100':
            matchesPrice = price > 50 && price <= 100;
            break;
          case 'over100':
            matchesPrice = price > 100;
            break;
          default:
            matchesPrice = true;
        }
      }

      return matchesSearch && matchesLocation && matchesPrice && matchesCategory;
    });

    // ========== SORTING ==========
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-low':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case 'price-high':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [announcements, searchTerm, sortBy, priceFilter, locationFilter, categoryFilter]);

  // ============================================
  // PAGINATION CALCULATIONS
  // ============================================
  const totalPages = Math.ceil(filteredAndSortedAnnouncements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedAnnouncements.slice(startIndex, endIndex);

  // ============================================
  // HANDLERS: PAGE NAVIGATION
  // ============================================
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // HANDLERS: FAVORITE TOGGLE
  // ============================================
  const handleToggleFavorite = async (announcementId, e) => {
    e.stopPropagation();

    if (!user) {
      // ========== GUEST USER FAVORITES ==========
      let localFavorites = [];
      try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        const parsed = JSON.parse(stored || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          localFavorites = parsed;
        } else if (Array.isArray(parsed)) {
          localFavorites = parsed.map(item => item.id).filter(Boolean);
        }
      } catch {}

      const isFav = localFavorites.includes(announcementId);
      let updatedFavorites;
      if (isFav) {
        updatedFavorites = localFavorites.filter(id => id !== announcementId);
      } else {
        updatedFavorites = [...localFavorites, announcementId];
      }

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      setFavoriteIds(updatedFavorites);
      window.dispatchEvent(new Event('favorites:updated'));
      return;
    }

    // ========== AUTHENTICATED USER FAVORITES ==========
    if (toggleFavorite) {
      await toggleFavorite(announcementId);
    }
  };

  // ============================================
  // HELPERS: DARK MODE DETECTION
  // ============================================
  const isDarkMode = document.body.classList.contains('dark-mode');

  // ============================================
  // RENDER
  // ============================================
  return (
    <Box className="my-announcements-page">
      {/* MOBILE HEADER - BACK BUTTON & TITLE */}
      <Box className="mobile-header">
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">{t('allAnnouncements.title')}</Typography>
      </Box>

      <Box className="all-announcements-wrapper">
        {/* DESKTOP HEADER - PAGE TITLE */}
        <Box className="page-header">
          <Typography variant="h3">{t('allAnnouncements.title')}</Typography>
        </Box>

        {/* SEARCH & FILTERS SECTION */}
        <Paper elevation={0} className="search-filters-bar">
          <Stack spacing={2}>
            {/* Search Input Field */}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'var(--ma-search-input-bg)',
                },
                '& .MuiInputBase-input': {
                  color: 'var(--ma-text-primary)',
                }
              }}
            />

            {/* Filters Toggle & View Mode Buttons */}
            <Box className="filters-controls">
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                className="filters-toggle-btn"
              >
                {showFilters ? t('allAnnouncements.hideFilters') : t('allAnnouncements.showFilters')}
              </Button>

              <ButtonGroup size="small" className="view-mode-toggle">
                <Button
                  onClick={() => setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                >
                  <GridViewIcon fontSize="small" />
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                >
                  <ListViewIcon fontSize="small" />
                </Button>
              </ButtonGroup>
            </Box>

            {/* Filter Options Grid (Sort, Category, Price, Location) */}
            {showFilters && (
              <Grid container spacing={2} className="filters-grid">
                {/* Sort Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.sortLabel')}</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label={t('allAnnouncements.sortLabel')}
                      className="filter-select"
                    >
                      <MenuItem value="recent">{t('allAnnouncements.recent')}</MenuItem>
                      <MenuItem value="oldest">{t('allAnnouncements.oldest')}</MenuItem>
                      <MenuItem value="price-low">{t('allAnnouncements.priceLow')}</MenuItem>
                      <MenuItem value="price-high">{t('allAnnouncements.priceHigh')}</MenuItem>
                      <MenuItem value="title">{t('allAnnouncements.titleSort')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Category Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.categoryLabel')}</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      label={t('allAnnouncements.categoryLabel')}
                      className="filter-select"
                    >
                      <MenuItem value="all">{t('allAnnouncements.allCategories')}</MenuItem>
                      {uniqueCategories.map(cat => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Price Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.priceLabel')}</InputLabel>
                    <Select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      label={t('allAnnouncements.priceLabel')}
                      className="filter-select"
                    >
                      <MenuItem value="all">{t('allAnnouncements.allPrices')}</MenuItem>
                      <MenuItem value="free">{t('allAnnouncements.free')}</MenuItem>
                      <MenuItem value="under50">{t('allAnnouncements.under50')}</MenuItem>
                      <MenuItem value="under100">{t('allAnnouncements.under100')}</MenuItem>
                      <MenuItem value="over100">{t('allAnnouncements.over100')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Location Filter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel className="filter-select-label">{t('allAnnouncements.locationLabel')}</InputLabel>
                    <Select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      label={t('allAnnouncements.locationLabel')}
                      className="filter-select"
                    >
                      <MenuItem value="all">{t('allAnnouncements.allLocations')}</MenuItem>
                      {uniqueLocations.map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}
          </Stack>
        </Paper>

        {/* MAIN CONTENT AREA - LOADING, EMPTY, OR CARDS */}
        {loading ? (
          // Loading State
          <Box className="loading-container">
            <Typography className="loading-text">{t('allAnnouncements.loading')}</Typography>
          </Box>
        ) : filteredAndSortedAnnouncements.length === 0 ? (
          // Empty Results State
          <Box className="no-results-container">
            <Typography variant="h6" className="no-results-title">
              {t('allAnnouncements.noResults')}
            </Typography>
            <Typography variant="body2" className="no-results-description">
              {t('allAnnouncements.noResultsDescription')}
            </Typography>
          </Box>
        ) : (
          // Announcements Cards & Pagination
          <>
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
                          : `/uploads/${announcement.images[0].replace(/^.*[\\\\/]/, '')}`}
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
                      <div
                        className={`favorite-heart ${favoriteIds.includes(announcement._id) ? 'filled' : ''}`}
                        onClick={ev => {
                          ev.stopPropagation();
                          handleToggleFavorite(announcement._id, ev);
                        }}
                      >
                        {favoriteIds.includes(announcement._id) ? (
                          <FavoriteIcon />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </div>
                    </div>
                    <h2 className="favorite-announcement-title">{announcement.title}</h2>
                    <div className="favorite-announcement-category">{announcement.category}</div>
                    <div className="favorite-announcement-location">{announcement.location}</div>
                    {announcement.price && (
                      <div className="favorite-price">{announcement.price} RON</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('allAnnouncements.previous')}
                </button>
                <div className="pagination-numbers">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="pagination-dots">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('allAnnouncements.next')}
                </button>
              </div>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
