import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import FooterPublishButton from './FooterPublishButton';
import './Footer.css';
import LegalSection from './LegalSection';
import MobileLegal from './MobileLegal';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export default function Footer({ hideOnMobile = false, hideLegalUpTo1200 = false, hideLegal = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;
    if (isMobile) {
      navigate('/cont');
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className={`footer ${hideOnMobile ? 'hide-on-mobile' : ''} ${hideLegalUpTo1200 ? 'hide-legal-upto-1200' : ''}`}>


  {/* Separator deasupra legal-section */}
  {!hideLegal && <div className="footer-separator desktop-only" />}

      {/* LegalSection desktop/tablet (component dedicat). Pe mobil folosim MobileLegal. */}
      {!hideLegal && (
        <div className="desktop-only">
          <LegalSection />
        </div>
      )}

  {/* Versiunea compactă pentru mobil */}
  {!hideLegal && <MobileLegal />}

      {/* Separator între legal-section și footer propriu-zis */}
  {!hideLegal && <div className="footer-separator desktop-only" />}

      {/* Footer propriu-zis: copyright și bara mobilă */}
      {!hideLegal && (
        <footer className="desktop-footer desktop-only">
          <p>{t('footer.copyright')}</p>
        </footer>
      )}
      
      {/* Mobile Footer - doar pe mobile */}
      <div className="footer-mobile-buttons">
        <div className="footer-active-indicator"></div>
        <div className="footer-icons">
          <div 
            className={`footer-icon ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
            aria-label={t('footer.explore')}
            role="button"
          >
            <TravelExploreOutlinedIcon />
            <span>{t('footer.explore')}</span>
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
            <span>{t('footer.favorites')}</span>
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
            <span>{t('footer.chat')}</span>
          </div>
          
          <div 
            className={`footer-icon footer-account ${location.pathname.includes('/profil') || location.pathname.includes('/setari-cont') || location.pathname.includes('/cont') || location.pathname.includes('/anunturile-mele') ? 'active' : ''}`}
            onClick={handleAccountClick}
            style={{ position: 'relative' }}
            aria-label={t('footer.account')}
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
            <span>{t('footer.account')}</span>
            {showDropdown && isAuthenticated && (
              <div className="section-dropdown footer-dropdown" style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                <a onClick={(e) => { e.preventDefault(); navigate('/setari-cont'); setShowDropdown(false); }}>{t('header.settings')}</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/anunturile-mele'); setShowDropdown(false); }}>{t('header.myAnnouncements')}</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/profil'); setShowDropdown(false); }}>{t('header.profile')}</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/plati'); setShowDropdown(false); }}>{t('header.payments')}</a>
                <a onClick={(e) => { e.preventDefault(); navigate('/contul-tau'); setShowDropdown(false); }}>{t('footer.accountHub')}</a>
                <a onClick={(e) => { e.preventDefault(); toggleDarkMode(); }}>
                  {isDarkMode ? t('common.lightMode') : t('common.darkMode')}
                </a>
                <a onClick={(e) => { e.preventDefault(); localStorage.removeItem('token'); localStorage.removeItem('userId'); setShowDropdown(false); navigate('/'); window.location.reload(); }}>{t('header.logout')}</a>
              </div>
            )}
          </div>
        </div>
      </div>
  {/* MobileLegal include și copyright-ul pe mobil */}
    </div>
  );
}