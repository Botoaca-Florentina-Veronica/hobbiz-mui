import googleLogo from '../assets/images/google-logo.svg';
import facebookLogo from '../assets/images/facebook-logo.png';
import appleLogo from '../assets/images/apple-logo.png';
import '../pages/SocialButtons.css';

// Buton Google
export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;
  };
  return (
    <button className="social-btn google" onClick={handleGoogleLogin}>
      <img src={googleLogo} alt="Google" />
      Continuă cu Google
    </button>
  );
}

// Buton Facebook
export function FacebookLoginButton({ onClick }) {
  return (
    <button className="social-btn facebook" onClick={onClick}>
      <img src={facebookLogo} alt="Facebook" />
      Continuă cu Facebook
    </button>
  );
}

// Buton Apple
export function AppleLoginButton({ onClick }) {
  return (
    <button className="social-btn apple" onClick={onClick}>
      <img src={appleLogo} alt="Apple" />
      Continuă cu Apple
    </button>
  );
}