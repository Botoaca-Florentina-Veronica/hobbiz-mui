import googleLogo from '../assets/images/google-icon-logo.svg';
// Buton Google
export function GoogleLoginButton({ onClick }) {
    return (
      <button className="social-btn google" onClick={onClick}>
        <img src={googleLogo} alt="Google" />
        Continuă cu Google
      </button>
    );
  }
  
  // Buton Facebook
  export function FacebookLoginButton({ onClick }) {
    return (
      <button className="social-btn facebook" onClick={onClick}>
        <img src="/icons/facebook.svg" alt="Facebook" />
        Continuă cu Facebook
      </button>
    );
  }
  
  // Buton Apple
  export function AppleLoginButton({ onClick }) {
    return (
      <button className="social-btn apple" onClick={onClick}>
        <img src="/icons/apple.svg" alt="Apple" />
        Continuă cu Apple
      </button>
    );
  }