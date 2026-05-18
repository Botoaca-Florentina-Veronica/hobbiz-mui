import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import cookieImg from '../assets/images/e_totul_ok.png';
import { clearNonEssentialCookies } from '../utils/cookieConsent';
import './CookieConsent.css';

const EXCLUDED_PATHS = ['/login', '/signup', '/oauth-success', '/forgot-password'];
const CONSENT_KEY = 'cookie_consent';
const BANNER_KEY = 'hobbiz_app_banner_shown';

// Module-level guard so two mounted instances don't both show
let instanceActive = false;

export default function CookieConsent() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only small screens
    const isSmall = window.matchMedia('(max-width: 1024px)').matches;
    if (!isSmall) return;

    // Excluded routes
    if (EXCLUDED_PATHS.some(p => location.pathname.startsWith(p))) return;

    // Already decided
    if (localStorage.getItem(CONSENT_KEY)) return;

    // Another instance already active
    if (instanceActive) return;

    // Wait for the app-install banner to clear first
    const bannerAlreadyDone = !!sessionStorage.getItem(BANNER_KEY);
    const delay = bannerAlreadyDone ? 2000 : 5500;

    const timer = setTimeout(() => {
      if (localStorage.getItem(CONSENT_KEY)) return; // decided while waiting
      if (instanceActive) return;
      instanceActive = true;
      setVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (decision) => {
    setExiting(true);
    localStorage.setItem(CONSENT_KEY, decision);
    instanceActive = false;
    if (decision === 'rejected') {
      clearNonEssentialCookies();
    }
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 320);
  };

  if (!visible) return null;

  return (
    <div
      className={`cc-backdrop ${exiting ? 'cc-backdrop--exit' : ''}`}
      onClick={() => dismiss('dismissed')}
    >
      <div
        className={`cc-sheet ${exiting ? 'cc-sheet--exit' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Consimțământ cookie-uri"
      >
        {/* Drag handle */}
        <div className="cc-handle" />

        {/* Close */}
        <button className="cc-close" onClick={() => dismiss('dismissed')} aria-label="Închide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero image */}
        <div className="cc-img-wrap">
          <img src={cookieImg} alt="Șaun aprobă cookie-urile" className="cc-img" />
        </div>

        {/* Text */}
        <h2 className="cc-title">Cookie-urile noastre n-au calorii! 🍪</h2>
        <p className="cc-desc">
          Spre deosebire de cele cu ciocolată, ale noastre sunt 100% digitale.
          Le folosim doar ca să-ți facem
          experiența pe Hobbiz mai <em>beeee</em>-ună!
        </p>

        {/* Primary actions */}
        <div className="cc-actions">
          <button className="cc-btn-accept" onClick={() => dismiss('accepted')}>
            Acceptă tot 🐑
          </button>
          <button className="cc-btn-reject" onClick={() => dismiss('rejected')}>
            Refuz
          </button>
        </div>

        {/* Settings link */}
        <button className="cc-settings-link" onClick={() => { window.location.href = '/cookie'; }}>
          ⚙️ Setări cookie-uri
        </button>
      </div>
    </div>
  );
}
