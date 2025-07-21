import React, { useEffect, useState } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useParams } from 'react-router-dom';
import apiClient from '../api/api';
import './AnnouncementDetails.css';
import SellerDetails from '../components/SellerDetails';
import Header from '../components/Header';

export default function AnnouncementDetails() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  // Favorite logic
  const userId = localStorage.getItem('userId');
  const FAVORITES_KEY = userId ? `favoriteAnnouncements_${userId}` : 'favoriteAnnouncements_guest';
  const [isFavorite, setIsFavorite] = useState(false);

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
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    setIsFavorite(favs.includes(announcement._id));
  }, [announcement, FAVORITES_KEY]);

  const handleToggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    let updated;
    if (favs.includes(announcement._id)) {
      updated = favs.filter(fid => fid !== announcement._id);
    } else {
      updated = [...favs, announcement._id];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setIsFavorite(updated.includes(announcement._id));
  };

  if (loading) return <div>Se încarcă detaliile anunțului...</div>;
  if (!announcement) return <div>Anunțul nu a fost găsit.</div>;

  return (
    <>
      <Header />
      <div className="announcement-details-container">
      <div className="announcement-details-image-wrapper">
        {announcement.images && announcement.images[0] ? (
          <img
            src={announcement.images[0].startsWith('http') || announcement.images[0].startsWith('/uploads')
              ? announcement.images[0]
              : `/uploads/${announcement.images[0].replace(/^.*[\\/]/, '')}`}
            alt="imagine anunț"
            className="announcement-details-image"
          />
        ) : (
          <div className="announcement-details-image announcement-details-image-placeholder" />
        )}
      </div>
      <div className="announcement-details-content">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
          <span style={{color: '#355070', fontSize: 18}}>
            {announcement.createdAt ? `Postat ${new Date(announcement.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
          </span>
          <div className="favorite-heart"
            style={{ position: 'relative', right: 0, bottom: 0, cursor: 'pointer', transition: 'transform 0.2s', zIndex: 2 }}
            onClick={handleToggleFavorite}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <FavoriteIcon sx={{ color: isFavorite ? 'red' : '#355070', fontSize: 32 }} />
          </div>
        </div>
        <h1 className="announcement-details-title">{announcement.title}</h1>
        <div className="announcement-details-description">{announcement.description}</div>
      </div>
      <SellerDetails 
        user={{
          ...announcement.user,
          contactPerson: announcement.contactPerson // trimite numele de contact ca prop în user
        }}
        contactPhone={announcement.contactPhone}
        contactEmail={announcement.contactEmail}
      />
      </div>
    </>
  );
}
