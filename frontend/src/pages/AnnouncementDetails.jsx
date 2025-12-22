/**
 * AnnouncementDetails
 * ------------------------------------------------------------
 * Pagina de detalii pentru un anunț.
 * Obiectiv: păstrăm comportamentul neschimbat și reorganizăm codul pentru lizibilitate.
 *
 * Structura logică a fișierului:
 *  - Imports (React, 3rd-party, componente interne, stiluri)
 *  - Componenta principală: state-uri, efecte, utilitare, handlere
 *  - Render helpers (funcții pure de afișare)
 *  - JSX (secțiuni clar marcate)
 *  - Dialoguri/Popups (chat, rating, zoom)
 *
 * Notă: Modificările sunt doar de documentare/comentarii. Nu am schimbat logica sau JSX-ul funcțional.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ImageZoomModal from '../components/ImageZoomModal';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Avatar,
  Button,
  IconButton,
  Box,
  Container,
  Grid,
  Paper,
  Divider,
  Tooltip,
  Fade,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import StarIcon from '@mui/icons-material/Star';
import apiClient from '../api/api';
import './AnnouncementDetails.css';
import AnnouncementLocationMap from '../components/AnnouncementLocationMap.jsx';
// Header and Footer are provided by the App.jsx route layout
import ChatPopup from '../components/ChatPopup';

export default function AnnouncementDetails() {
  // ========== Routing & Navigation ==========
  const { id } = useParams();
  const locationHook = useLocation();

  // ========== Local UI banners / loaders ==========
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false);
  const [bannerPhase, setBannerPhase] = useState('idle'); // idle | enter | shown | exit
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ========== Favorite ==========
  // Favorite logic (migrated to AuthContext). Fallback la localStorage pentru guest.
  const { favorites, toggleFavorite, user } = useAuth() || {};
  const [isFavorite, setIsFavorite] = useState(false); // local UI state
  
  // ========== Carousel ==========
  const [imgIndex, setImgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef();

  // ========== Modal Zoom ==========
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  
  // ========== Chat & Contact ==========
  const [showChat, setShowChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // ========== Rating dialog ==========
  const [rateOpen, setRateOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // ========== Seller profile & reviews ==========
  // Folosit pentru a afișa un scurt rezumat în cardul vânzătorului.
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerReviewsLoading, setSellerReviewsLoading] = useState(false);

  // ========== Rating handlers ==========
  const handleRateClick = (e) => {
    e?.stopPropagation();
    setRateOpen(true);
  };
  const handleRateClose = () => {
    setRateOpen(false);
    setRatingValue(5);
    setRatingComment('');
  };
  /**
   * Trimite evaluarea către backend și redirecționează către profilul public al vânzătorului.
   * Nu alterează comportamentul existent; doar docstring.
   */
  const handleRateSubmit = async () => {
    try {
      // Ensure we have the target user id
      const reviewedUserId = announcement?.user?._id || announcement?.user?.id;
      if (!reviewedUserId) {
        alert('Utilizatorul nu este disponibil pentru evaluare.');
        return;
      }

      // POST to backend reviews route. Backend expects { user, score, comment }
      const payload = { user: reviewedUserId, score: ratingValue, comment: ratingComment };
  const resp = await apiClient.post('/api/reviews', payload);
  console.log('Review POST response:', resp?.data);

  // Close dialog and navigate to the public profile page so the freshly posted review is visible
  handleRateClose();
  // Navigate carrying a small state so the profile page can show a confirmation message
  navigate(`/profil/${reviewedUserId}`, { state: { reviewPosted: true, reviewCreateResponse: resp?.data } });

    } catch (err) {
      console.error('Eroare la trimiterea recenziei:', err);
      // Provide user feedback
      if (err?.response?.data?.error) {
        alert(`Eroare: ${err.response.data.error}`);
      } else {
        alert('A apărut o eroare la trimiterea recenziei. Încearcă din nou.');
      }
    }
  };

  // ========== Effects: load seller public profile (cu recenzii) ==========
  useEffect(() => {
    let mounted = true;
    async function fetchSellerProfile() {
      try {
        if (!announcement?.user?._id) return;
        setSellerReviewsLoading(true);
        const res = await apiClient.get(`/api/users/profile/${announcement.user._id}`);
        if (!mounted) return;
        setSellerProfile(res.data);
      } catch (e) {
        console.error('Failed to load seller profile for reviews', e);
        if (mounted) setSellerProfile(null);
      } finally {
        if (mounted) setSellerReviewsLoading(false);
      }
    }
    fetchSellerProfile();
    return () => { mounted = false; };
  }, [announcement?.user?._id]);

  // ========== Render helper: sumar recenzii vânzător ==========
  const renderSellerReviewsSummary = () => {
    const reviews = sellerProfile?.reviews;
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">nu există review-uri</Typography>
      );
    }
    const avg = reviews.reduce((s, r) => s + Number(r.score || 0), 0) / reviews.length;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Rating value={avg} precision={0.1} readOnly size="small" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{avg.toFixed(1)}</Typography>
        <Typography variant="body2" color="text.secondary">({reviews.length} recenzii)</Typography>
      </Box>
    );
  };

  // ========== Dark mode helpers and accent palette ==========
  const [isDarkMode, setIsDarkMode] = useState(false);
  const getIsDarkMode = () => isDarkMode;
  const getAccentCss = () => (isDarkMode ? '#f51866' : '#355070');
  const getAccentHover = () => (isDarkMode ? '#fa4875' : '#406b92');

  // Tooltip simplu și centrat pentru butoanele de acțiune
  const getTooltipStyles = () => ({
    tooltip: {
      backgroundColor: getIsDarkMode() ? '#1a1a1a' : '#2c3e50',
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '8px 12px',
      borderRadius: '8px',
      boxShadow: getIsDarkMode() 
        ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
        : '0 4px 12px rgba(44, 62, 80, 0.3)'
    },
    arrow: {
      color: getIsDarkMode() ? '#1a1a1a' : '#2c3e50'
    }
  });

  // ========== Effects: sincronizare cu clasa globală dark-mode ==========
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const update = () => setIsDarkMode(body.classList.contains('dark-mode'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ========== Effects: încărcarea anunțului + banner "updated" ==========
  useEffect(() => {
    async function fetchAnnouncement() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/announcements/${id}`);
        setAnnouncement(res.data);
      } catch (e) {
        setAnnouncement(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncement();
    // Detectare param updated
    try {
      let shouldShow = false;
      const params = new URLSearchParams(window.location.search);
      if (params.get('updated') === '1') {
        shouldShow = true;
      }
      if (locationHook.state?.updated) {
        shouldShow = true;
      }
      if (shouldShow) {
        setShowUpdatedBanner(true);
        setBannerPhase('enter');
        // finalize enter -> shown
        setTimeout(() => setBannerPhase('shown'), 30);
        // start exit after 6s
        setTimeout(() => {
          setBannerPhase('exit');
          // unmount after exit animation
          setTimeout(() => setShowUpdatedBanner(false), 450);
        }, 6000);
        // Curățare parametru 'updated' din URL pentru a evita reapariția la refresh
        if (params.get('updated') === '1' && window.history.replaceState) {
          params.delete('updated');
          const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
          window.history.replaceState({ ...window.history.state, updated: false }, '', newUrl);
        }
      }
    } catch { /* ignore */ }
  }, [id]);

  // ========== Effects: sincronizare favorite ==========
  useEffect(() => {
    if (!announcement?._id) return;
    if (user) {
      setIsFavorite(favorites?.includes(announcement._id));
    } else {
      // guest fallback: still read localStorage legacy key
      const userId = localStorage.getItem('userId');
      const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
      const raw = localStorage.getItem(FAVORITES_KEY);
      let isFav = false;
      try {
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          isFav = parsed.includes(announcement._id);
        } else if (Array.isArray(parsed)) {
          isFav = parsed.some(item => item.id === announcement._id);
        }
      } catch { /* ignore */ }
      setIsFavorite(isFav);
    }
  }, [announcement?._id, favorites, user]);

  // ========== Action handlers ==========
  const handleToggleFavorite = () => {
    if (!announcement?._id) return;
    if (user) {
      toggleFavorite?.(announcement._id);
      setIsFavorite(prev => !prev);
    } else {
      // guest localStorage handling unchanged for now
      const userId = localStorage.getItem('userId');
      const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
      const raw = localStorage.getItem(FAVORITES_KEY);
      let list = [];
      try {
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          list = parsed.map(id => ({ id, addedAt: Date.now() }));
        } else if (Array.isArray(parsed)) {
          list = parsed;
        }
      } catch { list = []; }
      const exists = list.some(item => item.id === announcement._id);
      const updated = exists ? list.filter(i => i.id !== announcement._id) : [...list, { id: announcement._id, addedAt: Date.now() }];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setIsFavorite(!exists);
      // Notifică header-ul (și alte componente) că s-a schimbat numărul de favorite
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('favorites:updated'));
      }
    }
  };

  /**
   * Share: încearcă Web Share API, altfel copiază link-ul în clipboard.
   */
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: announcement.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // ========== Utilitare de format ==========
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.firstName ? user.firstName[0].toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <>
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={60} sx={{ mt: 2 }} />
              <Skeleton variant="text" height={40} />
              <Skeleton variant="text" height={120} sx={{ mt: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Container>
      </>
    );
  }

  if (!announcement) {
    return (
      <>
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Anunțul nu a fost găsit
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Înapoi la pagina principală
          </Button>
        </Container>
      </>
    );
  }

  const images = announcement.images || [];
  const showArrows = images.length > 1;
  /** Returnează src pentru imagine (acceptă http / uploads). */
  const getImageSrc = (img) =>
    img.startsWith('http') || img.startsWith('/uploads')
      ? img
      : `/uploads/${img.replace(/^.*[\\/]/, '')}`;

  // Pentru modal zoom
  const imagesSrc = images.map(getImageSrc);
  const handleOpenZoom = (idx) => {
    setZoomIndex(idx);
    setZoomOpen(true);
  };
  const handleCloseZoom = () => setZoomOpen(false);
  const handlePrevZoom = () => setZoomIndex(i => i > 0 ? i - 1 : imagesSrc.length - 1);
  const handleNextZoom = () => setZoomIndex(i => i < imagesSrc.length - 1 ? i + 1 : 0);

  const handlePrev = (e) => {
    e.stopPropagation();
    setFade(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setImgIndex(idx => idx > 0 ? idx - 1 : images.length - 1);
      setFade(true);
    }, 200);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setFade(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setImgIndex(idx => idx < images.length - 1 ? idx + 1 : 0);
      setFade(true);
    }, 200);
  };

  const loggedUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const isOwnAnnouncement = loggedUserId && announcement.user._id === loggedUserId;

  const handleChatClick = () => {
    console.log('🔍 Chat button clicked:', {
      loggedUserId,
      isOwnAnnouncement,
      announcementUserId: announcement.user._id,
      showChat
    });
  // Deschide chat-ul fără a forța redirecționarea la login; componenta ChatPopup gestionează lipsa autentificării
  console.log('✅ Opening chat popup');
    setShowChat(true);
  };

  return (
    <>
      <Container
        className="announcement-details-page"
        maxWidth="lg"
        sx={{
          // Use padding for top spacing on mobile to avoid two-tone background bands
          pt: { xs: 'calc(env(safe-area-inset-top, 0px) + 24px)', md: 10 },
          mt: 0,
          mb: 4,
          minHeight: '100vh',
          pb: { xs: 'calc(96px + env(safe-area-inset-bottom))', md: 0 }
        }}
      >
        {/* ========== Updated banner (apare după editare reușită) ========== */}
        {showUpdatedBanner && (
          <div
            className={`updated-banner ${bannerPhase === 'enter' || bannerPhase === 'shown' ? 'enter' : ''} ${bannerPhase === 'exit' ? 'exit' : ''}`}
            style={{
              background: getIsDarkMode() ? 'linear-gradient(135deg,#195a32,#237f45)' : 'linear-gradient(135deg,#38a169,#48bb78)',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: '14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 14px -2px rgba(0,0,0,0.18)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(4px)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:'1rem'}}>Anunț actualizat</div>
              <div style={{opacity:.9,fontSize:'.9rem',marginTop:2}}>Modificările au fost salvate și sunt vizibile public.</div>
            </div>
            <button
              onClick={() => {
                setBannerPhase('exit');
                setTimeout(() => setShowUpdatedBanner(false), 450);
              }}
              aria-label="Închide"
              style={{
                background:'rgba(255,255,255,0.18)',
                border:'none',
                color:'#fff',
                cursor:'pointer',
                width:34,
                height:34,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                borderRadius:10,
                fontSize:18,
                lineHeight:1,
                fontWeight:600
              }}
            >×</button>
          </div>
        )}
        {/* ========== Back Button ========== */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3, 
            color: getAccentCss(),
            display: { xs: 'inline-flex', sm: 'inline-flex', md: 'none' },
            '&:hover': { bgcolor: getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(53, 80, 112, 0.08)' }
          }}
        >
          Înapoi
        </Button>

        <Grid container spacing={4}>
          {/* ========== Main Content ========== */}
          <Grid item xs={12} md={8} order={{ xs: 1, md: 1 }}>
            {/* Image Carousel */}
            <Card className="seller-card" elevation={3} sx={{ mb: 3, overflow: 'hidden', mt: { xs: 0, md: 4 } }}>
              <Box sx={{ position: 'relative', height: { xs: '58vw', sm: '60vw', md: 500 } }}>
                {images.length > 0 ? (
                  <>
                    <CardMedia
                      component="img"
                      height={undefined}
                      image={getImageSrc(images[imgIndex])}
                      alt={`Imagine ${imgIndex + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        bgcolor: getIsDarkMode() ? '#121212' : '#ffffff',
                        opacity: fade ? 1 : 0,
                        transition: 'opacity 0.4s cubic-bezier(.4,0,.2,1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenZoom(imgIndex)}
                    />
                    {showArrows && (
                      <>
                        <IconButton
                          onClick={handlePrev}
                          sx={{
                            position: 'absolute',
                            left: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: getIsDarkMode() ? '#282828' : 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: getIsDarkMode() ? '#3f3f3f' : 'rgba(255,255,255,1)' },
                            boxShadow: 2
                          }}
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                        <IconButton
                          onClick={handleNext}
                          sx={{
                            position: 'absolute',
                            right: 16,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: getIsDarkMode() ? '#282828' : 'rgba(255,255,255,0.9)',
                            '&:hover': { bgcolor: getIsDarkMode() ? '#3f3f3f' : 'rgba(255,255,255,1)' },
                            boxShadow: 2
                          }}
                        >
                          <ChevronRightIcon />
                        </IconButton>
                        <Chip
                          label={`${imgIndex + 1} / ${images.length}`}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white'
                          }}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      height: 500,
                      bgcolor: getIsDarkMode() ? '#282828' : '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getIsDarkMode() ? '#f5f5f5' : '#999'
                    }}
                  >
                    <Typography variant="h6">Nu există imagini disponibile</Typography>
                  </Box>
                )}
              </Box>
            </Card>

            {/* Details card */}

            <Card className="seller-card" elevation={2}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {/* Header with actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AccessTimeIcon sx={{ color: getAccentCss(), fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        Postat {formatDate(announcement.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="h1" sx={{ color: getAccentCss(), fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }, textAlign: 'center' }}>
                      {announcement.title}
                    </Typography>
                    {announcement.category && (
                      <Chip
                        label={announcement.category}
                        variant="outlined"
                        sx={{
                          borderColor: getAccentCss(),
                          color: getAccentCss(),
                          mb: 2
                        }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip 
                      title={isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
                      placement="right"
                      arrow
                      enterDelay={300}
                      leaveDelay={200}
                      PopperProps={{ strategy: 'fixed' }}
                      componentsProps={{
                        tooltip: { sx: getTooltipStyles().tooltip },
                        arrow: { sx: getTooltipStyles().arrow }
                      }}
                    >
                      <IconButton
                        onClick={handleToggleFavorite}
                        sx={{
                          color: isFavorite ? (getIsDarkMode() ? '#f51866' : '#e53e3e') : getAccentCss(),
                          '&:hover': {
                            bgcolor: isFavorite 
                              ? (getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(229, 62, 62, 0.08)')
                              : (getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(53, 80, 112, 0.08)'),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip 
                      title="Partajează"
                      placement="right"
                      arrow
                      enterDelay={300}
                      leaveDelay={200}
                      PopperProps={{ strategy: 'fixed' }}
                      componentsProps={{
                        tooltip: { sx: getTooltipStyles().tooltip },
                        arrow: { sx: getTooltipStyles().arrow }
                      }}
                    >
                      <IconButton
                        onClick={handleShare}
                        sx={{
                          color: getAccentCss(),
                          '&:hover': {
                            bgcolor: getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(53, 80, 112, 0.08)',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Description */}
                <Typography variant="h6" sx={{ color: getAccentCss(), mb: 2, fontWeight: 600 }}>
                  Descriere
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: getIsDarkMode() ? '#f5f5f5' : '#2d3748',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    fontSize: { xs: '1rem', md: '1.1rem' }
                  }}
                >
                  {announcement.description}
                </Typography>

                {/* Footer meta info under description */}
                <Box
                  className="announcement-meta-footer"
                  sx={{
                    mt: 4,
                    pt: 2.5,
                    borderTop: '1px solid',
                    borderColor: getIsDarkMode() ? 'rgba(255,255,255,0.12)' : 'rgba(53,80,112,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: { xs: 1, sm: 3 },
                    justifyContent: 'space-between',
                    flexWrap: { xs: 'nowrap', sm: 'wrap' },
                    minHeight: { xs: '36px', sm: 'auto' }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1.5, sm: 3 }, 
                    flexWrap: 'nowrap',
                    minWidth: 0,
                    flex: '1 1 auto'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600, 
                        letterSpacing: '.5px', 
                        opacity: .75,
                        fontSize: { xs: '.65rem', sm: '.75rem' }
                      }}>
                        ID:
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        fontFamily: 'monospace', 
                        fontSize: { xs: '.65rem', sm: '.75rem' }, 
                        opacity: .9 
                      }}>
                        {announcement._id?.slice(-8) || '—'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5 }, flexShrink: 0 }}>
                      <VisibilityIcon sx={{ 
                        fontSize: { xs: 14, sm: 18 }, 
                        color: getAccentCss(), 
                        opacity: .85 
                      }} />
                      <Typography variant="caption" sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '.65rem', sm: '.75rem' }
                      }}>
                        {typeof announcement.views === 'number' ? announcement.views : 0} vizualizări
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => alert('Funcționalitatea de raportare va fi disponibilă în curând.')}
                    startIcon={
                      <svg xmlns="http://www.w3.org/2000/svg" width={window.innerWidth < 600 ? "12" : "16"} height={window.innerWidth < 600 ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16l-6 8 6 8H4z"/></svg>
                    }
                    sx={{
                      color: '#e5533d',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: getIsDarkMode() ? 'rgba(229,83,61,0.08)' : 'rgba(229,83,61,0.08)' },
                      fontSize: { xs: '.65rem', sm: '.75rem' },
                      letterSpacing: '.5px',
                      minWidth: { xs: '70px', sm: 'auto' },
                      px: { xs: 1, sm: 1.5 },
                      py: { xs: 0.5, sm: 0.75 },
                      flexShrink: 0
                    }}
                  >
                    Raportează
                  </Button>
                </Box>

                {announcement.price && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ color: getAccentCss(), mb: 1, fontWeight: 600 }}>
                      Preț
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#e53e3e', fontWeight: 700 }}>
                      {announcement.price} RON
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ========== Seller Information Sidebar + Location Map ========== */}
          <Grid item xs={12} md={4} order={{ xs: 2, md: 2 }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 120 } }}>
            <Card className="seller-card" elevation={2} sx={{ mb: 3, mt: { xs: 0, md: 4 } }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ color: getAccentCss(), mb: 3, fontWeight: 600 }}>
                  Informații vânzător
                </Typography>

                {/* Seller Avatar and Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, cursor: 'pointer' }} onClick={() => navigate(`/profil/${announcement.user._id}`)}>
                  <Avatar
                    src={announcement.user.avatar}
                    sx={{
                      width: 60,
                      height: 60,
                      mr: 2,
                      bgcolor: getAccentCss(),
                      fontSize: '1.2rem',
                      fontWeight: 600
                    }}
                  >
                    {!announcement.user.avatar && getInitials(announcement.user)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: getIsDarkMode() ? '#f5f5f5' : '#2d3748' }}>
                      {announcement.user.firstName} {announcement.user.lastName}
                    </Typography>
                    {/* Show seller reviews summary instead of "Membru din" */}
                    {sellerReviewsLoading ? (
                      <Typography variant="body2" color="text.secondary">Se încarcă...</Typography>
                    ) : (
                      renderSellerReviewsSummary()
                    )}
                  </Box>
                </Box>

                {/* Contact Person */}
                {announcement.contactPerson && !isOwnAnnouncement && (
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Persoană de contact:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {announcement.contactPerson}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<StarIcon />}
                        onClick={handleRateClick}
                        sx={{
                          borderColor: getAccentCss(),
                          color: getAccentCss(),
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 1.25,
                          py: 0.5
                        }}
                      >
                        Evaluează
                      </Button>
                    </Box>
                  </Box>
                )}

                <Divider sx={{ mb: 3 }} />

                {/* Action Buttons */}
                {!isOwnAnnouncement && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<MessageIcon />}
                      onClick={handleChatClick}
                      fullWidth
                      sx={{
                        bgcolor: getAccentCss(),
                        '&:hover': { bgcolor: getAccentHover() },
                        borderRadius: 2,
                        py: 1.5
                      }}
                    >
                      Trimite mesaj
                    </Button>

                    {/* Phone Contact */}
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2, bgcolor: getIsDarkMode() ? '#121212' : '#ffffff', border: getIsDarkMode() ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.12)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ color: getAccentCss(), fontSize: 20 }} />
                          <Typography variant="body1" sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit' }}>
                            {showPhone 
                              ? (announcement.contactPhone || announcement.user.phone || 'N/A')
                              : 'xxx xxx xxx'
                            }
                          </Typography>
                        </Box>
                        {!showPhone && (
                          <Button
                            size="small"
                            onClick={() => setShowPhone(true)}
                            sx={{ color: getAccentCss() }}
                          >
                            Arată
                          </Button>
                        )}
                      </Box>
                    </Paper>

                    {/* Vizualizare profil (în locul email-ului) */}
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/profil/${announcement.user._id}`)}
                      fullWidth
                      sx={{
                        borderColor: getAccentCss(),
                        color: getAccentCss(),
                        borderRadius: 2,
                        py: 1.5,
                        '&:hover': { borderColor: getAccentHover(), bgcolor: 'transparent' }
                      }}
                    >
                      Vizualizare profil
                    </Button>
                  </Box>
                )}

                {isOwnAnnouncement && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Acesta este anunțul tău
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            {/* Map Section - va sta imediat sub card */}
            <AnnouncementLocationMap
              location={announcement.location}
              darkMode={getIsDarkMode()}
              accentColor={getAccentCss()}
            />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* ========== Chat Popup ========== */}
      {showChat && !isOwnAnnouncement && (
        <ChatPopup
          open={showChat}
          onClose={() => {
            console.log('🔄 Closing chat popup');
            setShowChat(false);
          }}
          announcement={{
            id: announcement._id,
            _id: announcement._id,
            title: announcement.title,
            price: announcement.price,
            images: announcement.images
          }}
          seller={announcement.user}
          userId={loggedUserId}
          userRole="cumparator"
        />
      )}

      {/* ========== Rating Dialog ========== */}
      <Dialog
        open={rateOpen}
        onClose={handleRateClose}
        fullWidth
        maxWidth="sm"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            backgroundColor: getIsDarkMode() ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'
          }
        }}
        PaperProps={{
          sx: {
            bgcolor: getIsDarkMode() ? '#121212' : '#ffffff',
            color: getIsDarkMode() ? '#f5f5f5' : 'inherit',
            borderRadius: 2,
            boxShadow: getIsDarkMode() ? '0 10px 30px rgba(0,0,0,0.6)' : undefined,
            fontFamily: "'Poppins', sans-serif !important"
          }
        }}
      >
        <DialogTitle sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>Evaluează utilizatorul</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Rating
              name="rating"
              value={ratingValue}
              onChange={(e, v) => setRatingValue(v)}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#faaf00'
                },
                '& .MuiRating-iconEmpty': {
                  color: getIsDarkMode() ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)'
                }
              }}
            />
            <Typography variant="body2" sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>{ratingValue}.0</Typography>
          </Box>
          <TextField
            label="Comentariu (opțional)"
            fullWidth
            multiline
            minRows={3}
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            sx={{
              '& .MuiInputBase-input': {
                color: getIsDarkMode() ? '#ffffff' : '#374151'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: getIsDarkMode() ? '#ffffff' : '#d1d5db'
                },
                '&:hover fieldset': {
                  borderColor: getIsDarkMode() ? '#ffffff' : '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: getIsDarkMode() ? '#ffffff' : '#9ca3af'
                }
              },
              '& .MuiInputLabel-root': {
                color: getIsDarkMode() ? '#ffffff' : '#6b7280'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRateClose} sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>Anulează</Button>
          <Button variant="contained" onClick={handleRateSubmit} sx={{ bgcolor: getAccentCss(), '&:hover': { bgcolor: getAccentHover() }, color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>Trimite</Button>
        </DialogActions>
      </Dialog>

      {/* ========== Image Zoom Modal ========== */}
      {zoomOpen && (
        <ImageZoomModal
          open={zoomOpen}
          images={imagesSrc}
          index={zoomIndex}
          onClose={handleCloseZoom}
          onPrev={handlePrevZoom}
          onNext={handleNextZoom}
        />
      )}

      {/* Debug info (păstrat pentru dezvoltare) */}
      {console.log('🎯 ChatPopup render conditions:', {
        showChat,
        loggedUserId: !!loggedUserId,
        isOwnAnnouncement,
      })}
      
    </>
  );
}