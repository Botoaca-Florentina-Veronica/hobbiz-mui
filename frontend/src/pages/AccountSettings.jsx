import React, { useState } from 'react';
import './AccountSettings.css';
import { updateEmail } from '../api/api'; // Import the API function

export default function AccountSettings() {
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState(null); // State for messages (success/error)

  const handleEmailChangeClick = () => {
    console.log('Schimbă email-ul clicked!');
    setShowEmailChange(!showEmailChange);
    setMessage(null); // Clear messages when toggling
    setNewEmail(''); // Clear input when toggling
  };

  const handleSaveEmail = async () => {
    setMessage(null); // Clear previous messages
    if (!newEmail) {
      setMessage({ type: 'error', text: 'Please enter a new email address.' });
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
      const errorMessage = error.response?.data?.error || 'Failed to update email.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  return (
    <div className="account-settings-container">
      <h1 className="settings-title">Setări</h1>
      <div className="settings-menu">
        <div className="settings-item">Schimbă parola</div>
        <div className="settings-item" onClick={handleEmailChangeClick}>Schimbă email-ul</div>
        
        {/* Email Change Section */}
        {showEmailChange && (
          <div className="email-change-section">
            {/* Display messages here */}
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
            <label htmlFor="new-email">Noua ta adresă de e-mail</label>
            <input
              type="email"
              id="new-email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Introduceți noua adresă de e-mail"
            />
            <button onClick={handleSaveEmail}>Salvează</button>
          </div>
        )}

        <div className="settings-item">Setează notificările</div>
        <div className="settings-item">Administrare cont</div>
        <div className="settings-item">Ieși din cont de pe toate dispozitivele</div>
        <div className="settings-item">Date de facturare</div>
      </div>
    </div>
  );
}
