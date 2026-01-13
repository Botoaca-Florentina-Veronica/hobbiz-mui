/**
 * ProfilePage Component
 * 
 * Gestionează afișarea și editarea profilului utilizatorului
 * Structură:
 * - Header cu cover image și avatar
 * - Card cu informații de contact
 * - Card cu locația pe hartă
 * - Sidebar cu anunțurile utilizatorului
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api/api';
import ImageCropModal from '../components/ImageCropModal';
import LocationSelector from '../components/LocationSelector';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // Profile data & form
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    localitate: '',
    phone: '',
    website: '',
    social: '',
    bio: ''
  });

  // Loading & UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  
  // Messages & errors
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Announcements
  const [userAnnouncements, setUserAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  
  // UI preferences
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const carouselRef = useRef(null);

  // ============================================
  // EFFECTS
  // ============================================
  
  
  // Detectare Dark Mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains('dark-mode'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Încărcare date profil
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
          phone: res.data.phone || '',
          website: res.data.website || '',
          social: res.data.social || '',
          bio: res.data.bio || ''
        });
      } catch (e) {
        setError('profile.messages.errorLoadingProfile');
        setProfile({});
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Încărcare anunțuri utilizator
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

  // ============================================
  // EVENT HANDLERS - Profile Edit
  // ============================================

  // ============================================
  // EVENT HANDLERS - Profile Edit
  // ============================================

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleLocationEdit = () => {
    setLocationModalOpen(true);
  };

  const handleLocationSave = async (newLocation) => {
    try {
      setSaving(true);
      setError('');
      await apiClient.put('/api/users/profile', { localitate: newLocation });
      setProfile({ ...profile, localitate: newLocation });
      setLocationModalOpen(false);
      setSuccess('profile.messages.locationUpdated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('profile.messages.errorSavingLocation');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    setForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      localitate: profile?.localitate || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      social: profile?.social || '',
      bio: profile?.bio || ''
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
      setSuccess('profile.messages.profileUpdated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('profile.messages.errorSavingProfile');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // EVENT HANDLERS - Image Upload
  // ============================================

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleCoverClick = () => {
    setCropModalOpen(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.post('/api/users/avatar', formData);

      setProfile({ ...profile, avatar: res.data.avatar });

      // Best-effort removal of old avatar
      if (profile?.avatar) {
        try {
          await apiClient.delete('/api/users/avatar', {
            data: { url: profile.avatar }
          });
        } catch (_) {}
      }
      
      setSuccess('profile.messages.avatarUpdated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('profile.messages.errorUploadingImage');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverSave = async (file) => {
    if (!file) return;

    setCoverUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await apiClient.post('/api/users/cover', formData);
      setProfile({ ...profile, coverImage: res.data.coverImage });
      setSuccess('profile.messages.coverUpdated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('profile.messages.errorUploadingCover');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverDelete = async () => {
    if (!profile?.coverImage) return;
    setCoverUploading(true);
    setError('');
    try {
      await apiClient.delete('/api/users/cover', {
        data: { url: profile.coverImage }
      });
      setProfile({ ...profile, coverImage: null });
      setSuccess('profile.messages.coverDeleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Eroare la ștergerea copertei:', err);
      setError('profile.messages.errorDeletingCover');
    } finally {
      setCoverUploading(false);
    }
  };

  // ============================================
  // EVENT HANDLERS - Navigation
  // ============================================

  const handleAnnouncementClick = (announcementId) => {
    navigate(`/announcement/${announcementId}`);
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="profile-page-container">
      <div className="profile-loading-container">
        <CircularProgress className="profile-loading-spinner" />
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="mobile-header">
      <IconButton
        onClick={handleBackClick}
        className="mobile-back-btn"
        disableRipple
        disableFocusRipple
        aria-label={t('profile.back')}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" className="mobile-header-title">
        {t('profile.mobileTitle')}
      </Typography>
    </div>
  );

  const renderAlerts = () => (
    <>
      {error && (
        <Fade in={!!error}>
          <Alert severity="error" className="profile-alert">
            {t(error) || error}
          </Alert>
        </Fade>
      )}
      {success && (
        <Fade in={!!success}>
          <Alert severity="success" className="profile-alert">
            {t(success) || success}
          </Alert>
        </Fade>
      )}
    </>
  );

  const renderCoverSection = () => (
    <div className="profile-cover-container">
      <div
        className={`profile-cover ${profile?.coverImage ? 'has-image' : ''}`}
        style={{
          backgroundImage: profile?.coverImage
            ? `url(${profile.coverImage})`
            : 'none'
        }}
      >
        <button
          className="profile-cover-upload-btn"
          onClick={handleCoverClick}
          disabled={coverUploading}
          aria-label={t('profile.editCover')}
          title={t('profile.editCover')}
        >
          {coverUploading ? (
            <CircularProgress
              className="profile-loading-spinner-small"
              style={{ color: 'white' }}
            />
          ) : (
            <>
              <EditIcon className="profile-icon" />
              {t('profile.edit')}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderAvatarSection = () => (
    <div className="profile-avatar-container-unified">
      <input
        type="file"
        accept="image/*"
        className="profile-hidden-input"
        ref={fileInputRef}
        onChange={handleAvatarChange}
      />
      <div
        className={`profile-avatar-unified ${
          avatarUploading ? 'uploading' : ''
        }`}
        onClick={handleAvatarClick}
      >
        {profile?.avatar ? (
          <img
            src={profile.avatar}
            alt={t('profile.editAvatar')}
            className="profile-avatar-image"
          />
        ) : (
          <PersonIcon className="profile-person-icon" />
        )}
      </div>
      <button
        className="profile-camera-button-unified"
        onClick={handleAvatarClick}
        disabled={avatarUploading}
      >
        {avatarUploading ? (
          <CircularProgress
            className="profile-loading-spinner-small"
            style={{ color: 'white' }}
          />
        ) : (
          <PhotoCameraIcon className="profile-camera-icon" />
        )}
      </button>
    </div>
  );

  const renderNameSection = () => {
    const fullName =
      (profile?.firstName || '') +
      (profile?.lastName ? ' ' + profile.lastName : '') ||
      t('profile.mobileTitle');

    return (
      <div className="profile-name-section">
        <div className="profile-name-header">
          <div className="profile-name-info">
            <h1 className="profile-name-title-unified">{fullName}</h1>
            <div className="profile-verified-badge">
              <span className="profile-verified-icon">✓</span>
              <span className="profile-verified-text">{t('profile.verifiedMember')}</span>
            </div>
            <div className="profile-member-since">
              {t('profile.memberSince')} {profile?.createdAt
                ? new Date(profile.createdAt).getFullYear()
                : ''}
            </div>
          </div>
          <button className="profile-edit-profile-button" onClick={handleEdit}>
            {t('profile.editProfile')}
          </button>
        </div>
      </div>
    );
  };

  const renderProfileHeader = () => (
    <div className="profile-header-unified">
      {renderCoverSection()}
      <div className="profile-info-card">
        {renderAvatarSection()}
        {renderNameSection()}
      </div>
    </div>
  );

  const renderLocationCard = () => (
    <div className="profile-location-card">
      <div className="profile-location-header">
        <h2 className="profile-info-main-title">{t('profile.myLocation')}</h2>
        <button className="profile-edit-button" onClick={handleLocationEdit}>
          {t('profile.changeLocation')}
        </button>
      </div>
      <div className="profile-location-map">
        <div className="profile-location-map-frame">
          <iframe
            title="Harta locației"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              profile?.localitate || 'Romania'
            )}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );

  const renderContactField = (icon, label, value) => (
    <div className="contact-row">
      <div className="contact-icon-wrapper">{icon}</div>
      <div className="contact-field">
        <div className="contact-label">{label}</div>
        <div className={`contact-value ${!value ? 'unspecified' : ''}`}>
          {value || t('profile.unspecified')}
        </div>
      </div>
    </div>
  );

  const renderContactReadMode = () => (
    <div className="contact-list">
      {renderContactField(
        <EmailIcon />,
        t('profile.email'),
        profile?.email
      )}
      {renderContactField(
        <PhoneIcon />,
        t('profile.phone'),
        profile?.phone
      )}
      {renderContactField(
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>,
        t('profile.website'),
        profile?.website
      )}
      {renderContactField(
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>,
        t('profile.social'),
        profile?.social
      )}
    </div>
  );

  const renderMobileProfileHeader = () => (
    <div className="mobile-profile-header-card">
      <div className="mobile-avatar-container">
        {profile?.avatar ? (
          <img src={profile.avatar} alt="Avatar" className="mobile-avatar-image" />
        ) : (
          <div className="mobile-avatar-placeholder">
            <PersonIcon className="mobile-avatar-icon" />
          </div>
        )}
        <button
          className="mobile-camera-button"
          onClick={handleAvatarClick}
          disabled={avatarUploading}
        >
          {avatarUploading ? (
            <CircularProgress size={16} style={{ color: 'white' }} />
          ) : (
            <PhotoCameraIcon className="mobile-camera-icon" />
          )}
        </button>
      </div>
      <div className="mobile-profile-info">
        <div className="mobile-rating-badge">
          <span className="mobile-rating-star">★</span>
          <span className="mobile-rating-text">—</span>
        </div>
        <h1 className="mobile-user-name">
          {(profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '') || t('profile.mobileTitle')}
        </h1>
        <p className="mobile-register-date">
          {t('profile.memberSince')} {profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString(i18n?.language === 'en' ? 'en-US' : 'ro-RO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : ''}
        </p>
      </div>
    </div>
  );

  const renderMobileLocationSection = () => (
    <div className="mobile-location-section">
      <div className="mobile-location-header">
        <h2 className="mobile-section-title">{t('profile.myLocation')}</h2>
        <button className="mobile-change-location-btn" onClick={handleLocationEdit}>
          {t('profile.changeLocation')}
        </button>
      </div>
      <div className="mobile-map-container">
        {profile?.localitate ? (
          <iframe
            title="Locație"
            src={`https://www.google.com/maps?q=${encodeURIComponent(profile.localitate)}&z=15&output=embed`}
            className="mobile-map-iframe"
            loading="lazy"
          />
        ) : (
          <div className="mobile-map-placeholder">
            <LocationOnIcon style={{ fontSize: 48, color: '#999' }} />
            <p className="mobile-map-text">{t('profile.unspecified')}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileContactCard = () => (
    <div className="mobile-contact-card">
      <div className="mobile-card-header">
        <h2 className="mobile-card-title">{t('profile.contactInfoTitle')}</h2>
        {!editMode && (
          <button className="mobile-edit-button" onClick={handleEdit}>
            {t('profile.actions.edit')}
          </button>
        )}
      </div>
      <div className="mobile-contact-grid">
        {editMode ? (
          <>
            <div className="mobile-contact-item">
              <PersonIcon className="mobile-contact-icon" />
              <div className="mobile-contact-content">
                <label className="mobile-contact-label">{t('profile.lastName')}</label>
                <input
                  className="mobile-contact-input"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder={t('profile.placeholders.lastName')}
                />
              </div>
            </div>
            <div className="mobile-contact-item">
              <PersonIcon className="mobile-contact-icon" />
              <div className="mobile-contact-content">
                <label className="mobile-contact-label">{t('profile.firstName')}</label>
                <input
                  className="mobile-contact-input"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder={t('profile.placeholders.firstName')}
                />
              </div>
            </div>
            <div className="mobile-contact-item">
              <PhoneIcon className="mobile-contact-icon" />
              <div className="mobile-contact-content">
                <label className="mobile-contact-label">{t('profile.phone')}</label>
                <input
                  className="mobile-contact-input"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t('profile.placeholders.phone')}
                />
              </div>
            </div>
            <div className="mobile-contact-item">
              <EmailIcon className="mobile-contact-icon" />
              <div className="mobile-contact-content">
                <label className="mobile-contact-label">{t('profile.email')}</label>
                <div className="mobile-contact-value">{profile?.email || 'N/A'}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {renderContactField(<PersonIcon />, t('profile.lastName'), profile?.lastName)}
            {renderContactField(<PersonIcon />, t('profile.firstName'), profile?.firstName)}
            {renderContactField(<PhoneIcon />, t('profile.phone'), profile?.phone)}
            {renderContactField(<EmailIcon />, t('profile.email'), profile?.email)}
          </>
        )}
      </div>
      {editMode && (
        <div className="mobile-edit-actions">
          <button className="mobile-action-button mobile-cancel-button" onClick={handleCancel} disabled={saving}>
            <CancelIcon className="profile-icon" />
            {t('profile.actions.cancel')}
          </button>
          <button className="mobile-action-button mobile-save-button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <CircularProgress size={16} style={{ color: 'white' }} />
                <span>{t('profile.actions.saving')}</span>
              </>
            ) : (
              <>
                <SaveIcon className="profile-icon" />
                {t('profile.actions.save')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const renderAnnouncementCard = (announcement) => (
    <div
      key={announcement._id}
      onClick={() => handleAnnouncementClick(announcement._id)}
      className="announcement-card-vertical"
    >
      {announcement.images && announcement.images.length > 0 ? (
        <img
          src={announcement.images[0]}
          alt={announcement.title}
          className="announcement-image"
        />
      ) : (
        <div className="announcement-image-placeholder">{t('profile.noImage')}</div>
      )}

      <div className="announcement-card-body">
        <h4 className="announcement-title">{announcement.title}</h4>

        {announcement.price && (
          <p className="announcement-price">{announcement.price} lei</p>
        )}

        <p className="announcement-location">{announcement.localitate}</p>
      </div>
    </div>
  );



  const renderInputField = (name, label, icon, placeholder) => (
    <div className="profile-field-container">
      <div className="profile-field-label">
        {icon}
        {label}
      </div>
      <input
        className="profile-field-input"
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );

  const renderContactEditMode = () => (
    <div className="profile-form-grid">
      <div className="profile-form-column">
          {renderInputField(
            'lastName',
            t('profile.lastName'),
            <PersonIcon className="profile-icon" />,
            t('profile.placeholders.lastName')
          )}
          {renderInputField(
            'firstName',
            t('profile.firstName'),
            <PersonIcon className="profile-icon" />,
            t('profile.placeholders.firstName')
          )}
      </div>
      <div className="profile-form-column">
          {renderInputField(
            'localitate',
            t('profile.myLocation'),
            <LocationOnIcon className="profile-icon" />,
            t('profile.placeholders.localitate')
          )}
          {renderInputField(
            'phone',
            t('profile.phone'),
            <PhoneIcon className="profile-icon" />,
            t('profile.placeholders.phone')
          )}
      </div>
    </div>
  );

  const renderEditActions = () => (
    <>
      <hr className="profile-actions-divider" />
      <div className="profile-actions-container">
        <button
          className="profile-action-button cancel"
          onClick={handleCancel}
          disabled={saving}
        >
          <CancelIcon className="profile-icon" />
          {t('profile.actions.cancel')}
        </button>
        <button
          className="profile-action-button save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <CircularProgress
                className="profile-loading-spinner-small"
                style={{ color: 'white' }}
              />
              <span className="profile-loading-text">{t('profile.actions.saving')}</span>
            </>
          ) : (
            <>
              <SaveIcon className="profile-icon" />
              {t('profile.actions.save')}
            </>
          )}
        </button>
      </div>
    </>
  );

  const renderProfileStats = () => {
    const total = userAnnouncements.length;
    const active = userAnnouncements.filter(a => a.status === 'active').length;
    const views = userAnnouncements.reduce((sum, a) => sum + (a.views || 0), 0);
    const viewsFormatted = views > 999 ? `${(views / 1000).toFixed(1)}k` : views;

    return (
      <div className="profile-stats-card">
        <h2 className="profile-stats-title">{t('profile.profileStats')}</h2>
        <div className="profile-stats-list">
          <div className="profile-stat-row">
            <div className="profile-stat-left">
              <div className="profile-stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
              </div>
              <div className="profile-stat-label">{t('profile.totalListings')}</div>
            </div>
            <div className="profile-stat-value-right">{total}</div>
          </div>

          <div className="profile-stat-row">
            <div className="profile-stat-left">
              <div className="profile-stat-icon profile-stat-icon-green">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
              <div className="profile-stat-label">{t('profile.activeSales')}</div>
            </div>
            <div className="profile-stat-value-right">{active}</div>
          </div>

          <div className="profile-stat-row">
            <div className="profile-stat-left">
              <div className="profile-stat-icon profile-stat-icon-purple">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              </div>
              <div className="profile-stat-label">{t('profile.profileViews')}</div>
            </div>
            <div className="profile-stat-value-right">{viewsFormatted}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAboutMe = () => (
    <div className="profile-about-card">
      <h2 className="profile-about-title">{t('profile.aboutMe')}</h2>
      <p className="profile-about-text">
        {profile?.bio || (editMode ? (
          <textarea
            className="profile-about-textarea"
            name="bio"
            value={form.bio || ''}
            onChange={handleChange}
            placeholder={t('profile.placeholders.bio')}
            rows={4}
          />
        ) : (
          t('profile.noBio')
        ))}
      </p>
    </div>
  );



  const renderContactInfoCard = () => (
    <div className="profile-info-main-card">
      <div className="profile-info-content">
        <div className="profile-info-header-section">
          <h2 className="profile-info-main-title">{t('profile.contactInfoTitle')}</h2>
          {!editMode && (
            <button className="profile-edit-button" onClick={handleEdit}>
              <EditIcon className="profile-icon" />
              {t('profile.actions.edit')}
            </button>
          )}
        </div>

        <hr className="profile-divider" />

        {editMode ? renderContactEditMode() : renderContactReadMode()}

        {editMode && renderEditActions()}
      </div>
    </div>
  );

  const renderAnnouncementsSidebar = () => (
    <div className="profile-right-column">
      <div className="profile-announcements-sidebar">
        <div className="profile-announcements-header">
          <h3 className="profile-section-title">{t('profile.myAnnouncements')} ({userAnnouncements.length})</h3>
          <button className="profile-view-all-button" onClick={() => navigate('/my-announcements')}>{t('profile.viewAll')}</button>
        </div>

        {announcementsLoading ? (
          <Box className="profile-announcements-loading">
            <CircularProgress size={20} />
            <span className="profile-loading-inline-text">{t('profile.loading')}</span>
          </Box>
        ) : userAnnouncements.length === 0 ? (
          <Box className="profile-empty-state">{t('profile.emptyAnnouncements')}</Box>
        ) : (
          <div className="profile-announcements-vertical">
            {userAnnouncements
              .slice()
              .sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))
              .slice(0, 3)
              .map(renderAnnouncementCard)
            }
          </div>
        )}
        {!announcementsLoading && (
          <div className="profile-announcements-footer">
            <button className="profile-create-listing-button" onClick={() => navigate('/add-announcement')}>
              {t('profile.createNewListing')}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return renderLoadingState();
  }

  return (
    <div className="profile-page-container">
      {renderMobileHeader()}
      {renderAlerts()}

      {/* Desktop Layout */}
      <div className="profile-desktop-layout">
        {renderProfileHeader()}
        <div className="profile-two-column-layout">
          {/* Left column - Main content */}
          <div className="profile-left-column">
            <div className="profile-left-main">
              <div className="profile-grid-left">
                {renderContactInfoCard()}
                {renderAboutMe()}
              </div>
              {renderLocationCard()}
            </div>
          </div>

          {/* Right column - Sidebar */}
          <div className="profile-right-column">
            {renderProfileStats()}
            {renderAnnouncementsSidebar()}
          </div>
        </div>
      </div> 

      {/* Mobile Layout */}
      <div className="profile-mobile-layout">
        {renderMobileProfileHeader()}
        {renderMobileLocationSection()}
        {renderMobileContactCard()}
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        currentImage={profile?.coverImage}
        onSave={handleCoverSave}
        onDelete={handleCoverDelete}
        uploading={coverUploading}
      />

      {/* Location Selector Modal */}
      <LocationSelector
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={profile?.localitate}
        onSave={handleLocationSave}
        saving={saving}
      />
    </div>
  );
}

