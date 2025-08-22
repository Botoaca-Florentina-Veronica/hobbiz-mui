import React, { useEffect, useState, useRef } from 'react';
import ImageZoomModal from '../components/ImageZoomModal';
import { useParams, useNavigate } from 'react-router-dom';
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
  Skeleton
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
import apiClient from '../api/api';
import './AnnouncementDetails.css';
// Header and Footer are provided by the App.jsx route layout
import ChatPopup from '../components/ChatPopup';

export default function AnnouncementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Favorite logic
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Carousel logic
  const [imgIndex, setImgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timeoutRef = useRef();

  // Modal zoom logic
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  
  // Chat and contact logic
  const [showChat, setShowChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  // Dark mode helpers and accent palette
  const [isDarkMode, setIsDarkMode] = useState(false);
  const getIsDarkMode = () => isDarkMode;
  const getAccentCss = () => (isDarkMode ? '#f51866' : '#355070');
  const getAccentHover = () => (isDarkMode ? '#fa4875' : '#406b92');

  // Tooltip styling helper (bule de hover deasupra butoanelor)
  const getTooltipProps = () => ({
    placement: 'top',
    arrow: true,
    TransitionComponent: Fade,
    enterDelay: 200,
    enterTouchDelay: 100,
    leaveTouchDelay: 3000,
    componentsProps: {
      tooltip: {
        sx: {
          bgcolor: getIsDarkMode() ? '#282828' : '#355070',
          color: '#ffffff',
          border: `1px solid ${getIsDarkMode() ? '#3f3f3f' : '#4a6b8a'}`,
          fontSize: '0.8rem',
          boxShadow: 'none'
        }
      },
      arrow: {
        sx: {
          color: getIsDarkMode() ? '#282828' : '#355070'
        }
      }
    }
  });

  // Keep component in sync with global dark-mode class toggles
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const update = () => setIsDarkMode(body.classList.contains('dark-mode'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
  }, [id]);

  useEffect(() => {
    if (!announcement?._id) return;
    const raw = localStorage.getItem(FAVORITES_KEY);
    let isFav = false;
    try {
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // Format vechi: ["id1","id2",...]
        isFav = parsed.includes(announcement._id);
      } else if (Array.isArray(parsed)) {
        // Format nou: [{id, addedAt}]
        isFav = parsed.some(item => item.id === announcement._id);
      }
    } catch {
      isFav = false;
    }
    setIsFavorite(isFav);
  }, [announcement, FAVORITES_KEY]);

  const handleToggleFavorite = () => {
    const raw = localStorage.getItem(FAVORITES_KEY);
    let list = [];
    try {
      const parsed = JSON.parse(raw || '[]');
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // Convert format vechi la obiecte
        list = parsed.map(id => ({ id, addedAt: Date.now() }));
      } else if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      list = [];
    }

    const exists = list.some(item => item.id === announcement._id);
    let updatedObjects;
    if (exists) {
      updatedObjects = list.filter(item => item.id !== announcement._id);
    } else {
      updatedObjects = [...list, { id: announcement._id, addedAt: Date.now() }];
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedObjects));
    setIsFavorite(!exists);
  };

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
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3, 
            color: getAccentCss(),
            '&:hover': { bgcolor: getIsDarkMode() ? 'rgba(245, 24, 102, 0.08)' : 'rgba(53, 80, 112, 0.08)' }
          }}
        >
          Înapoi
        </Button>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
            {/* Image Carousel */}
            <Card elevation={3} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
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
                        bgcolor: '#f5f5f5',
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

            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: getIsDarkMode() ? '#282828' : '#f5f5f5' }}>
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
                    <Typography variant="h4" component="h1" sx={{ color: getAccentCss(), fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
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
                    <Tooltip {...getTooltipProps()} title={isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}>
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
                    <Tooltip {...getTooltipProps()} title="Partajează">
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

          {/* Seller Information Sidebar */}
          <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
            <Card elevation={2} sx={{ borderRadius: 3, position: { md: 'sticky' }, top: { md: 120 } }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ color: getAccentCss(), mb: 3, fontWeight: 600 }}>
                  Informații vânzător
                </Typography>

                {/* Seller Avatar and Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
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
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: getIsDarkMode() ? '#f5f5f5' : '#2d3748' }}>
                      {announcement.user.firstName} {announcement.user.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Membru din {formatDate(announcement.user.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Contact Person */}
                {announcement.contactPerson && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Persoană de contact:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {announcement.contactPerson}
                    </Typography>
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
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ color: getAccentCss(), fontSize: 20 }} />
                          <Typography variant="body1">
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

                    {/* Email Contact */}
                    {announcement.contactEmail && (
                      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ color: getAccentCss(), fontSize: 20 }} />
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {announcement.contactEmail}
                          </Typography>
                        </Box>
                      </Paper>
                    )}
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
          </Grid>
        </Grid>
      </Container>

      {/* Chat Popup */}
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

      {/* Image Zoom Modal */}
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

      {/* Debug info */}
      {console.log('🎯 ChatPopup render conditions:', {
        showChat,
        loggedUserId: !!loggedUserId,
        isOwnAnnouncement,
      })}
      
    </>
  );
}
