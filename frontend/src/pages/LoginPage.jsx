import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import '../pages/LoginSignup.css';
import introImg from '../assets/images/intro-web.png';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  useEffect(() => {
    const adjust = () => {
      if (!loginRef.current || !imgRef.current) return;
      // On small screens let image be natural height
      if (window.innerWidth < 900) {
        imgRef.current.style.height = '';
        return;
      }
      const h = loginRef.current.offsetHeight;
      imgRef.current.style.height = `${h}px`;
    };

    adjust();

    let ro;
    if (window.ResizeObserver && loginRef.current) {
      ro = new ResizeObserver(() => adjust());
      ro.observe(loginRef.current);
    }

    window.addEventListener('resize', adjust);
    return () => {
      window.removeEventListener('resize', adjust);
      if (ro) ro.disconnect();
      if (imgRef.current) imgRef.current.style.height = '';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Trimite cererea la backend folosind apiClient (gestionează automat baseURL și token)
      const response = await apiClient.post('/api/users/login', { email, password });

      // Salvează NOUL token în localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      // Redirect către pagina principală sau dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-main">
      <img src={introImg} alt="Intro" className="login-intro-image" ref={imgRef} />
      <div className="login-container" ref={loginRef}>
        <h2>{t('auth.signIn')}</h2>
        
        {/* Butoane sociale */}
        <div className="social-login">
          <GoogleLoginButton />
          <FacebookLoginButton onClick={() => console.log('Facebook login')} />
          <AppleLoginButton onClick={() => console.log('Apple login')} />
        </div>

        <div className="divider">{t('auth.or')}</div>

        {/* Formular clasic */}
        <form onSubmit={handleSubmit} className="email-login">
          {error && <div className="error-message">{error}</div>}
          
          <input
            type="email"
            placeholder={t('auth.placeholders.emailAddress')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.placeholders.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label={t('auth.placeholders.password')}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password-btn"
              aria-pressed={showPassword}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              onClick={() => setShowPassword(p => !p)}
            >
              {showPassword ? (
                <VisibilityOffIcon fontSize="small" />
              ) : (
                <VisibilityIcon fontSize="small" />
              )}
            </button>
          </div>
          <button 
            className="submit-btn" 
            type="submit"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('auth.signInButton')}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
          <Link to="/signup">{t('auth.createAccount')}</Link>
        </div>
      </div>
    </div>
  );
}