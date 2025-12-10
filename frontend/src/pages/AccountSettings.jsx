import React, { useState } from 'react';
import './AccountSettings.css';
import './NotificationSettingsPage.css';
import { updateEmail, updatePassword, detectMitm, deleteAccount, logout, getProfile } from '../api/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography, Container, Paper, List, ListItem, ListItemText } from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import Toast from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function AccountSettings() {
  const { t, i18n } = useTranslation();
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState(null); // State for messages (success/error)
  const [mitmResult, setMitmResult] = useState(null);
  const [mitmLoading, setMitmLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successDelete, setSuccessDelete] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastData, setToastData] = useState({ message: '', type: 'success' });
  const navigate = useNavigate();

  // Ștergere cont
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      await logout();
      setShowDeleteDialog(false);
      setSuccessDelete(true);
      localStorage.removeItem('token');
      setTimeout(() => {
        setSuccessDelete(false);
        navigate('/');
        setTimeout(() => {
          window.location.reload();
        }, 100); // mic delay pentru a permite navigarea
      }, 1500);
    } catch (error) {
      setShowDeleteDialog(false);
      setMessage({ type: 'error', text: t('accountSettings.messages.deleteError') });
    }
  };

  const handleEmailChangeClick = () => {
    console.log('Schimbă email-ul clicked!');
    setShowEmailChange(!showEmailChange);
    setShowPasswordChange(false);
    setMessage(null); // Clear messages when toggling
    setNewEmail(''); // Clear input when toggling
  };

  const handlePasswordChangeClick = () => {
    setShowPasswordChange(!showPasswordChange);
    setShowEmailChange(false);
    setMessage(null);
    setPasswords({ currentPassword: '', newPassword: '' });
  };

  const handleSaveEmail = async () => {
    setMessage(null); // Clear previous messages
    if (!newEmail) {
      setMessage({ type: 'error', text: t('accountSettings.messages.enterEmail') });
      return;
    }

    try {
      const response = await updateEmail({ newEmail });
      setMessage({ type: 'success', text: response.data.message });
      setNewEmail(''); // Clear input on success
      // Optionally hide the section after a delay
      // setTimeout(() => setShowEmailChange(false), 3000);
    } catch (error) {
      console.error('Error updating email:', error);
      const errorMessage = error.response?.data?.error || t('accountSettings.messages.updateEmailError');
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleSavePassword = async () => {
    setMessage(null);
    if (!passwords.currentPassword || !passwords.newPassword) {
      setMessage({ type: 'error', text: t('accountSettings.messages.enterPasswords') });
      return;
    }
    try {
      const response = await updatePassword(passwords);
      setMessage({ type: 'success', text: response.data.message });
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || t('accountSettings.messages.updatePasswordError');
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleDetectMitm = async () => {
    setMitmLoading(true);
    setMitmResult(null);
    try {
      const response = await detectMitm();
      setMitmResult(response.data.output);
    } catch (error) {
      setMitmResult(t('accountSettings.messages.mitmError') + (error.response?.data?.error || error.message));
    } finally {
      setMitmLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastData({ message, type });
    setToastVisible(true);
  };

  const handleDownloadData = async () => {
    setMessage(null);
    try {
      const response = await getProfile();
      const userData = response.data;

      const exportData = {
        nume: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A',
        email: userData.email || 'N/A',
        telefon: userData.phone || 'N/A',
        locatie: userData.localitate || 'N/A',
        dataInregistrarii: userData.createdAt 
          ? new Date(userData.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'N/A',
        exportatLa: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `datele_mele_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(t('accountSettings.messages.downloadSuccess'), 'success');
    } catch (error) {
      console.error('Download data error:', error);
      showToast(t('accountSettings.messages.downloadError'), 'error');
    }
  };

  return (
    <Container maxWidth="lg" className="notification-settings-container">
      {/* Mobile header: back + title */}
      <div className="mobile-header">
        <IconButton
          onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
          className="mobile-back-btn"
          disableRipple
          disableFocusRipple
          aria-label="Înapoi"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="mobile-header-title">{t('accountSettings.mobileHeaderTitle')}</Typography>
      </div>
      
      <h1 className="notification-title">{t('accountSettings.pageTitle')}</h1>
      
      {/* Change Password */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={handlePasswordChangeClick} className="setting-item" style={{ borderBottom: showPasswordChange ? '1px solid #000' : 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.changePassword')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
        {showPasswordChange && (
          <div className="email-change-section" style={{ padding: '24px', marginTop: 0 }}>
            {message && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}
            <label htmlFor="current-password">{t('accountSettings.labels.currentPassword')}</label>
            <input
              type="password"
              id="current-password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder={t('accountSettings.placeholders.currentPassword')}
            />
            <label htmlFor="new-password">{t('accountSettings.labels.newPassword')}</label>
            <input
              type="password"
              id="new-password"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder={t('accountSettings.placeholders.newPassword')}
            />
            <button onClick={handleSavePassword}>{t('accountSettings.buttons.save')}</button>
          </div>
        )}
      </Paper>

      {/* Change Email */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={handleEmailChangeClick} className="setting-item" style={{ borderBottom: showEmailChange ? '1px solid #000' : 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.changeEmail')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
        {showEmailChange && (
          <div className="email-change-section" style={{ padding: '24px', marginTop: 0 }}>
            {message && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}
            <label htmlFor="new-email">{t('accountSettings.labels.newEmail')}</label>
            <input
              type="email"
              id="new-email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder={t('accountSettings.placeholders.newEmail')}
            />
            <button onClick={handleSaveEmail}>{t('accountSettings.buttons.save')}</button>
          </div>
        )}
      </Paper>

      {/* My Announcements */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/anunturile-mele')} className="setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.myAnnouncements')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
      </Paper>

      {/* Notifications */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/setari-notificari')} className="setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.notifications')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
      </Paper>

      {/* Billing */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={handleDownloadData} className="setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.billing')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
      </Paper>

      {/* Logout All */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem className="setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.logoutAll')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem' }} 
            />
          </ListItem>
        </List>
      </Paper>

      {/* Delete Account */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => setShowDeleteDialog(true)} className="setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.deleteAccount')} 
              primaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'error.main' }} 
            />
          </ListItem>
        </List>
      </Paper>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title={t('accountSettings.confirm.deleteTitle')}
        description={t('accountSettings.confirm.deleteDescription')}
      />
      {successDelete && (
        <div className="message success" style={{textAlign:'center',marginTop:20}}>{t('accountSettings.messages.deleteSuccess')}</div>
      )}
      
      <Toast
        visible={toastVisible}
        message={toastData.message}
        type={toastData.type}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
    </Container>
  );
}