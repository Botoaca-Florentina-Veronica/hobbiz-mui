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
  Rating,
  MenuItem
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.js';
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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import apiClient from '../api/api';
import { createAnnouncementReport } from '../api/api';
import Toast from '../components/Toast';
import './AnnouncementDetails.css';
import AnnouncementLocationMap from '../components/AnnouncementLocationMap.jsx';
import translateCategory from '../utils/translateCategory';
import { resolveMediaUrl } from '../utils/media';
// Header and Footer are provided by the App.jsx route layout
import ChatPopup from '../components/ChatPopup';
import { getEffectiveViewportWidth } from '../utils/devicePatch';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container sx={{ mt: 12, mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>{i18n.t('announcementDetails.errorBoundary.message')}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom style={{ marginBottom: 12 }}>{this.state.error?.message}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>{i18n.t('announcementDetails.errorBoundary.reload')}</Button>
        </Container>
      );
    }
    return this.props.children;
  }
}

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
  const [showLoginToast, setShowLoginToast] = useState(false);
  
  // ========== Carousel ==========
  const [imgIndex, setImgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef();

  // ========== Modal Zoom ==========
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  // ========== Image aspect ratio (landscape → cover, portrait/square → contain) ==========
  const [imageFits, setImageFits] = useState({});
  
  // ========== Chat & Contact ==========
  const [showChat, setShowChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // ========== Rating dialog ==========
  const [rateOpen, setRateOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // ========== Error modal ==========
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const showErrorModal = (message) => { setErrorModalMessage(message); setErrorModalOpen(true); };

  // ========== Admin delete dialog ==========
  const [adminDeleteOpen, setAdminDeleteOpen] = useState(false);
  const [adminDeleting, setAdminDeleting] = useState(false);

  // ========== Report dialog ==========
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // ========== Seller profile & reviews ==========
  // Folosit pentru a afișa un scurt rezumat în cardul vânzătorului.
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerReviewsLoading, setSellerReviewsLoading] = useState(false);

  // Ensure full white background behind the fixed Header on large screens
  useEffect(() => {
    document.body.classList.add('page-announcement-details');
    return () => document.body.classList.remove('page-announcement-details');
  }, []);

  // ========== Rating handlers ==========
  const handleRateClick = (e) => {
    e?.stopPropagation();
    // Dacă utilizatorul nu este autentificat, redirecționăm la pagina de login și transmitem locația curentă pentru revenire
    const loggedUserId = localStorage.getItem('userId');
    if (!user && !loggedUserId) {
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }
    setRateOpen(true);
  };
  const handleRateClose = () => {
    setRateOpen(false);
    setRatingValue(5);
    setRatingComment('');
  };

  const handleCategoryClick = () => {
    if (!announcement?.category) return;
    navigate(`/anunturi-categorie/${encodeURIComponent(announcement.category)}`);
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
        showErrorModal(t('announcementDetails.userNotAvailable'));
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
        showErrorModal(err.response.data.error);
      } else {
        showErrorModal(t('announcementDetails.reviewError'));
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
        <Typography variant="body2" color="text.secondary">{t('announcementDetails.noReviews')}</Typography>
      );
    }
    const avg = reviews.reduce((s, r) => s + Number(r.score || 0), 0) / reviews.length;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Rating value={avg} precision={0.1} readOnly size="small" />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{avg.toFixed(1)}</Typography>
        <Typography variant="body2" color="text.secondary">{t('announcementDetails.reviewsCount', { count: reviews.length })}</Typography>
      </Box>
    );
  };

  // ========== Dark mode helpers and accent palette ==========
  const [isDarkMode, setIsDarkMode] = useState(false);
  const getIsDarkMode = () => isDarkMode;
  const getAccentCss = () => (isDarkMode ? '#f51866' : '#2D4361');
  const getAccentHover = () => (isDarkMode ? '#fa4875' : '#4A5F7F');

  // i18n
  const { t } = useTranslation();

  // Tooltip simplu și centrat pentru butoanele de acțiune
  const getTooltipStyles = () => ({
    tooltip: {
      backgroundColor: getIsDarkMode() ? '#1a1a1a' : '#324866',
      color: '#ffffff',
      fontSize: '0.75rem',
      fontWeight: 500,
      padding: '8px 12px',
      borderRadius: '8px',
      boxShadow: getIsDarkMode() 
        ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
        : '0 4px 12px rgba(50, 72, 102, 0.3)'
    },
    arrow: {
      color: getIsDarkMode() ? '#1a1a1a' : '#324866'
    }
  });

  // ========== Effects: preîncărcare imagini și detecție aspect ratio ==========
  useEffect(() => {
    if (!announcement?.images?.length) return;
    announcement.images.forEach((imgSrc, idx) => {
      const img = new window.Image();
      img.onload = () => {
        const fit = img.naturalWidth > img.naturalHeight ? 'cover' : 'contain';
        setImageFits(prev => ({ ...prev, [idx]: fit }));
      };
      img.src = resolveMediaUrl(imgSrc);
    });
  }, [announcement?.images]);

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
        console.log('Announcement fetched:', res.data);
        console.log('[AnnouncementDetails] tags received:', res.data?.tags);
        setAnnouncement(res.data);
      } catch (e) {
        console.error('Error fetching announcement:', e);
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
      setShowLoginToast(true);
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

  // ========== Admin delete ==========
  const handleAdminDelete = async () => {
    try {
      setAdminDeleting(true);
      await apiClient.delete(`/api/announcements/${announcement._id}`);
      setAdminDeleteOpen(false);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Eroare la ștergerea anunțului.';
      showErrorModal(msg);
    } finally {
      setAdminDeleting(false);
    }
  };

  // ========== Utilitare de format ==========
  const formatDate = (dateString) => {
    const locale = i18n.language === 'en' ? 'en-GB' : (i18n.language === 'es' ? 'es-ES' : 'ro-RO');
    return new Date(dateString).toLocaleDateString(locale, {
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
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  if (!announcement) {
    return (
      <ErrorBoundary>
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            {t('announcementDetails.notFound')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            {t('announcementDetails.backToMain')}
          </Button>
        </Container>
      </ErrorBoundary>
    );
  }

  const images = announcement.images || [];
  const showArrows = images.length > 1;
  /** Returnează src robust pentru imagine (acceptă absolute/relative/uploads). */
  const getImageSrc = (img) => resolveMediaUrl(img);

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

  const preventImageContextMenu = (e) => {
    e.preventDefault();
  };

  const loggedUserId = localStorage.getItem('userId') || user?._id;
  const token = localStorage.getItem('token');
  const isOwnAnnouncement = !!loggedUserId && String(announcement.user._id) === String(loggedUserId);
  const isAdminUser = !!user?.isAdmin;

  const handleChatClick = () => {
    console.log('🔍 Chat button clicked:', { loggedUserId, isOwnAnnouncement, announcementUserId: announcement.user._id, showChat });
    // Dacă utilizatorul nu este autentificat, redirecționăm la pagina de login și transmitem locația curentă pentru revenire
    if (!user && !loggedUserId) {
      console.log('⚠️ User not authenticated — redirecting to login');
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }
    console.log('✅ Opening chat popup');
    setShowChat(true);
  };

  const handleOpenReport = () => {
    if (!user && !loggedUserId) {
      navigate('/login', { state: { from: window.location.pathname + window.location.search } });
      return;
    }
    if (isOwnAnnouncement) {
      const msg = t('announcementDetails.cantReportOwn');
      if (window.showToast) window.showToast(msg, 'warning');
      else alert(msg);
      return;
    }
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    if (reportSubmitting) return;
    setReportOpen(false);
    setReportReason('spam');
    setReportDetails('');
  };

  const handleSubmitReport = async () => {
    if (!announcement?._id) return;
    try {
      setReportSubmitting(true);
      await createAnnouncementReport(announcement._id, {
        reason: reportReason,
        details: reportDetails,
      });
      const msg = t('announcementDetails.reportSubmitted');
      if (window.showToast) window.showToast(msg, 'success');
      else alert(msg);
      handleCloseReport();
    } catch (error) {
      const backendError = error?.response?.data?.error;
      const msg = backendError || t('announcementDetails.reportError');
      if (window.showToast) window.showToast(msg, 'error');
      else alert(msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <Toast
        message={t('favorites.loginRequired')}
        type="info"
        visible={showLoginToast}
        onClose={() => setShowLoginToast(false)}
      />
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
              <div style={{fontWeight:600,fontSize:'1rem'}}>{t('announcementDetails.updatedBanner.title')}</div>
              <div style={{opacity:.9,fontSize:'.9rem',marginTop:2}}>{t('announcementDetails.updatedBanner.body')}</div>
            </div>
            <button
              onClick={() => {
                setBannerPhase('exit');
                setTimeout(() => setShowUpdatedBanner(false), 450);
              }}
              aria-label={t('common.close')}
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
            '&:hover': { bgcolor: getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(45, 67, 97, 0.08)' }
          }}
        >
          {t('common.back')}
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
                      onContextMenu={preventImageContextMenu}
                      draggable={false}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: imageFits[imgIndex] ?? 'contain',
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
                    <Typography variant="h6">{t('announcementDetails.noImages')}</Typography>
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
                        {t('announcementDetails.posted', { date: formatDate(announcement.createdAt) })}
                      </Typography>
                    </Box>
                    <Typography variant="h4" component="h1" sx={{ color: getAccentCss(), fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }, textAlign: 'center' }}>
                      {announcement.title}
                    </Typography>
                    {(announcement.category || (Array.isArray(announcement.tags) && announcement.tags.length > 0)) && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {announcement.category && (
                          <Chip
                            label={translateCategory(announcement.category, t)}
                            clickable
                            onClick={handleCategoryClick}
                            variant="outlined"
                            sx={{
                              borderColor: getAccentCss(),
                              color: getAccentCss(),
                              cursor: 'pointer'
                            }}
                          />
                        )}
                        {Array.isArray(announcement.tags) && announcement.tags.map(tagKey => (
                          <Chip
                            key={tagKey}
                            label={t(`categoryTags.tags.${tagKey}`, tagKey)}
                            clickable
                            onClick={() => navigate(
                              `/anunturi-subcategorie/${encodeURIComponent(tagKey)}` +
                              (announcement.category ? `?category=${encodeURIComponent(announcement.category)}` : '')
                            )}
                            variant="outlined"
                            sx={{
                              borderColor: getAccentCss(),
                              color: getAccentCss(),
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip 
                      title={isFavorite ? t('announcementDetails.removeFromFavorites') : t('announcementDetails.addToFavorites')}
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
                              : (getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(45, 67, 97, 0.08)'),
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s'
                        }}
                      >
                        {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip 
                      title={t('announcementDetails.share')}
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
                            bgcolor: getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(45, 67, 97, 0.08)',
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
                  {t('announcementDetails.description')}
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
                    borderColor: getIsDarkMode() ? 'rgba(255,255,255,0.12)' : 'rgba(45,67,97,0.25)',
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
                        {t('announcementDetails.views', { count: typeof announcement.views === 'number' ? announcement.views : 0 })}
                      </Typography>
                    </Box>
                  </Box>
                  {!isOwnAnnouncement && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                      {isAdminUser && (
                        <Button
                          size="small"
                          onClick={() => setAdminDeleteOpen(true)}
                          sx={{
                            color: '#e5533d',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(229,83,61,0.08)' },
                            fontSize: { xs: '.65rem', sm: '.75rem' },
                            letterSpacing: '.5px',
                            px: { xs: 1, sm: 1.5 },
                            py: { xs: 0.5, sm: 0.75 },
                            border: '1px solid #e5533d',
                            borderRadius: 1.5,
                          }}
                        >
                          Șterge (Admin)
                        </Button>
                      )}
                      <Button
                        size="small"
                        onClick={handleOpenReport}
                        startIcon={
                          <svg xmlns="http://www.w3.org/2000/svg" width={getEffectiveViewportWidth() < 600 ? "12" : "16"} height={getEffectiveViewportWidth() < 600 ? "12" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16l-6 8 6 8H4z"/></svg>
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
                        }}
                      >
                        {t('announcementDetails.report')}
                      </Button>
                    </Box>
                  )}
                </Box>

                {announcement.price && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ color: getAccentCss(), mb: 1, fontWeight: 600 }}>
                      {t('announcementDetails.price')}
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
                  {t('announcementDetails.sellerInfo')}
                </Typography>

                {/* Seller Avatar and Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, cursor: 'pointer' }} onClick={() => navigate(`/profil/${announcement.user._id}`)}>
                  <Avatar
                    src={resolveMediaUrl(announcement.user.avatar) || undefined}
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
                      <Typography variant="body2" color="text.secondary">{t('common.loading')}</Typography>
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
                        {t('announcementDetails.contactPerson')}
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
                        {t('announcementDetails.rate')}
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
                      {t('announcementDetails.sendMessage')}
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
                            {t('announcementDetails.show')}
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
                      {t('announcementDetails.viewProfile')}
                    </Button>
                  </Box>
                )}

                {isOwnAnnouncement && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('announcementDetails.ownAnnouncement')}
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
        <DialogTitle sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>{t('announcementDetails.rateUser')}</DialogTitle>
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
            label={t('announcementDetails.commentOptional')}
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
          <Button onClick={handleRateClose} sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleRateSubmit} sx={{ bgcolor: getAccentCss(), '&:hover': { bgcolor: getAccentHover() }, color: '#ffffff', fontFamily: "'Poppins', sans-serif" }}>{t('announcementDetails.submit')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reportOpen}
        onClose={handleCloseReport}
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
        <DialogTitle sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>
          {t('announcementDetails.reportDialog.title')}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="normal"
            fullWidth
            label={t('announcementDetails.reportDialog.reasonLabel')}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
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
          >
            <MenuItem value="spam">{t('announcementDetails.reportDialog.reasons.spam')}</MenuItem>
            <MenuItem value="fake">{t('announcementDetails.reportDialog.reasons.fake')}</MenuItem>
            <MenuItem value="abusive">{t('announcementDetails.reportDialog.reasons.abusive')}</MenuItem>
            <MenuItem value="wrong_category">{t('announcementDetails.reportDialog.reasons.wrong_category')}</MenuItem>
            <MenuItem value="other">{t('announcementDetails.reportDialog.reasons.other')}</MenuItem>
          </TextField>

          <TextField
            margin="normal"
            fullWidth
            multiline
            minRows={4}
            value={reportDetails}
            label={t('announcementDetails.reportDialog.detailsLabel')}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder={t('announcementDetails.reportDialog.detailsPlaceholder')}
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
          <Button onClick={handleCloseReport} disabled={reportSubmitting} sx={{ color: getIsDarkMode() ? '#ffffff' : 'inherit', fontFamily: "'Poppins', sans-serif" }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReport}
            disabled={reportSubmitting}
            sx={{ bgcolor: '#e5533d', '&:hover': { bgcolor: '#cd412b' }, color: '#ffffff', fontFamily: "'Poppins', sans-serif" }}
          >
            {t('announcementDetails.reportDialog.submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Error Modal ========== */}
      <Dialog
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxWidth: '380px',
            width: '100%',
            background: getIsDarkMode() ? '#1a1a2e' : '#ffffff',
            boxShadow: getIsDarkMode()
              ? '0 32px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)'
              : '0 32px 64px rgba(0,0,0,0.14)',
            overflow: 'visible',
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0,0,0,0.45)',
            }
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 2, px: 4 }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: getIsDarkMode()
              ? 'linear-gradient(135deg, #f51866 0%, #fa4875 100%)'
              : 'linear-gradient(135deg, #2D4361 0%, #4A6FA5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: getIsDarkMode()
              ? '0 10px 28px rgba(245,24,102,0.4)'
              : '0 10px 28px rgba(45,67,97,0.32)',
          }}>
            <LockOutlinedIcon sx={{ color: '#fff', fontSize: 30 }} />
          </Box>
          <Typography sx={{
            fontWeight: 700,
            mb: 1.5,
            fontFamily: "'Poppins', sans-serif",
            color: getIsDarkMode() ? '#f9fafb' : '#111827',
            fontSize: '1.1rem',
            lineHeight: 1.3,
          }}>
            Acces restricționat
          </Typography>
          <Typography sx={{
            color: getIsDarkMode() ? '#9ca3af' : '#6b7280',
            lineHeight: 1.7,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.88rem',
          }}>
            {errorModalMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, pt: 1.5 }}>
          <Button
            onClick={() => setErrorModalOpen(false)}
            variant="contained"
            disableElevation
            sx={{
              borderRadius: '14px',
              padding: '11px 40px',
              background: getIsDarkMode()
                ? 'linear-gradient(135deg, #f51866 0%, #fa4875 100%)'
                : 'linear-gradient(135deg, #2D4361 0%, #4A6FA5 100%)',
              color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              letterSpacing: '0.01em',
              boxShadow: getIsDarkMode()
                ? '0 4px 16px rgba(245,24,102,0.35)'
                : '0 4px 16px rgba(45,67,97,0.28)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: getIsDarkMode()
                  ? 'linear-gradient(135deg, #e0145a 0%, #f03d6c 100%)'
                  : 'linear-gradient(135deg, #1A314E 0%, #2D4361 100%)',
                transform: 'translateY(-1px)',
                boxShadow: getIsDarkMode()
                  ? '0 8px 24px rgba(245,24,102,0.45)'
                  : '0 8px 24px rgba(45,67,97,0.38)',
              },
            }}
          >
            Am înțeles
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== Admin Delete Confirmation Dialog ========== */}
      <Dialog
        open={adminDeleteOpen}
        onClose={() => !adminDeleting && setAdminDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: getIsDarkMode() ? '#1a1a1a' : '#ffffff',
          }
        }}
      >
        <DialogTitle sx={{ color: getIsDarkMode() ? '#f5f5f5' : 'inherit', fontWeight: 700 }}>
          Confirmare ștergere (Admin)
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: getIsDarkMode() ? '#d1d5db' : '#374151' }}>
            Ești sigur că vrei să ștergi acest anunț? Acțiunea este ireversibilă.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setAdminDeleteOpen(false)}
            disabled={adminDeleting}
            sx={{ color: getIsDarkMode() ? '#9ca3af' : '#6b7280', textTransform: 'none' }}
          >
            Anulează
          </Button>
          <Button
            variant="contained"
            onClick={handleAdminDelete}
            disabled={adminDeleting}
            sx={{
              bgcolor: '#e5533d',
              '&:hover': { bgcolor: '#cd412b' },
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            {adminDeleting ? 'Se șterge...' : 'Șterge definitiv'}
          </Button>
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
      
    </ErrorBoundary>
  );
}