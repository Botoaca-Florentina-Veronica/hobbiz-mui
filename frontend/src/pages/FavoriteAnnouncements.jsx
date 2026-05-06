import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import './FavoriteAnnouncements.css';
import { useAuth } from '../context/AuthContext.jsx';
import gumballSiDarwin from '../assets/images/gumballSiDarwin.png';
import translateCategory from '../utils/translateCategory';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getImageSrc(images) {
  if (!images?.[0]) return null;
  const img = images[0];
  return img.startsWith('http') || img.startsWith('/uploads')
    ? img
    : `/uploads/${img.replace(/^.*[\\\\/]/, '')}`;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Toast({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1800);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="toast">
      <span className="toast-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2l4-4"/>
        </svg>
      </span>
      Șters din favorite
    </div>
  );
}

function MobileAppHeader({ count, onBack, t }) {
  return (
    <div className="favorites-app-header">
      <div className="favorites-app-header-left">
        <IconButton
          onClick={onBack}
          className="favorites-app-back-btn"
          disableRipple
          disableFocusRipple
          aria-label={t('common.back')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="favorites-app-header-title">
          {t('favorites.title')}
        </Typography>
      </div>
      <span className="favorites-app-count">{count}/150</span>
    </div>
  );
}

function MobileAppCard({ announcement: a, favorited, onToggle, onNavigate, t }) {
  const translatedCategory = translateCategory(a.category, t);
  const imageSrc = getImageSrc(a.images);

  return (
    <div
      className="favorites-app-card"
      onClick={(e) => {
        if (e.target.closest('.favorites-app-heart')) return;
        onNavigate(a._id);
      }}
    >
      <div className="favorites-app-image-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt="imagine principala" className="favorites-app-image" />
        ) : (
          <div className="favorites-app-image favorites-app-image-placeholder" />
        )}
        <div className="favorites-app-gradient" />

        <div
          className={`favorites-app-heart ${favorited ? 'filled' : ''}`}
          onClick={(ev) => { ev.stopPropagation(); onToggle(a._id); }}
        >
          {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </div>

        <div className="favorites-app-overlay-content">
          <div className="favorites-app-badges">
            <span className="favorites-app-badge category">
              {String(translatedCategory || '').toUpperCase()}
            </span>
            {a.location && (
              <span className="favorites-app-badge location">
                {String(a.location).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="favorites-app-title">{a.title}</h2>
        </div>
      </div>
    </div>
  );
}

function DesktopCard({ announcement: a, favorited, onToggle, onNavigate, t }) {
  const imageSrc = getImageSrc(a.images);
  const formattedDate = a.createdAt
    ? `${t('favorites.posted')} ${new Date(a.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}`
    : '';

  return (
    <div
      className="favorite-announcement-card"
      onClick={(e) => {
        if (e.target.closest('.favorite-heart')) return;
        onNavigate(a._id);
      }}
    >
      <div className="favorite-announcement-image">
        {imageSrc ? (
          <img src={imageSrc} alt="imagine principala" className="favorite-announcement-img" />
        ) : (
          <div className="favorite-announcement-img placeholder" />
        )}
      </div>
      <div className="favorite-announcement-info">
        <div className="favorite-info-top">
          <span className="favorite-date">{formattedDate}</span>
          <div
            className={`favorite-heart ${favorited ? 'filled' : ''}`}
            onClick={(ev) => { ev.stopPropagation(); onToggle(a._id); }}
          >
            {favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </div>
        </div>
        <h2 className="favorite-announcement-title">{a.title}</h2>
        <div className="favorite-announcement-category">{a.category}</div>
        <div className="favorite-announcement-location">{a.location}</div>
        {a.price && <div className="favorite-price">{a.price} €</div>}
      </div>
    </div>
  );
}

function FavoritesPagination({ currentPage, totalPages, onPageChange, t }) {
  return (
    <div className="pagination-container">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t('favorites.back')}
      </button>
      <div className="pagination-numbers">
        {[...Array(totalPages)].map((_, index) => {
          const pageNum = index + 1;
          const isVisible =
            pageNum === 1 ||
            pageNum === totalPages ||
            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
          const isEllipsis =
            pageNum === currentPage - 2 || pageNum === currentPage + 2;

          if (isVisible) {
            return (
              <button
                key={pageNum}
                className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          }
          if (isEllipsis) {
            return <span key={pageNum} className="pagination-dots">...</span>;
          }
          return null;
        })}
      </div>
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('favorites.next')}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function FavoriteAnnouncements() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, favorites: authFavoriteIds, fullFavorites, toggleFavorite } = useAuth() || {};

  // Guest localStorage fallback
  const guestUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const FAVORITES_KEY = guestUserId
    ? `favoriteAnnouncements_${guestUserId}`
    : 'favoriteAnnouncements_guest';

  const isAuthenticated = !!user;

  // Local state only used for guest mode
  const [guestFavoriteIds, setGuestFavoriteIds] = useState(() => {
    if (isAuthenticated) return [];
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        const converted = parsed.map(id => ({ id, addedAt: Date.now() }));
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(converted));
        return parsed;
      }
      return parsed.map(item => item.id);
    } catch { return []; }
  });

  const [guestFavoriteObjects, setGuestFavoriteObjects] = useState(() => {
    if (isAuthenticated) return [];
    const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed.map(id => ({ id, addedAt: Date.now() }));
      }
      return parsed;
    } catch { return []; }
  });

  const [guestAnnouncements, setGuestAnnouncements] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth
  );

  // Track viewport width for mobile/desktop layout switching
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setViewportWidth(window.innerWidth);
    const media = window.matchMedia('(max-width: 1024px)');

    window.addEventListener('resize', onResize);
    if (media.addEventListener) {
      media.addEventListener('change', onResize);
    } else {
      media.addListener(onResize);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (media.addEventListener) {
        media.removeEventListener('change', onResize);
      } else {
        media.removeListener(onResize);
      }
    };
  }, []);

  // Listen for favorites updates from other components (same-tab) and refresh guest lists
  useEffect(() => {
    const handler = () => {
      if (isAuthenticated) return;
      const stored = typeof window !== 'undefined' ? localStorage.getItem(FAVORITES_KEY) : null;
      if (!stored) {
        setGuestFavoriteIds([]);
        setGuestFavoriteObjects([]);
        setGuestAnnouncements([]);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        const ids = parsed.length > 0 && typeof parsed[0] === 'string'
          ? parsed
          : parsed.map(p => p.id);
        setGuestFavoriteIds(ids);
        setGuestFavoriteObjects(
          parsed.length > 0 && typeof parsed[0] === 'string'
            ? parsed.map(id => ({ id, addedAt: Date.now() }))
            : parsed
        );
      } catch {
        setGuestFavoriteIds([]);
        setGuestFavoriteObjects([]);
      }
    };
    window.addEventListener('favorites:updated', handler);
    return () => window.removeEventListener('favorites:updated', handler);
  }, [isAuthenticated, FAVORITES_KEY]);

  // Guest mode: fetch all announcements then filter to saved favorites
  useEffect(() => {
    if (isAuthenticated) return;
    if (guestFavoriteIds.length === 0) {
      setGuestAnnouncements([]);
      return;
    }
    apiClient.get('/api/announcements')
      .then(res => {
        const filtered = res.data.filter(a => guestFavoriteIds.includes(a._id));
        const sorted = filtered.sort((a, b) => {
          const aFav = guestFavoriteObjects.find(f => f.id === a._id);
          const bFav = guestFavoriteObjects.find(f => f.id === b._id);
          if (!aFav || !bFav) return 0;
          return bFav.addedAt - aFav.addedAt;
        });
        setGuestAnnouncements(sorted);
      })
      .catch(() => setGuestAnnouncements([]));
  }, [isAuthenticated, guestFavoriteIds, guestFavoriteObjects, FAVORITES_KEY]);

  const handleToggleFavorite = (id) => {
    if (isAuthenticated) {
      toggleFavorite?.(id);
      return;
    }
    // Guest local storage path
    setGuestFavoriteObjects(prev => {
      const exists = prev.find(item => item.id === id);
      let updated;
      if (exists) {
        updated = prev.filter(item => item.id !== id);
        setShowToast(true);
        apiClient.delete(`/api/announcements/${id}/favorite`).catch(() => {});
      } else {
        updated = [...prev, { id, addedAt: Date.now() }];
        apiClient.post(`/api/announcements/${id}/favorite`).catch(() => {});
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('favorites:updated'));
      return updated;
    });
    setGuestFavoriteIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Filtrăm fullFavorites prin authFavoriteIds (source of truth pentru starea toggle).
  // Fără acest filtru, un item scos din favorite rămânea vizibil cu inimioara goală
  // până la următorul hydrate, deoarece fullFavorites nu primea update optimist.
  const favoritesList = isAuthenticated
    ? (fullFavorites || []).filter(a => (authFavoriteIds || []).includes(String(a._id)))
    : guestAnnouncements;

  const isMobile = viewportWidth <= 1024;
  const isTwoColumnMobile = viewportWidth > 700;
  const itemsPerPage = 12;

  // On mobile show all favorites in a single long list (no pagination)
  let totalPages = 1;
  let currentItems = favoritesList || [];
  if (!isMobile) {
    totalPages = Math.ceil((favoritesList?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    currentItems = favoritesList?.slice(startIndex, startIndex + itemsPerPage) || [];
  }

  const isFavorited = (id) =>
    (isAuthenticated ? authFavoriteIds : guestFavoriteIds).includes(id);

  // Reset to page 1 when favorites list changes
  useEffect(() => { setCurrentPage(1); }, [favoritesList?.length]);

  // Add page-specific body class so global elements (Header) can be styled per-page
  useEffect(() => {
    document.body.classList.add('page-favorites');
    return () => { document.body.classList.remove('page-favorites'); };
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (id) => navigate(`/announcement/${id}`);
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const isEmpty = isAuthenticated
    ? favoritesList?.length === 0
    : guestAnnouncements.length === 0;

  return (
    <>
      <div className={`my-announcements-container ${isMobile ? 'favorites-applike' : ''}`}>
        {showToast && <Toast onClose={() => setShowToast(false)} />}

        {isMobile && (
          <MobileAppHeader
            count={favoritesList?.length || 0}
            onBack={handleBack}
            t={t}
          />
        )}

        <h1 className="my-announcements-title">
          {t('favorites.myFavorites')}
          <span className="my-announcements-title-count">
            ({isAuthenticated ? (favoritesList?.length || 0) : guestAnnouncements.length}/150)
          </span>
        </h1>

        {isEmpty ? (
          <div className="favorites-empty">
            <div className="favorites-empty-icon">
              <img src={gumballSiDarwin} alt="Favorite goale" />
            </div>
            <div className="favorites-empty-text">{t('favorites.empty')}</div>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className={`favorites-app-list ${isTwoColumnMobile ? 'two-col' : 'one-col'}`}>
                {currentItems.map((a) => (
                  <MobileAppCard
                    key={a._id}
                    announcement={a}
                    favorited={isFavorited(a._id)}
                    onToggle={handleToggleFavorite}
                    onNavigate={handleNavigate}
                    t={t}
                  />
                ))}
              </div>
            ) : (
              <div className="favorite-announcements-list">
                {currentItems.map((a) => (
                  <DesktopCard
                    key={a._id}
                    announcement={a}
                    favorited={isFavorited(a._id)}
                    onToggle={handleToggleFavorite}
                    onNavigate={handleNavigate}
                    t={t}
                  />
                ))}
              </div>
            )}

            {!isMobile && totalPages > 1 && (
              <FavoritesPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                t={t}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
