


import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import apiClient from '../api/api';

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
      <div className="account-settings-container">
        <div className="settings-title">Notificări</div>
        {/* Formularul de test eliminat. Doar notificări */}
        <div className="settings-menu">
          {loading ? (
            <div style={{ color: '#888', textAlign: 'center', fontSize: '1.2rem' }}>Se încarcă notificările...</div>
          ) : notifications.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', fontSize: '1.2rem' }}>Nu ai notificări.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map(n => (
                <li key={n._id} className="settings-item">
                  <div style={{ fontWeight: 500 }}>
                    {n.senderName && (
                      <span style={{ color: '#2ec4b6', fontWeight: 600 }}>{n.senderName}: </span>
                    )}
                    {n.preview}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString('ro-RO') : ''}</div>
                  {n.link && (
                    <a href={n.link} style={{ color: '#2ec4b6', fontSize: 14 }}>Deschide chat</a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
