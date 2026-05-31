import React, { useState } from 'react';
import './AccountSettings.css';
import './NotificationSettingsPage.css';
import { updateEmail, updatePassword, detectMitm, deleteAccount, resetUserData, logout, logoutAllDevices, getProfile } from '../api/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { IconButton, Typography, Container, Paper, List, ListItem, ListItemText } from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import Toast from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function AccountSettings() {
  const { t, i18n } = useTranslation();
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState(null); // State for messages (success/error)
  const [mitmResult, setMitmResult] = useState(null);
  const [mitmLoading, setMitmLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);
  const [successDelete, setSuccessDelete] = useState(false);
  const [successReset, setSuccessReset] = useState(false);
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
      // IMPORTANT: Șterge toate token-urile
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      try { localStorage.removeItem('lastAvatarUrl'); } catch {}
      window.dispatchEvent(new Event('logout'));
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

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllDevices();
      setShowLogoutAllDialog(false);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      try { localStorage.removeItem('lastAvatarUrl'); } catch {}
      window.dispatchEvent(new Event('logout'));
      navigate('/');
      setTimeout(() => { window.location.reload(); }, 100);
    } catch (error) {
      setShowLogoutAllDialog(false);
      setMessage({ type: 'error', text: t('accountSettings.messages.logoutAllError') });
    }
  };

  const handleEmailChangeClick = () => {
    console.log('Schimbă email-ul clicked!');
    setShowEmailChange(!showEmailChange);
    setShowPasswordChange(false);
    setMessage(null);
    setNewEmail('');
    setEmailPassword('');
    setShowEmailPassword(false);
  };

  const handleResetUserData = async () => {
    try {
      await resetUserData();
      setShowResetDialog(false);
      setSuccessReset(true);
      try { localStorage.removeItem('lastAvatarUrl'); } catch {}
      setTimeout(() => setSuccessReset(false), 2500);
    } catch (error) {
      setShowResetDialog(false);
      setMessage({ type: 'error', text: t('accountSettings.messages.resetError') });
    }
  };

  const handlePasswordChangeClick = () => {
    setShowPasswordChange(!showPasswordChange);
    setShowEmailChange(false);
    setMessage(null);
    setPasswords({ currentPassword: '', newPassword: '' });
  };

  const handleSaveEmail = async () => {
    setMessage(null);
    if (!newEmail) {
      setMessage({ type: 'error', text: t('accountSettings.messages.enterEmail') });
      return;
    }
    if (!emailPassword) {
      setMessage({ type: 'error', text: t('accountSettings.messages.enterPasswordConfirm') });
      return;
    }

    try {
      const response = await updateEmail({ newEmail, password: emailPassword });
      setMessage({ type: 'success', text: response.data.message });
      setNewEmail('');
      setEmailPassword('');
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
          ? new Date(userData.createdAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : (i18n.language === 'es' ? 'es-ES' : 'ro-RO'), {
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
    <div className="account-settings-page-container">
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

        {/* ── MOBILE CARD (vizibil doar pe ≤1024px) ── */}
        <div className="as-mobile-card">

          {/* Schimbă parola */}
          <button className="as-mobile-item" onClick={handlePasswordChangeClick}>
            <span className="as-mobile-ico"><VpnKeyOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.changePassword')}</span>
          </button>
          {showPasswordChange && (
            <div className="email-change-section as-mobile-form">
              {message && <div className={`message ${message.type}`}>{message.text}</div>}
              <label htmlFor="m-current-password">{t('accountSettings.labels.currentPassword')}</label>
              <input type="password" id="m-current-password" value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder={t('accountSettings.placeholders.currentPassword')} />
              <label htmlFor="m-new-password">{t('accountSettings.labels.newPassword')}</label>
              <input type="password" id="m-new-password" value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                placeholder={t('accountSettings.placeholders.newPassword')} />
              <button onClick={handleSavePassword}>{t('accountSettings.buttons.save')}</button>
            </div>
          )}

          <div className="as-mobile-divider" />

          {/* Schimbă email-ul */}
          <button className="as-mobile-item" onClick={handleEmailChangeClick}>
            <span className="as-mobile-ico"><MailOutlineIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.changeEmail')}</span>
          </button>
          {showEmailChange && (
            <div className="email-change-section as-mobile-form">
              {message && <div className={`message ${message.type}`}>{message.text}</div>}
              <label htmlFor="m-new-email">{t('accountSettings.labels.newEmail')}</label>
              <input type="email" id="m-new-email" value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder={t('accountSettings.placeholders.newEmail')} />
              <label htmlFor="m-email-password">{t('accountSettings.labels.currentPassword')}</label>
              <div className="password-input-wrapper">
                <input type={showEmailPassword ? 'text' : 'password'} id="m-email-password" value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)}
                  placeholder={t('accountSettings.placeholders.currentPassword')} />
                <IconButton
                  className="eye-toggle"
                  onClick={() => setShowEmailPassword(v => !v)}
                  tabIndex={-1}
                  size="small"
                >
                  {showEmailPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </div>
              <button onClick={handleSaveEmail}>{t('accountSettings.buttons.save')}</button>
            </div>
          )}

          <div className="as-mobile-divider" />

          {/* Anunțuri arhivate */}
          <button className="as-mobile-item" onClick={() => navigate('/archived-announcements')}>
            <span className="as-mobile-ico"><MoveToInboxOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.archivedAnnouncements') || t('myAnnouncements.archived')}</span>
          </button>

          <div className="as-mobile-divider" />

          {/* Setează notificările */}
          <button className="as-mobile-item" onClick={() => navigate('/setari-notificari')}>
            <span className="as-mobile-ico"><NotificationsNoneIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.notifications')}</span>
          </button>

          <div className="as-mobile-divider" />

          {/* Descarcă datele mele */}
          <button className="as-mobile-item" onClick={handleDownloadData}>
            <span className="as-mobile-ico"><FileDownloadOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.billing')}</span>
          </button>

          <div className="as-mobile-divider" />

          {/* Ieși din cont de pe toate dispozitivele */}
          <button className="as-mobile-item" onClick={() => setShowLogoutAllDialog(true)}>
            <span className="as-mobile-ico"><SmartphoneOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.logoutAll')}</span>
          </button>

          <div className="as-mobile-divider" />

          {/* Resetează datele contului */}
          <button className="as-mobile-item" onClick={() => setShowResetDialog(true)}>
            <span className="as-mobile-ico"><RefreshOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.resetUserData')}</span>
          </button>

          <div className="as-mobile-divider" />

          {/* Șterge contul */}
          <button className="as-mobile-item" onClick={() => setShowDeleteDialog(true)}>
            <span className="as-mobile-ico"><DeleteOutlinedIcon /></span>
            <span className="as-mobile-label">{t('accountSettings.menu.deleteAccount')}</span>
          </button>

        </div>

        {/* ── DESKTOP: Papers individuale (ascunse pe mobile) ── */}
        <div className="as-desktop-papers">

      {/* Change Password */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={handlePasswordChangeClick} className="setting-item mobile-setting-item" style={{ borderBottom: showPasswordChange ? '1px solid #000' : 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.changePassword')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
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
          <ListItem button onClick={handleEmailChangeClick} className="setting-item mobile-setting-item" style={{ borderBottom: showEmailChange ? '1px solid #000' : 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.changeEmail')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
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
            <label htmlFor="email-password">{t('accountSettings.labels.currentPassword')}</label>
            <div className="password-input-wrapper">
              <input
                type={showEmailPassword ? 'text' : 'password'}
                id="email-password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                placeholder={t('accountSettings.placeholders.currentPassword')}
              />
              <IconButton
                className="eye-toggle"
                onClick={() => setShowEmailPassword(v => !v)}
                tabIndex={-1}
                size="small"
              >
                {showEmailPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </IconButton>
            </div>
            <button onClick={handleSaveEmail}>{t('accountSettings.buttons.save')}</button>
          </div>
        )}
      </Paper>

      {/* My Announcements */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/anunturile-mele')} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.myAnnouncements')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Archived Announcements */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/archived-announcements')} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.archivedAnnouncements') || t('myAnnouncements.archived')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Notifications */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/setari-notificari')} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.notifications')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Verification Documents */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => navigate('/verificare-documente')} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('verification.title')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Billing */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={handleDownloadData} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.billing')} 
              primaryTypographyProps={{ fontWeight: 'bold' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Logout All */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => setShowLogoutAllDialog(true)} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText
              primary={t('accountSettings.menu.logoutAll')}
              primaryTypographyProps={{ fontWeight: 'bold' }}
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Delete Account */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => setShowResetDialog(true)} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText 
              primary={t('accountSettings.menu.resetUserData')} 
              primaryTypographyProps={{ fontWeight: 'bold', color: 'warning.main' }} 
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Delete Account */}
      <Paper elevation={0} className="settings-paper" style={{ marginBottom: '20px' }}>
        <List disablePadding>
          <ListItem button onClick={() => setShowDeleteDialog(true)} className="setting-item mobile-setting-item" style={{ borderBottom: 'none' }}>
            <ListItemText
              primary={t('accountSettings.menu.deleteAccount')}
              primaryTypographyProps={{ fontWeight: 'bold', color: 'error.main' }}
              className="mobile-setting-text"
            />
          </ListItem>
        </List>
      </Paper>

        </div>{/* end as-desktop-papers */}

        <ConfirmDialog
        open={showLogoutAllDialog}
        onClose={() => setShowLogoutAllDialog(false)}
        onConfirm={handleLogoutAllDevices}
        title={t('accountSettings.confirm.logoutAllTitle')}
        description={t('accountSettings.confirm.logoutAllDescription')}
        confirmText={t('accountSettings.buttons.confirmLogoutAll')}
        cancelText={t('accountSettings.buttons.cancel')}
      />

      <ConfirmDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetUserData}
        title={t('accountSettings.confirm.resetTitle')}
        description={t('accountSettings.confirm.resetDescription')}
        confirmText={t('accountSettings.buttons.confirmReset')}
        cancelText={t('accountSettings.buttons.cancel')}
        confirmColor="warning"
      />

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
      {successReset && (
        <div className="message success" style={{textAlign:'center',marginTop:20}}>{t('accountSettings.messages.resetSuccess')}</div>
      )}
      
      <Toast
        visible={toastVisible}
        message={toastData.message}
        type={toastData.type}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
      </Container>
    </div>
  );
}