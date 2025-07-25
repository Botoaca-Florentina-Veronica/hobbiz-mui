import React, { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/notifications/${userId}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(() => setNotifications([]));
  }, [userId]);

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Notificări</h2>
      {notifications.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center' }}>Nu ai notificări.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notifications.map(n => (
            <li key={n._id} style={{ background: '#f7f7f7', marginBottom: 12, padding: 16, borderRadius: 8 }}>
              <div style={{ fontWeight: 500 }}>{n.message}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{new Date(n.createdAt).toLocaleString('ro-RO')}</div>
              {n.link && <a href={n.link} style={{ color: '#2ec4b6', fontSize: 14 }}>Deschide chat</a>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
