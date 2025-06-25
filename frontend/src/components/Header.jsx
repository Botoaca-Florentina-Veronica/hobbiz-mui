import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import { useEffect, useState } from "react";
import axios from 'axios';
import { Snackbar, Alert } from '@mui/material';
import apiClient from '../api/api';
import './Header.css';

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
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
        // Daca exista avatar Google, salveaza-l
        if (response.data.googleAvatar) {
          setGoogleAvatar(response.data.googleAvatar);
        } else {
          setGoogleAvatar(null);
        }
      } catch (error) {
        console.error('Eroare la verificarea autentificării:', error);
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
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setOpenSnackbar(true); // Deschide Snackbar-ul
    navigate('/');
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
      <div className="header fixed-header">
        <ul className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <li>
            <img src={isDarkMode ? logoDark : logoLight} alt="Logo" />
          </li>
        </ul>
        <ul className="nav-right">
          <li>
            <button className="add-button" onClick={handleAddAnnouncement}>Adaugă un anunț</button>
          </li>
          <li>
            <button className="favorite-btn">
              <HiOutlineHeart />
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
                <img src={googleAvatar} alt="Google Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }} />
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
  );
}