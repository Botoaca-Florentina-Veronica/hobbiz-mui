import React, { useEffect, useState } from 'react';
import apiClient from '../api/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', localitate: '', phone: '' });
  const fileInputRef = React.useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get('/api/users/profile');
        setProfile(res.data);
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          localitate: res.data.localitate || '',
          phone: res.data.phone || ''
        });
      } catch (e) {
        setProfile({}); // fallback to empty
      }
    }
    fetchProfile();
  }, []);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      localitate: profile?.localitate || '',
      phone: profile?.phone || ''
    });
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    try {
      await apiClient.put('/api/users/profile', form);
      setProfile({ ...profile, ...form });
      setEditMode(false);
    } catch (e) {
      // handle error
    }
  };

  // ...existing code...
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      // Presupunem că endpoint-ul /api/users/avatar salvează imaginea și returnează url-ul nou
      const res = await apiClient.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Șterge avatarul vechi dacă există
      if (profile?.avatar) {
        await apiClient.delete('/api/users/avatar', { data: { url: profile.avatar } });
      }
      setProfile({ ...profile, avatar: res.data.avatar });
    } catch (err) {
      // handle error
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleAvatarChange}
        />
        {profile && profile.avatar ? (
          <img
            src={profile.avatar}
            alt="avatar"
            className="profile-avatar"
            style={{ cursor: 'pointer', opacity: avatarUploading ? 0.5 : 1 }}
            onClick={handleAvatarClick}
          />
        ) : (
          <div
            className="profile-avatar"
            style={{ cursor: 'pointer', opacity: avatarUploading ? 0.5 : 1 }}
            onClick={handleAvatarClick}
          />
        )}
        <div>
          <span className="profile-private">CONT PRIVAT</span>
          <h1 className="profile-title">Editează-ți profilul</h1>
          <a href="#" className="profile-view-link">Vezi cum îți văd alții profilul</a>
        </div>
      </div>
      <div className="profile-info-card">
        <div className="profile-info-header">
          <span>INFORMAȚII DE BAZĂ</span>
          {!editMode && <span className="profile-edit-link" onClick={handleEdit}>Editează</span>}
        </div>
        <div className="profile-info-list">
          <div className="profile-info-item">
            <span className="profile-info-label">Nume</span>
            {editMode ? (
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="profile-input"
                placeholder="Nume"
              />
            ) : (
              <span className="profile-info-value">{profile && profile.lastName ? profile.lastName : '-'}</span>
            )}
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Prenume</span>
            {editMode ? (
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="profile-input"
                placeholder="Prenume"
              />
            ) : (
              <span className="profile-info-value">{profile && profile.firstName ? profile.firstName : '-'}</span>
            )}
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Localitate</span>
            {editMode ? (
              <input
                type="text"
                name="localitate"
                value={form.localitate}
                onChange={handleChange}
                className="profile-input"
                placeholder="Localitate"
              />
            ) : (
              <span className="profile-info-value">{profile && profile.localitate ? profile.localitate : '-'}</span>
            )}
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Număr de telefon</span>
            {editMode ? (
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="profile-input"
                placeholder="Număr de telefon"
              />
            ) : (
              <span className="profile-info-value">{profile && profile.phone ? profile.phone : 'Nespecificat'}</span>
            )}
          </div>
        </div>
        {editMode && (
          <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
            <button className="profile-cancel-btn" onClick={handleCancel}>Renunță</button>
            <button className="profile-save-btn" onClick={handleSave}>Salvează</button>
          </div>
        )}
      </div>
    </div>
  );
}
