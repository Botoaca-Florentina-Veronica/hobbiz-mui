import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Badge from '@mui/material/Badge';
import { Paper, List, ListItemButton, ListItemText } from '@mui/material';
import './MobileHeader.css';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';

export default function MobileHeader({ notificationCount = 0, onSearchFocus, onNotificationClick }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        console.log("Mobile: Fetching suggestions for:", query);
        const response = await apiClient.get(`/api/announcements/suggestions?q=${query}`);
        console.log("Mobile: Suggestions received:", response.data);
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    setShowSuggestions(false);
    navigate(`/anunt/${suggestion._id}`);
  };
  
  return (
    <>
      <div className="mobile-header-spacer" aria-hidden="true" />
      <div className="mobile-header">
      <div className="mobile-search-container" style={{ position: 'relative' }}>
        <div className="mobile-search-bar">
          <input
            type="text"
            className="mobile-search-input"
            placeholder={t('mobileHeader.searchPlaceholder')}
            onFocus={(e) => {
              if (onSearchFocus) onSearchFocus(e);
              if (searchQuery.length > 2) setShowSuggestions(true);
            }}
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="mobile-search-btn">
            <SearchIcon htmlColor="currentColor" />
          </div>
        </div>
        {showSuggestions && suggestions.length > 0 && (
            <Paper className="search-suggestions-mobile" elevation={3} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: '200px', overflowY: 'auto', borderRadius: '0 0 12px 12px', marginTop: '5px' }}>
              <List>
                {suggestions.map((suggestion) => (
                  <ListItemButton key={suggestion._id} onClick={() => handleSuggestionClick(suggestion)}>
                    <ListItemText primary={suggestion.title} />
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
