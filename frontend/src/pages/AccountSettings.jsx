import React, { useState } from 'react';
import './AccountSettings.css';
import { updateEmail, updatePassword, detectMitm } from '../api/api'; // Importă detectMitm

export default function AccountSettings() {
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState(null); // State for messages (success/error)
  const [mitmResult, setMitmResult] = useState(null);
  const [mitmLoading, setMitmLoading] = useState(false);

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
      setMessage({ type: 'error', text: 'Introduceți noua adresă de e-mail.' });
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
      const errorMessage = error.response?.data?.error || 'Eroare la actualizarea emailului.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleSavePassword = async () => {
    setMessage(null);
    if (!passwords.currentPassword || !passwords.newPassword) {
      setMessage({ type: 'error', text: 'Introduceți ambele parole.' });
      return;
    }
    try {
      const response = await updatePassword(passwords);
      setMessage({ type: 'success', text: response.data.message });
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Eroare la schimbarea parolei.';
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
      setMitmResult('Eroare la detectarea MITM: ' + (error.response?.data?.error || error.message));
    } finally {
      setMitmLoading(false);
    }
  };

  return (
    <div className="account-settings-container">
      <h1 className="settings-title">Setări</h1>
      <div className="settings-menu">
        <div className="settings-item" onClick={handlePasswordChangeClick}>Schimbă parola</div>
        {showPasswordChange && (
          <div className="email-change-section">
            {message && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}
            <label htmlFor="current-password">Parola curentă</label>
            <input
              type="password"
              id="current-password"
              value={passwords.currentPassword}
              onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="Introduceți parola curentă"
            />
            <label htmlFor="new-password">Parola nouă</label>
            <input
              type="password"
              id="new-password"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Introduceți noua parolă"
            />
            <button onClick={handleSavePassword}>Salvează</button>
          </div>
        )}
        <div className="settings-item" onClick={handleEmailChangeClick}>Schimbă email-ul</div>
        {showEmailChange && (
          <div className="email-change-section">
            {message && (
              <div className={`message ${message.type}`}>{message.text}</div>
            )}
            <label htmlFor="new-email">Noua ta adresă de e-mail</label>
            <input
              type="email"
              id="new-email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Introduceți noua adresă de e-mail"
            />
            <button onClick={handleSaveEmail}>Salvează</button>
          </div>
        )}
        <div className="settings-item" onClick={handleDetectMitm}>Detectează atac MITM</div>
        {mitmLoading && <div className="message info">Se detectează atacuri MITM...</div>}
        {mitmResult && <div className="message info">Rezultat MITM: {mitmResult}</div>}
        <div className="settings-item">Profil</div>
        <div className="settings-item">Anunțuri</div>
        <div className="settings-item">Setează notificările</div>
        <div className="settings-item">Date de facturare</div>
        <div className="settings-item">Ieși din cont de pe toate dispozitivele</div>
        <div className="settings-item">Șterge contul</div>
      </div>
    </div>
  );
}
