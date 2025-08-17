import { useNavigate, useLocation } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart, HiOutlineBell, HiOutlineChat } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import puzzleLogo from '../assets/images/puzzle.png';
import puzzle2 from '../assets/images/puzzle2.png';
import { useEffect, useState } from "react";
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';
import apiClient from '../api/api';
import './Header.css';
import MobileHeader from './MobileHeader';
import './MobileHeader.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [avatar, setAvatar] = useState(null); // Avatar personal sau Google
  const [unreadCount, setUnreadCount] = useState(0); // Nou: numărul de notificări necitite

  // Funcție pentru a obține numărul de notificări necitite
  const fetchUnreadCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      const response = await apiClient.get(`/api/notifications/${userId}`);
      const notifications = response.data;
      const unreadNotifications = notifications.filter(n => !n.read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      if (error?.response?.status === 401) {
        // token expirat – nu forțăm redirect aici; contorul rămâne 0 până la reautentificare
        setUnreadCount(0);
        return;
      }
      console.error('Eroare la obținerea notificărilor necitite:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const body = document.body;
    setIsDarkMode(body.classList.contains('dark-mode'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(body.classList.contains('dark-mode'));
    });

    observer.observe(body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Dacă nu există token, nu ești autentificat
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setAvatar(null);
      setUnreadCount(0);
      return;
    }
    // Dacă există token, verifică și cu backendul (pentru sesiuni Google etc)
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
        if (response.data.avatar) {
          setAvatar(response.data.avatar);
        } else if (response.data.googleAvatar) {
          setAvatar(response.data.googleAvatar);
        } else {
          setAvatar(null);
        }
        
        // Dacă utilizatorul este autentificat, obține numărul de notificări necitite
        if (response.data.isAuthenticated) {
          fetchUnreadCount();
        }
      } catch (error) {
        setIsAuthenticated(false);
        setAvatar(null);
        setUnreadCount(0);
      }
    };
    checkAuth();
  }, []);

  // Actualizează contorul când se schimbă pagina (pentru a reflecta citirea notificărilor)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [location.pathname, isAuthenticated]);

  // Polling pentru actualizarea în timp real a contorului (la fiecare 30 de secunde)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 secunde

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Detectează mobilul în mod reactiv (la resize / schimbare media query)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e) => setIsMobile(e.matches);
    // compat: event listener on MQ
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      // Safari
      mq.addListener(handler);
    }
    // inițial, sincronizează
    setIsMobile(mq.matches);
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isAuthenticated) {
      setShowDropdown(true);
    }
  };

  const handleMouseLeave = () => {
    setTimeout(() => setShowDropdown(false), 200); // Adaugă un delay de 200ms înainte de a închide meniul
  };

  const handleLogout = () => {
    // Deconectare completă: și local, și server (cookie/session)
    import('../api/api').then(({ logout }) => {
      logout().finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setOpenSnackbar(true);
        navigate('/');
        window.location.reload();
      });
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleAddAnnouncement = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/add-announcement');
    }
  };

  return (
    <>
      {isMobile ? (
        (location.pathname === '/setari-cont' || location.pathname === '/profil') ? null : (
          <MobileHeader 
            notificationCount={unreadCount} 
            onSearchFocus={() => {/* handel search focus */}}
            onNotificationClick={() => navigate('/notificari')}
          />
        )
      ) : (
        <>
          <div className="header fixed-header">
            <ul className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <li style={{display: 'flex', alignItems: 'center'}}>
                <img src={isDarkMode ? puzzle2 : puzzleLogo} alt="Puzzle Logo" className="puzzle-logo" />
                <img src={isDarkMode ? logoDark : logoLight} alt="Logo" className="main-logo" />
              </li>
            </ul>
            <ul className="nav-right">
              <li>
                <button className="add-button" onClick={handleAddAnnouncement}>Adaugă un anunț</button>
              </li>
              <li>
                <button className="favorite-btn" onClick={() => navigate('/favorite-announcements')}>
                  <HiOutlineHeart />
                </button>
              </li>
              <li>
                <button className="favorite-btn notification-btn" style={{marginLeft: 0}} onClick={() => navigate('/notificari')}>
                  <HiOutlineBell />
                  {unreadCount > 0 && (
                    <span className={`notification-badge ${unreadCount > 99 ? 'notification-badge-large' : ''}`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </li>
              <li>
                <button className="favorite-btn" style={{marginLeft: 0}} onClick={() => navigate('/chat')}>
                  <HiOutlineChat />
                </button>
              </li>
              <li
                className="user-account-container"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <input 
                  type="checkbox" 
                  id="account-dropdown" 
                  className="dropdown" 
                  checked={showDropdown}
                  onChange={() => setShowDropdown(!showDropdown)} 
                />
                <label 
                  htmlFor="account-dropdown" 
                  className="for-dropdown" 
                  onClick={handleAccountClick}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8, border: '2px solid #fff', boxSizing: 'border-box' }} />
                  ) : (
                    <HiOutlineUser size={24} />
                  )}
                  <span>Contul tău</span>
                </label>
                {isAuthenticated && (
                  <div className="section-dropdown">
                    <a onClick={(e) => { e.preventDefault(); navigate('/setari-cont'); }}>Setări</a>
                    <a onClick={(e) => { e.preventDefault(); navigate('/anunturile-mele'); }}>Anunțurile mele</a>
                    <a onClick={(e) => { e.preventDefault(); navigate('/profil'); }}>Profil</a>
                    <a onClick={(e) => { e.preventDefault(); navigate('/plati'); }}>Plăți</a>
                    <a onClick={(e) => { e.preventDefault(); navigate('/contul-tau'); }}>Contul tău</a>
                    <a onClick={(e) => { e.preventDefault(); handleLogout(); }}>Deconectează-te</a>
                  </div>
                )}
              </li>
            </ul>
          </div>
          <Snackbar 
            open={openSnackbar} 
            autoHideDuration={3000} 
            onClose={handleCloseSnackbar} 
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%', fontSize: '1.2rem', padding: '16px' }}>
              Ai fost deconectat din cont.
            </Alert>
          </Snackbar>
        </>
      )}
    </>
  );
}