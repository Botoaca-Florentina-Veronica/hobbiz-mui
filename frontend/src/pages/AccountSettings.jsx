import React, { useState } from 'react';
import './AccountSettings.css';
import { updateEmail, updatePassword, detectMitm, deleteAccount, logout } from '../api/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton, Typography } from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import { useTranslation } from 'react-i18next';

export default function AccountSettings() {
  const { t } = useTranslation();
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState(null); // State for messages (success/error)
  const [mitmResult, setMitmResult] = useState(null);
  const [mitmLoading, setMitmLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successDelete, setSuccessDelete] = useState(false);
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

  return (
    <div className="account-settings-container">
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
      <h1 className="settings-title">{t('accountSettings.pageTitle')}</h1>
      <div className="settings-menu">
        <div className="settings-item" onClick={handlePasswordChangeClick}>{t('accountSettings.menu.changePassword')}</div>
        {showPasswordChange && (
          <div className="email-change-section">
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
        <div className="settings-item" onClick={handleEmailChangeClick}>{t('accountSettings.menu.changeEmail')}</div>
        {showEmailChange && (
          <div className="email-change-section">
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
        <div className="settings-item" onClick={() => navigate('/anunturile-mele')}>{t('accountSettings.menu.myAnnouncements')}</div>
        <div className="settings-item" onClick={() => navigate('/setari-notificari')}>{t('accountSettings.menu.notifications')}</div>
        <div className="settings-item">{t('accountSettings.menu.billing')}</div>
        <div className="settings-item">{t('accountSettings.menu.logoutAll')}</div>
        <div className="settings-item" onClick={() => setShowDeleteDialog(true)}>{t('accountSettings.menu.deleteAccount')}</div>
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
      </div>
    </div>
  );
}