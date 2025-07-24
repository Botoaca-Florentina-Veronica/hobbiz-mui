import React, { useRef } from 'react';
import { IconButton, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import './Content.css';

// Importuri imagini
import guitar from '../assets/images/guitar-lessons.jpg'
import weheartitGif from '../assets/images/weheartit.gif';
import crosetat from '../assets/images/crosetat.png';
import fridge from '../assets/images/Fridge-Repair.jpg';
import dancing from '../assets/images/dancing.jpg';
import cooking from '../assets/images/cooking.png';
import pregatire from '../assets/images/pregatire.png';

export default function Content() {
  const carouselRef = useRef(null);

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400; // Valoare fixă pentru scroll sau poți calcula dinamic
      carouselRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const images = [
    { src: dancing, alt: "Dans" },
    { src: crosetat, alt: "Croșetare" },
    { src: guitar, alt: "Lecții de chitară" },
    { src: fridge, alt: "Reparații frigidere" },
    { src: pregatire, alt: "Pregătire pentru examen" },
    { src: cooking, alt: "Gătind prăjituri" }
  ];

  return (
    <section className="content">
      {/* GIF animat cu traiectorie orizontală */}
      <div className="moving-gif-container">
        <img src={weheartitGif} alt="We Heart It" className="moving-gif" />
      </div>
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
          {images.map((img, index) => (
            <Box 
              key={index}
              sx={{ 
                minWidth: '380px',
                flexShrink: 0,
                position: 'relative'
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
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