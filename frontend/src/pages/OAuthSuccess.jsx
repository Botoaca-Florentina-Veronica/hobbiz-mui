import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Extrage tokenul din query string
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Poți face un request pentru profilul userului dacă vrei
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div>Se finalizează autentificarea...</div>;
}
