import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import './ProfilePage.css';
import apiClient from '../api/api';

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
      <div className="profile-page-container">
        <div className="profile-loading-container">
          <CircularProgress className="profile-loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
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
    </div>
  );
}
