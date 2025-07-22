import React, { useEffect, useState, useRef } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useParams } from 'react-router-dom';
import apiClient from '../api/api';
import './AnnouncementDetails.css';
import SellerDetails from '../components/SellerDetails';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AnnouncementDetails() {
  const { id } = useParams();
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
  // Tooltip favorite
  const [favHover, setFavHover] = useState(false);

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

  const images = announcement.images || [];
  const showArrows = images.length > 1;
  const getImageSrc = (img) =>
    img.startsWith('http') || img.startsWith('/uploads')
      ? img
      : `/uploads/${img.replace(/^.*[\\/]/, '')}`;
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

  return (
    <>
      <Header />
      <div className="announcement-details-container">
        <div className="announcement-details-image-wrapper" style={{position: 'relative'}}>
          {images.length > 0 ? (
            <>
            <img
              src={getImageSrc(images[imgIndex])}
              alt={`imagine ${imgIndex + 1}`}
              className="announcement-details-image"
              style={{ opacity: fade ? 1 : 0 }}
            />
              {showArrows && (
                <>
                  <button
                    className="announcement-details-nav-btn left"
                    onClick={handlePrev}
                    aria-label="Imagine anterioară"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                  </button>
                  <button
                    className="announcement-details-nav-btn right"
                    onClick={handleNext}
                    aria-label="Imagine următoare"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>
                  </button>
                  <div style={{position:'absolute',bottom:12,right:16,background:'#fff8',borderRadius:8,padding:'2px 10px',fontSize:14}}>{imgIndex+1}/{images.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="announcement-details-image announcement-details-image-placeholder" />
          )}
        </div>
        <div className="announcement-details-content">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <span style={{color: '#355070', fontSize: 18}}>
              {announcement.createdAt ? `Postat ${new Date(announcement.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
            </span>
            <div
              className="favorite-heart"
              style={{ position: 'relative', right: 0, bottom: 0, cursor: 'pointer', transition: 'transform 0.2s', zIndex: 2, display: 'inline-block' }}
              onClick={handleToggleFavorite}
              onMouseEnter={e => { setFavHover(true); e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={e => { setFavHover(false); e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {/* Tooltip modern */}
              {favHover && (
                <div style={{
                  position: 'absolute',
                  right: 36,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#fff',
                  color: '#043136',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  zIndex: 10,
                  minHeight: 24,
                  letterSpacing: 0.1,
                }}>
                  {isFavorite ? 'Sterge din Salvate' : 'Salvează ca favorit'}
                </div>
              )}
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
      <Footer />
    </>
  );
}
