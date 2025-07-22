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
  // Mutat aici, la început, pentru a respecta regulile hooks
  const [imageIndexes, setImageIndexes] = useState({});
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

  const handleEdit = (announcement) => {
    localStorage.setItem('editAnnouncement', JSON.stringify(announcement));
    navigate('/edit-announcement', { state: { announcement } });
  };

  if (loading) return <div>Se încarcă anunțurile...</div>;

  const handlePrevImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : imagesLength - 1
    }));
  };

  const handleNextImage = (id, imagesLength) => {
    setImageIndexes(prev => ({
      ...prev,
      [id]: prev[id] < imagesLength - 1 ? prev[id] + 1 : 0
    }));
  };

  return (
    <>
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
          <div className="my-announcements-list">
            {announcements.map((a) => {
              const images = a.images || [];
              const getImageSrc = (img) =>
                img.startsWith('http') || img.startsWith('/uploads')
                  ? img
                  : `/uploads/${img.replace(/^.*[\\/]/, '')}`;
              return (
                <div key={a._id} className="my-announcement-card" style={{ cursor: 'pointer' }}
                  onClick={e => {
                    if (e.target.closest('.my-announcement-btn')) return;
                    window.location.href = `/announcement/${a._id}`;
                  }}
                >
                  <div className="my-announcement-image">
                    {images.length > 0 ? (
                      <img
                        src={getImageSrc(images[0])}
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
                          <LocationOnIcon sx={{ fontSize: 26, color: '#355070', marginRight: 1 }} />
                          {a.location}
                        </div>
                        {/* Descrierea a fost eliminată pentru un aspect mai curat al listei de anunțuri */}
                      </div>
                      <div className="my-announcement-id">
                        ID: {a._id?.slice(-9) || ''}
                      </div>
                    </div>
                    <div className="my-announcement-actions">
                      <button className="my-announcement-btn" onClick={() => handleEdit(a)}>Editează</button>
                      <button className="my-announcement-btn secondary">Reactualizează</button>
                      <button className="my-announcement-btn danger" onClick={() => handleDelete(a._id)}>Șterge</button>
                      <button className="my-announcement-btn secondary">Dezactivează</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* separatorul este inclus în Footer, nu mai este nevoie aici */}
    </>
  );
}
