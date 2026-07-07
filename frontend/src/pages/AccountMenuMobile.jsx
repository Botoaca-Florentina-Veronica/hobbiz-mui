import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Typography, IconButton, Switch } from '@mui/material';
import { 
  ArrowBack, 
  Settings, 
  Campaign, 
  Person, 
  InfoOutlined,
  HelpOutline,
  Language,
  MailOutline,
  Gavel,
  Logout,
  DarkMode,
  VerifiedUser,
  Close,
  SendRounded,
  MailOutlineRounded
} from '@mui/icons-material';
import apiClient from '../api/api';
import Toast from '../components/Toast';
import { useTranslation } from 'react-i18next';
import sunImage from '../assets/images/sun.png';
import nightImage from '../assets/images/night.png';
import './AccountMenuMobile.v2.css';

export default function AccountMenuMobile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isSmallViewport, setIsSmallViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1200px)').matches;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [showContactSuccessToast, setShowContactSuccessToast] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        const authed = response.data?.isAuthenticated;
        setIsAuthenticated(authed);
        if (!authed) {
          navigate('/login');
        }
      } catch (err) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/users/profile');
        setUserProfile(response.data || null);
      } catch (err) {
        // silent fail
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const body = document.body;
    const saved = localStorage.getItem('darkMode');
    const initial = saved === 'true' || body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', initial);
    setIsDarkMode(initial);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 1200px)');
    const onChange = (event) => setIsSmallViewport(event.matches);

    setIsSmallViewport(media.matches);

    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const toggleDarkMode = () => {
    const body = document.body;
    const next = !body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', next);
    try { localStorage.setItem('darkMode', next ? 'true' : 'false'); } catch {}
    setIsDarkMode(next);
  };

  const handleLogout = async () => {
    // IMPORTANT: Șterge token-urile IMEDIAT și SINCRONIC pentru a preveni probleme de securitate
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('userId'); } catch {}
    try { localStorage.removeItem('lastAvatarUrl'); } catch {}
    
    // Dispatch logout event imediat
    window.dispatchEvent(new Event('logout'));
    setShowLogoutToast(true);

    // Apoi apelează logout pe server (pentru cookie/session)
    try {
      const { logout } = await import('../api/api');
      await logout();
    } catch (err) {
      // ignore server logout errors
    }
    
    // Redirecționează și reîncarcă
    setTimeout(() => {
      navigate('/');
      window.location.reload();
    }, 2000);
  };

  // While we determine auth, don't render the page
  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return null; // redirect in effect

  const displayFirstName = userProfile?.firstName || 'Utilizator';
  const displayLastName = userProfile?.lastName || '';

  const greetingByLang = {
    ro: 'Ceau',
    en: 'Hello',
    es: 'Hola',
  };
  const currentLang = String(i18n.language || 'ro').toLowerCase().startsWith('en')
    ? 'en'
    : String(i18n.language || 'ro').toLowerCase().startsWith('es')
      ? 'es'
      : 'ro';

  const primaryMenuItems = [
    { icon: <Settings />, label: t('header.settings'), path: '/setari-cont' },
    { icon: <Campaign />, label: t('header.myAnnouncements'), path: '/anunturile-mele' },
    { icon: <Person />, label: t('header.profile'), path: '/profil' },
    { icon: <VerifiedUser />, label: t('verification.menuLabel'), path: '/verificare-documente' },
    ...(userProfile?.isAdmin ? [
      { icon: <VerifiedUser />, label: t('header.adminVerifications'), path: '/admin/setari', style: { color: '#f51866' } }
    ] : [])
  ];

  const infoMenuItems = [
    { icon: <InfoOutlined />, label: t('legal.about'), path: '/despre' },
    { icon: <HelpOutline />, label: t('legal.howItWorks'), path: '/cum-functioneaza' },
    { icon: <Gavel />, label: t('legal.legal'), path: '/informatii-legale' }
  ];

  const selectLanguage = (lang) => {
    i18n.changeLanguage(lang).then(() => {
      window.location.reload();
    });
    setShowLanguageModal(false);
  };

  const openContactModal = () => {
    setContactError('');
    setContactForm({
      name: `${displayFirstName} ${displayLastName}`.trim(),
      email: userProfile?.email || '',
      message: '',
    });
    setShowContactModal(true);
  };

  const submitContact = async () => {
    const name = contactForm.name.trim();
    const email = contactForm.email.trim();
    const message = contactForm.message.trim();
    if (!name || !email || !message) {
      setContactError(t('contactModal.errorRequired'));
      return;
    }

    setContactSending(true);
    setContactError('');
    try {
      await apiClient.post('/api/contact', { name, email, message });
      setShowContactModal(false);
      setContactForm({ name: '', email: '', message: '' });
      setShowContactSuccessToast(true);
    } catch (err) {
      const apiMessage = err?.response?.data?.error;
      setContactError(apiMessage || t('contactModal.errorGeneric'));
    } finally {
      setContactSending(false);
    }
  };

  const handleContactFieldChange = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    if (contactError) setContactError('');
  };

  return (
    <div className={`account-mobile ${isDarkMode ? 'mode-dark' : 'mode-light'} ${isSmallViewport ? 'account-mobile--applike' : ''}`}>
      <div className="account-mobile__header">
        <div className="account-mobile__sun" aria-hidden>
          <img
            src={isDarkMode ? nightImage : sunImage}
            alt=""
            className="account-mobile__sun-image"
          />
        </div>
        <div className="account-mobile__header-inner">
          <button className="account-mobile__backbtn" onClick={() => navigate(-1)} aria-label="inapoi">
            <ArrowBack />
          </button>
          <div className="account-mobile__title">{t('header.profile')}</div>
        </div>

        <div className="account-mobile__greeting">
          <span className="account-mobile__greeting-hello">{greetingByLang[currentLang]} </span>
          <span className="account-mobile__greeting-name">
            {displayFirstName}
            {displayLastName ? (
              <>
                {' '}<br className="account-mobile__greeting-break" />
                {displayLastName}
              </>
            ) : null}
            {' !'} <span className="account-mobile__greeting-emoji" aria-hidden>👋</span>
          </span>
        </div>
      </div>

      <main className="account-mobile__content">
        <section className="account-mobile__usercard">
          <div className="account-mobile__avatar-wrap">
            <div className="account-mobile__avatar">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="avatar" />
              ) : (
                <Person />
              )}
            </div>
          </div>

          <div className="account-mobile__info">
            <div className="account-mobile__name">{displayFirstName} {displayLastName}</div>
            {userProfile?.isAdmin ? (
              <div className="account-mobile__admin-badge">
                <VerifiedUser fontSize="inherit" />
                <span>Administrator</span>
              </div>
            ) : null}
            <div className="account-mobile__email">{userProfile?.email || '\u2014'}</div>
          </div>
        </section>

        <section className="account-mobile__menu-group" role="menu">
          {primaryMenuItems.map((item, idx) => (
            <div key={item.path || `item-${idx}`} role="none" className="account-mobile__menu-item-wrap">
              <button
                role="menuitem"
                className="account-mobile__menu-btn"
                onClick={() => {
                  if (item.actionType === 'contact') {
                      openContactModal();
                      return;
                  }
                  if (item.action) {
                    item.action();
                    return;
                  }
                  navigate(item.path);
                }}
                style={item.style}
              >
                <span className="account-mobile__menu-icon" aria-hidden>{item.icon}</span>
                <span className="account-mobile__menu-label">{item.label}</span>
                <span className="account-mobile__chevron" aria-hidden>&#8250;</span>
              </button>
            </div>
          ))}

          <div className="account-mobile__menu-item-wrap">
            <div className="account-mobile__menu-row" role="menuitem">
              <div className="account-mobile__menu-icon" aria-hidden><DarkMode /></div>
              <div className="account-mobile__menu-label">{isDarkMode ? t('common.lightMode') : t('common.darkMode')}</div>
              <div className="account-mobile__menu-control"><Switch checked={isDarkMode} onChange={toggleDarkMode} /></div>
            </div>
          </div>

          <div className="account-mobile__menu-item-wrap" role="none">
            <button role="menuitem" className="account-mobile__menu-btn" onClick={openContactModal}>
              <span className="account-mobile__menu-icon" aria-hidden><MailOutline /></span>
              <span className="account-mobile__menu-label">{t('contactModal.title')}</span>
              <span className="account-mobile__chevron" aria-hidden>&#8250;</span>
            </button>
          </div>
          
          <div className="account-mobile__menu-item-wrap" role="none">
            <button role="menuitem" className="account-mobile__menu-btn" onClick={() => setShowLanguageModal(true)}>
              <span className="account-mobile__menu-icon" aria-hidden><Language /></span>
              <span className="account-mobile__menu-label">{t('language.change')}</span>
              <span className="account-mobile__chevron" aria-hidden>&#8250;</span>
            </button>
          </div>
        </section>

        <section className="account-mobile__menu-group" role="menu">
          {infoMenuItems.map((item, idx) => (
            <div key={item.path || `sec-${idx}`} role="none" className="account-mobile__menu-item-wrap">
              <button
                role="menuitem"
                className="account-mobile__menu-btn"
                onClick={() => {
                  if (item.action) {
                    item.action();
                    return;
                  }
                  navigate(item.path);
                }}
                style={item.style}
              >
                <span className="account-mobile__menu-icon" aria-hidden>{item.icon}</span>
                <span className="account-mobile__menu-label">{item.label}</span>
                <span className="account-mobile__chevron" aria-hidden>&#8250;</span>
              </button>
            </div>
          ))}
        </section>

        <section className="account-mobile__menu-group account-mobile__logout-group" role="menu">
          <div className="account-mobile__menu-item-wrap">
            <button className="account-mobile__menu-btn account-mobile__logout" onClick={() => setShowLogoutConfirm(true)}>
              <span className="account-mobile__menu-icon" aria-hidden><Logout /></span>
              <span className="account-mobile__menu-label">{t('header.logout')}</span>
            </button>
          </div>
        </section>
      </main>

      {showLogoutConfirm && (
        <div className="account-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="account-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t('common.confirmTitle')}</h3>
            <p>{t('header.logout')}?</p>
            <div className="account-modal-actions">
              <button type="button" className="account-modal-btn ghost" onClick={() => setShowLogoutConfirm(false)}>{t('common.cancel')}</button>
              <button type="button" className="account-modal-btn danger" onClick={handleLogout}>{t('header.logout')}</button>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div className="account-modal-overlay" onClick={() => setShowLanguageModal(false)}>
          <div className="account-modal-card account-modal-card--language" onClick={(e) => e.stopPropagation()}>
            <button className="account-modal-close" onClick={() => setShowLanguageModal(false)} aria-label={t('common.close')}>
              <Close />
            </button>
            <h3>{t('language.change')}</h3>
            <div className="account-lang-list">
              <button type="button" className={`account-modal-btn ${currentLang === 'ro' ? 'is-active' : ''}`} onClick={() => selectLanguage('ro')}>{t('language.ro')}</button>
              <button type="button" className={`account-modal-btn ${currentLang === 'en' ? 'is-active' : ''}`} onClick={() => selectLanguage('en')}>{t('language.en')}</button>
              <button type="button" className={`account-modal-btn ${currentLang === 'es' ? 'is-active' : ''}`} onClick={() => selectLanguage('es')}>{t('language.es')}</button>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="account-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="account-modal-card contact" onClick={(e) => e.stopPropagation()}>
            <button className="account-modal-close" onClick={() => setShowContactModal(false)} aria-label={t('contactModal.closeAria')}>
              <Close />
            </button>
            <div className="account-contact-head" aria-hidden>
              <div className="account-contact-icon-wrap">
                <MailOutlineRounded />
              </div>
              <h3>{t('contactModal.title')}</h3>
              <p>{t('contactModal.email')}</p>
            </div>

            <div className="account-contact-form" role="form" aria-label={t('contactModal.title')}>
              <p className="account-contact-intro">{t('contactModal.intro')}</p>

              <div className="account-contact-row">
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => handleContactFieldChange('name', e.target.value)}
                  maxLength={100}
                  placeholder={`${t('contactModal.nameLabel')} *`}
                  aria-label={t('contactModal.nameLabel')}
                  autoComplete="name"
                />
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => handleContactFieldChange('email', e.target.value)}
                  maxLength={200}
                  placeholder={`${t('contactModal.emailLabel')} *`}
                  aria-label={t('contactModal.emailLabel')}
                  autoComplete="email"
                />
              </div>

              <textarea
                rows={5}
                value={contactForm.message}
                onChange={(e) => handleContactFieldChange('message', e.target.value)}
                maxLength={3000}
                placeholder={`${t('contactModal.messageLabel')} *`}
                aria-label={t('contactModal.messageLabel')}
              />

              <div className="account-contact-counter">{contactForm.message.length} / 3000</div>
            </div>

            {contactError ? <p className="account-contact-error">{contactError}</p> : null}
            <div className="account-modal-actions">
              <button type="button" className="account-modal-btn ghost" onClick={() => setShowContactModal(false)}>{t('contactModal.cancelButton')}</button>
              <button type="button" className="account-modal-btn primary" onClick={submitContact} disabled={contactSending}>
                {!contactSending ? <SendRounded fontSize="small" /> : null}
                {contactSending ? t('contactModal.sending') : t('contactModal.sendButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="account-mobile__footer-spacer" />
      <Toast
        message={t('header.logoutSuccess')}
        type="info"
        visible={showLogoutToast}
        onClose={() => setShowLogoutToast(false)}
      />
      <Toast
        message={t('contactModal.successTitle')}
        type="success"
        visible={showContactSuccessToast}
        onClose={() => setShowContactSuccessToast(false)}
      />
    </div>
  );
}
