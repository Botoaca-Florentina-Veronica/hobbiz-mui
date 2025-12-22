import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../pages/LoginSignup.css';

export default function SignupPage() {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Align background behavior with LoginPage to avoid white bars on dark mode
    document.body.classList.add('login-page');
    return () => document.body.classList.remove('login-page');
  }, []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, formData);
      
      // Redirecționează către login cu mesaj de succes
      navigate('/login', { state: { success: t('auth.signupSuccess') } });
    } catch (err) {
      setError(err.response?.data?.error || t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container signup-container">
      <h2>{t('auth.createAccount')}</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="email-login">
        <input
          type="text"
          name="firstName"
          placeholder={t('auth.placeholders.firstName')}
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder={t('auth.placeholders.lastName')}
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder={t('auth.placeholders.email')}
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder={t('auth.placeholders.password')}
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder={t('auth.placeholders.phone')}
          value={formData.phone}
          onChange={handleChange}
        />
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('auth.createButton')}
        </button>
      </form>

      <div className="login-links">
        {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
      </div>
    </div>
  );
}