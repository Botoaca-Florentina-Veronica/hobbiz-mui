import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import '../pages/LoginSignup.css';
import introImg400 from '../assets/images/intro-web-400.webp';
import introImg800 from '../assets/images/intro-web-800.webp';
import introImg1200 from '../assets/images/intro-web-1200.webp';
import introImgFallback from '../assets/images/intro-web.png';
import introImgEn from '../assets/images/intro-web2.png';
import introImgEs from '../assets/images/intro-web3.png';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth() || {};
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

      // Re-hidratează AuthContext imediat (altfel user/favorite apar cu întârziere de până la 60s)
      await refreshUser?.({ force: true });

      // Redirect către pagina principală sau dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const language = i18n?.language || 'ro';
  const useIntroEs = language.startsWith('es');
  const useIntroEn = language.startsWith('en');
  const socialAuthNotice = useIntroEn
    ? 'Social login is currently available only with Google. Facebook and Apple login are in progress.'
    : useIntroEs
      ? 'El inicio de sesion social esta disponible por ahora solo con Google. Facebook y Apple estan en desarrollo.'
      : 'Autentificarea socială este disponibilă momentan doar cu Google. Facebook și Apple sunt în curs de implementare.';

  return (
    <div className="login-page-wrapper">
      <div className="login-page-main">
        {useIntroEs || useIntroEn ? (
        <img
          src={useIntroEs ? introImgEs : introImgEn}
          alt="Intro"
          className="login-intro-image"
          ref={imgRef}
          width="800"
          height="800"
          loading="eager"
        />
      ) : (
        <picture>
          <source
            type="image/webp"
            srcSet={`${introImg400} 400w, ${introImg800} 800w, ${introImg1200} 1200w`}
            sizes="(max-width: 600px) 400px, (max-width: 900px) 600px, 800px"
          />
          <img
            src={introImgFallback}
            alt="Intro"
            className="login-intro-image"
            ref={imgRef}
            width="800"
            height="800"
            loading="eager"
          />
        </picture>
      )}
      <div className="login-container" ref={loginRef}>
        <h2>{t('auth.signIn')}</h2>
        
        {/* Butoane sociale */}
        <div className="social-login">
          <GoogleLoginButton />
          <FacebookLoginButton disabled />
          <AppleLoginButton disabled />
        </div>

        <div className="social-auth-notice" role="status" aria-live="polite">
          <span className="social-auth-notice__icon" aria-hidden="true">i</span>
          <span>{socialAuthNotice}</span>
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
    </div>
  );
}