import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Box, Grid,
  Card, CardMedia, CardContent, Paper, Avatar, Chip,
  Typography, IconButton, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MessageIcon from '@mui/icons-material/Message';
import PhoneIcon from '@mui/icons-material/Phone';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import translateCategory from '../utils/translateCategory';
import AnnouncementLocationMap from './AnnouncementLocationMap.jsx';

/**
 * AnnouncementPreviewDialog — dialog partajat de previzualizare anunț
 *
 * Props:
 *   open           {boolean}   — vizibil/ascuns
 *   onClose        {function}  — callback la închidere
 *   title          {string}
 *   category       {string}
 *   description    {string}
 *   price          {string|number}
 *   imagePreviews  {string[]}  — array URL-uri imagini
 *   mainImagePreview {string}  — fallback imagine singulară
 *   contactPerson  {string}
 *   contactEmail   {string}
 *   contactPhone   {string}
 *   selectedLocalitate {string}
 *   selectedJudet  {string}
 *   onSubmit       {function}  — apelat la click pe butonul de publicare/salvare (omis = buton ascuns)
 *   submitLabel    {string}    — eticheta butonului de submit (default din i18n)
 */
export default function AnnouncementPreviewDialog({
  open,
  onClose,
  title,
  category,
  description,
  price,
  imagePreviews = [],
  mainImagePreview,
  contactPerson,
  contactEmail,
  contactPhone,
  selectedLocalitate,
  selectedJudet,
  onSubmit,
  submitLabel,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [imgFade, setImgFade] = useState(true);

  // Resetează la fiecare deschidere
  useEffect(() => {
    if (open) {
      setSelectedIdx(0);
      setImgFade(true);
    }
  }, [open]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setImgFade(false);
    setTimeout(() => {
      setSelectedIdx(i => (i > 0 ? i - 1 : imagePreviews.length - 1));
      setImgFade(true);
    }, 200);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setImgFade(false);
    setTimeout(() => {
      setSelectedIdx(i => (i < imagePreviews.length - 1 ? i + 1 : 0));
      setImgFade(true);
    }, 200);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
          color: (theme) => theme.palette.mode === 'dark' ? '#f5f5f5' : 'inherit',
          maxHeight: '92vh',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0,0,0,0.8)'
              : '0 20px 60px rgba(0,0,0,0.2)',
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0,0,0,0.5)',
        },
      }}
    >
      {/* ── Header ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 1.5,
        borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#2a2a2a' : '#e5e7eb'}`,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#fafafa',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={t('addAnnouncement.previewTitle')}
            size="small"
            sx={{
              backgroundColor: '#f51866', color: '#fff', fontWeight: 700,
              fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              borderRadius: 9999, height: 24,
            }}
          />
          <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#666' : '#9ca3af' }}>
            Acesta este aspectul anunțului tău după publicare
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#aaa' : '#666' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* ── Conținut ── */}
      <DialogContent sx={{ p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
        <Grid container spacing={4}>

          {/* === Coloana principală (8/12) === */}
          <Grid item xs={12} md={8}>

            {/* Carusel imagini */}
            <Card elevation={3} sx={{
              mb: 3, overflow: 'hidden', borderRadius: '12px',
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #8b8b8b' : '1px solid #121212',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.6)'
                  : '0 8px 32px rgba(45,67,97,0.08)',
            }}>
              <Box sx={{ position: 'relative', height: { xs: '58vw', sm: 380, md: 460 } }}>
                {imagePreviews.length > 0 ? (
                  <>
                    <CardMedia
                      component="img"
                      image={imagePreviews[selectedIdx] || imagePreviews[0]}
                      alt={t('addAnnouncement.preview.imageAlt')}
                      sx={{
                        width: '100%', height: '100%', objectFit: 'contain',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
                        opacity: imgFade ? 1 : 0,
                        transition: 'opacity 0.4s cubic-bezier(.4,0,.2,1)',
                      }}
                    />
                    {imagePreviews.length > 1 && (
                      <>
                        <IconButton onClick={handlePrev} sx={{
                          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)',
                          color: (theme) => theme.palette.mode === 'dark' ? '#ffabb7' : 'inherit',
                          '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : '#fff' },
                          boxShadow: 2,
                        }}>
                          <ChevronLeftIcon />
                        </IconButton>
                        <IconButton onClick={handleNext} sx={{
                          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.9)',
                          color: (theme) => theme.palette.mode === 'dark' ? '#ffabb7' : 'inherit',
                          '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : '#fff' },
                          boxShadow: 2,
                        }}>
                          <ChevronRightIcon />
                        </IconButton>
                        <Chip
                          label={`${selectedIdx + 1} / ${imagePreviews.length}`}
                          size="small"
                          sx={{ position: 'absolute', bottom: 16, right: 16, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff' }}
                        />
                      </>
                    )}
                  </>
                ) : mainImagePreview ? (
                  <CardMedia
                    component="img"
                    image={mainImagePreview}
                    alt={t('addAnnouncement.preview.imageAlt')}
                    sx={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
                    }}
                  />
                ) : (
                  <Box sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 1,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#282828' : '#f5f5f5',
                    color: (theme) => theme.palette.mode === 'dark' ? '#555' : '#999',
                  }}>
                    <FaCamera size={36} />
                    <Typography variant="body2">Nu există imagini</Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Card detalii */}
            <Card elevation={2} sx={{
              borderRadius: '12px',
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #8b8b8b' : '1px solid #121212',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0,0,0,0.6)'
                  : '0 8px 32px rgba(45,67,97,0.08)',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
            }}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>

                {/* Data + titlu + categorie + iconițe */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AccessTimeIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#888' : '#6b7280' }}>
                        {new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="h1" sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                      fontWeight: 700, mb: 2,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                      textAlign: 'center',
                    }}>
                      {title || '—'}
                    </Typography>
                    {category && (
                      <Chip
                        label={translateCategory(category, t)}
                        variant="outlined"
                        sx={{
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                          color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                          mb: 2, fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361' }}>
                      <FavoriteBorderIcon />
                    </IconButton>
                    <IconButton sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361' }}>
                      <ShareIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }} />

                {/* Descriere */}
                <Typography variant="h6" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', mb: 2, fontWeight: 600 }}>
                  {t('addAnnouncement.preview.description')}
                </Typography>
                <Typography variant="body1" sx={{
                  color: (theme) => theme.palette.mode === 'dark' ? '#f5f5f5' : '#2d3748',
                  lineHeight: 1.7, whiteSpace: 'pre-line',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                }}>
                  {description || '—'}
                </Typography>

                {/* Meta footer */}
                <Box sx={{
                  mt: 4, pt: 2.5,
                  borderTop: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(45,67,97,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, opacity: 0.75, letterSpacing: '.5px', color: (theme) => theme.palette.mode === 'dark' ? '#bbb' : '#6b7280' }}>ID:</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.9, color: (theme) => theme.palette.mode === 'dark' ? '#bbb' : '#6b7280' }}>——</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VisibilityIcon sx={{ fontSize: 16, color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', opacity: 0.85 }} />
                      <Typography variant="caption" sx={{ fontWeight: 500, color: (theme) => theme.palette.mode === 'dark' ? '#bbb' : '#6b7280' }}>0 vizualizări</Typography>
                    </Box>
                  </Box>
                  <Button size="small" disabled sx={{ color: '#e5533d !important', textTransform: 'none', fontWeight: 600, opacity: 0.5, fontSize: '.75rem' }}>
                    Raportează
                  </Button>
                </Box>

                {/* Preț */}
                {price && (
                  <>
                    <Divider sx={{ my: 3, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }} />
                    <Typography variant="h6" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', mb: 1, fontWeight: 600 }}>
                      Preț
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#e53e3e', fontWeight: 700 }}>
                      {price} RON
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* === Sidebar (4/12) === */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>

              {/* Card vânzător */}
              <Card elevation={2} sx={{
                mb: 3, borderRadius: '12px',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #8b8b8b' : '1px solid #121212',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0,0,0,0.6)'
                    : '0 8px 32px rgba(45,67,97,0.08)',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
              }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography variant="h6" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', mb: 3, fontWeight: 600 }}>
                    {t('addAnnouncement.preview.sellerInfo')}
                  </Typography>

                  {/* Avatar + nume */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      src={user?.avatar || undefined}
                      sx={{
                        width: 60, height: 60, mr: 2,
                        background: 'linear-gradient(135deg, #f51866 0%, #2D4361 100%)',
                        fontSize: '1.2rem', fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(45,67,97,0.2)',
                        border: (theme) => theme.palette.mode === 'dark' ? '3px solid rgba(245,24,102,0.3)' : '3px solid rgba(255,255,255,0.8)',
                      }}
                    >
                      {!user?.avatar && (contactPerson ? contactPerson[0]?.toUpperCase() : '?')}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: (theme) => theme.palette.mode === 'dark' ? '#f5f5f5' : '#2d3748' }}>
                        {contactPerson || '—'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#888' : '#9ca3af' }}>
                        nu există review-uri
                      </Typography>
                    </Box>
                  </Box>

                  {/* Persoana de contact + buton Evaluează */}
                  {contactPerson && (
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, color: (theme) => theme.palette.mode === 'dark' ? '#888' : '#9ca3af' }}>
                          {t('addAnnouncement.preview.contactPersonLabel')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, color: (theme) => theme.palette.mode === 'dark' ? '#f5f5f5' : '#2d3748' }}>
                          {contactPerson}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined" size="small" disabled
                        sx={{
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                          color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                          '&.Mui-disabled': {
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,24,102,0.4)' : 'rgba(45,67,97,0.4)',
                            color: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,24,102,0.5)' : 'rgba(45,67,97,0.4)',
                          },
                          textTransform: 'none', fontWeight: 600, px: 1.25, py: 0.5, ml: 2,
                        }}
                      >
                        Evaluează
                      </Button>
                    </Box>
                  )}

                  <Divider sx={{ mb: 3, borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }} />

                  {/* Butoane acțiuni */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained" fullWidth disabled
                      startIcon={<MessageIcon />}
                      sx={{
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                        '&.Mui-disabled': {
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,24,102,0.4)' : 'rgba(45,67,97,0.4)',
                          color: '#fff',
                        },
                        borderRadius: 2, py: 1.5,
                      }}
                    >
                      Trimite mesaj
                    </Button>

                    {/* Telefon mascat */}
                    <Paper elevation={1} sx={{
                      p: 2, borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
                      border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361', fontSize: 20 }} />
                          <Typography variant="body1" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit', letterSpacing: 2 }}>
                            {contactPhone ? 'xxx xxx xxx' : 'N/A'}
                          </Typography>
                        </Box>
                        {contactPhone && (
                          <Button size="small" disabled sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#f51866 !important' : '#2D4361 !important' }}>
                            Arată
                          </Button>
                        )}
                      </Box>
                    </Paper>

                    <Button
                      variant="outlined" fullWidth disabled
                      sx={{
                        borderColor: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                        color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#2D4361',
                        '&.Mui-disabled': {
                          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,24,102,0.4)' : 'rgba(45,67,97,0.4)',
                          color: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,24,102,0.4)' : 'rgba(45,67,97,0.4)',
                        },
                        borderRadius: 2, py: 1.5,
                      }}
                    >
                      Vizualizare profil
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Card locație */}
              {(selectedLocalitate || selectedJudet) && (
                <AnnouncementLocationMap
                  location={[selectedLocalitate, selectedJudet].filter(Boolean).join(', ')}
                  darkMode={theme.palette.mode === 'dark'}
                  accentColor={theme.palette.mode === 'dark' ? '#f51866' : '#2D4361'}
                  height={220}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions sx={{
        px: 3, py: 2, gap: 1.5,
        borderTop: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#2a2a2a' : '#e5e7eb'}`,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#fafafa',
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 9999, px: 3,
            borderColor: (theme) => theme.palette.mode === 'dark' ? '#444' : '#d1d5db',
            color: (theme) => theme.palette.mode === 'dark' ? '#ccc' : '#374151',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#666' : '#9ca3af',
            },
          }}
        >
          {t('common.close')}
        </Button>
        {onSubmit && (
          <Button
            onClick={() => { onClose(); onSubmit(); }}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: 9999, px: 4, fontWeight: 700,
              background: 'linear-gradient(90deg, #f51866 0%, #c0134f 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(245,24,102,0.38)',
              '&:hover': {
                background: 'linear-gradient(90deg, #d6134f 0%, #a81044 100%)',
                boxShadow: '0 6px 22px rgba(245,24,102,0.50)',
              },
            }}
          >
            {submitLabel || t('addAnnouncement.submitButton.create')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
