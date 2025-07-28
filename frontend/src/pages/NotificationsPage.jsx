


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/api';
import './NotificationsPage.css';

// Helper pentru obținerea datelor userului
const getUserName = async (userId) => {
  try {
    const res = await apiClient.get(`/api/users/${userId}`);
    const user = res.data;
    if (user.firstName) return `${user.firstName} ${user.lastName || ''}`;
    return user.email || 'Expeditor necunoscut';
  } catch {
    return 'Expeditor necunoscut';
  }
};

// Helper pentru obținerea preview-ului ultimului mesaj dintr-o conversație
const getLastMessagePreview = async (convId) => {
  try {
    const res = await apiClient.get(`/api/messages/conversation/${convId}`);
    const msgs = res.data;
    if (!msgs.length) return { senderName: '', preview: '' };
    const lastMsg = msgs[msgs.length - 1];
    const senderName = await getUserName(lastMsg.senderId);
    return { senderName, preview: lastMsg.text };
  } catch {
    return { senderName: '', preview: '' };
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  // Funcție pentru navigarea la chat
  const handleChatNavigation = (notificationId, chatLink) => {
    // Marchează notificarea ca citită
    markAsRead(notificationId);
    
    // Extrage conversationId din link
    if (chatLink && chatLink.startsWith('/chat/')) {
      const conversationId = chatLink.split('/chat/')[1];
      // Navighează la pagina de chat cu conversationId în state sau ca query param
      navigate('/chat', { state: { conversationId } });
    } else {
      // Navighează la pagina de chat generală
      navigate('/chat');
    }
  };

  // Funcție pentru a marca o notificare ca citită
  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      // Actualizează starea locală
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Eroare la marcarea notificării ca citită:', error);
    }
  };

  // Funcție pentru ștergerea unei notificări
  const deleteNotification = async (notificationId) => {
    try {
      console.log('🗑️ Ștergere notificare cu ID:', notificationId);
      console.log('🔗 URL apel:', `${apiClient.defaults.baseURL}/api/notifications/${notificationId}`);
      
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      console.log('✅ Răspuns server pentru ștergere:', response.data);
      console.log('📊 Status răspuns:', response.status);
      
      // Actualizează lista locală eliminând notificarea ștearsă
      setNotifications(prev => {
        const newNotifications = prev.filter(n => n._id !== notificationId);
        console.log('📝 Notificări înainte de filtrare:', prev.length);
        console.log('📝 Notificări după filtrare:', newNotifications.length);
        return newNotifications;
      });
      console.log('✅ Lista de notificări actualizată local');
    } catch (error) {
      console.error('❌ Eroare la ștergerea notificării:', error);
      console.error('❌ Detalii eroare:', error.response?.data);
      console.error('❌ Status eroare:', error.response?.status);
      console.error('❌ Mesaj eroare:', error.message);
      // Poți adăuga aici o notificare de eroare pentru utilizator
    }
  };

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('🔔 Frontend: Încarcă notificări pentru userId:', userId);
    
    apiClient.get(`/api/notifications/${userId}`)
      .then(res => {
        console.log('🔔 Frontend: Răspuns primit:', res.data);
        return res.data;
      })
      .then(async data => {
        // Enrich chat notifications cu preview și sender
        const enriched = await Promise.all(data.map(async notif => {
          if (notif.link && notif.link.startsWith('/chat/')) {
            const convId = notif.link.split('/chat/')[1];
            const { senderName, preview } = await getLastMessagePreview(convId);
            return { ...notif, senderName, preview };
          }
          // Notificare non-chat
          return { ...notif, senderName: '', preview: notif.message || '' };
        }));
        setNotifications(enriched);
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Frontend: Eroare la încărcarea notificărilor:', err);
        setNotifications([]);
        setLoading(false);
      });
  }, [userId]);

  return (
    <>
      <Header />
      <div className="notifications-page">
        <div className="notifications-container">
          <h1 className="notifications-title">Notificări</h1>
          <div className="notifications-content">
            {loading ? (
              <div className="notifications-loading">
                <div className="loading-spinner"></div>
                <span>Se încarcă notificările...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-empty">
                Nu ai notificări noi.
              </div>
            ) : (
              <ul className="notifications-list">
                {notifications.map(n => (
                  <li key={n._id} className={`notification-item ${!n.read ? 'unread' : 'read'}`}>
                    <div className="notification-content">
                      <div className="notification-header">
                        <div className="notification-main-content" onClick={() => !n.read && markAsRead(n._id)}>
                          {!n.read && <div className="unread-indicator"></div>}
                          {n.senderName && (
                            <div className="notification-sender">{n.senderName}</div>
                          )}
                          <div className="notification-message">{n.preview}</div>
                          <div className="notification-date">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString('ro-RO') : ''}
                          </div>
                          {n.link && (
                            <button 
                              className="notification-link"
                              onClick={() => handleChatNavigation(n._id, n.link)}
                            >
                              Deschide chat
                            </button>
                          )}
                        </div>
                        <button 
                          className="notification-delete-btn"
                          onClick={() => deleteNotification(n._id)}
                          title="Șterge notificarea"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
