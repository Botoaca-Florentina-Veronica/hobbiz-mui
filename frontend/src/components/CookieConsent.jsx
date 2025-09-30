import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import './CookieConsent.css';

const CookieConsent = () => {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // show only when auth finished loading and user is not logged in
    if (loading) return;
    const saved = localStorage.getItem('cookie_consent');
    if (!user && !saved) {
      setVisible(true);
    }
  }, [user, loading]);

  const acceptAll = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const rejectAll = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setVisible(false);
  };

  const openSettings = () => {
    // simple behaviour: navigate to cookie policy page
    window.location.href = '/cookie';
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-root" role="dialog" aria-live="polite">
      <div className="cookie-consent-card">
        <h3>Setări cookie</h3>
        <p>
          Folosim cookie-uri pentru a îmbunătăți experiența de navigare, a afișa conținut personalizat
          și a analiza traficul. Click pe „Acceptă tot” pentru a-ți da acordul.
        </p>

        <button className="cookie-settings" onClick={openSettings} aria-label="Customize settings">
          <span className="gear">⚙️</span>
          Personalizează setările
        </button>

        <div className="cookie-actions">
          <button className="cookie-accept" onClick={acceptAll}>Acceptă tot</button>
          <button className="cookie-reject" onClick={rejectAll}>Refuză tot</button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
