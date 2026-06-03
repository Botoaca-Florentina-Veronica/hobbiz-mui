import React, { useRef, useEffect, useState } from 'react';
import {
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
// Content.css is imported in App.jsx to ensure it is loaded after global styles
import apiClient from '../api/api';
import { useNavigate } from 'react-router-dom';
import ResultCard from './ResultCard';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Content() {
  const carouselRef = useRef(null);
  const [popular, setPopular] = useState([]);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = (i18n?.language || 'ro').slice(0, 2);
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
  const accent = isDarkMode ? '#f51866' : '#1A314E';
  const accentHover = isDarkMode ? '#d01456' : '#0f2237';
  const [scrollPage, setScrollPage] = useState(0);

  const planeRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  // Re-render when dark mode class changes on <body>
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const formatRoDate = (date) => {
    try {
      const dateLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'ro-RO';
      return date.toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  // Load popular announcements
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

  // Track carousel scroll position for pagination dots
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const total = popular.length;
      const dots = Math.max(1, Math.ceil(total / 5));
      setScrollPage(max > 0 ? Math.round((el.scrollLeft / max) * (dots - 1)) : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [popular]);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = ''; };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e) => setIsTouchDevice(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isTouchDevice || !planeRef.current) return;

    const PLANE_SIZE = 180;
    const HALF = PLANE_SIZE / 2;
    const BUFFER = 250;   // px beyond plane edge before it appears/disappears
    const DURATION = 22000; // ms per full pass
    const BASE_Y = 70;
    const AMPLITUDE = 35;
    const WAVE_COUNT = 2;

    let raf;
    let startTime = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const w = window.innerWidth;
      const startX = -(HALF + BUFFER);          // center fully off-screen left
      const endX   = w + HALF + BUFFER;          // center fully off-screen right
      const totalDist = endX - startX;

      const elapsed = (timestamp - startTime) % DURATION;
      const t = elapsed / DURATION;

      const cx = startX + totalDist * t;
      const cy = BASE_Y + Math.sin(t * Math.PI * 2 * WAVE_COUNT) * AMPLITUDE;

      // lookahead for rotation angle
      const dt = 50 / DURATION;
      const nt = t + dt;
      const ncx = startX + totalDist * nt;
      const ncy = BASE_Y + Math.sin(nt * Math.PI * 2 * WAVE_COUNT) * AMPLITUDE;
      const angle = Math.atan2(ncy - cy, ncx - cx) * (180 / Math.PI);

      if (planeRef.current) {
        planeRef.current.style.transform =
          `translate(${cx - HALF}px, ${cy - HALF}px) rotate(${angle}deg)`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isTouchDevice]);

  return (
    <>
    {!isTouchDevice && (
      <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'visible', marginBottom: '-60px', zIndex: 10 }}>
        <div
          ref={planeRef}
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            transformOrigin: 'center center',
          }}
        >
          <DotLottieReact
            src="https://lottie.host/02c2376a-b63f-4c01-8e92-71c0bc80c662/YBmzfBifVm.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
    )}
    <section className="content">
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" className="choose-us-title">
          {t('content.popularTitle')}
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
            display: 'block',
          }}
        >
          {t('content.popularSubtitle')}
        </Typography>
      </Box>

      <Box sx={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        px: { xs: 0, lg: 2 },
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
            transition: 'background 0.2s ease, box-shadow 0.2s ease !important',
          }}
        >
          <ChevronLeft fontSize="large" />
        </IconButton>

        <Box
          ref={carouselRef}
          className="popular-announcements-container"
          sx={{
            display: { xs: 'grid', lg: 'flex' },
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
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
              display: { xs: 'none', lg: 'block' },
            },
            '&::-webkit-scrollbar-thumb': { background: accent, borderRadius: '10px' },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '10px',
              margin: '0 10px',
            },
          }}
        >
          {popular.map((a, index) => (
            <ResultCard
              key={a._id || index}
              a={a}
              layout="carousel"
              isDarkMode={isDarkMode}
              accent={accent}
              formatRoDate={formatRoDate}
              t={t}
              navigate={navigate}
              priceLabel=""
            />
          ))}
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
            transition: 'background 0.2s ease, box-shadow 0.2s ease !important',
          }}
        >
          <ChevronRight fontSize="large" />
        </IconButton>
      </Box>

      {popular.length > 0 && (
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
          {Array.from({ length: Math.ceil(popular.length / 5) }).map((_, i) => (
            <Box
              key={i}
              onClick={() => {
                if (carouselRef.current) {
                  const el = carouselRef.current;
                  const total = Math.ceil(popular.length / 5);
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

      <Box sx={{ textAlign: 'center', mt: 5, mb: 2 }}>
        <button
          className="explore-all-button"
          onClick={() => navigate('/toate-anunturile')}
        >
          {t('content.exploreAllButton')}
        </button>
      </Box>
    </section>
    </>
  );
}
