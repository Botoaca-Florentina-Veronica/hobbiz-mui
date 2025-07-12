import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/api';
import './AnnouncementDetails.css';
import SellerDetails from '../components/SellerDetails';
import Header from '../components/Header';

export default function AnnouncementDetails() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncement() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/announcements/${id}`);
        setAnnouncement(res.data);
      } catch (e) {
        setAnnouncement(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncement();
  }, [id]);

  if (loading) return <div>Se încarcă detaliile anunțului...</div>;
  if (!announcement) return <div>Anunțul nu a fost găsit.</div>;

  return (
    <>
      <Header />
      <div className="announcement-details-container">
      <div className="announcement-details-image-wrapper">
        {announcement.images && announcement.images[0] ? (
          <img
            src={announcement.images[0].startsWith('http') || announcement.images[0].startsWith('/uploads')
              ? announcement.images[0]
              : `/uploads/${announcement.images[0].replace(/^.*[\\/]/, '')}`}
            alt="imagine anunț"
            className="announcement-details-image"
          />
        ) : (
          <div className="announcement-details-image announcement-details-image-placeholder" />
        )}
      </div>
      <div className="announcement-details-content">
        <h1 className="announcement-details-title">{announcement.title}</h1>
        <div className="announcement-details-description">{announcement.description}</div>
      </div>
      <SellerDetails 
        user={{
          ...announcement.user,
          contactPerson: announcement.contactPerson // trimite numele de contact ca prop în user
        }}
        contactPhone={announcement.contactPhone}
        contactEmail={announcement.contactEmail}
      />
      </div>
    </>
  );
}
