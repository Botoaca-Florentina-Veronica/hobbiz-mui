import React from 'react';
import './AccountSettings.css';

export default function AccountSettings() {
  return (
    <div className="account-settings-container">
      <h1 className="settings-title">Setări</h1>
      <div className="settings-menu">
        <div className="settings-item">Schimbă parola</div>
        <div className="settings-item">Schimbă e-mail-ul</div>
        <div className="settings-item">Setează notificările</div>
        <div className="settings-item">Administrare cont</div>
        <div className="settings-item">Ieși din cont de pe toate dispozitivele</div>
        <div className="settings-item">Date de facturare</div>
      </div>
    </div>
  );
}
