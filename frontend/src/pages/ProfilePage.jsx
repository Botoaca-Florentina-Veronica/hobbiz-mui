import React, { useEffect, useState } from 'react';
import {
  Alert,
  CircularProgress,
  Fade
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
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import apiClient from '../api/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', localitate: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
