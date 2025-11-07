// =============================================================================
// IMPORTS
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import ConfirmDialog from './ConfirmDialog';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { 
  TextField, 
  InputAdornment, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import './MyAnnouncements.css';

// =============================================================================
// MY ANNOUNCEMENTS COMPONENT
// =============================================================================
export default function MyAnnouncements() {
  // ---------------------------------------------------------------------------
  // 1. STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // === Announcements Data ===
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // === Delete Confirmation ===
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // === Image Navigation ===
  const [imageIndexes, setImageIndexes] = useState({});
  
  // === Search & Filter State ===
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Orice categorie');
  const [dateFilter, setDateFilter] = useState('cea mai recenta');
  
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 2. COMPUTED VALUES (useMemo)
  // ---------------------------------------------------------------------------
  
  // Get unique categories from announcements
  const uniqueCategories = useMemo(() => {
    const categories = announcements.map(a => a.category).filter(Boolean);
    return [...new Set(categories)];
  }, [announcements]);

  // Filter and sort announcements based on search and filter criteria
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(a => {
      // Search filter (title, ID, or location)
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
      let matchesSearch = true;
      
      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase();
        const idText = a._id?.toLowerCase() || '';
        const locationText = a.location?.toLowerCase() || '';
        
        matchesSearch = searchWords.every(searchWord => 
          titleWords.includes(searchWord) || 
          idText.includes(searchWord) || 
          locationText.includes(searchWord)
        );
      }

      // Category filter
      const matchesCategory = categoryFilter === 'Orice categorie' || a.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (dateFilter) {
        case 'cea mai veche':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'cea mai recenta':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'titlu_a_z':
          return a.title.localeCompare(b.title, 'ro');
        case 'titlu_z_a':
          return b.title.localeCompare(a.title, 'ro');
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [announcements, searchTerm, categoryFilter, dateFilter]);

  // ---------------------------------------------------------------------------
  // 3. EFFECTS
  // ---------------------------------------------------------------------------
  
  // Fetch user's announcements on mount
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await apiClient.get('/api/users/my-announcements');
        setAnnouncements(res.data);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  // ---------------------------------------------------------------------------
  // 4. EVENT HANDLERS
  // ---------------------------------------------------------------------------
  
  /**
   * Navigate to edit page with announcement data
   */
  const handleEdit = (announcement) => {
    localStorage.setItem('editAnnouncement', JSON.stringify(announcement));
    navigate('/edit-announcement', { state: { announcement } });
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  /**
   * Confirm and execute announcement deletion
   */
  const handleConfirmDelete = async () => {
    try {
      await apiClient.delete(`/api/users/my-announcements/${deleteId}`);
      setAnnouncements(announcements.filter(a => a._id !== deleteId));
    } catch (e) {
      alert('Eroare la ștergerea anunțului!');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  /**
   * Navigate to previous image in carousel
   */
  const handlePrevImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : imagesLength - 1
    }));
  };

  /**
   * Navigate to next image in carousel
   */
  const handleNextImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] < imagesLength - 1 ? prev[id] + 1 : 0
    }));
  };

  /**
   * Navigate to announcement details page
   */
  const handleCardClick = (e, announcementId) => {
    if (e.target.closest('.my-announcement-btn')) return;
    window.location.href = `/announcement/${announcementId}`;
  };

  // ---------------------------------------------------------------------------
  // 5. RENDER HELPERS
  // ---------------------------------------------------------------------------
  
  /**
   * Render loading state
   */
  const renderLoadingState = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        gap: 2
      }}
    >
      <CircularProgress size={48} sx={{ color: '#355070' }} />
      <Typography variant="body1" sx={{ color: '#666' }}>
        Se încarcă anunțurile...
      </Typography>
    </Box>
  );

  /**
   * Render mobile header with back button
   */
  const renderMobileHeader = () => (
    <div className="mobile-header">
      <IconButton
        onClick={() => { 
          if (window.history.length > 1) { 
            navigate(-1); 
          } else { 
            navigate('/'); 
          } 
        }}
        className="mobile-back-btn"
        disableRipple
        disableFocusRipple
        aria-label="Înapoi"
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" className="mobile-header-title">
        Anunțurile mele
      </Typography>
    </div>
  );

  /**
   * Render search and filter header
   */
  const renderSearchHeader = () => (
    <Paper elevation={1} className="my-announcements-search-header" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={2}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Caută după titlu, ID sau locație..."
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
        <Box className="search-filters-wrap" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box className="search-filters-left" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Categorie</InputLabel>
              <Select
                value={categoryFilter}
                label="Categorie"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="Orice categorie">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ fontSize: 16 }} />
                    Toate
                  </Box>
                </MenuItem>
                {uniqueCategories.map(category => (
                  <MenuItem key={category} value={category}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon sx={{ fontSize: 16 }} />
                      {category.length > 20 ? `${category.substring(0, 20)}...` : category}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Sort Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sortare</InputLabel>
              <Select
                value={dateFilter}
                label="Sortare"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="cea mai recenta">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16 }} />
                    Cele mai recente
                  </Box>
                </MenuItem>
                <MenuItem value="cea mai veche">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 16 }} />
                    Cele mai vechi
                  </Box>
                </MenuItem>
                <MenuItem value="titlu_a_z">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ fontSize: 16 }} />
                    Titlu A-Z
                  </Box>
                </MenuItem>
                <MenuItem value="titlu_z_a">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon sx={{ fontSize: 16 }} />
                    Titlu Z-A
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box className="search-results-count" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredAndSortedAnnouncements.length} rezultate
            </Typography>
          </Box>
        </Box>
        
        {/* Active Filters */}
        {(searchTerm || categoryFilter !== 'Orice categorie') && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {searchTerm && (
              <Chip
                label={`Căutare: "${searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"`}
                onDelete={() => setSearchTerm('')}
                size="small"
              />
            )}
            {categoryFilter !== 'Orice categorie' && (
              <Chip
                label={`Categorie: ${categoryFilter.length > 15 ? categoryFilter.substring(0, 15) + '...' : categoryFilter}`}
                onDelete={() => setCategoryFilter('Orice categorie')}
                size="small"
              />
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );

  /**
   * Get image source URL (handle different formats)
   */
  const getImageSrc = (img) => 
    img.startsWith('http') || img.startsWith('/uploads')
      ? img
      : `/uploads/${img.replace(/^.*[\\/]/, '')}`;

  /**
   * Render single announcement card
   */
  const renderAnnouncementCard = (announcement) => {
    const images = Array.isArray(announcement.images) ? announcement.images : [];
    
    return (
      <div 
        key={announcement._id} 
        className="my-announcement-card" 
        style={{ cursor: 'pointer' }}
        onClick={(e) => handleCardClick(e, announcement._id)}
      >
        {/* Card Image */}
        <div className="my-announcement-image">
          {images.length > 0 ? (
            <img
              src={getImageSrc(images[0])}
              alt="imagine principala"
              className="my-announcement-img"
            />
          ) : (
            <div className="my-announcement-img" style={{background: '#eee'}} />
          )}
        </div>
        
        {/* Card Info */}
        <div className="my-announcement-info">
          <div className="my-announcement-header">
            <div>
              <h2 className="my-announcement-title">{announcement.title}</h2>
              <div className="my-announcement-category">{announcement.category}</div>
              <div className="my-announcement-location">
                <LocationOnIcon sx={{ fontSize: 26, marginRight: 1 }} />
                {announcement.location}
              </div>
            </div>
            <div className="my-announcement-id">
              ID: {announcement._id?.slice(-9) || ''}
            </div>
          </div>
          
          {/* Card Actions */}
          <div className="my-announcement-actions">
            <button className="my-announcement-btn" onClick={() => handleEdit(announcement)}>
              Editează
            </button>
            <button className="my-announcement-btn secondary">
              Reactualizează
            </button>
            <button className="my-announcement-btn danger" onClick={() => handleDelete(announcement._id)}>
              Șterge
            </button>
            <button className="my-announcement-btn secondary">
              Dezactivează
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render empty state (no announcements found)
   */
  const renderEmptyState = () => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Typography variant="h6" color="text.secondary">
        {searchTerm || categoryFilter !== 'Orice categorie' 
          ? 'Nu au fost găsite anunțuri cu criteriile selectate'
          : 'Nu ai încă niciun anunț publicat'}
      </Typography>
    </div>
  );

  // ---------------------------------------------------------------------------
  // 6. MAIN RENDER
  // ---------------------------------------------------------------------------
  
  if (loading) {
    return renderLoadingState();
  }

  return (
    <>
      <div className="my-announcements-container">
        {renderMobileHeader()}
        
        <h1 className="my-announcements-title">Anunțurile mele</h1>
        
        {announcements.length > 0 && renderSearchHeader()}

        {filteredAndSortedAnnouncements.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="my-announcements-list">
            {filteredAndSortedAnnouncements.map(renderAnnouncementCard)}
          </div>
        )}
      </div>
      
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleConfirmDelete}
        title="Sigur vrei să ștergi acest anunț?"
        description="Această acțiune nu poate fi anulată."
      />
    </>
  );
}
