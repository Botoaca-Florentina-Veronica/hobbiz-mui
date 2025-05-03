import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import { useEffect, useState } from "react";
import axios from 'axios';
import { Menu, MenuItem } from '@mui/material';

export default function Header() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
        const response = await axios.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
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
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  };

  return (
    <div className="header fixed-header">
      <ul className="logo">
        <li>
          <img src={isDarkMode ? logoDark : logoLight} alt="Logo" />
        </li>
      </ul>
      <ul className="nav-right">
        <li>
          <button className="add-button">Adaugă un anunț</button>
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
          <button className="user-account-btn" onClick={handleAccountClick}>
            <HiOutlineUser size={24} />
            <span>Contul tău</span>
          </button>
          {isAuthenticated && showDropdown && (
            <ul className="dropdown-menu">
              <li><button onClick={() => navigate('/setari')}>Setări</button></li>
              <li><button onClick={() => navigate('/anunturile-mele')}>Anunțurile mele</button></li>
              <li><button onClick={() => navigate('/profil')}>Profil</button></li>
              <li><button onClick={() => navigate('/plati')}>Plăți</button></li>
              <li><button onClick={() => navigate('/contul-tau')}>Contul tău</button></li>
              <li><button onClick={handleLogout}>Deconectează-te</button></li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}