import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthSuccess() {
  const navigate = useNavigate();

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
      // Poți face un request pentru profilul userului dacă vrei
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div>Se finalizează autentificarea...</div>;
}
