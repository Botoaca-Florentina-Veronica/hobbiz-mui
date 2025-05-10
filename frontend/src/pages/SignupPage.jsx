import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
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
      navigate('/login', { state: { success: 'Cont creat cu succes! Te poți autentifica.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Înregistrare eșuată');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Creează cont nou</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="email-login">
        <input
          type="text"
          name="firstName"
          placeholder="Prenume"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Nume"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Parolă"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Telefon"
          value={formData.phone}
          onChange={handleChange}
        />
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Se încarcă...' : 'Creează cont'}
        </button>
      </form>

      <div className="login-links">
        Ai deja cont? <Link to="/login">Autentifică-te</Link>
      </div>
    </div>
  );
}