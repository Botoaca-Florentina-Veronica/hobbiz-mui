
import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart, HiOutlineBell, HiOutlineChat } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import puzzleLogo from '../assets/images/puzzle.png';
import { useEffect, useState } from "react";
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';
import apiClient from '../api/api';
import './Header.css';
import MobileHeader from './MobileHeader';
import './MobileHeader.css';

export default function Header() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState(null); // Nou: avatar Google

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
      setGoogleAvatar(null);
      return;
    }
    // Dacă există token, verifică și cu backendul (pentru sesiuni Google etc)
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
        if (response.data.googleAvatar) {
          setGoogleAvatar(response.data.googleAvatar);
        } else {
          setGoogleAvatar(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setGoogleAvatar(null);
      }
    };
    checkAuth();
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

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
  return (
    <>
      {isMobile ? (
        <MobileHeader notificationCount={5} />
      ) : (
        <>
          <div className="header fixed-header">
            <ul className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <li style={{display: 'flex', alignItems: 'center'}}>
                <img src={puzzleLogo} alt="Puzzle Logo" className="puzzle-logo" />
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
                <button className="favorite-btn" style={{marginLeft: 0}}>
                  <HiOutlineBell />
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
                  {googleAvatar ? (
                    <img src={googleAvatar} alt="Google Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8, border: '2px solid #fff', boxSizing: 'border-box' }} />
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