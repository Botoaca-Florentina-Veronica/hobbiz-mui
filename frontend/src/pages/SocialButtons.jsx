import googleLogo from '../assets/images/google-logo.svg';
import facebookLogo from '../assets/images/facebook-logo.png';
import appleLogo from '../assets/images/apple-logo.png';
import { useTranslation } from 'react-i18next';
import '../pages/SocialButtons.css';

// Buton Google
export function GoogleLoginButton() {
  const { t } = useTranslation();
  const handleGoogleLogin = () => {
    // Ensure we don't end up with a double slash if VITE_API_URL ends with '/'
    // Use Render backend as safe production fallback when VITE_API_URL is not provided at build time
    const base = import.meta.env.VITE_API_URL || 'https://hobbiz-mui.onrender.com';
    const baseNoSlash = base.replace(/\/+$/, '');
    const redirectOrigin = window.location.origin;
    const query = new URLSearchParams({
      state: 'web',
      redirect: redirectOrigin,
    });
    window.location.href = `${baseNoSlash}/auth/google?${query.toString()}`;
  };
  return (
    <button className="social-btn google" onClick={handleGoogleLogin}>
      <img src={googleLogo} alt="Google" />
      {t('auth.social.google')}
    </button>
  );
}

// Buton Facebook
export function FacebookLoginButton({ disabled = false }) {
  const { t } = useTranslation();
  const handleFacebookLogin = () => {
    if (disabled) return;
    window.FB.login(function(response) {
      if (response.authResponse) {
        // Trimite tokenul la backend pentru validare și login
        fetch(`${import.meta.env.VITE_API_URL || 'https://hobbiz-mui.onrender.com'}/api/auth/facebook/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: response.authResponse.accessToken })
        })
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            // IMPORTANT: Șterge token-urile vechi ÎNAINTE de a seta noul token
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('userId');
              localStorage.removeItem('lastAvatarUrl');
            } catch (e) {
              console.warn('Failed to clear old tokens:', e);
            }
            localStorage.setItem('token', data.token);
            window.location.href = '/';
          } else {
            alert('Autentificare Facebook eșuată!');
          }
        });
      } else {
        alert('Autentificare Facebook anulată!');
      }
    }, {scope: 'email,public_profile'});
  };
  return (
    <button
      className={`social-btn facebook ${disabled ? 'social-btn--disabled' : ''}`}
      onClick={handleFacebookLogin}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? 'În curând' : undefined}
    >
      <img src={facebookLogo} alt="Facebook" />
      {t('auth.social.facebook')}
    </button>
  );
}

// Buton Apple
export function AppleLoginButton({ onClick, disabled = false }) {
  const { t } = useTranslation();
  return (
    <button
      className={`social-btn apple ${disabled ? 'social-btn--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? 'În curând' : undefined}
    >
      <img src={appleLogo} alt="Apple" />
      {t('auth.social.apple')}
    </button>
  );
}