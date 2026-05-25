import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import introImg400 from '../assets/images/intro-web-400.webp';
import introImg800 from '../assets/images/intro-web-800.webp';
import introImg1200 from '../assets/images/intro-web-1200.webp';
import introImgFallback from '../assets/images/intro-web.png';
import introImgEn from '../assets/images/intro-web2.png';
import introImgEs from '../assets/images/intro-web3.png';
import '../pages/LoginSignup.css';

// Password strength indicator with per-requirement hints.
// Each rule is shown as a chip — green/checked when satisfied, muted/dotted when missing.
function PasswordStrength({ password, t }) {
  const rules = useMemo(() => ([
    { key: 'minLength', ok: password.length >= 8 },
    { key: 'lowercase', ok: /[a-z]/.test(password) },
    { key: 'uppercase', ok: /[A-Z]/.test(password) },
    { key: 'digit',     ok: /\d/.test(password) },
    { key: 'special',   ok: /[^A-Za-z0-9]/.test(password) },
  ]), [password]);

  const metCount = rules.filter(r => r.ok).length;
  // Map 0-5 met rules to a 0-4 bar level so the meter matches the chips visually.
  const level = password ? Math.min(4, Math.ceil(metCount * 4 / 5)) : 0;
  const allMet = metCount === rules.length;

  if (!password) {
    return (
      <div className="signup-strength signup-strength--lvl0" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="signup-strength__bar" />
        ))}
      </div>
    );
  }

  return (
    <div className="signup-strength-block">
      <div
        className={`signup-strength signup-strength--lvl${level}`}
        role="meter"
        aria-valuenow={level}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={t('auth.passwordHints.title')}
      >
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`signup-strength__bar ${i <= level ? 'is-on' : ''}`} />
        ))}
      </div>

      <div className="signup-strength-popover">
        {allMet ? (
          <div className="signup-strength-hints signup-strength-hints--ok" role="status">
            <span className="signup-strength-hint signup-strength-hint--ok">
              <span className="signup-strength-hint__icon" aria-hidden="true">✓</span>
              {t('auth.passwordHints.strong')}
            </span>
          </div>
        ) : (
          <>
            <div className="signup-strength-hints__title">
              {t('auth.passwordHints.title')}
            </div>
            <ul className="signup-strength-hints" aria-live="polite">
              {rules.map((rule) => (
                <li
                  key={rule.key}
                  className={`signup-strength-hint ${rule.ok ? 'signup-strength-hint--ok' : 'signup-strength-hint--missing'}`}
                >
                  <span className="signup-strength-hint__icon" aria-hidden="true">
                    {rule.ok ? '✓' : '○'}
                  </span>
                  {t(`auth.passwordHints.${rule.key}`)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    _trap: '', // honeypot — utilizatorii reali nu îl văd (ascuns vizual); bot-ii îl completează
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Challenge anti-bot: cerem un JWT semnat de server la randarea formularului,
  // pe care îl trimitem înapoi cu cererea de register pentru a verifica că au
  // trecut min 2s între randare și submit (anti-fill-instant).
  const [formToken, setFormToken] = useState(null);
  const navigate = useNavigate();

  const fetchFormToken = async () => {
    try {
      const res = await apiClient.get('/api/users/register/challenge');
      setFormToken(res.data?.token || null);
    } catch (err) {
      console.warn('Eroare la fetch register challenge:', err);
      setFormToken(null);
    }
  };

  useEffect(() => {
    fetchFormToken();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/api/users/register', {
        ...formData,
        _formToken: formToken,
      });
      navigate('/login', { state: { success: t('auth.signupSuccess') } });
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setError(t('auth.emailAlreadyExists'));
      } else if (code === 'PHONE_ALREADY_EXISTS') {
        setError(t('auth.phoneAlreadyExists'));
      } else if (code === 'EMAIL_DISPOSABLE') {
        setError(t('auth.emailDisposable', 'Nu acceptăm adrese de email temporare. Folosește un email permanent.'));
      } else if (code === 'ACCOUNT_RECENTLY_DELETED') {
        const days = err.response?.data?.daysLeft;
        setError(
          t('auth.accountRecentlyDeleted', { defaultValue: `Acest cont a fost șters recent. Poți crea un cont nou cu aceste date după {{days}} zile.`, days }),
        );
      } else if (code === 'FORM_TOO_FAST' || code === 'FORM_TOKEN_MISSING' || code === 'FORM_TOKEN_INVALID') {
        // Token expirat sau lipsă - refacem și informăm utilizatorul să reîncerce
        await fetchFormToken();
        setError(t('auth.formExpired', 'Sesiunea formularului a expirat. Te rugăm să reîncerci.'));
      } else {
        setError(err.response?.data?.error || t('auth.signupError'));
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
      <div className="login-page-main signup-page-main">
        {useIntroEs || useIntroEn ? (
          <picture>
            <img
              src={useIntroEs ? introImgEs : introImgEn}
              alt="Intro"
              className="login-intro-image"
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
              width="800"
              height="800"
              loading="eager"
            />
          </picture>
        )}

        <div className="login-container signup-container">
          <h2>{t('auth.createAccount')}</h2>

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

          <form onSubmit={handleSubmit} className="email-login signup-form">
            {error && (
              <div className="error-message" role="alert">
                <div>{error}</div>
              </div>
            )}

            {/* Honeypot — utilizatorii reali NU văd câmpul (poziție off-screen).
                Bot-ii naivi care fill-uiesc toate input-urile vor completa și acesta,
                ceea ce face backend-ul să respingă cererea cu 400.
                Folosim style inline + autoComplete=off + tabIndex=-1 + aria-hidden. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
              }}
            >
              <label htmlFor="signup_website">Website (do not fill)</label>
              <input
                id="signup_website"
                type="text"
                name="_trap"
                value={formData._trap}
                onChange={handleChange}
                autoComplete="off"
                tabIndex={-1}
              />
            </div>

            <div className="signup-name-row">
              <input
                type="text"
                name="firstName"
                placeholder={t('auth.placeholders.firstName')}
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder={t('auth.placeholders.lastName')}
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder={t('auth.placeholders.email')}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <div className="signup-password-block">
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('auth.placeholders.password')}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  aria-pressed={showPassword}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </button>
              </div>
              <PasswordStrength password={formData.password} t={t} />
            </div>

            <input
              type="tel"
              name="phone"
              placeholder={t('auth.placeholders.phone')}
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
            />

            <button
              type="submit"
              className="submit-btn signup-submit-btn"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('auth.createButton')}
            </button>
          </form>

          <div className="login-links signup-links">
            <span className="signup-links__hint">
              {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
