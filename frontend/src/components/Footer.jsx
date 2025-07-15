
import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import { FiCompass } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import apiClient from '../api/api';
import FooterPublishButton from './FooterPublishButton';
import './Footer.css';
export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState(null);

  useEffect(() => {
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

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className="footer">
      {/* Bara separator subtire */}
      <div className="footer-separator" />
      {/* Versiunea desktop - copyright sub bara */}
      <footer className="desktop-footer">
        <p>©Copyright Hobbiz 2025</p>
      </footer>

      {/* Versiunea mobilă - bara de navigare */}
      <div className="footer-mobile-buttons">
        <div className="footer-icon footer-account" onClick={handleAccountClick} style={{ position: 'relative' }}>
          {googleAvatar ? (
            <img src={googleAvatar} alt="Google Avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxSizing: 'border-box' }} />
          ) : (
            <HiOutlineUser size={26} />
          )}
          <span className="footer-account-label">Cont</span>
          {showDropdown && isAuthenticated && (
            <div className="section-dropdown footer-dropdown" style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
              <a onClick={(e) => { e.preventDefault(); navigate('/setari-cont'); setShowDropdown(false); }}>Setări</a>
              <a onClick={(e) => { e.preventDefault(); navigate('/anunturile-mele'); setShowDropdown(false); }}>Anunțurile mele</a>
              <a onClick={(e) => { e.preventDefault(); navigate('/profil'); setShowDropdown(false); }}>Profil</a>
              <a onClick={(e) => { e.preventDefault(); navigate('/plati'); setShowDropdown(false); }}>Plăți</a>
              <a onClick={(e) => { e.preventDefault(); navigate('/contul-tau'); setShowDropdown(false); }}>Contul tău</a>
              <a onClick={(e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('userId'); setShowDropdown(false); navigate('/'); window.location.reload(); }}>Deconectează-te</a>
            </div>
          )}
        </div>
        <FooterPublishButton 
          onClick={() => navigate('/add-announcement')}
          active={location.pathname === '/add-announcement'}
        />
        <div 
          className="footer-icon footer-favorite" 
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login');
            } else {
              navigate('/favorite-announcements');
            }
          }}
        >
          <HiOutlineHeart />
          <span className="footer-favorite-label" style={location.pathname === '/favorite-announcements' ? {opacity: 1, height: 'auto', pointerEvents: 'auto'} : {}}>
            Favorite
          </span>
        </div>
        <div className="footer-icon footer-explore" onClick={() => navigate("/explore")}> 
          <FiCompass />
          <span className="footer-explore-label" style={location.pathname === '/explore' ? {opacity: 1, height: 'auto', pointerEvents: 'auto'} : {}}>
            Explorează
          </span>
        </div>
      </div>
    </div>
  );
}