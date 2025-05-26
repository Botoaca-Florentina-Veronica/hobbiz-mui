import { useState } from 'react';
import { useEffect } from 'react';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Sau folosește fetch
import '../pages/LoginSignup.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Trimite cererea la backend
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, {
        email,
        password
      });

      // Salvează token-ul în localStorage/sessionStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      // Redirect către pagina principală sau dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Autentificare eșuată');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Intră în cont</h2>
      
      {/* Butoane sociale */}
      <div className="social-login">
        <GoogleLoginButton />
        <FacebookLoginButton onClick={() => console.log('Facebook login')} />
        <AppleLoginButton onClick={() => console.log('Apple login')} />
      </div>

      <div className="divider">SAU</div>

      {/* Formular clasic */}
      <form onSubmit={handleSubmit} className="email-login">
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          placeholder="Adresa ta de email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Parola"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          className="submit-btn" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Se încarcă...' : 'Intră în cont'}
        </button>
      </form>

      <div className="login-links">
        <Link to="/forgot-password">Ai uitat parola?</Link>
        <Link to="/signup">Creează cont</Link>
      </div>
    </div>
  );
}