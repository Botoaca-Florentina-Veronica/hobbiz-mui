import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth() || {};
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Elimină token-ul din URL imediat — nu rămâne în istoricul browserului
    // și nu apare în header-ul Referer dacă userul navighează mai departe
    window.history.replaceState({}, document.title, window.location.pathname);

    if (token) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastAvatarUrl');
      } catch (e) {
        console.warn('Failed to clear old tokens:', e);
      }
      localStorage.setItem('token', token);

      const finalizeOAuth = async () => {
        try {
          await refreshUser?.({ force: true });
        } catch (e) {
          // Ignore and validate from localStorage below.
        }

        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
          navigate('/login?error=' + encodeURIComponent('Sesiunea Google a expirat. Te rugăm să încerci din nou.'));
          return;
        }

        navigate('/');
      };

      finalizeOAuth();
    } else {
      navigate('/login');
    }
  }, [navigate, refreshUser]);

  return <div>Se finalizează autentificarea...</div>;
}
