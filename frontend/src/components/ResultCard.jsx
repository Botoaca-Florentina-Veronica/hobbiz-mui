import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  FavoriteBorder,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import translateCategory from '../utils/translateCategory';

/**
 * Reusable announcement card used in both the popular carousel and the search
 * results grid. Layout adapts via the `layout` prop ("carousel" | "grid").
 *
 * In "carousel" mode the card has fixed width/height (220×270 on lg) so it can
 * sit inside a horizontal scroll container. In "grid" mode it stretches to
 * fill its parent column (`width: 100%`) and uses flexible height.
 */
export default function ResultCard({
  a,
  layout = 'grid',
  isDarkMode,
  accent,
  formatRoDate,
  t,
  navigate,
  priceLabel = '',
}) {
  let createdAtLabel = null;
  try {
    const createdAt = a?.createdAt
      ? new Date(a.createdAt)
      : (a?._id ? new Date(parseInt(String(a._id).substring(0, 8), 16) * 1000) : null);
    if (createdAt && !isNaN(createdAt.getTime())) {
      createdAtLabel = formatRoDate(createdAt);
    }
  } catch (_) { /* noop */ }

  const isCarousel = layout === 'carousel';

  const widthSx = isCarousel ? { xs: '100%', lg: 220 } : '100%';
  const minWidthSx = isCarousel ? { lg: 220 } : 'auto';
  const maxWidthSx = isCarousel ? { lg: 220 } : 'none';
  const heightSx = isCarousel ? { xs: 260, sm: 280, md: 300, lg: 270 } : 'auto';
  const imageHeightSx = isCarousel
    ? { xs: 155, sm: 165, md: 175, lg: 160 }
    : { xs: 170, sm: 180, md: 190 };
  const contentHeightSx = isCarousel
    ? { xs: 100, sm: 110, md: 110, lg: 110 }
    : 'auto';

  return (
    <Card
      onClick={() => a?._id && navigate(`/announcement/${a._id}`)}
      sx={{
        width: widthSx,
        minWidth: minWidthSx,
        maxWidth: maxWidthSx,
        height: heightSx,
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        background: isDarkMode
          ? 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isDarkMode
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(0,0,0,0.06)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-6px) scale(1.01)',
          boxShadow: isDarkMode
            ? `0 20px 60px rgba(245, 24, 102, 0.25)`
            : `0 20px 40px rgba(26, 49, 78, 0.15)`,
          border: isDarkMode
            ? '1px solid rgba(245, 24, 102, 0.3)'
            : '1px solid rgba(26, 49, 78, 0.2)',
          '& .card-image': { transform: 'scale(1.06)' },
          '& .overlay-gradient': { opacity: 0.7 },
        },
      }}
    >
      <Box sx={{
        position: 'relative',
        height: imageHeightSx,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        flexShrink: 0,
      }}>
        {a?.images && a.images[0] ? (
          <>
            <Box
              component="img"
              className="card-image"
              src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                ? a.images[0]
                : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
              alt={a.title || 'anunț'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
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
                pointerEvents: 'none',
              }}
            />
          </>
        ) : (
          <Box sx={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: { xs: '0.9rem', md: '1rem' },
            fontWeight: 500,
          }}>
            Fără imagine
          </Box>
        )}

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
              '& .MuiChip-icon': { color: 'white', marginLeft: '4px' },
              '& .MuiChip-label': { px: 1 },
            }}
          />
        )}

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
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          />
        )}
      </Box>

      <CardContent sx={{
        p: { xs: 1.5, sm: 2, md: 2 },
        height: contentHeightSx,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
      }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem', lg: '1.1rem' },
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: isDarkMode ? '#ffffff' : '#1a1a1a',
            mb: 1,
            letterSpacing: '-0.01em',
          }}
        >
          {a.title || 'Anunț fără titlu'}
        </Typography>

        {priceLabel ? (
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              color: accent,
              letterSpacing: '-0.2px',
              mb: 0.6,
            }}
          >
            {priceLabel}
          </Typography>
        ) : null}

        <Stack spacing={0.6}>
          {a.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <LocationOn sx={{ fontSize: { xs: 15, md: 17 }, color: accent, flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? '#bbb' : '#666',
                  fontSize: { xs: '0.78rem', md: '0.82rem' },
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {a.location}
              </Typography>
            </Box>
          )}

          {createdAtLabel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <AccessTime sx={{ fontSize: { xs: 14, md: 16 }, color: isDarkMode ? '#888' : '#999', flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? '#888' : '#999',
                  fontSize: { xs: '0.72rem', md: '0.78rem' },
                  fontWeight: 400,
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
}
