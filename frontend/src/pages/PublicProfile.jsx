import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import './ProfilePage.css';
import './PublicProfile.css';
import apiClient from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

export default function PublicProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const carouselRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const [showReviewPosted, setShowReviewPosted] = useState(false);
  const [alertMounted, setAlertMounted] = useState(false);
  const [alertLeaving, setAlertLeaving] = useState(false);
  const alertTimerRef = useRef(null);
  const alertLeaveTimerRef = useRef(null);
  const { user } = useAuth() || {};
  // Normalized current user id (AuthContext may store profile with _id)
  const currentUserId = user ? (user._id || user.userId || user.id) : null;

  // local state to track liked reviews to update UI optimistically
  const [likedState, setLikedState] = useState({});
  // State for review action menus
  const [menuState, setMenuState] = useState({ anchorEl: null, reviewId: null });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPayload, setEditPayload] = useState({ reviewId: null, comment: '', score: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Helper: normalize review author id from different shapes (string, ObjectId, populated object)
  const getReviewAuthorId = (r) => {
    if (!r) return null;
    // If populated as an object with _id
    if (r.author && typeof r.author === 'object') {
      if (r.author._id) return String(r.author._id);
      // If it's a full user object, try id or userId
      if (r.author.id) return String(r.author.id);
      // Fallback to calling String on the object (works for ObjectId-like values)
      try { return String(r.author); } catch (_) { return null; }
    }
    // If author is a primitive (string/ObjectId), return its string form
    if (r.author) return String(r.author);
    if (r.authorId) return String(r.authorId);
    return null;
  };

  // Detectează dark mode ca în ProfilePage.jsx
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Compute available viewport height for the page container and expose as a CSS variable
  // so CSS can adapt max-heights responsively without hardcoding values.
  useEffect(() => {
    function updateAvailableHeight() {
      const el = document.querySelector('.public-profile-page-container');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // available area within viewport under the top of this container
      const available = window.innerHeight - Math.max(0, rect.top);
      el.style.setProperty('--pp-available-height', `${available}px`);
    }
    updateAvailableHeight();
    window.addEventListener('resize', updateAvailableHeight);
    window.addEventListener('orientationchange', updateAvailableHeight);
    // Also update after a short delay to cover UI chrome changes on mobile
    const t = setTimeout(updateAvailableHeight, 300);
    return () => {
      window.removeEventListener('resize', updateAvailableHeight);
      window.removeEventListener('orientationchange', updateAvailableHeight);
      clearTimeout(t);
    };
  }, []);

  // Compute average rating for reuse in the header and the reviews card
  let avgRating = null;
  if (Array.isArray(profile?.reviews) && profile.reviews.length > 0) {
    const nums = profile.reviews.map(r => Number(r.score || r.rating || r.value || 0)).filter(n => !isNaN(n));
    if (nums.length > 0) avgRating = nums.reduce((a, b) => a + b, 0) / nums.length;
  } else if (profile?.rating || profile?.averageRating) {
    avgRating = Number(profile.rating || profile.averageRating);
  }

  const getPrimaryColor = () => (isDarkMode ? '#f51866' : '#355070');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/users/profile/${userId}`);
        setProfile(res.data);
      } catch (e) {
        setError('Eroare la încărcarea profilului');
        setProfile({});
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchProfile();
    // If navigated here carrying state that a review was posted, show confirmation
    if (location?.state?.reviewPosted) {
      // mount alert and schedule graceful leave
      setShowReviewPosted(true);
      setAlertMounted(true);
      setAlertLeaving(false);
      // schedule start of leave a bit before full 4s so animation can play
      const visibleMs = 4000;
      const leaveAnimMs = 420; // should match CSS animation duration
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (alertLeaveTimerRef.current) clearTimeout(alertLeaveTimerRef.current);
      alertTimerRef.current = setTimeout(() => {
        // start leave animation
        setAlertLeaving(true);
        alertLeaveTimerRef.current = setTimeout(() => {
          setAlertMounted(false);
          setShowReviewPosted(false);
          setAlertLeaving(false);
        }, leaveAnimMs);
      }, visibleMs - leaveAnimMs);

      // remove the state from history so refresh doesn't keep showing it
      if (window.history && window.history.replaceState) {
        const newState = { ...window.history.state };
        try { delete newState.state?.reviewPosted; } catch(_) {}
        window.history.replaceState(newState, '');
      }

      // Clean up timers
      return () => {
        if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
        if (alertLeaveTimerRef.current) clearTimeout(alertLeaveTimerRef.current);
      };
    }
  }, [userId]);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setAnnouncementsLoading(true);
        const res = await apiClient.get(`/api/users/announcements/${userId}`);
        setAnnouncements(res.data || []);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    }
    if (userId) fetchAnnouncements();
  }, [userId]);

  const handleScroll = (dir) => {
    if (!carouselRef.current) return;
    const delta = 400;
    carouselRef.current.scrollLeft += dir === 'left' ? -delta : delta;
  };

  if (loading) {
    return (
      <div className="profile-page-container public-profile-page-container">
        <div className="profile-loading-container">
          <CircularProgress className="profile-loading-spinner" />
        </div>
      </div>
    );
  }

    // prepare reviews list JSX to avoid nested ternary/JSX parsing issues
    const reviewsList = Array.isArray(profile?.reviews) && profile.reviews.length > 0 ? (
      profile.reviews.map((r) => {
        const annId = r.announcement?._id || r.announcementId || r.announcement;
        const annFromList = annId ? (announcements || []).find(a => String(a._id || a.id) === String(annId)) : null;
        const annTitle = r.announcementTitle || (r.announcement && (r.announcement.title || r.announcement.name)) || (annFromList && (annFromList.title || annFromList.name));
        return (
          <div key={r._id || `${r.user || 'u'}-${r.createdAt || Math.random()}`} className="compact-review-item">
            <div className="compact-review-left">
              <Avatar src={r.authorAvatar || r.avatar} alt={r.authorName || r.name || 'U'} sx={{ width:44, height:44, fontSize:16 }}>
                {(r.authorName || r.name || 'U').charAt(0)}
              </Avatar>
            </div>
            <div className="compact-review-main">
              <div className="compact-review-top">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="compact-review-author">{r.authorName || r.name || 'Utilizator'}</div>
                  <div className="compact-review-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('ro-RO') : ''}</div>
                  { annTitle && (
                    <div className="compact-review-ann-title">{annTitle}</div>
                  ) }
                </div>
                {currentUserId && getReviewAuthorId(r) && String(currentUserId) === getReviewAuthorId(r) && (
                  <div className="review-actions-menu">
                    <IconButton size="small" onClick={(e) => setMenuState({ anchorEl: e.currentTarget, reviewId: r._id })}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </div>
                )}
              </div>
              <div className="compact-review-body">{r.comment}</div>
              <div className="compact-review-actions">
                <div className="compact-review-score">{Number(r.score || r.rating || r.value || 0).toFixed(1)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      try {
                        if (!user) { alert('Trebuie să fii autentificat pentru a da like'); return; }
                        const prev = likedState[r._id] || { liked: false, count: (r.likes || []).length };
                        const newLiked = !prev.liked;
                        setLikedState(s => ({ ...s, [r._id]: { liked: newLiked, count: prev.count + (newLiked ? 1 : -1) } }));
                        const resp = await apiClient.post(`/api/reviews/${r._id}/like`);
                        setLikedState(s => ({ ...s, [r._id]: { liked: resp.data.liked, count: resp.data.likesCount } }));
                      } catch (e) {
                        console.error('Like error', e);
                        alert('A apărut o eroare la like. Încearcă din nou.');
                      }
                    }}
                  >
                    <ThumbUpIcon fontSize="small" color={(likedState[r._id]?.liked || (r.likes || []).some(id=>String(id)===String(currentUserId))) ? 'primary' : 'action'} />
                  </IconButton>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--pf-text-muted)' }}>{(likedState[r._id]?.count ?? (r.likes || []).length) || 0}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="public-profile-no-reviews">Acest utilizator nu are recenzii încă.</div>
    );

  return (
  <div className="profile-page-container public-profile-page-container">
      <div className="mobile-header">
        <IconButton
          onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
          className="mobile-back-btn"
          disableRipple
          disableFocusRipple
          aria-label="Înapoi"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="mobile-header-title">Profil</Typography>
      </div>

      {error && (
        <Fade in={!!error}>
          <Alert severity="error" className="profile-alert">{error}</Alert>
        </Fade>
      )}

      {showReviewPosted && (
        // Keep mounted while animating; CSS handles enter/leave
        alertMounted && (
          <div className={`profile-alert-wrapper ${alertLeaving ? 'alert-leaving' : 'alert-entering'}`}>
            <Alert severity="success" className="profile-alert" onClose={() => {
              // start graceful leave
              if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
              if (alertLeaveTimerRef.current) clearTimeout(alertLeaveTimerRef.current);
              setAlertLeaving(true);
              alertLeaveTimerRef.current = setTimeout(() => {
                setAlertMounted(false);
                setShowReviewPosted(false);
                setAlertLeaving(false);
              }, 420);
            }}>
              Recenzia a fost publicată. Mulțumim pentru feedback!
            </Alert>
          </div>
        )
      )}

      {/*
        To override widths for this page only, add one of the utility classes to the Container:
        - 'pp-container--wide'  -> makes the lg breakpoint wider (uses CSS var override)
        - 'pp-container--narrow' -> makes the lg breakpoint narrower
        Example: <Container maxWidth={false} className="public-profile-container pp-container--wide">
      */}
      <Container maxWidth={false} className="public-profile-container">
  <Grid container spacing={4}>
          {/* Left column: existing profile content */}
          <Grid item xs={12} md={8}>
            {/* Header Card (read-only) */}
            <div className="profile-header-card">
              <div className="profile-header-grid">
                <div className="profile-avatar-container">
                  <div className="profile-avatar-main">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="profile-avatar-image" />
                    ) : (
                      <PersonIcon className="profile-person-icon" />
                    )}
                  </div>
                </div>
                <div className="profile-header-info">
                  <span className="profile-private-chip">PROFIL PUBLIC</span>
                  <h1 className="profile-main-title">
                    {profile?.firstName || ''} {profile?.lastName || ''}
                  </h1>
                  {/* Review stars: show 5 empty stars if no reviews, otherwise color average */}
                  <div className="profile-rating-row" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(() => {
                      const filled = avgRating ? Math.round(avgRating) : 0;
                      const stars = [];
                      for (let i = 1; i <= 5; i++) {
                        if (i <= filled) {
                          stars.push(<StarIcon key={i} className="profile-star filled" sx={{ color: '#FFD24A' }} />);
                        } else {
                          stars.push(<StarBorderIcon key={i} className="profile-star" />);
                        }
                      }
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {stars}
                          </div>
                          <div style={{ color: 'var(--pf-text-muted)', fontWeight: 600 }}>
                            {avgRating ? `(${avgRating.toFixed(1)})` : ''}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {profile?.createdAt && (
                    <div style={{ marginTop: 6, color: 'var(--pf-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarMonthIcon className="profile-icon" />
                      <span>
                        Membru din {new Date(profile.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile details (read-only) */}
            <div className="profile-info-main-card">
              <div className="profile-info-content">
                <div className="profile-info-header-section">
                  <h2 className="profile-info-main-title">INFORMAȚII DE BAZĂ</h2>
                </div>
                <hr className="profile-divider" />

                <div className="profile-form-grid">
                  <div className="profile-form-column">
                    {/* Nume de familie */}
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <PersonIcon className="profile-icon" />
                        <span>Nume</span>
                      </div>
                      <div className={`profile-field-value ${!profile?.lastName ? 'unspecified' : ''}`}>
                        {profile?.lastName || 'Nespecificat'}
                      </div>
                    </div>

                    {/* Prenume */}
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <PersonIcon className="profile-icon" />
                        <span>Prenume</span>
                      </div>
                      <div className={`profile-field-value ${!profile?.firstName ? 'unspecified' : ''}`}>
                        {profile?.firstName || 'Nespecificat'}
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-column">
                    {/* Localitate */}
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <LocationOnIcon className="profile-icon" />
                        <span>Localitate</span>
                      </div>
                      <div className={`profile-field-value ${!profile?.localitate ? 'unspecified' : ''}`}>
                        {profile?.localitate || 'Nespecificat'}
                      </div>
                    </div>

                    {/* Telefon */}
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <PhoneIcon className="profile-icon" />
                        <span>Telefon</span>
                      </div>
                      <div className={`profile-field-value ${!profile?.phone ? 'unspecified' : ''}`}>
                        {profile?.phone || 'Nespecificat'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email and Last Seen row */}
                <div className="profile-form-grid" style={{ marginTop: 8 }}>
                  <div className="profile-form-column">
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <EmailIcon className="profile-icon" />
                        <span>Email</span>
                      </div>
                      <div className={`profile-field-value ${!profile?.email ? 'unspecified' : ''}`}>
                        {profile?.email || 'Nespecificat'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="profile-form-column">
                    <div className="profile-field-container">
                      <div className="profile-field-label">
                        <CalendarMonthIcon className="profile-icon" />
                        <span>Ultima activitate</span>
                      </div>
                      <div className="profile-field-value">
                        {profile?.lastSeen 
                          ? new Date(profile.lastSeen).toLocaleDateString('ro-RO', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })
                          : 'Nespecificat'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anunțurile utilizatorului - identic cu ProfilePage.jsx */}
            <div className="profile-info-main-card">
              <div className="profile-info-content">
                <div style={{ marginTop: '0px' }}>
                  <h3 className="profile-section-title">
                    Anunțurile utilizatorului ({announcements.length})
                  </h3>
                  {announcementsLoading ? (
                    <Box className="profile-announcements-loading">
                      <CircularProgress size={20} />
                      <span className="profile-loading-inline-text">Se încarcă...</span>
                    </Box>
                  ) : announcements.length === 0 ? (
                    <Box className="profile-empty-state">
                      Acest utilizator nu are anunțuri publicate.
                    </Box>
                  ) : (
                    <Box className="profile-announcements-container">
                      {announcements.length > 3 && (
                        <IconButton 
                          onClick={() => handleScroll('left')}
                          sx={{
                            position: 'absolute',
                            left: { xs: '0', sm: '-25px' },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1,
                            backgroundColor: getPrimaryColor(),
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            display: { xs: 'none', sm: 'inline-flex' },
                            '&:hover': {
                              backgroundColor: '#2a4a65'
                            }
                          }}
                        >
                          <ChevronLeft />
                        </IconButton>
                      )}

                      <Box ref={carouselRef} className="profile-carousel">
                        {announcements.map((a) => (
                          <Box 
                            key={a._id}
                            onClick={() => navigate(`/announcement/${a._id}`)}
                            className="profile-card-wrapper"
                          >
                            <Box className="announcement-card">
                              {a.images && a.images.length > 0 ? (
                                <img src={a.images[0]} alt={a.title} className="announcement-image" />
                              ) : (
                                <Box className="announcement-image-placeholder">
                                  Fără imagine
                                </Box>
                              )}
                              
                              <Box className="announcement-card-body">
                                <h4 className="announcement-title">
                                  {a.title}
                                </h4>
                                
                                {a.price && (
                                  <p className="announcement-price">
                                    {a.price} lei
                                  </p>
                                )}
                                
                                <p className="announcement-location">
                                  {a.location || a.localitate || ''}
                                </p>
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </Box>

                      {announcements.length > 3 && (
                        <IconButton
                          onClick={() => handleScroll('right')}
                          sx={{
                            position: 'absolute',
                            right: { xs: '0', sm: '-25px' },
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 1,
                            backgroundColor: getPrimaryColor(),
                            color: 'white',
                            width: '40px',
                            height: '40px',
                            display: { xs: 'none', sm: 'inline-flex' },
                            '&:hover': {
                              backgroundColor: '#2a4a65'
                            }
                          }}
                        >
                          <ChevronRight />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </div>
              </div>
            </div>
          </Grid>

          {/* Right column: Reviews summary (sticky on desktop) */}
          <Grid item xs={12} md={4}>
            <div className="public-profile-reviews-wrap">
              <Card className="public-profile-reviews-card">
                <CardContent className="public-profile-reviews-content">
                  <Typography variant="h6" className="public-profile-reviews-title">
                    Rezumatul evaluării
                  </Typography>

                  <div className="public-profile-reviews-header">
                    <div className="public-profile-reviews-score">{avgRating ? avgRating.toFixed(1) : '0.0'}</div>
                    <div>
                      <div className="public-profile-reviews-stars">
                        {(() => {
                          const filled = avgRating ? Math.round(avgRating) : 0;
                          const stars = [];
                          for (let i = 1; i <= 5; i++) {
                            if (i <= filled) stars.push(<StarIcon key={i} className="public-star filled" />);
                            else stars.push(<StarBorderIcon key={i} className="public-star empty" />);
                          }
                          return stars;
                        })()}
                      </div>
                      <div className="public-profile-reviews-count">{Array.isArray(profile?.reviews) ? `${profile.reviews.length} review${profile.reviews.length !== 1 ? 's' : ''}` : ''}</div>
                    </div>
                  </div>

                  {/* Show summary info; 'Toate comentariile' moved below the individual reviews list */}

                  <Divider className="public-profile-reviews-divider" />

                  {/* Rating bars */}
                  {(() => {
                    const counts = [5,4,3,2,1].map(st => {
                      const c = Array.isArray(profile?.reviews) ? profile.reviews.filter(r => Number(r.score || r.rating || r.value || 0) === st).length : 0;
                      return { star: st, count: c };
                    });
                    const total = counts.reduce((s, x) => s + x.count, 0) || 0;
                    return counts.map(({ star, count }) => (
                      <div key={star} className="public-profile-rating-row">
                        <div className="public-profile-rating-star">{star} <span className="star-char">★</span></div>
                        <div className="public-profile-rating-bar-outer">
                          <div className="public-profile-rating-bar-inner" style={{ width: `${total ? (count/total*100) : 0}%` }} />
                        </div>
                        <div className="public-profile-rating-count">{count}</div>
                      </div>
                    ));
                  })()}
                  
                  {/* Placeholder: individual reviews are rendered in a separate section below */}
                  <div className="public-profile-review-list-placeholder" />
                </CardContent>
              </Card>
              {/* Compact reviews list nested under the summary card (shares the same column width) */}
              <div style={{ marginTop: 16 }} className="public-profile-reviews-list-container">
                <div className="public-profile-reviews-list-inner">
                  {reviewsList}
                  {/* 'Toate comentariile' button appears under the individual reviews list */}
                  {Array.isArray(profile?.reviews) && profile.reviews.length >= 2 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/profil/${userId}/toate-recenziile`)}>
                        Toate comentariile
                      </Button>
                    </div>
                  )}
                  {/* Action menu for reviews (styled and positioned to the left of button) */}
                  <Menu
                    anchorEl={menuState.anchorEl}
                    open={!!menuState.anchorEl}
                    onClose={() => setMenuState({ anchorEl: null, reviewId: null })}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                        background: 'var(--pf-card-bg, #fff)',
                        border: '1px solid var(--pf-divider, #e6eef6)',
                        minWidth: 160,
                        py: 0.5,
                        // nudge left to sit closer to the button
                        transform: 'translateX(-10px)'
                      }
                    }}
                  >
                    <MenuItem onClick={() => {
                      const id = menuState.reviewId;
                      if (!id) return;
                      // open edit dialog with current values
                      const current = profile.reviews.find(rr => rr._id === id) || {};
                      setEditPayload({ reviewId: id, comment: current.comment || '', score: (current.score || current.rating || '') });
                      setMenuState({ anchorEl: null, reviewId: null });
                      setEditDialogOpen(true);
                    }} sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><EditIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={'Editează'} />
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const id = menuState.reviewId;
                      if (!id) return;
                      setMenuState({ anchorEl: null, reviewId: null });
                      setDeleteTargetId(id);
                      setDeleteDialogOpen(true);
                    }} sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}><DeleteIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary={'Șterge'} />
                    </MenuItem>
                  </Menu>

                  {/* Edit dialog */}
                  <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Editează recenzia</DialogTitle>
                    <DialogContent dividers>
                      <TextField
                        label="Scor (0-5)"
                        type="number"
                        inputProps={{ min: 0, max: 5, step: 0.5 }}
                        fullWidth
                        margin="dense"
                        value={editPayload.score}
                        onChange={(e) => setEditPayload(p => ({ ...p, score: e.target.value }))}
                      />
                      <TextField
                        label="Comentariu"
                        fullWidth
                        multiline
                        rows={4}
                        margin="dense"
                        value={editPayload.comment}
                        onChange={(e) => setEditPayload(p => ({ ...p, comment: e.target.value }))}
                      />
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setEditDialogOpen(false)}>Anulează</Button>
                      <Button variant="contained" onClick={async () => {
                        try {
                          const id = editPayload.reviewId;
                          const body = { comment: editPayload.comment };
                          if (editPayload.score !== '') body.score = editPayload.score;
                          const resp = await apiClient.put(`/api/reviews/${id}`, body);
                          // update profile state with returned review
                          setProfile(prev => ({ ...prev, reviews: prev.reviews.map(rr => rr._id === id ? ({ ...rr, comment: resp.data.review.comment, score: resp.data.review.score }) : rr) }));
                          setEditDialogOpen(false);
                        } catch (e) {
                          console.error('Edit review error', e);
                          alert('A apărut o eroare la editare.');
                        }
                      }}>Salvează</Button>
                    </DialogActions>
                  </Dialog>

                  {/* Delete confirmation dialog */}
                  <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirmare ștergere</DialogTitle>
                    <DialogContent dividers>
                      <Typography>Ești sigur(ă) că vrei să ștergi această recenzie? Această acțiune nu poate fi anulată.</Typography>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setDeleteDialogOpen(false)}>Anulează</Button>
                      <Button color="error" variant="contained" onClick={async () => {
                        try {
                          const id = deleteTargetId;
                          await apiClient.delete(`/api/reviews/${id}`);
                          setProfile(prev => ({ ...prev, reviews: prev.reviews.filter(rr => rr._id !== id) }));
                        } catch (e) {
                          console.error('Delete review error', e);
                          alert('A apărut o eroare la ștergere.');
                        } finally {
                          setDeleteDialogOpen(false);
                        }
                      }}>Șterge</Button>
                    </DialogActions>
                  </Dialog>
                </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}
