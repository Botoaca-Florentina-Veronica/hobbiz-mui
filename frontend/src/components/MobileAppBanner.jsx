import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import appLogo from '../assets/images/puzzle_safe.png';
import './MobileAppBanner.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.verabotoaca.hobbiz';
const SESSION_KEY = 'hobbiz_app_banner_shown';

// Routes where we never show the banner
const EXCLUDED_PATHS = ['/login', '/signup', '/oauth-success', '/forgot-password'];

export default function MobileAppBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only on small screens
    const isSmall = window.matchMedia('(max-width: 1024px)').matches;
    if (!isSmall) return;

    // Excluded routes
    if (EXCLUDED_PATHS.some(p => location.pathname.startsWith(p))) return;

    // Already shown this session — don't show again until next visit
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so the page renders first
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const dismiss = () => {
    setExiting(true);
    sessionStorage.setItem(SESSION_KEY, '1');
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, 320);
  };

  if (!visible) return null;

  return (
    <div className={`mab-backdrop ${exiting ? 'mab-backdrop--exit' : ''}`} onClick={dismiss}>
      <div
        className={`mab-sheet ${exiting ? 'mab-sheet--exit' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top handle */}
        <div className="mab-handle" />

        {/* Header row */}
        <div className="mab-header">
          <img src={appLogo} alt="Hobbiz" className="mab-logo-img" />
          <div className="mab-header-text">
            <span className="mab-brand">Hobbiz</span>
            <span className="mab-android-badge">
              <svg className="mab-android-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1C2.67 17 2 17.67 2 18.5v-9C2 8.67 2.67 8 3.5 8S5 8.67 5 9.5v9c0 .83-.67 1.5-1.5 1.5zm17 0c-.83 0-1.5-.67-1.5-1.5v-9c0-.83.67-1.5 1.5-1.5S22 8.67 22 9.5v9c0 .83-.67 1.5-1.5 1.5zM15.53 2.16l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C7.28 3.28 6.5 4.87 6.5 6.5H18c-.01-1.63-.79-3.22-2.47-4.34zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
              </svg>
              Exclusiv Android
            </span>
          </div>
          <button className="mab-close" onClick={dismiss} aria-label="Închide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="mab-body">
          <p className="mab-title">Experiență mai bună pe telefon</p>
          <p className="mab-desc">
            Instalează aplicația Hobbiz pe dispozitivul tău Android și bucură-te de notificări în timp real, chat rapid și navigare fluidă.
          </p>
        </div>

        {/* Actions */}
        <div className="mab-actions">
          <a
            className="mab-btn-download"
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
          >
            <svg className="mab-btn-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z"/>
            </svg>
            Descarcă aplicația
          </a>
          <button className="mab-btn-dismiss" onClick={dismiss}>
            Nu acum
          </button>
        </div>
      </div>
    </div>
  );
}
