import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import './MobileHeader.css';

export default function MobileHeader({ notificationCount = 0 }) {
  return (
    <div className="mobile-header">
      <div className="mobile-search-bar">
        <input
          type="text"
          className="mobile-search-input"
          placeholder="Ce anume cauți?"
        />
        <button className="mobile-search-btn">
          <SearchIcon />
        </button>
      </div>
      <Badge badgeContent={notificationCount} color="warning" overlap="circular" className="mobile-notification-badge">
        <NotificationsIcon className="mobile-notification-icon" />
      </Badge>
    </div>
  );
}
