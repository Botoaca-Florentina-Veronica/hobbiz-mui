import React, { useState } from 'react';
import './SellerDetails.css';
import ChatPopup from './ChatPopup';

export default function SellerDetails({ user, contactPhone, contactEmail, announcement }) {
  const [showPhone, setShowPhone] = useState(false);
  const [showChat, setShowChat] = useState(false);
  if (!user) return null;
  const initials = (user.firstName && user.lastName)
    ? `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase()
    : (user.firstName ? user.firstName[0].toUpperCase() : 'U');
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long' }) : '';

  const loggedUserId = localStorage.getItem('userId');
  let loggedUserRole = 'cumparator';
  if (user && loggedUserId && user._id === loggedUserId) {
    loggedUserRole = 'vanzator';
  }

  return (
    <>
      <div className="seller-details-box">
        <div className="seller-details-left">
          <div className="seller-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="seller-avatar-img" />
            ) : (
              <div className="seller-avatar-placeholder">{initials}</div>
            )}
          </div>
          <div className="seller-info">
            <div className="seller-name">{user.firstName || ''} {user.lastName || ''}</div>
            {/* Numele de contact la publicarea anunțului */}
            <div className="seller-joined">Nume de contact: {user.contactPerson || user.firstName || user.lastName || user.email || 'Utilizator'}</div>
          </div>
        </div>
        <div className="seller-details-right">
          <button className="seller-message-btn" onClick={() => setShowChat(true)}>Trimite mesaj</button>
          <div className="seller-phone-row">
            <div className="seller-phone-icon">📞</div>
            <div className="seller-phone-number">{showPhone ? (contactPhone || user.phone || 'N/A') : 'xxx xxx xxx'}</div>
            <button className="seller-show-btn" onClick={() => setShowPhone(true)}>Arată</button>
          </div>
          {contactEmail && <div className="seller-email">{contactEmail}</div>}
        </div>
      </div>
      <ChatPopup 
        open={showChat} 
        onClose={() => setShowChat(false)} 
        announcement={announcement} 
        seller={user} 
        userId={loggedUserId} 
        userRole={loggedUserRole} 
      />
    </>
  );
}
