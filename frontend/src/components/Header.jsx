import { useNavigate, useLocation } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart, HiOutlineBell, HiOutlineChat } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import puzzleLogo from '../assets/images/puzzle.png';
import puzzle2 from '../assets/images/puzzle2.png';
import { useEffect, useState } from "react";
import { useAuth } from '../context/AuthContext.jsx';
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
  const [unreadCount, setUnreadCount] = useState(0); // Număr notificări necitite
  const [chatUnreadCount, setChatUnreadCount] = useState(0); // Număr mesaje chat necitite
  // Versiune pentru recalcularea numărului de favorite în modul guest (se actualizează la evenimente)
  const [guestFavVersion, setGuestFavVersion] = useState(0);
  const auth = useAuth();

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

  // Funcție pentru a obține numărul de mesaje necitite în chat
  const fetchChatUnreadCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await apiClient.get(`/api/messages/conversations/${userId}`);
      const conversations = response.data || [];
      const unread = conversations.filter(c => c.unread).length;
      setChatUnreadCount(unread);
    } catch (error) {
      if (error?.response?.status === 401) {
        setChatUnreadCount(0);
        return;
      }
      console.error('Eroare la obținerea numărului de mesaje necitite:', error);
      setChatUnreadCount(0);
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
      setChatUnreadCount(0);
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
        
        // Dacă utilizatorul este autentificat, obține numărul de notificări și chat necitite
  if (response.data.isAuthenticated) {
          fetchUnreadCount();
          fetchChatUnreadCount();
        }
      } catch (error) {
        setIsAuthenticated(false);
        setAvatar(null);
        setUnreadCount(0);
        setChatUnreadCount(0);
      }
    };
    checkAuth();
  }, []);

  // Actualizează contoarele când se schimbă pagina (pentru a reflecta citirea notificărilor/chat)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchChatUnreadCount();
    }
  }, [location.pathname, isAuthenticated]);

  // Polling pentru actualizarea în timp real a contoarelor (la fiecare 30 de secunde)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchChatUnreadCount();
    }, 30000); // 30 secunde

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Recalculează pentru guest când se schimbă favoritele (eveniment custom + storage cross-tab)
  useEffect(() => {
    const handler = () => setGuestFavVersion(v => v + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('favorites:updated', handler);
      window.addEventListener('storage', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('favorites:updated', handler);
        window.removeEventListener('storage', handler);
      }
    };
  }, []);

  // Calculează numărul de favorite pentru guest la fiecare re-randare relevantă
  const computeGuestFavoriteCount = () => {
    try {
      const raw = localStorage.getItem('favoriteAnnouncements_guest');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return 0;
      // Suportă ambele formate: [string] sau [{id, addedAt}]
      if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        return parsed.length;
      }
      return parsed.length;
    } catch {
      return 0;
    }
  };

  const favoriteCount = auth?.user ? (auth?.favorites?.length || 0) : computeGuestFavoriteCount();

  // Ascultă evenimentul global emis din ChatPage pentru a actualiza instant badge-ul
  useEffect(() => {
    const handler = () => {
      if (isAuthenticated) {
        fetchChatUnreadCount();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('chat:counts-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chat:counts-updated', handler);
      }
    };
  }, [isAuthenticated]);

  // Detectare mobil + width pentru regula specială doar pe homepage
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1200px)').matches
  );
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1200px)');
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener(handler);
    }
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    setIsMobile(mq.matches);
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
      window.removeEventListener('resize', onResize);
    };
  }, []);
  const isHomepage = location.pathname === '/' || location.pathname === '';
  const showMobileHeader = isHomepage ? windowWidth < 1200 : isMobile;

  // Asigură că pe pagina de chat, când trecem în layout-ul "desktop" al chat-ului ( > 870px ),
  // afișăm întotdeauna header-ul de desktop chiar dacă încă suntem sub 1200px (interval 871-1199px).
  const CHAT_DESKTOP_BREAKPOINT = 870; // folosit și în ChatPage.jsx
  const isChatRoute = location.pathname.startsWith('/chat');
  const effectiveShowMobileHeader = (isChatRoute && windowWidth > CHAT_DESKTOP_BREAKPOINT)
    ? false
    : showMobileHeader;

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
  {effectiveShowMobileHeader ? (
        ((
          location.pathname.startsWith('/chat') ||
          location.pathname.startsWith('/favorite-announcements') ||
          location.pathname.startsWith('/cont') ||
          location.pathname.startsWith('/setari-cont') ||
          location.pathname.startsWith('/add-announcement') ||
          location.pathname.startsWith('/anunturile-mele') ||
          location.pathname.startsWith('/profil') ||
          location.pathname.startsWith('/cookie') ||
          location.pathname.startsWith('/confidentialitate') ||
          location.pathname.startsWith('/despre') ||
          location.pathname.startsWith('/cum-functioneaza') ||
          location.pathname.startsWith('/termeni') ||
          // Hide MobileHeader on notifications page as well
          location.pathname.startsWith('/notificari') ||
          // Hide MobileHeader on announcement details and category pages on mobile
          location.pathname.startsWith('/announcement/') ||
          location.pathname.startsWith('/anunturi-categorie') ||
          // Hide MobileHeader on add/edit announcement pages
          location.pathname.startsWith('/adauga-anunt') ||
          location.pathname.startsWith('/edit-announcement')
        ) ? null : (
          <MobileHeader 
            notificationCount={unreadCount} 
            onSearchFocus={() => {/* handel search focus */}}
            onNotificationClick={() => navigate('/notificari')}
          />
        ))
      ) : (
        <>
          <div className="header fixed-header">
            <ul className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <li style={{display: 'flex', alignItems: 'center'}}>
                <img src={isDarkMode ? puzzle2 : puzzleLogo} alt="Puzzle Logo" className="puzzle-logo" />
                <img src={logoDark} alt="Logo" className="main-logo" />
              </li>
            </ul>
            <ul className="nav-right">
              <li>
                <button className="add-button" onClick={handleAddAnnouncement}>Adaugă un anunț</button>
              </li>
              <li>
                <button className="favorite-btn notification-btn" onClick={() => navigate('/favorite-announcements')}>
                  <HiOutlineHeart />
                  {favoriteCount > 0 && (
                    <span className={`notification-badge ${favoriteCount > 99 ? 'notification-badge-large' : ''}`}>
                      {favoriteCount > 99 ? '99+' : favoriteCount}
                    </span>
                  )}
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
                  {chatUnreadCount > 0 && (
                    <span className={`notification-badge ${chatUnreadCount > 99 ? 'notification-badge-large' : ''}`}>
                      {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                    </span>
                  )}
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