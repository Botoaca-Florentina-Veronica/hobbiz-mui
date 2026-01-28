import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from 'react-i18next';
import { clearNonEssentialCookies } from '../utils/cookieConsent';
import './CookieConsent.css';

const CookieConsent = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
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
    // Salvăm refuzul și curățăm toate cookie-urile non-esențiale
    localStorage.setItem('cookie_consent', 'rejected');
    clearNonEssentialCookies();
    
    // Blocăm Google Analytics și alte scripturi de tracking (dacă există)
    if (window.gtag) {
      window['ga-disable-YOUR-GA-ID'] = true; // Înlocuiește YOUR-GA-ID cu ID-ul tău GA real
    }

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
        <h3>{t('cookieConsent.title')}</h3>
        <p>
          {t('cookieConsent.description')}
        </p>

        <button className="cookie-settings" onClick={openSettings} aria-label="Customize settings">
          <span className="gear">⚙️</span>
          {t('cookieConsent.customize')}
        </button>

        <div className="cookie-actions">
          <button className="cookie-accept" onClick={acceptAll}>{t('cookieConsent.acceptAll')}</button>
          <button className="cookie-reject" onClick={rejectAll}>{t('cookieConsent.rejectAll')}</button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

