import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import apiClient from '../api/api';
import './AccountMenuMobile.css';

export default function AccountMenuMobile() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
        if (!response.data.isAuthenticated) {
          navigate('/login');
        }
      } catch (e) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Sync dark mode with body + localStorage (listen and apply)
  useEffect(() => {
    const body = document.body;
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      body.classList.add('dark-mode');
    } else if (saved === 'false') {
      body.classList.remove('dark-mode');
    }
    setIsDarkMode(body.classList.contains('dark-mode'));

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

  const handleLogout = () => {
    import('../api/api').then(({ logout }) => {
      logout().finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/');
        window.location.reload();
      });
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="mobile-account-menu">
      <div className="mobile-account-menu__header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Înapoi">←</button>
        <h1>Contul tău</h1>
      </div>

      <nav className="mobile-account-menu__list">
        <button className="menu-item" onClick={() => navigate('/setari-cont')}>Setări</button>
        <button className="menu-item" onClick={() => navigate('/anunturile-mele')}>Anunțurile mele</button>
        <button className="menu-item" onClick={() => navigate('/profil')}>Profil</button>
        <button className="menu-item" onClick={() => navigate('/plati')}>Plăți</button>
        <button className="menu-item" onClick={() => navigate('/contul-tau')}>Contul tău</button>
        <button className="menu-item" onClick={toggleDarkMode}>
          {isDarkMode ? 'Luminos' : 'Mod Întunecat'}
        </button>
      </nav>

      <div className="mobile-account-menu__footer">
        <button className="logout-btn" onClick={handleLogout}>Deconectează-te</button>
      </div>
    </div>
  );
}
