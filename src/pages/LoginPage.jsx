import { useState } from 'react';
import { GoogleLoginButton, FacebookLoginButton, AppleLoginButton } from './SocialButtons'; // Componente personalizate
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logica de autentificare
  };

  return (
    <div className="login-container">
      <h2>Intră în cont</h2>
      
      {/* Butoane sociale */}
      <div className="social-login">
        <GoogleLoginButton onClick={() => console.log('Google login')} />
        <FacebookLoginButton onClick={() => console.log('Facebook login')} />
        <AppleLoginButton onClick={() => console.log('Apple login')} />
      </div>

      <div className="divider">SAU</div>

      {/* Formular clasic */}
      <form onSubmit={handleSubmit} className="email-login">
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
        <button type="submit">Intră în cont</button>
      </form>

      <div className="login-links">
        <Link to="/forgot-password">Ai uitat parola?</Link>
        <Link to="/signup">Creează cont</Link>
      </div>
    </div>
  );
}