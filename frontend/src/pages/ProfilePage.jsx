import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', localitate: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userAnnouncements, setUserAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const carouselRef = useRef(null);

  // Detectează dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    
    checkDarkMode();
    
    // Observer pentru schimbări de clasă pe body
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleScroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  const handleAnnouncementClick = (announcementId) => {
    navigate(`/announcement/${announcementId}`);
  };

  // Culori în funcție de tema activă
  const getPrimaryColor = () => isDarkMode ? '#f51866' : '#355070';
  const getScrollbarColor = () => isDarkMode ? '#f51866' : '#355070';

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError('');
        const res = await apiClient.get('/api/users/profile');
        setProfile(res.data);
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          localitate: res.data.localitate || '',
          phone: res.data.phone || ''
        });
      } catch (e) {
        setError('Eroare la încărcarea profilului');
        setProfile({});
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Încarcă anunțurile utilizatorului
  useEffect(() => {
    async function fetchUserAnnouncements() {
      try {
        setAnnouncementsLoading(true);
        const res = await apiClient.get('/api/users/my-announcements');
        setUserAnnouncements(res.data);
      } catch (error) {
        console.error('Eroare la încărcarea anunțurilor:', error);
        setUserAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    }
    fetchUserAnnouncements();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    setForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      localitate: profile?.localitate || '',
      phone: profile?.phone || ''
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await apiClient.put('/api/users/profile', form);
      setProfile({ ...profile, ...form });
      setEditMode(false);
      setSuccess('Profilul a fost actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Eroare la salvarea profilului');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (profile?.avatar) {
        await apiClient.delete('/api/users/avatar', { data: { url: profile.avatar } });
      }
      
      setProfile({ ...profile, avatar: res.data.avatar });
      setSuccess('Avatar actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Eroare la încărcarea imaginii');
    } finally {
      setAvatarUploading(false);
    }
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
      {/* Mobile header: back + title */}
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
      {/* Alerts */}
      {error && (
        <Fade in={!!error}>
          <Alert severity="error" className="profile-alert">
            {error}
          </Alert>
        </Fade>
      )}
      {success && (
        <Fade in={!!success}>
          <Alert severity="success" className="profile-alert">
            {success}
          </Alert>
        </Fade>
      )}

      {/* Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-grid">
          <div className="profile-avatar-container">
            <input
              type="file"
              accept="image/*"
              className="profile-hidden-input"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <div
              className={`profile-avatar-main ${avatarUploading ? 'uploading' : ''}`}
              onClick={handleAvatarClick}
            >
              {profile?.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt="Avatar" 
                  className="profile-avatar-image"
                />
              ) : (
                <PersonIcon className="profile-person-icon" />
              )}
            </div>
            <button
              className="profile-camera-button"
              onClick={handleAvatarClick}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <CircularProgress className="profile-loading-spinner-small" style={{color: 'white'}} />
              ) : (
                <PhotoCameraIcon className="profile-camera-icon" />
              )}
            </button>
          </div>
          <div className="profile-header-info">
            <span className="profile-private-chip">CONT PRIVAT</span>
            <h1 className="profile-main-title">Editează-ți profilul</h1>
            <button className="profile-view-button">
              <VisibilityIcon className="profile-icon" />
              Vezi cum îți văd alții profilul
            </button>
          </div>
        </div>
      </div>
      {/* Profile Information Card */}
      <div className="profile-info-main-card">
        <div className="profile-info-content">
          <div className="profile-info-header-section">
            <h2 className="profile-info-main-title">INFORMAȚII DE BAZĂ</h2>
            {!editMode && (
              <button className="profile-edit-button" onClick={handleEdit}>
                <EditIcon className="profile-icon" />
                Editează
              </button>
            )}
          </div>

          <hr className="profile-divider" />

          <div className="profile-form-grid">
            <div className="profile-form-column">
              {/* Nume */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <PersonIcon className="profile-icon" />
                  Nume
                </div>
                {editMode ? (
                  <input
                    className="profile-field-input"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Introduceți numele"
                  />
                ) : (
                  <div className={`profile-field-value ${!profile?.lastName ? 'unspecified' : ''}`}>
                    {profile?.lastName || 'Nespecificat'}
                  </div>
                )}
              </div>

              {/* Prenume */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <PersonIcon className="profile-icon" />
                  Prenume
                </div>
                {editMode ? (
                  <input
                    className="profile-field-input"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Introduceți prenumele"
                  />
                ) : (
                  <div className={`profile-field-value ${!profile?.firstName ? 'unspecified' : ''}`}>
                    {profile?.firstName || 'Nespecificat'}
                  </div>
                )}
              </div>

              {/* Membru din (readonly) */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <CalendarMonthIcon className="profile-icon" />
                  Membru din
                </div>
                <div className="profile-field-value">
                  {profile?.createdAt 
                    ? new Date(profile.createdAt).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'long',
                        day: '2-digit'
                      })
                    : 'Nespecificat'
                  }
                </div>
              </div>
            </div>

            <div className="profile-form-column">
              {/* Localitate */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <LocationOnIcon className="profile-icon" />
                  Localitate
                </div>
                {editMode ? (
                  <input
                    className="profile-field-input"
                    name="localitate"
                    value={form.localitate}
                    onChange={handleChange}
                    placeholder="Introduceți localitatea"
                  />
                ) : (
                  <div className={`profile-field-value ${!profile?.localitate ? 'unspecified' : ''}`}>
                    {profile?.localitate || 'Nespecificat'}
                  </div>
                )}
              </div>

              {/* Telefon */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <PhoneIcon className="profile-icon" />
                  Număr de telefon
                </div>
                {editMode ? (
                  <input
                    className="profile-field-input"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Introduceți numărul de telefon"
                  />
                ) : (
                  <div className={`profile-field-value ${!profile?.phone ? 'unspecified' : ''}`}>
                    {profile?.phone || 'Nespecificat'}
                  </div>
                )}
              </div>

              {/* Email (readonly) */}
              <div className="profile-field-container">
                <div className="profile-field-label">
                  <EmailIcon className="profile-icon" />
                  Email
                </div>
                <div className="profile-field-value unspecified">
                  {profile?.email || 'Nespecificat'}
                </div>
              </div>
            </div>
          </div>

          {/* Secțiunea Anunțurile mele */}
          <>
            <hr className="profile-divider" />
            <div style={{ marginTop: '24px' }}>
              <h3 className="profile-section-title">
                Anunțurile mele ({userAnnouncements.length})
              </h3>
              {announcementsLoading ? (
                <Box className="profile-announcements-loading">
                  <CircularProgress size={20} />
                  <span className="profile-loading-inline-text">Se încarcă...</span>
                </Box>
              ) : userAnnouncements.length === 0 ? (
                <Box className="profile-empty-state">
                  Nu ai încă anunțuri.
                </Box>
              ) : (
                <Box className="profile-announcements-container">
                  {userAnnouncements.length > 3 && (
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
                    {userAnnouncements.map((announcement, index) => (
                      <Box 
                        key={announcement._id}
                        onClick={() => handleAnnouncementClick(announcement._id)}
                        className="profile-card-wrapper"
                      >
                        <Box className="announcement-card">
                          {announcement.images && announcement.images.length > 0 ? (
                            <img src={announcement.images[0]} alt={announcement.title} className="announcement-image" />
                          ) : (
                            <Box className="announcement-image-placeholder">
                              Fără imagine
                            </Box>
                          )}
                          
                          <Box className="announcement-card-body">
                            <h4 className="announcement-title">
                              {announcement.title}
                            </h4>
                            
                            {announcement.price && (
                              <p className="announcement-price">
                                {announcement.price} lei
                              </p>
                            )}
                            
                            <p className="announcement-location">
                              {announcement.localitate}
                            </p>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {userAnnouncements.length > 3 && (
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
          </>

          {editMode && (
            <>
              <hr className="profile-actions-divider" />
              <div className="profile-actions-container">
                <button
                  className="profile-action-button cancel"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <CancelIcon className="profile-icon" />
                  Renunță
                </button>
                <button
                  className="profile-action-button save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress className="profile-loading-spinner-small" style={{color: 'white'}} />
                      <span className="profile-loading-text">Se salvează...</span>
                    </>
                  ) : (
                    <>
                      <SaveIcon className="profile-icon" />
                      Salvează
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
