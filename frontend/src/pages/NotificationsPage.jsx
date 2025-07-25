import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../pages/AccountSettings.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem('userId');
  console.log('userId folosit pentru notificări:', userId);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/notifications/${userId}`)
      .then(res => res.json())
      .then(async data => {
        console.log('Notificări primite de la backend:', data);
        // Pentru fiecare notificare, ia mesajul și expeditorul
        const enriched = await Promise.all(data.map(async notif => {
          let senderName = '';
          let preview = '';
          if (notif.link && notif.link.startsWith('/chat/')) {
            const convId = notif.link.split('/chat/')[1];
            // Ia ultimul mesaj din conversație
            try {
              const msgRes = await fetch(`/api/messages/conversation/${convId}`);
              const msgs = await msgRes.json();
              if (msgs.length > 0) {
                const lastMsg = msgs[msgs.length - 1];
                preview = lastMsg.text;
                // Ia numele expeditorului
                const userRes = await fetch(`/api/users/${lastMsg.senderId}`);
                const user = await userRes.json();
                senderName = user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email;
              }
            } catch {}
          }
          return { ...notif, senderName, preview };
        }));
        setNotifications(enriched);
      })
      .catch(() => setNotifications([]));
  }, [userId]);

  return (
    <>
      <Header />
      <div className="account-settings-container">
        <div className="settings-title">Notificări</div>
        <div className="settings-menu">
          {notifications.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', fontSize: '1.2rem' }}>Nu ai notificări.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map(n => (
                <li key={n._id} className="settings-item">
                  <div style={{ fontWeight: 500 }}>
                    {n.senderName && <span style={{ color: '#2ec4b6', fontWeight: 600 }}>{n.senderName}: </span>}
                    {n.preview || n.message}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString('ro-RO')}</div>
                  {n.link && <a href={n.link} style={{ color: '#2ec4b6', fontSize: 14 }}>Deschide chat</a>}
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
