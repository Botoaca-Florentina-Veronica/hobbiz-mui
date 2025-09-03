import React, { useEffect, useState, useMemo } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Button, 
  ButtonGroup,
  Typography,
  Chip,
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
  Sort as SortIcon 
} from '@mui/icons-material';
import apiClient from '../api/api';
import './MyAnnouncements.css';
import './AnnouncementsByCategory.css';

export default function AnnouncementsByCategory() {
  const { category } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  
  const [favoriteIds, setFavoriteIds] = useState(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      // Verifică dacă e în formatul vechi (array de string-uri) sau nou (array de obiecte)
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed; // returnează ID-urile pentru compatibilitate
      } else {
        // Format nou - returnează doar ID-urile pentru compatibilitate
        return parsed.map(item => item.id);
      }
    } catch {
      return [];
    }
  });

  // Get unique locations from announcements
  const uniqueLocations = useMemo(() => {
    const locations = announcements.map(a => a.location).filter(Boolean);
    return [...new Set(locations)];
  }, [announcements]);

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(a => {
      // Improved search logic - split search term into individual words
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
      
      if (searchWords.length === 0) {
        // If no search term, only apply other filters
        var matchesSearch = true;
      } else {
        // Check if all search words are found in title or description
        const titleWords = a.title.toLowerCase().split(/\s+/);
        const descriptionWords = a.description?.toLowerCase().split(/\s+/) || [];
        const allTextWords = [...titleWords, ...descriptionWords];
        
        matchesSearch = searchWords.every(searchWord => 
          allTextWords.some(textWord => 
            textWord.includes(searchWord) || searchWord.includes(textWord)
          )
        );
      }
      
      const matchesLocation = locationFilter === 'all' || a.location === locationFilter;
      
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
        }
      }
      
      return matchesSearch && matchesLocation && matchesPrice;
    });

    // Sort announcements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case 'price-desc':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [announcements, searchTerm, sortBy, priceFilter, locationFilter]);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/announcements?category=${encodeURIComponent(category)}`);
        setAnnouncements(res.data);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, [category]);

  if (loading) return <div>Se încarcă anunțurile...</div>;

  return (
    <div className="my-announcements-container announcements-by-category">
      <div className="mobile-back-container" onClick={() => window.history.back()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && window.history.back()}>
        <button className="mobile-back-btn" aria-label="Înapoi">
          {/* left arrow svg */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="#23484a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="mobile-back-label">Înapoi</span>
      </div>
      <Typography variant="h4" className="my-announcements-title" gutterBottom>
        {category}
      </Typography>
      <div className="abc-align-container">
        {/* Searchbar și filtre */}
        <div className="abc-searchbar">
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Caută anunturi..."
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
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={
                    showFilters
                      ? {
                          backgroundColor: '#f51866',
                          color: '#ffffff',
                          borderColor: '#f51866',
                          '&:hover': { backgroundColor: '#d71558', borderColor: '#d71558' },
                        }
                      : {
                          color: '#f51866',
                          borderColor: '#f51866',
                          '&:hover': { backgroundColor: 'rgba(245,24,102,0.08)', borderColor: '#f51866' },
                        }
                  }
                >
                  Filtre
                </Button>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sortează după</InputLabel>
                  <Select
                    value={sortBy}
                    label="Sortează după"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="recent">Cele mai recente</MenuItem>
                    <MenuItem value="price-asc">Preț crescător</MenuItem>
                    <MenuItem value="price-desc">Preț descrescător</MenuItem>
                    <MenuItem value="title">Nume (A-Z)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredAndSortedAnnouncements.length} rezultate
                </Typography>
                <ButtonGroup size="small">
                  <IconButton
                    onClick={() => setViewMode('grid')}
                    sx={{
                      color: viewMode === 'grid' ? '#f51866' : 'text.secondary',
                      '&:hover': { color: '#f51866' },
                    }}
                    aria-pressed={viewMode === 'grid'}
                  >
                    <GridViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setViewMode('list')}
                    sx={{
                      color: viewMode === 'list' ? '#f51866' : 'text.secondary',
                      '&:hover': { color: '#f51866' },
                    }}
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
                  <InputLabel>Preț</InputLabel>
                  <Select
                    value={priceFilter}
                    label="Preț"
                    onChange={(e) => setPriceFilter(e.target.value)}
                  >
                    <MenuItem value="all">Toate prețurile</MenuItem>
                    <MenuItem value="free">Gratuit</MenuItem>
                    <MenuItem value="under50">Sub 50 RON</MenuItem>
                    <MenuItem value="under100">50-100 RON</MenuItem>
                    <MenuItem value="over100">Peste 100 RON</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Locație</InputLabel>
                  <Select
                    value={locationFilter}
                    label="Locație"
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <MenuItem value="all">Toate locațiile</MenuItem>
                    {uniqueLocations.map(location => (
                      <MenuItem key={location} value={location}>{location}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {(searchTerm || priceFilter !== 'all' || locationFilter !== 'all') && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setSearchTerm('');
                      setPriceFilter('all');
                      setLocationFilter('all');
                    }}
                  >
                    Resetează filtrele
                  </Button>
                )}
              </Box>
            )}
            {(searchTerm || priceFilter !== 'all' || locationFilter !== 'all') && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {searchTerm && (
                  <Chip
                    label={`Căutare: "${searchTerm}"`}
                    onDelete={() => setSearchTerm('')}
                    size="small"
                  />
                )}
                {priceFilter !== 'all' && (
                  <Chip
                    label={`Preț: ${priceFilter === 'free' ? 'Gratuit' : 
                      priceFilter === 'under50' ? 'Sub 50 RON' : 
                      priceFilter === 'under100' ? '50-100 RON' : 'Peste 100 RON'}`}
                    onDelete={() => setPriceFilter('all')}
                    size="small"
                  />
                )}
                {locationFilter !== 'all' && (
                  <Chip
                    label={`Locație: ${locationFilter}`}
                    onDelete={() => setLocationFilter('all')}
                    size="small"
                  />
                )}
              </Box>
            )}
          </Stack>
        </div>
        {/* Rezultate */}
        {filteredAndSortedAnnouncements.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {announcements.length === 0 
                ? "Nu există anunțuri pentru această categorie." 
                : "Nu s-au găsit anunțuri care să corespundă filtrelor."}
            </Typography>
          </Box>
        ) : (
          <div className={`favorite-announcements-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {filteredAndSortedAnnouncements.map((a) => (
              <div key={a._id} className="abc-announcement-card my-announcement-card" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={e => {
                  if (e.target.closest('.favorite-heart')) return;
                  window.location.href = `/announcement/${a._id}`;
                }}
              >
                <div className="my-announcement-image">
                  {a.images && a.images[0] ? (
                    <img
                      src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
                      alt="imagine principala"
                      className="my-announcement-img"
                    />
                  ) : (
                    <div className="my-announcement-img" style={{background: '#eee'}} />
                  )}
                </div>
                <div className="my-announcement-info">
                  <div className="my-announcement-header">
                    <div>
                      <h2 className="my-announcement-title">{a.title}</h2>
                      <div className="my-announcement-category">{a.category}</div>
                      <div className="my-announcement-location">{a.location}</div>
                      {a.price && (
                        <div className="my-announcement-price" style={{
                          color: '#f51866',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          marginTop: '8px'
                        }}>
                          {parseFloat(a.price) === 0 ? 'Gratuit' : `${a.price} RON`}
                        </div>
                      )}

                      {/* Keep ID inside the left column to avoid overlap with absolute-positioned rules */}
                      <div className="my-announcement-id">
                        ID: {a._id?.slice(-9) || ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="favorite-heart"
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    zIndex: 2
                  }}
                  onClick={ev => {
                    ev.stopPropagation();
                    const stored = localStorage.getItem(FAVORITES_KEY);
                    let favoriteObjects = [];
                    try {
                      const parsed = JSON.parse(stored || '[]');
                      if (parsed.length > 0 && typeof parsed[0] === 'string') {
                        favoriteObjects = parsed.map(id => ({ id, addedAt: Date.now() }));
                      } else {
                        favoriteObjects = parsed;
                      }
                    } catch {
                      favoriteObjects = [];
                    }
                    const exists = favoriteObjects.find(item => item.id === a._id);
                    let updatedObjects;
                    if (exists) {
                      updatedObjects = favoriteObjects.filter(item => item.id !== a._id);
                    } else {
                      updatedObjects = [...favoriteObjects, { id: a._id, addedAt: Date.now() }];
                    }
                    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedObjects));
                    setFavoriteIds((prev) => {
                      if (prev.includes(a._id)) {
                        return prev.filter((id) => id !== a._id);
                      } else {
                        return [...prev, a._id];
                      }
                    });
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {favoriteIds.includes(a._id) ? (
                    <FavoriteIcon sx={{ color: 'red', fontSize: 28 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ color: '#23484a', fontSize: 28 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
