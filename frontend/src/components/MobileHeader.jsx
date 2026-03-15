import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import { Paper, List, ListItemButton, ListItemText } from '@mui/material';
import './MobileHeader.css';
import { useTranslation } from 'react-i18next';
import useSearchSuggestions from '../hooks/useSearchSuggestions';
import translateCategory from '../utils/translateCategory';

export default function MobileHeader({ notificationCount = 0, onSearchFocus, onNotificationClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const {
    searchTerm: searchQuery,
    setSearchTerm: setSearchQuery,
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    clearSearch,
  } = useSearchSuggestions();

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSuggestionClick = (suggestion) => {
    clearSearch();
    navigate(`/announcement/${suggestion._id}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  return (
    <>
      <div className="mobile-header-spacer" aria-hidden="true" />
      <div className="mobile-header">
      <div className="mobile-search-container" ref={containerRef} style={{ position: 'relative' }}>
        <form className="mobile-search-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t('mobileHeader.searchPlaceholder')}
            onFocus={(e) => {
              if (onSearchFocus) onSearchFocus(e);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="mobile-search-btn">
            <SearchIcon htmlColor="currentColor" />
          </button>
        </form>
        {showSuggestions && suggestions.length > 0 && (
            <Paper className="search-suggestions-mobile" elevation={3} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: '280px', overflowY: 'auto', borderRadius: '0 0 12px 12px', marginTop: '5px' }}>
              <List>
                {suggestions.map((suggestion) => (
                  <ListItemButton key={suggestion._id} onClick={() => handleSuggestionClick(suggestion)}>
                    <ListItemText 
                      primary={suggestion.title}
                      secondary={[
                        translateCategory(suggestion.category, t),
                        suggestion.location
                      ].filter(Boolean).join(' • ')}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
        )}
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
