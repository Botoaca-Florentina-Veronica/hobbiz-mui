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
    phone: ''
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
          phone: res.data.phone || ''
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
        <h1 className="profile-name-title-unified">{fullName}</h1>
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
      <div className="contact-icon">{icon}</div>
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
        <PersonIcon />,
        t('profile.lastName'),
        profile?.lastName
      )}
      {renderContactField(
        <PersonIcon />,
        t('profile.firstName'),
        profile?.firstName
      )}
      {renderContactField(
        <PhoneIcon />,
        t('profile.phone'),
        profile?.phone
      )}
      {renderContactField(
        <EmailIcon />,
        t('profile.email'),
        profile?.email
      )}
      {renderContactField(
        <CalendarMonthIcon />,
        t('profile.memberSince'),
        profile?.createdAt
          ? new Date(profile.createdAt).toLocaleDateString(i18n?.language === 'en' ? 'en-US' : 'ro-RO', {
              year: 'numeric',
              month: 'long',
              day: '2-digit'
            })
          : null
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

  const renderMobileAnnouncementsCard = () => (
    <div className="mobile-announcements-card">
      <div className="mobile-card-header">
        <h2 className="mobile-card-title">
          {t('header.myAnnouncements') || 'Anunțurile mele'}
        </h2>
        <button
          className="mobile-view-all-icon"
          onClick={() => navigate('/my-announcements')}
          aria-label="Vezi toate"
        >
          →
        </button>
      </div>
      <div className="mobile-announcement-stats">
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{userAnnouncements.length}</div>
          <div className="mobile-stat-label">Active</div>
        </div>
        <div className="mobile-stat-divider" />
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{userAnnouncements.length}</div>
          <div className="mobile-stat-label">Total</div>
        </div>
        <div className="mobile-stat-divider" />
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">
            {userAnnouncements.reduce((sum, a) => sum + (a.views || 0), 0)}
          </div>
          <div className="mobile-stat-label">Views</div>
        </div>
      </div>
      {announcementsLoading ? (
        <Box className="mobile-announcements-loading">
          <CircularProgress size={20} />
        </Box>
      ) : userAnnouncements.length === 0 ? (
        <Box className="mobile-empty-announcements">
          <p>{t('profile.emptyAnnouncements')}</p>
        </Box>
      ) : (
        <div className="mobile-announcements-horizontal">
          {userAnnouncements.slice(0, 5).map(renderAnnouncementCard)}
        </div>
      )}
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
        <h3 className="profile-section-title">
          Anunțurile mele ({userAnnouncements.length})
        </h3>

        {announcementsLoading ? (
          <Box className="profile-announcements-loading">
            <CircularProgress size={20} />
            <span className="profile-loading-inline-text">{t('profile.loading')}</span>
          </Box>
        ) : userAnnouncements.length === 0 ? (
          <Box className="profile-empty-state">{t('profile.emptyAnnouncements')}</Box>
        ) : (
          <div className="profile-announcements-vertical">
            {userAnnouncements.map(renderAnnouncementCard)}
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
        <div className="profile-two-column-layout">
          {/* Left column - Main content */}
          <div className="profile-left-column">
            {renderProfileHeader()}
            {renderLocationCard()}
            {renderContactInfoCard()}
          </div>

          {/* Right column - Announcements */}
          {renderAnnouncementsSidebar()}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="profile-mobile-layout">
        {renderMobileProfileHeader()}
        {renderMobileLocationSection()}
        {renderMobileContactCard()}
        {renderMobileAnnouncementsCard()}
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

