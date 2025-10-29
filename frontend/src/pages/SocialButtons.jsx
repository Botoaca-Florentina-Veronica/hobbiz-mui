import googleLogo from '../assets/images/google-logo.svg';
import facebookLogo from '../assets/images/facebook-logo.png';
import appleLogo from '../assets/images/apple-logo.png';
import '../pages/SocialButtons.css';

// Buton Google
export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // Ensure we don't end up with a double slash if VITE_API_URL ends with '/'
    // Use Render backend as safe production fallback when VITE_API_URL is not provided at build time
    const base = import.meta.env.VITE_API_URL || 'https://hobbiz-mui.onrender.com';
    const baseNoSlash = base.replace(/\/+$/, '');
    window.location.href = `${baseNoSlash}/auth/google`;
  };
  return (
    <button className="social-btn google" onClick={handleGoogleLogin}>
      <img src={googleLogo} alt="Google" />
      Continuă cu Google
    </button>
  );
}

// Buton Facebook
export function FacebookLoginButton() {
  const handleFacebookLogin = () => {
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
    <button className="social-btn facebook" onClick={handleFacebookLogin}>
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