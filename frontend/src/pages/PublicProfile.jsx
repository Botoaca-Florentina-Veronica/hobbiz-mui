import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  CircularProgress,
  IconButton,
  Avatar,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarRateIcon from '@mui/icons-material/StarRate';
import RateReviewIcon from '@mui/icons-material/RateReview';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useTranslation } from 'react-i18next';
import './PublicProfile.css';
import apiClient from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast';
import { resolveMediaUrl } from '../utils/media';

export default function PublicProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth() || {};
  const currentUserId = user ? (user._id || user.userId || user.id) : null;

  // Data
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Review interactions
  const [likedState, setLikedState] = useState({});
  const [menuState, setMenuState] = useState({ anchorEl: null, reviewId: null });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPayload, setEditPayload] = useState({ reviewId: null, comment: '', score: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Helpers
  const getReviewAuthorId = (r) => {
    if (!r) return null;
    if (r.author && typeof r.author === 'object') {
      if (r.author._id) return String(r.author._id);
      if (r.author.id) return String(r.author.id);
      try { return String(r.author); } catch (_) { return null; }
    }
    if (r.author) return String(r.author);
    if (r.authorId) return String(r.authorId);
    return null;
  };

  const getAnnouncementTitle = (r) => {
    if (!r) return '';
    if (r.announcementTitle) return String(r.announcementTitle);
    if (r.announcement && typeof r.announcement === 'object') {
      return String(r.announcement.title || r.announcement.name || '');
    }
    const annId = r.announcement || r.announcementId || r.annId || r.announcement_id;
    if (annId && Array.isArray(announcements) && announcements.length > 0) {
      const found = announcements.find(a => String(a._id || a.id) === String(annId));
      if (found) return String(found.title || found.name || '');
    }
    return '';
  };

  // Format lastSeen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const d = new Date(timestamp);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 5) return t('publicProfile.onlineNow');
    if (diffMins < 60) return t('publicProfile.lastSeenMinutes', { count: diffMins });
    if (diffHours < 24) return t('publicProfile.lastSeenHours', { count: diffHours });
    if (diffDays === 1) return t('publicProfile.lastSeenYesterday');
    if (diffDays < 7) return t('publicProfile.lastSeenDays', { count: diffDays });
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  };

  const isOnline = profile?.lastSeen && (new Date() - new Date(profile.lastSeen)) < 5 * 60 * 1000;

  // Avg rating
  let avgRating = null;
  if (Array.isArray(profile?.reviews) && profile.reviews.length > 0) {
    const nums = profile.reviews.map(r => Number(r.score || r.rating || r.value || 0)).filter(n => !isNaN(n));
    if (nums.length > 0) avgRating = nums.reduce((a, b) => a + b, 0) / nums.length;
  } else if (profile?.rating || profile?.averageRating) {
    avgRating = Number(profile.rating || profile.averageRating);
  }

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/users/profile/${userId}`);
        setProfile(res.data);
      } catch {
        setError(t('publicProfile.errorLoading'));
        setProfile({});
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchProfile();

    if (location?.state?.reviewPosted) {
      setToastMessage(t('publicProfile.reviewPostedSuccess'));
      setToastType('success');
      setToastVisible(true);
      // Inject newly created review into profile without re-fetch
      if (location?.state?.reviewCreateResponse) {
        const newReview = location.state.reviewCreateResponse;
        setProfile(prev => {
          if (!prev) return prev;
          const existing = (prev.reviews || []).find(r => r._id === newReview._id);
          if (existing) return prev;
          return { ...prev, reviews: [newReview, ...(prev.reviews || [])] };
        });
      }
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, '');
      }
    }
  }, [userId]);

  // Fetch announcements
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setAnnouncementsLoading(true);
        const res = await apiClient.get(`/api/users/announcements/${userId}`);
        setAnnouncements(res.data || []);
      } catch {
        setAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    }
    if (userId) fetchAnnouncements();
  }, [userId]);

  // Init liked state from API response
  useEffect(() => {
    if (!profile?.reviews || !currentUserId) return;
    const initial = {};
    profile.reviews.forEach(r => {
      if (r._id) {
        initial[r._id] = {
          liked: r.likedByCurrentUser || (r.likes || []).some(id => String(id) === String(currentUserId)),
          count: r.likesCount ?? (r.likes || []).length
        };
      }
    });
    setLikedState(initial);
  }, [profile?.reviews, currentUserId]);

  // Derived
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' })
    : '';
  const fullName = ((profile?.firstName || '') + (profile?.lastName ? ' ' + profile.lastName : '')).trim() || t('publicProfile.mobileTitle');

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <CircularProgress size={36} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp-page">
        <div className="pp-error">
          <ErrorOutlineIcon className="pp-error-icon" />
          <h2>{t('publicProfile.errorLoading')}</h2>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {t('publicProfile.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      <Toast message={toastMessage} type={toastType} visible={toastVisible} onClose={() => setToastVisible(false)} />

      {/* ─── Mobile header ─── */}
      <div className="pp-mobile-header">
        <IconButton
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="pp-mobile-back"
          disableRipple
          aria-label={t('publicProfile.backAria')}
        >
          <ArrowBackIcon />
        </IconButton>
        <span className="pp-mobile-title">{t('publicProfile.mobileTitle')}</span>
      </div>

      {/* ─── Hero ─── */}
      <div className="pp-hero">
        <div
          className={`pp-hero-cover ${profile?.coverImage ? 'has-cover' : ''}`}
          style={{ backgroundImage: profile?.coverImage ? `url(${profile.coverImage})` : 'none' }}
        />
        <div className="pp-hero-body">
          <div className="pp-hero-avatar">
            {profile?.avatar ? (
              <img src={resolveMediaUrl(profile.avatar)} alt={fullName} />
            ) : (
              <PersonIcon className="pp-hero-avatar-fallback" />
            )}
          </div>
          <div className="pp-hero-info">
            <h1 className="pp-hero-name">
              {fullName}
              {profile?.isVerified && <VerifiedIcon className="pp-verified-icon" />}
            </h1>
            {profile?.isVerified && (
              <span className="pp-verified-badge">{t('publicProfile.verifiedSeller')}</span>
            )}
            {profile?.lastSeen && (
              <span className={`pp-hero-status ${isOnline ? 'online' : ''}`}>
                {isOnline
                  ? <><FiberManualRecordIcon className="pp-status-dot" />{t('publicProfile.onlineNow')}</>
                  : <><AccessTimeIcon className="pp-status-icon" />{formatLastSeen(profile.lastSeen)}</>
                }
              </span>
            )}
            {profile?.localitate && (
              <span className="pp-hero-location">
                <LocationOnIcon className="pp-hero-loc-icon" />
                {profile.localitate}
              </span>
            )}
          </div>
          {/* Action buttons */}
          {user && currentUserId !== userId && (
            <div className="pp-hero-actions">
              <Button
                variant="contained"
                startIcon={<ChatBubbleOutlineIcon />}
                className="pp-msg-btn"
                onClick={() => navigate('/chat', { state: { openConversationWith: userId } })}
              >
                {t('publicProfile.sendMessage')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="pp-stats">
        <div className="pp-stat">
          <CalendarMonthIcon className="pp-stat-icon" />
          <div className="pp-stat-text">
            <span className="pp-stat-val">{memberSince || '—'}</span>
            <span className="pp-stat-lbl">{t('publicProfile.memberSince')}</span>
          </div>
        </div>
        <div className="pp-stat-sep" />
        <div className="pp-stat">
          <StorefrontIcon className="pp-stat-icon" />
          <div className="pp-stat-text">
            <span className="pp-stat-val">{announcements.length}</span>
            <span className="pp-stat-lbl">{t('publicProfile.listings')}</span>
          </div>
        </div>
        <div className="pp-stat-sep" />
        <div className="pp-stat">
          <RateReviewIcon className="pp-stat-icon" />
          <div className="pp-stat-text">
            <span className="pp-stat-val">{profile?.reviews?.length || 0}</span>
            <span className="pp-stat-lbl">{t('publicProfile.reviews')}</span>
          </div>
        </div>
        <div className="pp-stat-sep" />
        <div className="pp-stat">
          <StarRateIcon className="pp-stat-icon pp-stat-icon--gold" />
          <div className="pp-stat-text">
            <span className="pp-stat-val">{avgRating ? avgRating.toFixed(1) : t('publicProfile.noRating')}</span>
            <span className="pp-stat-lbl">{t('publicProfile.rating')}</span>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="pp-grid">
        {/* ── Left: Reviews + Contact + Map ── */}
        <div className="pp-col-main">

          {/* Reviews */}
          <section className="pp-card">
            <div className="pp-card-head">
              <h2 className="pp-card-title">{t('publicProfile.reviewsSection')}</h2>
              {Array.isArray(profile?.reviews) && profile.reviews.length >= 2 && (
                <Button className="pp-link-btn" size="small" onClick={() => navigate(`/profil/${userId}/toate-recenziile`)}>
                  {t('publicProfile.allReviews')} →
                </Button>
              )}
            </div>

            {/* Rating summary */}
            <div className="pp-rating-box">
              <div className="pp-rating-left">
                <span className="pp-big-score">{avgRating ? avgRating.toFixed(1) : '0.0'}</span>
                <div className="pp-stars-row">
                  {[1,2,3,4,5].map(i =>
                    i <= Math.round(avgRating || 0)
                      ? <StarIcon key={i} className="pp-star pp-star--on" />
                      : <StarBorderIcon key={i} className="pp-star pp-star--off" />
                  )}
                </div>
                <span className="pp-total-reviews">{profile?.reviews?.length || 0} {t('publicProfile.reviews').toLowerCase()}</span>
              </div>
              <div className="pp-bars">
                {[5,4,3,2,1].map(star => {
                  const cnt = Array.isArray(profile?.reviews) ? profile.reviews.filter(r => Number(r.score || r.rating || r.value || 0) === star).length : 0;
                  const tot = profile?.reviews?.length || 0;
                  const pct = tot ? (cnt / tot * 100) : 0;
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

            {/* Individual reviews */}
            <div className="pp-reviews">
              {Array.isArray(profile?.reviews) && profile.reviews.length > 0 ? (
                profile.reviews.map((r) => (
                  <article key={r._id || `${r.user || 'u'}-${r.createdAt || Math.random()}`} className="pp-rev">
                    <Avatar src={resolveMediaUrl(r.authorAvatar || r.avatar) || undefined} alt={r.authorName || r.name || 'U'} className="pp-rev-avatar">
                      {(r.authorName || r.name || 'U').charAt(0)}
                    </Avatar>
                    <div className="pp-rev-content">
                      <div className="pp-rev-top">
                        <div className="pp-rev-meta">
                          <span className="pp-rev-name">{r.authorName || r.name || 'Utilizator'}</span>
                          <span className="pp-rev-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('ro-RO') : ''}</span>
                          {(() => { const at = getAnnouncementTitle(r); return at ? <span className="pp-rev-ann">{at}</span> : null; })()}
                        </div>
                        <span className="pp-rev-badge">
                          <StarIcon className="pp-rev-badge-star" />
                          {Number(r.score || r.rating || r.value || 0).toFixed(1)}
                        </span>
                      </div>
                      <p className="pp-rev-text">{r.comment}</p>
                      <div className="pp-rev-foot">
                        <button
                          className={`pp-like-btn ${(likedState[r._id]?.liked || (r.likes || []).some(id => String(id) === String(currentUserId))) ? 'active' : ''}`}
                          onClick={async () => {
                            try {
                              if (!user) { setToastMessage(t('publicProfile.reviewLikeAuth')); setToastType('info'); setToastVisible(true); return; }
                              const prev = likedState[r._id] || { liked: false, count: (r.likes || []).length };
                              const nl = !prev.liked;
                              setLikedState(s => ({ ...s, [r._id]: { liked: nl, count: prev.count + (nl ? 1 : -1) } }));
                              const resp = await apiClient.post(`/api/reviews/${r._id}/like`);
                              setLikedState(s => ({ ...s, [r._id]: { liked: resp.data.liked, count: resp.data.likesCount } }));
                            } catch {
                              setToastMessage(t('publicProfile.reviewLikeError')); setToastType('error'); setToastVisible(true);
                            }
                          }}
                        >
                          <ThumbUpIcon className="pp-like-ico" />
                          <span>{likedState[r._id]?.count ?? (r.likes || []).length}</span>
                        </button>
                        {currentUserId && getReviewAuthorId(r) && String(currentUserId) === getReviewAuthorId(r) && (
                          <IconButton size="small" className="pp-rev-menu" onClick={(e) => setMenuState({ anchorEl: e.currentTarget, reviewId: r._id })}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="pp-empty">{t('publicProfile.noReviews')}</div>
              )}
            </div>
          </section>

          {/* Contact */}
          <section className="pp-card">
            <div className="pp-card-head">
              <h2 className="pp-card-title">{t('publicProfile.contactSection')}</h2>
            </div>
            <div className="pp-contacts">
              {[
                { icon: <PersonIcon />, label: t('publicProfile.firstName'), value: profile?.firstName },
                { icon: <PersonIcon />, label: t('publicProfile.lastName'), value: profile?.lastName },
                { icon: <PhoneIcon />, label: t('publicProfile.phone'), value: profile?.phone },
                { icon: <EmailIcon />, label: t('publicProfile.email'), value: profile?.email },
              ].map((c, i) => (
                <div key={i} className="pp-contact-row">
                  <div className="pp-contact-ic">{c.icon}</div>
                  <div className="pp-contact-info">
                    <span className="pp-contact-lbl">{c.label}</span>
                    <span className={`pp-contact-val ${!c.value ? 'empty' : ''}`}>{c.value || t('publicProfile.unspecified')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Map */}
          {profile?.localitate && (
            <section className="pp-card pp-card--flush">
              <div className="pp-card-head">
                <h2 className="pp-card-title">{t('publicProfile.locationSection')}</h2>
              </div>
              <div className="pp-map">
                <iframe
                  title={t('publicProfile.mapTitle')}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(profile.localitate)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>
          )}
        </div>

        {/* ── Right: Announcements ── */}
        <aside className="pp-col-side">
          <div className="pp-side-card">
            <h3 className="pp-side-title">
              {t('publicProfile.announcementsSection')} ({announcements.length})
            </h3>
            {announcementsLoading ? (
              <div className="pp-side-loading"><CircularProgress size={20} /><span>{t('publicProfile.loading')}</span></div>
            ) : announcements.length === 0 ? (
              <div className="pp-empty">{t('publicProfile.noAnnouncements')}</div>
            ) : (
              <div className="pp-ann-list">
                {announcements.map((a) => (
                  <div key={a._id} className="pp-ann" onClick={() => navigate(`/announcement/${a._id}`)}>
                    {a.images?.length > 0 ? (
                      <img src={a.images[0]} alt={a.title} className="pp-ann-img" />
                    ) : (
                      <div className="pp-ann-img pp-ann-placeholder">{t('publicProfile.noImage')}</div>
                    )}
                    <div className="pp-ann-body">
                      <span className="pp-ann-title">{a.title}</span>
                      {a.price && <span className="pp-ann-price">{a.price} lei</span>}
                      {a.localitate && <span className="pp-ann-loc">{a.localitate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ─── Dialogs ─── */}
      <Menu anchorEl={menuState.anchorEl} open={!!menuState.anchorEl}
        onClose={() => setMenuState({ anchorEl: null, reviewId: null })}
        PaperProps={{ sx: { borderRadius: 2.5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: 160, py: 0.5 } }}
      >
        <MenuItem onClick={() => {
          const id = menuState.reviewId; if (!id) return;
          const cur = profile.reviews.find(rr => rr._id === id) || {};
          setEditPayload({ reviewId: id, comment: cur.comment || '', score: (cur.score || cur.rating || '') });
          setMenuState({ anchorEl: null, reviewId: null }); setEditDialogOpen(true);
        }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('publicProfile.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          const id = menuState.reviewId; if (!id) return;
          setMenuState({ anchorEl: null, reviewId: null }); setDeleteTargetId(id); setDeleteDialogOpen(true);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('publicProfile.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm" className="pp-edit-review-dialog" PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('publicProfile.editReview')}</DialogTitle>
        <DialogContent dividers>
          <TextField label={t('publicProfile.editReviewScore')} type="number" inputProps={{ min: 0, max: 5, step: 0.5 }}
            fullWidth margin="dense" value={editPayload.score}
            onChange={(e) => setEditPayload(p => ({ ...p, score: e.target.value }))} />
          <TextField label={t('publicProfile.editReviewComment')} fullWidth multiline rows={4} margin="dense"
            value={editPayload.comment}
            onChange={(e) => setEditPayload(p => ({ ...p, comment: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ borderRadius: 2 }}>{t('publicProfile.cancel')}</Button>
          <Button variant="contained" sx={{ borderRadius: 2 }} onClick={async () => {
            try {
              const id = editPayload.reviewId;
              const body = { comment: editPayload.comment };
              if (editPayload.score !== '') body.score = editPayload.score;
              const resp = await apiClient.put(`/api/reviews/${id}`, body);
              setProfile(prev => ({ ...prev, reviews: prev.reviews.map(rr => rr._id === id ? ({ ...rr, comment: resp.data.review.comment, score: resp.data.review.score }) : rr) }));
              setEditDialogOpen(false);
            } catch { setToastMessage(t('publicProfile.editReviewError')); setToastType('error'); setToastVisible(true); }
          }}>{t('publicProfile.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} className="pp-delete-review-dialog" PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('publicProfile.deleteReview')}</DialogTitle>
        <DialogContent dividers>
          <Typography>{t('publicProfile.deleteReviewMessage')}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>{t('publicProfile.cancel')}</Button>
          <Button color="error" variant="contained" sx={{ borderRadius: 2 }} onClick={async () => {
            try {
              await apiClient.delete(`/api/reviews/${deleteTargetId}`);
              setProfile(prev => ({ ...prev, reviews: prev.reviews.filter(rr => rr._id !== deleteTargetId) }));
              setToastMessage(t('publicProfile.deleteReviewSuccess')); setToastType('success'); setToastVisible(true);
            } catch { setToastMessage(t('publicProfile.deleteReviewError')); setToastType('error'); setToastVisible(true); }
            finally { setDeleteDialogOpen(false); }
          }}>{t('publicProfile.delete')}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
