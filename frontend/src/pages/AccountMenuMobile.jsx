import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Button,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Settings, 
  Campaign, 
  Person, 
  InfoOutlined,
  Gavel,
  Logout,
  DarkMode
} from '@mui/icons-material';
import apiClient from '../api/api';
import Toast from '../components/Toast';
import { useTranslation } from 'react-i18next';
import './AccountMenuMobile.v2.css';

export default function AccountMenuMobile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);

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

  const toggleDarkMode = () => {
    const body = document.body;
    const next = !body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', next);
    try { localStorage.setItem('darkMode', next ? 'true' : 'false'); } catch {}
    setIsDarkMode(next);
  };

  const handleLogout = async () => {
    try {
      const { logout } = await import('../api/api');
      await logout();
    } catch (err) {
      // ignore
    } finally {
      try { localStorage.removeItem('token'); } catch {}
      try { localStorage.removeItem('userId'); } catch {}
      window.dispatchEvent(new Event('logout'));
      setShowLogoutToast(true);
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 2000);
    }
  };

  // While we determine auth, don't render the page
  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return null; // redirect in effect

  const displayFirstName = userProfile?.firstName || 'Utilizator';
  const displayLastName = userProfile?.lastName || '';
  const displayPhone = userProfile?.phone || '\u2014';

  const menuItems = [
    { icon: <Settings />, label: 'Setări', path: '/setari-cont' },
    { icon: <Campaign />, label: 'Anunțurile mele', path: '/anunturile-mele' },
    { icon: <Person />, label: 'Profil', path: '/profil' },
    { icon: <InfoOutlined />, label: 'Despre noi', path: '/despre' },
    { icon: <Gavel />, label: 'Informații legale', path: '/informatii-legale' }
  ];

  return (
    <div className="account-mobile">
      <div className="account-mobile__header">
        <div className="account-mobile__header-inner">
          <button className="account-mobile__backbtn" onClick={() => navigate(-1)} aria-label="inapoi">
            <ArrowBack />
          </button>
          <div className="account-mobile__title">Profil</div>
        </div>

        <div className="account-mobile__greeting">Ceau <span className="account-mobile__greeting-name">{displayFirstName} {displayLastName}!</span></div>
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
            <div className="account-mobile__phone">{displayPhone}</div>
            <div className="account-mobile__email">{userProfile?.email || '\u2014'}</div>
          </div>
        </section>

        <ul className="account-mobile__menu" role="menu">
          {menuItems.map((item) => (
            <li key={item.path} role="none">
              <button role="menuitem" className="account-mobile__menu-btn" onClick={() => navigate(item.path)}>
                <span className="account-mobile__menu-icon" aria-hidden>{item.icon}</span>
                <span className="account-mobile__menu-label">{item.label}</span>
              </button>
            </li>
          ))}

          <li>
            <div className="account-mobile__menu-row">
              <div className="account-mobile__menu-icon" aria-hidden><DarkMode /></div>
              <div className="account-mobile__menu-label">{isDarkMode ? 'Mod luminos' : 'Mod întunecat'}</div>
              <div className="account-mobile__menu-control"><Switch checked={isDarkMode} onChange={toggleDarkMode} /></div>
            </div>
          </li>

          <li>
            <button className="account-mobile__menu-btn account-mobile__logout" onClick={handleLogout}>
              <span className="account-mobile__menu-icon" aria-hidden><Logout /></span>
              <span className="account-mobile__menu-label">Deconectează-te</span>
            </button>
          </li>
        </ul>
      </main>

      <div className="account-mobile__footer-spacer" />
      <Toast
        message={t('header.logoutSuccess')}
        type="info"
        visible={showLogoutToast}
        onClose={() => setShowLogoutToast(false)}
      />
    </div>
  );
}
