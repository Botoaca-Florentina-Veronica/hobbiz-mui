import React, { useRef, useEffect, useState } from 'react';
import { 
  IconButton, 
  Box, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Chip,
  Skeleton
} from '@mui/material';
import { ChevronLeft, ChevronRight, FavoriteOutlined } from '@mui/icons-material';
// Content.css is imported in App.jsx to ensure it is loaded after global styles
import apiClient from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Content() {
  const carouselRef = useRef(null);
  const [popular, setPopular] = useState([]);
  const navigate = useNavigate();

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

  return (
    <section className="content">
      <h2>Anunțuri populare</h2>
        <Box sx={{ 
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative'
      }}>
        <IconButton 
          onClick={() => handleScroll('left')}
          sx={{
            position: 'absolute',
            left: '-50px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: '#f51866',
            color: 'white',
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'flex' }, // Only visible on large screens
            '&:hover': {
              backgroundColor: '#2a4a65'
            }
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        {/* Responsive card container */}
        <Box
          ref={carouselRef}
          className="popular-announcements-container"
          sx={{
            /* Use grid on small screens to guarantee 2 columns, switch to horizontal flex/scroll on large screens */
            display: { xs: 'grid', lg: 'flex' },
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' },
            gap: { xs: '12px', sm: '16px', md: '20px', lg: '20px' },
            flexWrap: { lg: 'nowrap' },
            overflowX: { xs: 'hidden', sm: 'hidden', md: 'hidden', lg: 'auto' },
            overflowY: 'visible',
            scrollBehavior: 'smooth',
            padding: { xs: '20px 12px', sm: '20px 16px', md: '20px 20px', lg: '20px 10px' },
            justifyContent: { lg: 'flex-start' },
            maxHeight: { xs: 'none', sm: 'none', md: 'none', lg: 'auto' },
            '&::-webkit-scrollbar': {
              height: '8px',
              backgroundColor: '#f5f5f5',
              display: { xs: 'none', sm: 'none', md: 'none', lg: 'block' }
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#f51866',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }
          }}
        >
          {popular.length === 0 ? (
            // Loading skeletons
            [...Array(6)].map((_, index) => (
              <Card
                key={index}
                sx={{
                  /* Full width within grid columns on small screens, fixed card width on large screens */
                  width: { xs: '100%', sm: '100%', md: '100%', lg: 320 },
                  minWidth: { lg: 320 },
                  maxWidth: { lg: 320 },
                  height: { 
                    xs: 220, 
                    sm: 260, 
                    md: 300, 
                    lg: 310 
                  },
                  flexShrink: 0,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <Skeleton 
                  variant="rectangular" 
                  height={{ xs: 120, sm: 150, md: 180, lg: 190 }} 
                />
                <CardContent>
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                  <Skeleton variant="text" width="40%" height={16} />
                </CardContent>
              </Card>
            ))
          ) : (
            popular.map((a, index) => {
              // Compute created date; fallback to ObjectId timestamp if createdAt missing
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
                  width: { xs: '100%', sm: '100%', md: '100%', lg: 320 },
                  minWidth: { lg: 320 },
                  maxWidth: { lg: 320 },
                  height: { 
                    xs: 220, 
                    sm: 260, 
                    md: 300, 
                    lg: 310 
                  },
                  flexShrink: 0,
                  cursor: 'pointer',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <Box sx={{ 
                  position: 'relative', 
                  height: { xs: 120, sm: 150, md: 180, lg: 190 }, 
                  overflow: 'hidden' 
                }}>
                  {a?.images && a.images[0] ? (
                    <CardMedia
                      component="img"
                      height="120"
                      image={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                      alt={a.title || 'anunț popular'}
                      sx={{
                        height: { xs: 120, sm: 150, md: 180, lg: 190 },
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: { xs: 120, sm: 150, md: 180, lg: 190 },
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666'
                      }}
                    >
                      <Typography variant="body2">Fără imagine</Typography>
                    </Box>
                  )}
                  
                  {/* Favorite count badge */}
                  {a.favoritesCount > 0 && (
                    <Chip
                      icon={<FavoriteOutlined sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />}
                      label={a.favoritesCount}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 10, md: 12 },
                        right: { xs: 8, sm: 10, md: 12 },
                        backgroundColor: 'rgba(245, 24, 102, 0.9)',
                        color: 'white',
                        backdropFilter: 'blur(8px)',
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                        height: { xs: '20px', sm: '22px', md: '24px' },
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  )}
                </Box>
                
                <CardContent sx={{ 
                  p: { xs: 0.75, sm: 1, md: 1.5, lg: 2 }, 
                  height: { xs: 90, sm: 100, md: 110, lg: 100 }, 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem', lg: '1.1rem' },
                      lineHeight: { xs: 1.1, sm: 1.15, md: 1.2, lg: 1.3 },
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: '#1a1a1a',
                      mb: { xs: 0.2, sm: 0.3, md: 0.5, lg: 1 }
                    }}
                  >
                    {a.title || 'Anunț fără titlu'}
                  </Typography>
                  
                  {/* Location and Date info */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.1, sm: 0.15, md: 0.2 } }}>
                    {a.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.4, md: 0.5 } }}>
                        <Box
                          component="svg"
                          sx={{ width: { xs: 9, sm: 11, md: 13, lg: 14 }, height: { xs: 9, sm: 11, md: 13, lg: 14 }, color: '#666' }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#666', 
                            fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.7rem', lg: '0.75rem' },
                            lineHeight: { xs: 1, sm: 1.05, md: 1.1, lg: 1.2 },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                        >
                          {a.location}
                        </Typography>
                      </Box>
                    )}
                    
                    {createdAtLabel && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.3, sm: 0.4, md: 0.5 } }}>
                        <Box
                          component="svg"
                          sx={{ width: { xs: 9, sm: 11, md: 13, lg: 14 }, height: { xs: 9, sm: 11, md: 13, lg: 14 }, color: '#666' }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#666', 
                            fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.7rem', lg: '0.75rem' },
                            lineHeight: { xs: 1, sm: 1.05, md: 1.1, lg: 1.2 }
                          }}
                        >
                          {createdAtLabel}
                        </Typography>
                      </Box>
                    )}
                  </Box>
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
            right: '-50px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: '#f51866',
            color: 'white',
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'flex' }, // Only visible on large screens
            '&:hover': {
              backgroundColor: '#2a4a65'
            }
          }}
        >
          <ChevronRight fontSize="large" />
        </IconButton>
      </Box>
    </section>
  );
}