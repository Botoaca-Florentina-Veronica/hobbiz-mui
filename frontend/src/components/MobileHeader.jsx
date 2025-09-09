import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import './MobileHeader.css';

export default function MobileHeader({ notificationCount = 0, onSearchFocus, onNotificationClick }) {
  return (
    <>
      <div className="mobile-header-spacer" aria-hidden="true" />
      <div className="mobile-header">
      <div className="mobile-search-container">
        <div className="mobile-search-bar">
          <input
            type="text"
            className="mobile-search-input"
            placeholder="Ce anume cauți?"
            onFocus={onSearchFocus}
          />
          <div className="mobile-search-btn">
            <SearchIcon htmlColor="currentColor" />
          </div>
        </div>
      </div>
      <button 
        className="mobile-notification-btn"
        onClick={onNotificationClick}
        aria-label="Notificări"
      >
        <Badge 
          badgeContent={notificationCount} 
          color="error" 
          overlap="circular" 
          className="mobile-notification-badge"
        >
          <NotificationsNoneOutlinedIcon className="mobile-notification-icon" htmlColor="currentColor" />
        </Badge>
      </button>
      </div>
    </>
  );
}
