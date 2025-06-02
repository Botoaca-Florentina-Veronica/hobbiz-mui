import React, { useEffect, useState } from 'react';
import apiClient from '../api/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get('/api/users/profile');
        setProfile(res.data);
      } catch (e) {
        setProfile({}); // fallback to empty
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="profile-container">
      <div className="profile-header">
        {profile && profile.avatar ? (
          <img src={profile.avatar} alt="avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar" />
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
          <span className="profile-edit-link">Editează</span>
        </div>
        <div className="profile-info-list">
          <div className="profile-info-item">
            <span className="profile-info-label">Nume</span>
            <span className="profile-info-value">{profile && (profile.firstName || profile.lastName) ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '-'}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Localitate</span>
            <span className="profile-info-value">{profile && profile.localitate ? profile.localitate : '-'}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Număr de telefon</span>
            <span className="profile-info-value">{profile && profile.phone ? profile.phone : 'Nespecificat'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
