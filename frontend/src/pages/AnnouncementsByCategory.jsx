import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/api';
import './MyAnnouncements.css';

export default function AnnouncementsByCategory() {
  const { category } = useParams();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/announcements?category=${encodeURIComponent(category)}`);
        setAnnouncements(res.data);
      } catch (e) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, [category]);

  if (loading) return <div>Se încarcă anunțurile...</div>;

  return (
    <div className="my-announcements-container">
      <h1 className="my-announcements-title">Anunțuri pentru categoria: {category}</h1>
      {announcements.length === 0 ? (
        <div>Nu există anunțuri pentru această categorie.</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
          {announcements.map((a) => (
            <div key={a._id} className="my-announcement-card">
              <div className="my-announcement-image">
                {a.images && a.images[0] ? (
                  <img
                    src={a.images[0].startsWith('http') || a.images[0].startsWith('/uploads')
                      ? a.images[0]
                      : `/uploads/${a.images[0].replace(/^.*[\\/]/, '')}`}
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
                    <div className="my-announcement-location">{a.location}</div>
                    <div className="my-announcement-description">{a.description}</div>
                  </div>
                  <div className="my-announcement-id">
                    ID: {a._id?.slice(-9) || ''}
                  </div>
                </div>
                {/* Fără butoane de acțiune */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
