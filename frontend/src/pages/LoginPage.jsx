import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

// errorType: 'error' | 'warning' | 'locked'
function LoginError({ type, message, attemptsLeft, lockedUntil, onUnlock, t }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (type !== 'locked' || !lockedUntil) {
      setCountdown('');
      return;
    }
    const tick = () => {
      const diff = lockedUntil.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('');
        onUnlock?.();
        return;
      }
      const totalSecs = Math.ceil(diff / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setCountdown(`${mins}:${String(secs).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [type, lockedUntil, onUnlock]);

  if (!message && type !== 'locked') return null;

  if (type === 'warning') {
    return (
      <div className="warning-message" role="alert">
        <span className="warning-message__icon" aria-hidden="true">⚠️</span>
        <span>{message}</span>
      </div>
    );
  }

  if (type === 'locked') {
    return (
      <div className="error-message error-message--locked" role="alert">
        <span className="error-message--locked__icon" aria-hidden="true">🔒</span>
        <span>
          {message}
          {countdown && (
            <span className="error-message--locked__countdown"> ({countdown})</span>
          )}
        </span>
      </div>
    );
  }

  // eroare normală
  return (
    <div className="error-message" role="alert">
      <div>{message}</div>
      {attemptsLeft > 0 && attemptsLeft <= 3 && (
        <div className="attempts-left">
          {t('auth.loginErrors.attemptsLeft', { count: attemptsLeft })}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { refreshUser } = useAuth() || {};
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('error'); // 'error' | 'warning' | 'locked'
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const loginRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleError = params.get('error');
    if (googleError) {
      setErrorMsg(googleError);
      setErrorType('error');
    }
  }, [location.search]);

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  const clearError = () => {
    setErrorMsg('');
    setErrorType('error');
    setAttemptsLeft(0);
    setLockedUntil(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      const response = await apiClient.post('/api/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      await refreshUser?.({ force: true });
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const code = data?.code;

      if (code === 'warning_last_attempt') {
        setErrorType('warning');
        setErrorMsg(t('auth.loginErrors.warningLastAttempt'));
      } else if (code === 'account_locked') {
        const until = data?.lockedUntil
          ? new Date(data.lockedUntil)
          : new Date(Date.now() + 60 * 60 * 1000);
        const minutes = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
        setErrorType('locked');
        setLockedUntil(until);
        setErrorMsg(t('auth.loginErrors.accountLocked', { count: minutes }));
      } else {
        setErrorType('error');
        setErrorMsg(t('auth.loginErrors.invalidCredentials'));
        if (typeof data?.attemptsLeft === 'number') {
          setAttemptsLeft(data.attemptsLeft);
        }
      }
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
          <picture>
            <img
              src={useIntroEs ? introImgEs : introImgEn}
              alt="Intro"
              className="login-intro-image"
              ref={imgRef}
              width="800"
              height="800"
              loading="eager"
            />
          </picture>
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

          <form onSubmit={handleSubmit} className="email-login">
            <LoginError
              type={errorType}
              message={errorMsg}
              attemptsLeft={attemptsLeft}
              lockedUntil={lockedUntil}
              onUnlock={clearError}
              t={t}
            />

            <input
              type="email"
              placeholder={t('auth.placeholders.emailAddress')}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
            />
            <div className="password-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.placeholders.password')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
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
              disabled={loading || errorType === 'locked'}
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
