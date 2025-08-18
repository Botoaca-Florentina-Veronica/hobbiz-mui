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
import './Content.css';
import apiClient from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function Content() {
  const carouselRef = useRef(null);
  const [popular, setPopular] = useState([]);
  const navigate = useNavigate();

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
            '&:hover': {
              backgroundColor: '#2a4a65'
            }
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        {/* Carusel cu scrollbar vizibil */}
        <Box
          ref={carouselRef}
          sx={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            padding: '20px 10px',
            '&::-webkit-scrollbar': {
              height: '8px',
              backgroundColor: '#f5f5f5'
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
                  minWidth: 320,
                  maxWidth: 320,
                  height: 300,
                  flexShrink: 0,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <Skeleton variant="rectangular" height={240} />
                <CardContent>
                  <Skeleton variant="text" height={28} />
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} />
                </CardContent>
              </Card>
            ))
          ) : (
            popular.map((a, index) => (
              <Card
                key={a._id || index}
                onClick={() => a?._id && navigate(`/announcement/${a._id}`)}
                sx={{
                  minWidth: 320,
                  maxWidth: 320,
                  height: 300,
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
                <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                  {a?.images && a.images[0] ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                      alt={a.title || 'anunț popular'}
                      sx={{
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
                        height: 200,
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
                      icon={<FavoriteOutlined sx={{ fontSize: 16 }} />}
                      label={a.favoritesCount}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        backgroundColor: 'rgba(245, 24, 102, 0.9)',
                        color: 'white',
                        backdropFilter: 'blur(8px)',
                        '& .MuiChip-icon': {
                          color: 'white'
                        }
                      }}
                    />
                  )}
                </Box>
                
                <CardContent sx={{ p: 2, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: '#1a1a1a',
                      textAlign: 'center'
                    }}
                  >
                    {a.title || 'Anunț fără titlu'}
                  </Typography>
                </CardContent>
              </Card>
            ))
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