import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth() || {};

  useEffect(() => {
    // Extrage tokenul din query string
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // IMPORTANT: Șterge token-urile vechi ÎNAINTE de a seta noul token
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('lastAvatarUrl');
      } catch (e) {
        console.warn('Failed to clear old tokens:', e);
      }
      localStorage.setItem('token', token);
      // Re-hidratează AuthContext imediat după OAuth (altfel user/favorite apar cu întârziere)
      refreshUser?.({ force: true }).finally(() => navigate('/'));
    } else {
      navigate('/login');
    }
  }, [navigate, refreshUser]);

  return <div>Se finalizează autentificarea...</div>;
}
