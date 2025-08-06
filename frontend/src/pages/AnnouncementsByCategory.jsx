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
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
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
      <Typography variant="h4" className="my-announcements-title" gutterBottom>
        {category}
      </Typography>
      
      {/* Search and Filter Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Search Bar */}
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
          
          {/* Filter and View Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
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
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <ListViewIcon />
                </IconButton>
              </ButtonGroup>
            </Box>
          </Box>
          
          {/* Expandable Filters */}
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
          
          {/* Active Filters Display */}
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
      </Paper>

      {/* Results */}
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
            <div key={a._id} className="my-announcement-card" style={{ position: 'relative', cursor: 'pointer' }}
              onClick={e => {
                // Nu declanșa navigarea dacă s-a dat click pe inimă
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
                {/* Iconiță inimă pentru favorite */}
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
                    setFavoriteIds((prev) => {
                      let updated;
                      if (prev.includes(a._id)) {
                        updated = prev.filter((id) => id !== a._id);
                      } else {
                        updated = [...prev, a._id];
                      }
                      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
                      return updated;
                    });
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {favoriteIds.includes(a._id) ? (
                    <FavoriteIcon sx={{ color: 'red', fontSize: 32 }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ color: '#23484a', fontSize: 32 }} />
                  )}
                </div>
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
                  </div>
                  <div className="my-announcement-id">
                    ID: {a._id?.slice(-9) || ''}
                  </div>
                </div>
                {/* Fără butoane de acțiune */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
