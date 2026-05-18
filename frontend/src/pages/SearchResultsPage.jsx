import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Close,
  SearchOff,
  ArrowBack,
} from '@mui/icons-material';
import { searchAnnouncements } from '../api/api';
import ResultCard from '../components/ResultCard';
import './SearchResultsPage.css';

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const locale = (i18n?.language || 'ro').slice(0, 2);

  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
  const accent = isDarkMode ? '#f51866' : '#1A314E';
  const accentHover = isDarkMode ? '#d01456' : '#0f2237';

  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortMode, setSortMode] = useState('relevance');

  // Re-render on dark-mode toggle
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Parse query from URL — accept both ?q= and the legacy ?search= for safety
  const params = new URLSearchParams(location.search);
  const query = (params.get('q') || params.get('search') || '').trim();
  const locationParam = params.get('location') || undefined;

  // Localized helpers
  const formatRoDate = (date) => {
    try {
      const dateLocale = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'ro-RO';
      return date.toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const formatPrice = (price) => {
    const n = parseFloat(price);
    if (Number.isNaN(n) || price === undefined || price === null || price === '') return '';
    if (n === 0) {
      return locale === 'en' ? 'Free' : locale === 'es' ? 'Gratis' : 'Gratuit';
    }
    const numFormatter = locale === 'en' ? 'en-GB' : locale === 'es' ? 'es-ES' : 'ro-RO';
    try {
      return `${n.toLocaleString(numFormatter)} RON`;
    } catch {
      return `${n} RON`;
    }
  };

  // Fetch results whenever the query changes
  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setResults([]);
    setSortMode('relevance');

    searchAnnouncements(query, controller.signal, locationParam)
      .then(res => {
        if (controller.signal.aborted) return;
        setResults(res.data || []);
        setIsSearching(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Eroare la căutarea anunțurilor:', err);
        setResults([]);
        setIsSearching(false);
        if (typeof window.showToast === 'function') {
          window.showToast(t('content.searchError'), 'error', 4000);
        }
      });

    return () => controller.abort();
  }, [query, locationParam, t]);

  // Scroll to top when navigating to this page (or query changes)
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
  }, [query]);

  // Client-side sort
  const sortedResults = useMemo(() => {
    if (!results.length) return results;
    const arr = [...results];
    switch (sortMode) {
      case 'newest':
        return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'oldest':
        return arr.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      case 'priceAsc':
        return arr.sort((a, b) => (parseFloat(a.price) || Infinity) - (parseFloat(b.price) || Infinity));
      case 'priceDesc':
        return arr.sort((a, b) => (parseFloat(b.price) || -Infinity) - (parseFloat(a.price) || -Infinity));
      case 'relevance':
      default:
        return arr;
    }
  }, [results, sortMode]);

  const sortOptions = useMemo(() => ([
    { key: 'relevance', label: t('content.sortRelevance') },
    { key: 'newest',    label: t('content.sortNewest') },
    { key: 'oldest',    label: t('content.sortOldest') },
    { key: 'priceAsc',  label: t('content.sortPriceAsc') },
    { key: 'priceDesc', label: t('content.sortPriceDesc') },
  ]), [t]);

  const handleClearSearch = () => {
    navigate('/', { replace: true });
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  // Header headline based on state
  const headline = isSearching
    ? t('content.searching')
    : sortedResults.length > 0
      ? t('content.searchResultsCount', { count: sortedResults.length })
      : t('content.noResultsTitle');

  return (
    <main className="search-results-page" data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* ====== Sticky header bar ====== */}
      <Box className="search-results-headerbar" sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: isDarkMode ? 'rgba(18,18,18,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <Box sx={{
          maxWidth: '1200px',
          margin: '0 auto',
          px: { xs: 2, md: 3 },
          py: { xs: 1.6, md: 2.2 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.2, md: 1.6 },
        }}>
          <Box
            component="button"
            type="button"
            onClick={handleBack}
            aria-label={t('search.back') || 'Înapoi'}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: isDarkMode ? '#eceeef' : '#1A314E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease, transform 0.12s ease',
              '&:hover': {
                background: isDarkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
              },
              '&:active': { transform: 'translateY(1px)' },
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.45rem' },
                lineHeight: 1.15,
                letterSpacing: '-0.4px',
                color: isDarkMode ? '#ffffff' : '#0e1525',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {headline}
            </Typography>
            {query && (
              <Typography
                sx={{
                  color: isDarkMode ? '#aaa' : '#5A6473',
                  fontSize: { xs: '0.78rem', md: '0.9rem' },
                  fontWeight: 500,
                  mt: 0.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t('content.resultsFor')}{' '}
                <Box component="span" sx={{ color: accent, fontWeight: 700 }}>&ldquo;{query}&rdquo;</Box>
              </Typography>
            )}
          </Box>

          {query && (
            <Box
              component="button"
              type="button"
              onClick={handleClearSearch}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                background: isDarkMode ? 'rgba(245,24,102,0.12)' : 'rgba(26,49,78,0.07)',
                color: accent,
                border: `1px solid ${isDarkMode ? 'rgba(245,24,102,0.30)' : 'rgba(26,49,78,0.15)'}`,
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: { xs: '0.78rem', md: '0.88rem' },
                fontFamily: 'inherit',
                padding: { xs: '6px 10px', md: '8px 14px' },
                transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.12s ease',
                flexShrink: 0,
                '&:hover': {
                  background: isDarkMode ? 'rgba(245,24,102,0.20)' : 'rgba(26,49,78,0.12)',
                  borderColor: isDarkMode ? 'rgba(245,24,102,0.55)' : 'rgba(26,49,78,0.30)',
                },
                '&:active': { transform: 'translateY(1px)' },
              }}
            >
              <Close sx={{ fontSize: 16 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {t('content.clearSearch')}
              </Box>
            </Box>
          )}
        </Box>

        {/* Sort chips row */}
        {!isSearching && sortedResults.length > 0 && (
          <Box sx={{
            maxWidth: '1200px',
            margin: '0 auto',
            px: { xs: 2, md: 3 },
            pb: { xs: 1.2, md: 1.6 },
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}>
            {sortOptions.map(opt => {
              const active = sortMode === opt.key;
              return (
                <Chip
                  key={opt.key}
                  label={opt.label}
                  onClick={() => setSortMode(opt.key)}
                  sx={{
                    background: active ? accent : (isDarkMode ? '#1f1f1f' : '#F2F4F7'),
                    color: active ? '#ffffff' : (isDarkMode ? '#eceeef' : '#1A314E'),
                    border: active ? 'none' : `1px solid ${isDarkMode ? '#2f2f2f' : '#E5E7EB'}`,
                    fontWeight: 600,
                    fontSize: { xs: '0.78rem', md: '0.85rem' },
                    height: { xs: 30, md: 32 },
                    px: 0.5,
                    transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                    flexShrink: 0,
                    '&:hover': {
                      background: active ? accentHover : (isDarkMode ? '#262626' : '#E8EBF0'),
                    },
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {/* ====== Body ====== */}
      <Box sx={{
        maxWidth: '1200px',
        margin: '0 auto',
        px: { xs: 2, md: 3 },
        pt: { xs: 2.5, md: 4 },
        pb: { xs: 6, md: 8 },
      }}>
        {isSearching ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, md: 3 },
          }}>
            {[...Array(8)].map((_, index) => (
              <Card key={index} sx={{
                borderRadius: 4,
                overflow: 'hidden',
                background: isDarkMode
                  ? 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)'
                  : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0,0,0,0.4)'
                  : '0 8px 32px rgba(0,0,0,0.06)',
                border: isDarkMode ? '1px solid #2a2a2a' : 'none',
              }}>
                <Skeleton variant="rectangular" sx={{
                  height: { xs: 170, sm: 180, md: 190 },
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',
                }} />
                <CardContent sx={{ p: 2 }}>
                  <Skeleton variant="text" height={26} sx={{ mb: 1, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }} />
                  <Skeleton variant="text" height={20} width="60%" sx={{ mb: 0.8, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }} />
                  <Skeleton variant="text" height={16} width="40%" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : sortedResults.length > 0 ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, md: 3 },
          }}>
            {sortedResults.map((a, index) => (
              <ResultCard
                key={a._id || index}
                a={a}
                layout="grid"
                isDarkMode={isDarkMode}
                accent={accent}
                formatRoDate={formatRoDate}
                t={t}
                navigate={navigate}
                priceLabel={formatPrice(a.price)}
              />
            ))}
          </Box>
        ) : (
          // Empty state
          <Box sx={{
            textAlign: 'center',
            py: { xs: 5, md: 8 },
            maxWidth: 460,
            margin: '0 auto',
          }}>
            <Box sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: isDarkMode ? 'rgba(245,24,102,0.10)' : 'rgba(26,49,78,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <SearchOff sx={{ fontSize: 44, color: accent }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.2rem', md: '1.4rem' },
                color: isDarkMode ? '#ffffff' : '#0e1525',
                letterSpacing: '-0.4px',
                mb: 1,
              }}
            >
              {t('content.noResultsTitle')}
            </Typography>
            <Typography sx={{
              color: isDarkMode ? '#aaa' : '#5A6473',
              fontSize: { xs: '0.92rem', md: '1rem' },
              lineHeight: 1.5,
              mb: 3,
            }}>
              {t('content.noResultsHint')}
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={handleClearSearch}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.7,
                background: accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.92rem',
                fontFamily: 'inherit',
                padding: '10px 20px',
                transition: 'background 0.2s ease, transform 0.12s ease, box-shadow 0.2s ease',
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                '&:hover': { background: accentHover, boxShadow: '0 10px 28px rgba(0,0,0,0.18)' },
                '&:active': { transform: 'translateY(1px)' },
              }}
            >
              <Close sx={{ fontSize: 18 }} />
              {t('content.clearSearch')}
            </Box>
          </Box>
        )}
      </Box>
    </main>
  );
}
