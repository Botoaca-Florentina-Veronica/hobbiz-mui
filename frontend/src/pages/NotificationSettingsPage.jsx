import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Switch, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Paper,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile } from '../api/api';
import './NotificationSettingsPage.css';

export default function NotificationSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    messages: true,
    reviews: true,
    favorites: true,
    promotions: false
  });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getProfile(); 
      if (res.data && res.data.notificationSettings) {
        setSettings(res.data.notificationSettings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      showToast(t('notificationSettings.saveError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      await updateProfile({ notificationSettings: newSettings });
      // showToast(t('notificationSettings.saveSuccess'), 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(t('notificationSettings.saveError'), 'error');
      // Revert
      setSettings(prev => ({ ...prev, [key]: !newSettings[key] }));
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const renderSettingItem = (key, labelKey, descKey) => (
    <ListItem className="setting-item">
      <ListItemText 
        primary={t(labelKey)} 
        secondary={t(descKey)} 
        primaryTypographyProps={{ fontWeight: 'bold' }}
        secondaryTypographyProps={{ className: 'setting-desc' }}
      />
      <ListItemSecondaryAction>
        <Switch
          edge="end"
          onChange={() => handleToggle(key)}
          checked={settings[key]}
          disabled={loading}
          color="primary"
        />
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Container maxWidth="md" className="notification-settings-container">
      <Box display="flex" alignItems="center" justifyContent="center" mb={3} mt={2} className="settings-header">
        <h1 className="notification-title">{t('notificationSettings.title')}</h1>
        {saving && <CircularProgress size={20} sx={{ ml: 2 }} />}
      </Box>

      <Paper elevation={0} className="settings-paper">
        <List>
          {renderSettingItem('push', 'notificationSettings.push', 'notificationSettings.pushDesc')}
          {renderSettingItem('email', 'notificationSettings.email', 'notificationSettings.emailDesc')}
          {renderSettingItem('messages', 'notificationSettings.messages', 'notificationSettings.messagesDesc')}
          {renderSettingItem('reviews', 'notificationSettings.reviews', 'notificationSettings.reviewsDesc')}
          {renderSettingItem('favorites', 'notificationSettings.favorites', 'notificationSettings.favoritesDesc')}
          {renderSettingItem('promotions', 'notificationSettings.promotions', 'notificationSettings.promotionsDesc')}
        </List>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
