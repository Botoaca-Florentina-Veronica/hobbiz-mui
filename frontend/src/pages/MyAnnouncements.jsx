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
  Divider,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import './MyAnnouncements.css';



export default function MyAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // Mutat aici, la început, pentru a respecta regulile hooks
  const [imageIndexes, setImageIndexes] = useState({});
  // Stati pentru filtrare și căutare
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Orice categorie');
  const [dateFilter, setDateFilter] = useState('cea mai recenta');
  const navigate = useNavigate();

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

  // Obține categoriile unice din anunțuri
  const uniqueCategories = useMemo(() => {
    const categories = announcements.map(a => a.category).filter(Boolean);
    return [...new Set(categories)];
  }, [announcements]);

  // Filtrează și sortează anunțurile
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter(a => {
      // Filtrare după termenul de căutare (titlu, ID sau locație)
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

      // Filtrare după categorie
      const matchesCategory = categoryFilter === 'Orice categorie' || a.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Sortare după criteriul selectat
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

  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

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

  const handleEdit = (announcement) => {
    localStorage.setItem('editAnnouncement', JSON.stringify(announcement));
    navigate('/edit-announcement', { state: { announcement } });
  };

  if (loading) {
    return (
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
  }

  const handlePrevImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : imagesLength - 1
    }));
  };

  const handleNextImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] < imagesLength - 1 ? prev[id] + 1 : 0
    }));
  };

  return (
    <>
      <div className="my-announcements-container">
        <h1 className="my-announcements-title">Anunțurile mele</h1>
        
        {/* Header de căutare și filtrare */}
        {announcements.length > 0 && (
          <Card elevation={2} sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
            <CardContent sx={{ p: 1.5 }}>
              {/* Căutare și controale într-o singură linie */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                {/* Căutare */}
                <TextField
                  placeholder="Caută după titlu, ID sau locație"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#355070', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    flex: 2,
                    minWidth: 280,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': { backgroundColor: '#fff' },
                      '&.Mui-focused': { backgroundColor: '#fff' }
                    }
                  }}
                />
                
                {/* Filtru categorie */}
                <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
                  <InputLabel>Categorie</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Categorie"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': { backgroundColor: '#fff' },
                    }}
                  >
                    <MenuItem value="Orice categorie">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon sx={{ fontSize: 16, color: '#666' }} />
                        Toate
                      </Box>
                    </MenuItem>
                    {uniqueCategories.map(category => (
                      <MenuItem key={category} value={category}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 16, color: '#355070' }} />
                          {category.length > 20 ? `${category.substring(0, 20)}...` : category}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Filtru sortare */}
                <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
                  <InputLabel>Sortare</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Sortare"
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      backgroundColor: '#f8f9fa',
                      '&:hover': { backgroundColor: '#fff' },
                    }}
                  >
                    <MenuItem value="cea mai recenta">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#355070' }} />
                        Data publicării: cea mai recentă
                      </Box>
                    </MenuItem>
                    <MenuItem value="cea mai veche">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#666' }} />
                        Data publicării: cea mai veche
                      </Box>
                    </MenuItem>
                    <MenuItem value="titlu_a_z">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#355070' }} />
                        Titlu: A-Z
                      </Box>
                    </MenuItem>
                    <MenuItem value="titlu_z_a">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: '#666' }} />
                        Titlu: Z-A
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Numărul de anunțuri și sortarea pe aceeași linie */}
              <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`${filteredAndSortedAnnouncements.length} ${filteredAndSortedAnnouncements.length === 1 ? 'anunț găsit' : 'anunțuri găsite'}`}
                  size="medium"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    height: 32
                  }}
                />
                {/* Butonul de sortare în dreapta */}
                {dateFilter !== 'cea mai recenta' && (
                  <Chip
                    label={
                      dateFilter === 'cea mai veche' ? 'Sortare: Vechi' :
                      dateFilter === 'titlu_a_z' ? 'Sortare: A-Z' :
                      dateFilter === 'titlu_z_a' ? 'Sortare: Z-A' : 'Sortare'
                    }
                    onDelete={() => setDateFilter('cea mai recenta')}
                    size="medium"
                    color="default"
                    variant="outlined"
                    sx={{ fontSize: '0.8rem', height: 32 }}
                  />
                )}
              </Box>
              
              {/* Filtre active - doar căutare și categorie */}
              {(searchTerm || categoryFilter !== 'Orice categorie') && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {searchTerm && (
                    <Chip
                      label={`"${searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"`}
                      onDelete={() => setSearchTerm('')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 28 }}
                    />
                  )}
                  {categoryFilter !== 'Orice categorie' && (
                    <Chip
                      label={categoryFilter.length > 15 ? categoryFilter.substring(0, 15) + '...' : categoryFilter}
                      onDelete={() => setCategoryFilter('Orice categorie')}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 28 }}
                    />
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}
        
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
        />
        {filteredAndSortedAnnouncements.length === 0 ? (
          <Card elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
              {announcements.length === 0 
                ? "🎯 Nu ai publicat niciun anunț încă" 
                : "🔍 Nu s-au găsit anunțuri care să corespundă filtrelor"}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              {announcements.length === 0 
                ? "Începe să-ți publici primul anunț pentru a-ți prezenta serviciile!" 
                : "Încearcă să modifici criteriile de căutare sau să resetezi filtrele."}
            </Typography>
          </Card>
        ) : (
          <div className="my-announcements-list">
            {filteredAndSortedAnnouncements.map((a) => {
              const images = a.images || [];
              const getImageSrc = (img) =>
                img.startsWith('http') || img.startsWith('/uploads')
                  ? img
                  : `/uploads/${img.replace(/^.*[\\/]/, '')}`;
              return (
                <div key={a._id} className="my-announcement-card" style={{ cursor: 'pointer' }}
                  onClick={e => {
                    if (e.target.closest('.my-announcement-btn')) return;
                    window.location.href = `/announcement/${a._id}`;
                  }}
                >
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
                  <div className="my-announcement-info">
                    <div className="my-announcement-header">
                      <div>
                        <h2 className="my-announcement-title">{a.title}</h2>
                        <div className="my-announcement-category">{a.category}</div>
                        <div className="my-announcement-location">
                          <LocationOnIcon sx={{ fontSize: 26, color: '#355070', marginRight: 1 }} />
                          {a.location}
                        </div>
                        {/* Descrierea a fost eliminată pentru un aspect mai curat al listei de anunțuri */}
                      </div>
                      <div className="my-announcement-id">
                        ID: {a._id?.slice(-9) || ''}
                      </div>
                    </div>
                    <div className="my-announcement-actions">
                      <button className="my-announcement-btn" onClick={() => handleEdit(a)}>Editează</button>
                      <button className="my-announcement-btn secondary">Reactualizează</button>
                      <button className="my-announcement-btn danger" onClick={() => handleDelete(a._id)}>Șterge</button>
                      <button className="my-announcement-btn secondary">Dezactivează</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* separatorul este inclus în Footer, nu mai este nevoie aici */}
    </>
  );
}
