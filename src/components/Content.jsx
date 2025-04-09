import React, { useRef } from 'react';
import { IconButton, Box } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Importuri corecte pentru imagini
import prajituri from '../assets/images/prajituri-asortate.jpg';
import guitar from '../assets/images/guitar-lessons.jpg';
import fridge from '../assets/images/Fridge-Repair.jpg';
import dancing from '../assets/images/dancing.jpg';

export default function Content() {
  const sliderRef = useRef(null);
  
  const images = [
    { src: prajituri, alt: "Prăjituri asortate" },
    { src: guitar, alt: "Lecții de chitară" },
    { src: fridge, alt: "Reparații frigidere" },
    { src: dancing, alt: "Dans" }
  ];

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 }
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 1 }
      }
    ]
  };

  return (
    <section className="content" style={{ padding: '100px 0', backgroundColor: '#F67280' }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: '#1f2937', 
        fontSize: '3.5rem', 
        marginBottom: '2rem',
        fontWeight: 'bolder'
      }}>
        Anunțuri populare
      </h2>

      <Box sx={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        position: 'relative',
        padding: '0 50px'
      }}>
        <IconButton 
          onClick={() => sliderRef.current.slickPrev()}
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: '#355C7D',
            color: 'white',
            '&:hover': {
              backgroundColor: '#2a4a65'
            }
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        <Slider ref={sliderRef} {...settings}>
          {images.map((img, index) => (
            <Box key={index} sx={{ padding: '0 10px' }}>
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
        </Slider>

        <IconButton
          onClick={() => sliderRef.current.slickNext()}
          sx={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: '#355C7D',
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