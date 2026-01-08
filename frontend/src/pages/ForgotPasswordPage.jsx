import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/api';
import '../pages/LoginSignup.css';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = request code, 2 = confirm
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');

  const requestCode = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await apiClient.post('/api/users/password-reset/request', { email: email.trim() });
      setInfo(t('auth.resetSent'));
      setStep(2);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await apiClient.post('/api/users/password-reset/confirm', {
        email: email.trim(),
        code: code.trim(),
        newPassword
      });
      window.showToast(t('auth.resetDone'), 'success');
      navigate('/login');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>{t('auth.resetTitle')}</h2>

      <form className="email-login" onSubmit={(e) => { e.preventDefault(); step === 1 ? requestCode() : confirmReset(); }}>
        {info && <div className="info-message">{info}</div>}
        {error && <div className="error-message">{error}</div>}

        <input
          type="email"
          placeholder={t('auth.placeholders.emailAddress')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder={t('auth.resetCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <div className="password-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.resetNewPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                aria-label={t('auth.resetNewPassword')}
              />
              <button
                type="button"
                className="toggle-password-btn"
                aria-pressed={showPassword}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setShowPassword(p => !p)}
              >
                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </button>
            </div>
          </>
        )}

        <button
          className="submit-btn"
          type="submit"
          disabled={loading || !email.trim() || (step === 2 && (!code.trim() || !newPassword))}
        >
          {loading ? t('common.loading') : (step === 1 ? t('auth.resetSend') : t('auth.resetConfirm'))}
        </button>
      </form>

      <div className="login-links">
        <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>{t('auth.resetBack')}</a>
      </div>
    </div>
  );
}
