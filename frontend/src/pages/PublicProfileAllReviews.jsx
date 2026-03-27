import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Avatar, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SortIcon from '@mui/icons-material/Sort';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast';
import { resolveMediaUrl } from '../utils/media';
import './PublicProfile.css';
import './PublicProfileAllReviews.css';

export default function PublicProfileAllReviews() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth() || {};
  const currentUserId = user ? (user._id || user.userId || user.id) : null;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedState, setLikedState] = useState({});
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | highest | lowest
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/users/profile/${userId}`);
        if (!mounted) return;
        setProfile(res.data);
      } catch (e) {
        console.error('Failed to load profile for all reviews', e);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (userId) fetchProfile();
    return () => { mounted = false; };
  }, [userId]);

  // Init liked state from profile reviews
  useEffect(() => {
    if (!profile?.reviews || !currentUserId) return;
    const state = {};
    profile.reviews.forEach(r => {
      const liked = (r.likes || []).some(id => String(id) === String(currentUserId));
      state[r._id] = { liked, count: (r.likes || []).length };
    });
    setLikedState(state);
  }, [profile?.reviews, currentUserId]);

  // Compute average rating
  const reviews = Array.isArray(profile?.reviews) ? profile.reviews : [];
  const nums = reviews.map(r => Number(r.score || r.rating || r.value || 0)).filter(n => !isNaN(n) && n > 0);
  const avgRating = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    const scoreA = Number(a.score || a.rating || a.value || 0);
    const scoreB = Number(b.score || b.rating || b.value || 0);
    switch (sortBy) {
      case 'oldest': return dateA - dateB;
      case 'highest': return scoreB - scoreA;
      case 'lowest': return scoreA - scoreB;
      default: return dateB - dateA; // newest
    }
  });

  const getAnnouncementTitle = (r) => {
    if (!r) return '';
    if (r.announcementTitle) return String(r.announcementTitle);
    if (r.announcement && typeof r.announcement === 'object') {
      return String(r.announcement.title || r.announcement.name || '');
    }
    return '';
  };

  const handleLike = async (reviewId) => {
    try {
      if (!user) {
        setToastMessage(t('publicProfile.reviewLikeAuth'));
        setToastType('info');
        setToastVisible(true);
        return;
      }
      const prev = likedState[reviewId] || { liked: false, count: 0 };
      const nl = !prev.liked;
      setLikedState(s => ({ ...s, [reviewId]: { liked: nl, count: prev.count + (nl ? 1 : -1) } }));
      const resp = await apiClient.post(`/api/reviews/${reviewId}/like`);
      setLikedState(s => ({ ...s, [reviewId]: { liked: resp.data.liked, count: resp.data.likesCount } }));
    } catch {
      setToastMessage(t('publicProfile.reviewLikeError'));
      setToastType('error');
      setToastVisible(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <CircularProgress sx={{ color: 'var(--pp-accent)' }} />
        </div>
      </div>
    );
  }

  // Error / not found
  if (!profile) {
    return (
      <div className="pp-page">
        <div className="pp-error">
          <h2>{t('publicProfile.errorLoading')}</h2>
        </div>
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Utilizator';

  return (
    <div className="pp-page">
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onClose={() => setToastVisible(false)} />

      {/* ── Header bar ── */}
      <div className="ar-header">
        <div className="ar-header-inner">
          <IconButton className="ar-back-btn" onClick={() => navigate(-1)} aria-label={t('publicProfile.backAria')}>
            <ArrowBackIcon />
          </IconButton>
          <div className="ar-header-info">
            <Avatar
              src={resolveMediaUrl(profile.avatar) || undefined}
              alt={displayName}
              className="ar-header-avatar"
            >
              {displayName.charAt(0)}
            </Avatar>
            <div className="ar-header-text">
              <h1 className="ar-title">{t('publicProfile.allReviews')}</h1>
              <span className="ar-subtitle">{displayName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="ar-content">

        {/* Rating Summary Card */}
        <div className="ar-summary-card">
          <div className="pp-rating-box">
            <div className="pp-rating-left">
              <span className="pp-big-score">{avgRating ? avgRating.toFixed(1) : '0.0'}</span>
              <div className="pp-stars-row">
                {[1, 2, 3, 4, 5].map(i =>
                  i <= Math.round(avgRating || 0)
                    ? <StarIcon key={i} className="pp-star pp-star--on" />
                    : <StarBorderIcon key={i} className="pp-star pp-star--off" />
                )}
              </div>
              <span className="pp-total-reviews">
                {reviews.length} {t('publicProfile.reviews').toLowerCase()}
              </span>
            </div>
            <div className="pp-bars">
              {[5, 4, 3, 2, 1].map(star => {
                const cnt = reviews.filter(r => Math.round(Number(r.score || r.rating || r.value || 0)) === star).length;
                const pct = reviews.length ? (cnt / reviews.length * 100) : 0;
                return (
                  <div key={star} className="pp-bar-row">
                    <span className="pp-bar-num">{star}</span>
                    <StarIcon className="pp-bar-star" />
                    <div className="pp-bar-track"><div className="pp-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="pp-bar-cnt">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sort Bar */}
        <div className="ar-sort-bar">
          <SortIcon className="ar-sort-icon" />
          <div className="ar-sort-options">
            {[
              { key: 'newest', label: 'Cele mai noi' },
              { key: 'oldest', label: 'Cele mai vechi' },
              { key: 'highest', label: 'Scor maxim' },
              { key: 'lowest', label: 'Scor minim' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`ar-sort-chip ${sortBy === opt.key ? 'active' : ''}`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="ar-reviews-list">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((r, idx) => {
              const annTitle = getAnnouncementTitle(r);
              const score = Number(r.score || r.rating || r.value || 0);
              return (
                <article
                  key={r._id || idx}
                  className="ar-review-card"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="ar-review-header">
                    <Avatar
                      src={resolveMediaUrl(r.authorAvatar || r.avatar) || undefined}
                      alt={r.authorName || 'U'}
                      className="ar-review-avatar"
                    >
                      {(r.authorName || r.name || 'U').charAt(0)}
                    </Avatar>
                    <div className="ar-review-meta">
                      <span className="ar-review-name">{r.authorName || r.name || 'Utilizator'}</span>
                      <span className="ar-review-date">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('ro-RO', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        }) : ''}
                      </span>
                      {annTitle && <span className="ar-review-ann">{annTitle}</span>}
                    </div>
                    <span className="pp-rev-badge">
                      <StarIcon className="pp-rev-badge-star" />
                      {score.toFixed(1)}
                    </span>
                  </div>

                  {/* Star pills */}
                  <div className="ar-review-stars">
                    {[1, 2, 3, 4, 5].map(i =>
                      i <= Math.round(score)
                        ? <StarIcon key={i} className="ar-star ar-star--on" />
                        : <StarBorderIcon key={i} className="ar-star ar-star--off" />
                    )}
                  </div>

                  <p className="ar-review-text">{r.comment}</p>

                  <div className="ar-review-footer">
                    <button
                      className={`pp-like-btn ${(likedState[r._id]?.liked || (r.likes || []).some(id => String(id) === String(currentUserId))) ? 'active' : ''}`}
                      onClick={() => handleLike(r._id)}
                    >
                      <ThumbUpIcon className="pp-like-ico" />
                      <span>{likedState[r._id]?.count ?? (r.likes || []).length}</span>
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="pp-empty">{t('publicProfile.noReviews')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
