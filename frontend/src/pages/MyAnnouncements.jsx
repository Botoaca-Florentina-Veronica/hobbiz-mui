import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import ConfirmDialog from './ConfirmDialog';
import LocationOnIcon from '@mui/icons-material/LocationOn';


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
    <div style={{maxWidth: 900, margin: '0 auto', padding: 24}}>
      <h1>Anunțurile mele</h1>
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
            <div key={a._id} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              display: 'flex',
              padding: 0,
              overflow: 'hidden',
              alignItems: 'stretch',
              minHeight: 180
            }}>
              <div style={{minWidth: 220, maxWidth: 220, background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {a.images && a.images[0] ? (
                  <img
                    src={
                      a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                        ? a.images[0]
                        : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`
                    }
                    alt="imagine principala"
                    style={{width: 200, height: 150, objectFit: 'cover', borderRadius: 8, margin: 12, boxShadow: '0 1px 6px #eee'}}
                  />
                ) : (
                  <div style={{width: 200, height: 150, background: '#eee', borderRadius: 8, margin: 12}} />
                )}
              </div>
              <div style={{flex: 1, padding: '18px 28px 18px 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                  <div>
                    <h2 style={{margin: 0, fontSize: '1.35rem', fontWeight: 700}}>{a.title}</h2>
                    <div style={{color: '#46626a', fontWeight: 500, fontSize: 18, margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8}}>
                      {a.category}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', color: '#23484a', fontWeight: 500, fontSize: 18, margin: '8px 0 8px 0'}}>
                      <LocationOnIcon sx={{ fontSize: 26, color: '#23484a', marginRight: 1 }} />
                      {a.location}
                    </div>
                    <div style={{color: '#888', fontSize: 14, marginBottom: 8}}>{a.description}</div>
                  </div>
                  <div style={{textAlign: 'right', minWidth: 120}}>
                    <div style={{color: '#888', fontSize: 13}}>ID: {a._id?.slice(-9) || ''}</div>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 12}}>
                  <button style={{border: '1.5px solid #183642', background: '#fff', color: '#183642', borderRadius: 7, padding: '7px 22px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}} onClick={() => navigate('/adauga-anunt', { state: { announcement: a } })}>Editează</button>
                  <button style={{border: 'none', background: 'none', color: '#183642', fontWeight: 600, fontSize: 15, cursor: 'pointer', borderBottom: '2px solid #183642', padding: '7px 0'}}>Reactualizează</button>
                  <button style={{border: 'none', background: 'none', color: '#183642', fontWeight: 600, fontSize: 15, cursor: 'pointer', borderBottom: '2px solid #d32f2f', padding: '7px 0'}} onClick={() => handleDelete(a._id)}>Șterge</button>
                  <button style={{border: 'none', background: 'none', color: '#183642', fontWeight: 600, fontSize: 15, cursor: 'pointer', borderBottom: '2px solid #183642', padding: '7px 0'}}>Dezactivează</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
