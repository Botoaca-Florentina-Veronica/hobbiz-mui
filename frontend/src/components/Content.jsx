import React, { useRef, useEffect, useState } from 'react';
import { 
  IconButton, 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Skeleton,
  Avatar,
  Stack
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  FavoriteBorder, 
  LocationOn,
  AccessTime,
  TrendingUp
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
// Content.css is imported in App.jsx to ensure it is loaded after global styles
import apiClient, { searchAnnouncements } from '../api/api';
import { useNavigate, useLocation } from 'react-router-dom';
import translateCategory from '../utils/translateCategory';

export default function Content() {
  const carouselRef = useRef(null);
  const [popular, setPopular] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
  const accent = isDarkMode ? '#f51866' : '#1A314E';
  const accentHover = isDarkMode ? '#d01456' : '#0f2237';
  const [scrollPage, setScrollPage] = useState(0);

  // Re-render when dark mode class changes on <body>
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Format date in Romanian like "09 septembrie 2025"
  const formatRoDate = (date) => {
    try {
      return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400; // Valoare fixă pentru scroll sau poți calcula dinamic
      carouselRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  useEffect(() => {
    let mounted = true;
    apiClient.get('/api/announcements/popular?limit=10')
      .then(res => {
        if (!mounted) return;
        setPopular(res.data || []);
      })
      .catch(() => setPopular([]));
    return () => { mounted = false; };
  }, []);

  // Handle search parameter from URL (with AbortController to prevent race conditions)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTerm = urlParams.get('search');
    const locationParam = urlParams.get('location');
    
    if (!searchTerm || !searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchResults([]);

    searchAnnouncements(searchTerm.trim(), controller.signal, locationParam || undefined)
      .then(res => {
        if (controller.signal.aborted) return;
        const results = res.data || [];
        setSearchResults(results);
        setIsSearching(false);
        if (results.length === 0) {
          window.showToast(t('content.noResultsFound'), "info", 4000);
        }
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Eroare la căutarea anunțurilor:', err);
        setSearchResults([]);
        setIsSearching(false);
        window.showToast(t('content.searchError'), "error", 4000);
      });

    return () => controller.abort();
  }, [location.search]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const total = popular.length || searchResults.length;
      const dots = Math.max(1, Math.ceil(total / 5));
      setScrollPage(max > 0 ? Math.round((el.scrollLeft / max) * (dots - 1)) : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [popular, searchResults]);

  return (
    <section className="content">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" className="choose-us-title">
          {searchResults.length > 0 || isSearching ? t('content.searchResults') : t('content.popularTitle')}
        </Typography>
        <Typography 
          variant="subtitle1" 
          className="choose-us-subtitle"
          sx={{ 
            color: isDarkMode ? '#aaa' : '#666',
            fontSize: { xs: '0.95rem', md: '1.1rem' },
            maxWidth: '600px',
            fontWeight: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'block'
          }}
        >
          {searchResults.length > 0
            ? t('content.searchResultsCount', { count: searchResults.length })
            : isSearching
              ? t('content.searching')
              : t('content.popularSubtitle')}
        </Typography>
      </Box>

      <Box sx={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        px: { xs: 0, lg: 2 }
      }}>
        <IconButton
          onClick={() => handleScroll('left')}
          sx={{
            position: 'absolute',
            left: { lg: '-60px' },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: accent,
            color: 'white',
            width: 48,
            height: 48,
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'flex' },
            boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
            '&:hover': {
              background: accentHover,
              transform: 'translateY(-50%) !important',
              boxShadow: `0 6px 25px rgba(0,0,0,0.3)`,
            },
            '&:focus': { transform: 'translateY(-50%) !important' },
            '&:active': { transform: 'translateY(-50%) !important' },
            transition: 'background 0.2s ease, box-shadow 0.2s ease !important'
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        {/* Modern card container */}
        <Box
          ref={carouselRef}
          className="popular-announcements-container"
          sx={{
            display: { xs: 'grid', lg: 'flex' },
            gridTemplateColumns: { 
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(3, 1fr)' 
            },
            gap: { xs: '16px', sm: '20px', md: '24px', lg: '24px' },
            flexWrap: { lg: 'nowrap' },
            overflowX: { xs: 'hidden', lg: 'auto' },
            overflowY: 'visible',
            scrollBehavior: 'smooth',
            padding: { xs: '16px', sm: '20px', md: '24px', lg: '20px 10px' },
            justifyContent: { lg: 'flex-start' },
            '&::-webkit-scrollbar': {
              height: '6px',
              backgroundColor: 'transparent',
              display: { xs: 'none', lg: 'block' }
            },
            '&::-webkit-scrollbar-thumb': {
              background: accent,
              borderRadius: '10px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '10px',
              margin: '0 10px'
            }
          }}
        >
          {isSearching ? (
            // Loading skeletons for search
            [...Array(6)].map((_, index) => (
              <Card
                key={index}
                sx={{
                  width: { xs: '100%', lg: 220 },
                  minWidth: { lg: 220 },
                  maxWidth: { lg: 220 },
                  height: { xs: 260, sm: 280, md: 300, lg: 270 },
                  flexShrink: 0,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                  boxShadow: isDarkMode
                    ? '0 8px 32px rgba(0,0,0,0.4)'
                    : '0 8px 32px rgba(0,0,0,0.06)',
                  border: isDarkMode ? '1px solid #2a2a2a' : 'none'
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  height={{ xs: 180, sm: 200, md: 240, lg: 260 }}
                  sx={{ 
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Skeleton 
                    variant="text" 
                    height={28} 
                    sx={{ 
                      mb: 1.5,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
                    }} 
                  />
                  <Skeleton 
                    variant="text" 
                    height={20} 
                    width="80%" 
                    sx={{ 
                      mb: 1,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
                    }} 
                  />
                  <Skeleton 
                    variant="text" 
                    height={20} 
                    width="60%" 
                    sx={{ 
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'
                    }} 
                  />
                </CardContent>
              </Card>
            ))
          ) : searchResults.length > 0 ? (
            // Display search results
            searchResults.map((a, index) => {
              // Compute created date
              let createdAtLabel = null;
              try {
                const createdAt = a?.createdAt ? new Date(a.createdAt) : (a?._id ? new Date(parseInt(String(a._id).substring(0, 8), 16) * 1000) : null);
                if (createdAt && !isNaN(createdAt.getTime())) {
                  createdAtLabel = formatRoDate(createdAt);
                }
              } catch {}
              
              return (
              <Card
                key={a._id || index}
                onClick={() => a?._id && navigate(`/announcement/${a._id}`)}
                sx={{
                  width: { xs: '100%', lg: 220 },
                  minWidth: { lg: 220 },
                  maxWidth: { lg: 220 },
                  height: { xs: 260, sm: 280, md: 300, lg: 270 },
                  flexShrink: 0,
                  cursor: 'pointer',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  background: isDarkMode
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                  border: isDarkMode
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isDarkMode
                    ? '0 8px 32px rgba(0,0,0,0.4)'
                    : '0 8px 32px rgba(0,0,0,0.06)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: isDarkMode
                      ? `0 20px 60px rgba(245, 24, 102, 0.25)`
                      : `0 20px 40px rgba(26, 49, 78, 0.15)`,
                    border: isDarkMode
                      ? '1px solid rgba(245, 24, 102, 0.3)'
                      : '1px solid rgba(26, 49, 78, 0.2)',
                    '& .card-image': {
                      transform: 'scale(1.1)',
                    },
                    '& .overlay-gradient': {
                      opacity: 0.7
                    }
                  }
                }}
              >
                {/* Image Section with Gradient Overlay */}
                <Box sx={{
                  position: 'relative',
                  height: { xs: 155, sm: 165, md: 175, lg: 160 },
                  overflow: 'hidden',
                  backgroundColor: '#f0f0f0'
                }}>
                  {a?.images && a.images[0] ? (
                    <>
                      <Box
                        component="img"
                        className="card-image"
                        src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                          ? a.images[0]
                          : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                        alt={a.title || 'anunț popular'}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                      {/* Gradient overlay for better text readability */}
                      <Box
                        className="overlay-gradient"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '60%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                          opacity: 0.5,
                          transition: 'opacity 0.4s ease',
                          pointerEvents: 'none'
                        }}
                      />
                    </>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        fontWeight: 500
                      }}
                    >
                      Fără imagine
                    </Box>
                  )}
                  
                  {/* Favorite Badge - Modern Design */}
                  {a.favoritesCount > 0 && (
                    <Chip
                      icon={<FavoriteBorder sx={{ fontSize: 16, color: 'white !important' }} />}
                      label={a.favoritesCount}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        height: '32px',
                        px: 0.5,
                        '& .MuiChip-icon': {
                          color: 'white',
                          marginLeft: '4px'
                        },
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  )}

                  {/* Category Badge */}
                  {a.category && (
                    <Chip
                      label={a.category}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: accent,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '28px',
                        textTransform: 'capitalize',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    />
                  )}
                </Box>

                {/* Content Section - Modern Layout */}
                <CardContent sx={{
                  p: { xs: 1.5, sm: 2, md: 2 },
                  height: { xs: 100, sm: 110, md: 110, lg: 110 },
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Title */}
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.15rem' },
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: isDarkMode ? '#ffffff' : '#1a1a1a',
                      mb: 1.5,
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {a.title || 'Anunț fără titlu'}
                  </Typography>
                  
                  {/* Info Stack - Location & Date */}
                  <Stack spacing={0.8}>
                    {a.location && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.8 
                      }}>
                        <LocationOn sx={{
                          fontSize: { xs: 16, md: 18 },
                          color: accent,
                          flexShrink: 0
                        }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isDarkMode ? '#bbb' : '#666', 
                            fontSize: { xs: '0.8rem', md: '0.85rem' },
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {a.location}
                        </Typography>
                      </Box>
                    )}
                    
                    {createdAtLabel && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.8 
                      }}>
                        <AccessTime sx={{ 
                          fontSize: { xs: 16, md: 18 }, 
                          color: isDarkMode ? '#888' : '#999',
                          flexShrink: 0
                        }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: isDarkMode ? '#888' : '#999', 
                            fontSize: { xs: '0.75rem', md: '0.8rem' },
                            fontWeight: 400
                          }}
                        >
                          {createdAtLabel}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
            })
          ) : (
            // Display popular announcements (fallback)
            popular.map((a, index) => {
              // Compute created date
              let createdAtLabel = null;
              try {
                const createdAt = a?.createdAt ? new Date(a.createdAt) : (a?._id ? new Date(parseInt(String(a._id).substring(0, 8), 16) * 1000) : null);
                if (createdAt && !isNaN(createdAt.getTime())) {
                  createdAtLabel = formatRoDate(createdAt);
                }
              } catch (error) {
                console.warn('Eroare la formatarea datei:', error);
              }

              return (
                <Card
                  key={a._id || index}
                  sx={{
                    width: { xs: '100%', lg: 220 },
                    minWidth: { lg: 220 },
                    maxWidth: { lg: 220 },
                    height: { xs: 260, sm: 280, md: 300, lg: 270 },
                    flexShrink: 0,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: isDarkMode
                      ? 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)'
                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                    boxShadow: isDarkMode
                      ? '0 8px 32px rgba(0,0,0,0.4)'
                      : '0 8px 32px rgba(0,0,0,0.06)',
                    border: isDarkMode ? '1px solid #2a2a2a' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: isDarkMode
                        ? '0 20px 40px rgba(0,0,0,0.6)'
                        : `0 20px 40px rgba(26, 49, 78, 0.15)`,
                      border: isDarkMode ? '1px solid #2a2a2a' : `1px solid rgba(26, 49, 78, 0.2)`,
                    }
                  }}
                  onClick={() => navigate(`/announcement/${a._id}`)}
                >
                  {/* Image Section */}
                  <Box sx={{
                    position: 'relative',
                    height: { xs: 155, sm: 165, md: 175, lg: 160 },
                    overflow: 'hidden',
                    backgroundColor: '#f0f0f0'
                  }}>
                    {a?.images && a.images[0] ? (
                      <>
                        <Box
                          component="img"
                          className="card-image"
                          src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                            ? a.images[0]
                            : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                          alt={a.title || 'anunț popular'}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                        {/* Gradient overlay for better text readability */}
                        <Box
                          className="overlay-gradient"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '60%',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                            opacity: 0.5,
                            transition: 'opacity 0.4s ease',
                            pointerEvents: 'none'
                          }}
                        />
                      </>
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          fontWeight: 500
                        }}
                      >
                        Fără imagine
                      </Box>
                    )}
                    
                    {/* Favorite Badge - Modern Design */}
                    {a.favoritesCount > 0 && (
                      <Chip
                        icon={<FavoriteBorder sx={{ fontSize: 16, color: 'white !important' }} />}
                        label={a.favoritesCount}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: 'rgba(255, 255, 255, 0.25)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          height: '32px',
                          px: 0.5,
                          '& .MuiChip-icon': {
                            color: 'white',
                            marginLeft: '4px'
                          },
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    )}

                    {/* Category Badge */}
                    {a.category && (
                      <Chip
                        label={translateCategory(a.category, t)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: accent,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: '28px',
                          textTransform: 'capitalize',
                          border: 'none',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                      />
                    )}
                  </Box>
                  
                  {/* Content Section - Modern Layout */}
                  <CardContent sx={{
                    p: { xs: 1.5, sm: 2, md: 2 },
                    height: { xs: 100, sm: 110, md: 110, lg: 110 },
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Title */}
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.15rem' },
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a',
                        mb: 1.5,
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {a.title || 'Anunț fără titlu'}
                    </Typography>
                    
                    {/* Info Stack - Location & Date */}
                    <Stack spacing={0.8}>
                      {a.location && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.8 
                        }}>
                          <LocationOn sx={{
                            fontSize: { xs: 16, md: 18 },
                            color: accent,
                            flexShrink: 0
                          }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isDarkMode ? '#bbb' : '#666', 
                              fontSize: { xs: '0.8rem', md: '0.85rem' },
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {a.location}
                          </Typography>
                        </Box>
                      )}
                      
                      {createdAtLabel && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.8 
                        }}>
                          <AccessTime sx={{ 
                            fontSize: { xs: 16, md: 18 }, 
                            color: isDarkMode ? '#888' : '#999',
                            flexShrink: 0
                          }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: isDarkMode ? '#888' : '#999', 
                              fontSize: { xs: '0.75rem', md: '0.8rem' },
                              fontWeight: 400
                            }}
                          >
                            {createdAtLabel}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>

        <IconButton
          onClick={() => handleScroll('right')}
          sx={{
            position: 'absolute',
            right: { lg: '-60px' },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: accent,
            color: 'white',
            width: 48,
            height: 48,
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'flex' },
            boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
            '&:hover': {
              background: accentHover,
              transform: 'translateY(-50%) !important',
              boxShadow: `0 6px 25px rgba(0,0,0,0.3)`,
            },
            '&:focus': { transform: 'translateY(-50%) !important' },
            '&:active': { transform: 'translateY(-50%) !important' },
            transition: 'background 0.2s ease, box-shadow 0.2s ease !important'
          }}
        >
          <ChevronRight fontSize="large" />
        </IconButton>
      </Box>

      {/* Pagination dots */}
      {!isSearching && (popular.length > 0 || searchResults.length > 0) && (
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
          {Array.from({ length: Math.ceil((popular.length || searchResults.length) / 5) }).map((_, i) => (
            <Box
              key={i}
              onClick={() => {
                if (carouselRef.current) {
                  const el = carouselRef.current;
                  const total = Math.ceil((popular.length || searchResults.length) / 5);
                  el.scrollLeft = (i / Math.max(1, total - 1)) * (el.scrollWidth - el.clientWidth);
                }
              }}
              sx={{
                width: i === scrollPage ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i === scrollPage ? accent : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(26,49,78,0.2)'),
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}

      {/* Button to explore all announcements */}
      <Box sx={{ 
        textAlign: 'center', 
        mt: 5,
        mb: 2
      }}>
        <button
          className="explore-all-button"
          onClick={() => navigate('/toate-anunturile')}
        >
          {t('content.exploreAllButton')}
        </button>
      </Box>
    </section>
  );
}