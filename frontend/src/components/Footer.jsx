import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import apiClient from '../api/api';
import FooterPublishButton from './FooterPublishButton';
import './Footer.css';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export default function Footer({ hideOnMobile = false, hideLegalUpTo1200 = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleAvatar, setGoogleAvatar] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Sync dark mode with body + localStorage
  useEffect(() => {
    const body = document.body;
    // Apply saved preference
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      body.classList.add('dark-mode');
    } else if (saved === 'false') {
      body.classList.remove('dark-mode');
    }
    setIsDarkMode(body.classList.contains('dark-mode'));

    // Observe external changes
    const observer = new MutationObserver(() => {
      setIsDarkMode(body.classList.contains('dark-mode'));
    });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const body = document.body;
    const next = !body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', next);
    localStorage.setItem('darkMode', next ? 'true' : 'false');
    setIsDarkMode(next);
  };

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      navigate('/cont');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`footer ${hideOnMobile ? 'hide-on-mobile' : ''} ${hideLegalUpTo1200 ? 'hide-legal-upto-1200' : ''}`}>


      {/* Separator deasupra legal-section */}
      <div className="footer-separator" />
      {/* LegalSection combinat aici */}
      <div className="legal-section">
        <div className="legal-section__column">
          <div className="legal-section__logo">
            <span role="img" aria-label="chip" className="legal-section__icon">🧩</span>
            <span className="legal-section__brand">Hobbiz</span>
          </div>
          <p className="legal-section__desc">Descoperă, vinde și cumpără servicii sau produse de la pasionați ca tine.</p>
        </div>
        <div className="legal-section__column">
          <h4>Linkuri utile</h4>
          <ul>
            <li><a href="/despre">Despre noi</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/cum-functioneaza">Cum funcționează</a></li>
          </ul>
        </div>
        <div className="legal-section__column">
          <h4>Legal</h4>
          <ul>
            <li><a href="/termeni">Termeni și condiții</a></li>
            <li><a href="/confidentialitate">Politică de Confidențialitate</a></li>
            <li><a href="/cookie">Cookie Policy</a></li>
          </ul>
        </div>
        <div className="legal-section__column legal-section__socials">
          <h4>Urmărește-ne</h4>
          <div className="legal-section__icons">
            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="Discord"><i className="fa-brands fa-discord"></i></a>
          </div>
        </div>
      </div>

      {/* Separator între legal-section și footer propriu-zis */}
      <div className="footer-separator" />

      {/* Footer propriu-zis: copyright și bara mobilă */}
      <footer className="desktop-footer">
        <p>Copyright Hobbiz 2025. Toate drepturile rezervate</p>
      </footer>
      
      {/* Mobile Footer - doar pe mobile */}
      <div className="footer-mobile-buttons">
        <div className="footer-icons">
          <div 
            className={`footer-icon ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
            aria-label="Explorează"
            role="button"
          >
            <TravelExploreOutlinedIcon />
            <span>Explorează</span>
          </div>
          
          <div 
            className={`footer-icon ${location.pathname === '/favorite-announcements' ? 'active' : ''}`}
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                navigate('/favorite-announcements');
              }
            }}
          >
            <FavoriteBorderOutlinedIcon />
            <span>Favorite</span>
          </div>
          
          <FooterPublishButton 
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                navigate('/add-announcement');
              }
            }}
            active={location.pathname === '/add-announcement'}
          />
          
          <div 
            className={`footer-icon ${location.pathname === '/chat' ? 'active' : ''}`}
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
              } else {
                navigate('/chat');
              }
            }}
          >
            <ChatBubbleOutlineOutlinedIcon />
            <span>Chat</span>
          </div>
          
          <div 
            className={`footer-icon footer-account ${location.pathname.includes('/profil') || location.pathname.includes('/setari-cont') ? 'active' : ''}`}
            onClick={handleAccountClick}
            style={{ position: 'relative' }}
            aria-label="Cont"
            role="button"
          >
            {googleAvatar ? (
              <img 
                src={googleAvatar} 
                alt="Avatar" 
                style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              <AccountCircleOutlinedIcon />
            )}
            <span>Cont</span>
            {showDropdown && isAuthenticated && (
              <div className="section-dropdown footer-dropdown" style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                <a onClick={(e) => { e.preventDefault(); navigate('/setari-cont'); setShowDropdown(false); }}>Setări</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/anunturile-mele'); setShowDropdown(false); }}>Anunțurile mele</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/profil'); setShowDropdown(false); }}>Profil</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/plati'); setShowDropdown(false); }}>Plăți</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/contul-tau'); setShowDropdown(false); }}>Contul tău</a>
                <a onClick={(e) => { e.preventDefault(); toggleDarkMode(); }}>
                  {isDarkMode ? 'Luminos' : 'Mod Întunecat'}
                </a>
                <a onClick={(e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('userId'); setShowDropdown(false); navigate('/'); window.location.reload(); }}>Deconectează-te</a>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile legal block to show copyright text without desktop footer */}
      <div className="footer-mobile-legal" aria-hidden={false}>
        <small>Copyright © Hobbiz 2025. Toate drepturile rezervate.</small>
      </div>
    </div>
  );
}