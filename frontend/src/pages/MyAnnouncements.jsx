import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import ConfirmDialog from './ConfirmDialog';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import './MyAnnouncements.css';

export default function MyAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await apiClient.get('/api/users/my-announcements');
        setAnnouncements(res.data);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiClient.delete(`/api/users/my-announcements/${deleteId}`);
      setAnnouncements(announcements.filter(a => a._id !== deleteId));
    } catch (e) {
      alert('Eroare la ștergerea anunțului!');
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) return <div>Se încarcă anunțurile...</div>;

  return (
    <div className="my-announcements-container">
      <h1 className="my-announcements-title">Anunțurile mele</h1>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      {announcements.length === 0 ? (
        <div>Nu ai publicat niciun anunț încă.</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
          {announcements.map((a) => (
            <div key={a._id} className="my-announcement-card">
              <div className="my-announcement-image">
                {a.images && a.images[0] ? (
                  <img
                    src={
                      a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`
                    }
                    alt="imagine principala"
                    className="my-announcement-img"
                  />
                ) : (
                  <div className="my-announcement-img" style={{background: '#eee'}} />
                )}
              </div>
              <div className="my-announcement-info">
                <div className="my-announcement-header">
                  <div>
                    <h2 className="my-announcement-title">{a.title}</h2>
                    <div className="my-announcement-category">{a.category}</div>
                    <div className="my-announcement-location">
                      <LocationOnIcon sx={{ fontSize: 26, color: '#23484a', marginRight: 1 }} />
                      {a.location}
                    </div>
                    <div className="my-announcement-description">{a.description}</div>
                  </div>
                  <div className="my-announcement-id">
                    ID: {a._id?.slice(-9) || ''}
                  </div>
                </div>
                <div className="my-announcement-actions">
                  <button className="my-announcement-btn" onClick={() => navigate('/adauga-anunt', { state: { announcement: a } })}>Editează</button>
                  <button className="my-announcement-btn secondary">Reactualizează</button>
                  <button className="my-announcement-btn danger" onClick={() => handleDelete(a._id)}>Șterge</button>
                  <button className="my-announcement-btn secondary">Dezactivează</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
