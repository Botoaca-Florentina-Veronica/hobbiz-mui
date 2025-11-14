import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import './MobileHeader.css';
import { useTranslation } from 'react-i18next';

export default function MobileHeader({ notificationCount = 0, onSearchFocus, onNotificationClick }) {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="mobile-header-spacer" aria-hidden="true" />
      <div className="mobile-header">
      <div className="mobile-search-container">
        <div className="mobile-search-bar">
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t('mobileHeader.searchPlaceholder')}
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
        aria-label={t('mobileHeader.notifications')}
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
