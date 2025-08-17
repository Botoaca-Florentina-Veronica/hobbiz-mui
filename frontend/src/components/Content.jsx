import React, { useRef, useEffect, useState } from 'react';
import { IconButton, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './Content.css';
import apiClient from '../api/api';

export default function Content() {
  const carouselRef = useRef(null);
  const [popular, setPopular] = useState([]);

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
          {popular.map((a, index) => (
            <Box 
              key={index}
              sx={{ 
                minWidth: '380px',
                flexShrink: 0,
                position: 'relative'
              }}
            >
              {a?.images && a.images[0] ? (
                <img
                  src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                    ? a.images[0]
                    : `/uploads/${a.images[0].replace(/^.*[\\\/]/, '')}`}
                  alt={a.title || 'anunț popular'}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                />
              ) : (
                <div style={{width:'100%', height:300, borderRadius:8, background:'#ffebf0'}} />
              )}
            </Box>
          ))}
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