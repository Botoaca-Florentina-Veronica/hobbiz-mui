import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DescriptionIcon from '@mui/icons-material/Description';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import './NotificationsPage.css';
import gumballPeace from '../assets/images/gumballPeace.jpg';

// Resolve relative avatar URLs
const resolveAvatarUrl = (src) => {
  if (!src) return '';
  if (typeof src !== 'string') return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
  return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\/]/, '')}`;
};

// Derive notification type from stored type or link pattern
const getNotifType = (n) => {
  if (n.type === 'review') return 'review';
  if (n.type === 'verification' || n.type === 'document') return n.type;
  if (n.link && typeof n.link === 'string' && n.link.startsWith('/chat/')) return 'message';
  if (n.type === 'general' && n.relatedAnnouncementId) return 'general';
  return n.type || 'general';
};

// Icon component per type
const NotifIcon = ({ type }) => {
  const style = { fontSize: 18 };
  switch (type) {
    case 'message':     return <ChatBubbleOutlineIcon style={style} />;
    case 'review':      return <StarIcon style={style} />;
    case 'verification':return <VerifiedUserIcon style={style} />;
    case 'document':    return <DescriptionIcon style={style} />;
    default:
      // Guess from relatedAnnouncementId (favorite or negotiation)
      return <LocalOfferIcon style={style} />;
  }
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Mark a notification as read (update local state)
  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      window.dispatchEvent(new Event('notifications:updated'));
    } catch (_) {}
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      window.dispatchEvent(new Event('notifications:updated'));
    } catch (_) {}
  };

  // Handle click on the action button
  const handleAction = async (n) => {
    const type = getNotifType(n);

    if (type === 'message' && n.link && n.link.startsWith('/chat/')) {
      // Chat: delete the notification and open the conversation
      await deleteNotification(n._id);
      const parts = n.link.split('/');
      if (parts.length >= 3) {
        navigate('/chat', { state: { conversationId: parts[2] } });
      } else {
        navigate('/chat');
      }
      return;
    }

    // All other types: mark as read and navigate to the link
    await markAsRead(n._id);
    if (n.link) {
      navigate(n.link);
    }
  };

  // Get contextual action label
  const getActionLabel = (n) => {
    const type = getNotifType(n);
    switch (type) {
      case 'message':     return t('notifications.reply');
      case 'review':      return t('notifications.viewProfile');
      case 'verification':return t('notifications.viewDocuments');
      case 'document':    return t('notifications.viewAdmin');
      default:            return t('notifications.viewAnnouncement');
    }
  };

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get(`/api/notifications/${userId}`)
      .then(res => {
        setNotifications(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoading(false);
      });
  }, [userId]);

  return (
    <>
      <div className="notifications-page">
        <div className="notifications-container">
          {/* Mobile header */}
          <div className="mobile-header">
            <IconButton
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
              className="mobile-back-btn"
              disableRipple
              disableFocusRipple
              aria-label={t('notifications.back')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="mobile-header-title">{t('notifications.title')}</Typography>
          </div>
          <h1 className="notifications-title">{t('notifications.title')}</h1>
          <div className="notifications-content">
            {loading ? (
              <div className="notifications-loading">
                <div className="loading-spinner"></div>
                <span>{t('notifications.loading')}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                <div className="notifications-empty-icon">
                  <img src={gumballPeace} alt={t('notifications.empty')} />
                </div>
                <div className="notifications-empty-text">{t('notifications.empty')}</div>
              </div>
            ) : (
              <ul className="notifications-list">
                {notifications.map(n => {
                  const type = getNotifType(n);
                  const avatarSrc = n.senderAvatar
                    ? resolveAvatarUrl(n.senderAvatar)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(n.senderName || 'H')}&background=355070&color=fff&size=128`;

                  return (
                    <li key={n._id} className={`notification-item ${!n.read ? 'unread' : 'read'} notif-type-${type}`}>
                      <div className="notification-card-inner">

                        {/* Type icon strip */}
                        <div className={`notif-type-strip notif-strip-${type}`}>
                          <NotifIcon type={type} />
                        </div>

                        {/* Avatar */}
                        <div className="notification-avatar-container">
                          <div className="notification-avatar">
                            <img
                              src={avatarSrc}
                              alt={n.senderName || 'User'}
                              onError={(e) => {
                                const fb = n.senderName || 'H';
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fb)}&background=355070&color=fff&size=128`;
                              }}
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="notification-content-column">
                          <div className="notification-header-row">
                            {n.senderName && (
                              <div className="notification-sender">{n.senderName}</div>
                            )}
                            <div className="notification-date">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>

                          {/* Main message */}
                          <div className="notification-message">{n.preview || n.message}</div>

                          {/* Announcement context */}
                          {n.announcementTitle && (
                            <div className="notif-ann-context">
                              📦 {n.announcementTitle}
                            </div>
                          )}

                          {/* Action button — shown for all notifications with a link, cu excepția
                              notificării de acordare a badge-ului de utilizator de încredere
                              (type 'verification' + link '/profile'), unde "Verifică documentele"
                              nu e relevant — nu mai există niciun document de verificat în acel context. */}
                          {n.link && !(getNotifType(n) === 'verification' && n.link === '/profile') && (
                            <button
                              className="notification-action-btn"
                              onClick={() => handleAction(n)}
                            >
                              <span>{getActionLabel(n)}</span>
                              <span className="action-arrow">→</span>
                            </button>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          className="notification-delete-btn"
                          onClick={() => deleteNotification(n._id)}
                          title={t('notifications.deleteNotification')}
                        >
                          <DeleteIcon className="notification-delete-icon" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

