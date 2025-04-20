import { FiUser, FiHeart, FiCompass } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <div className="footer">
      {/* Versiunea desktop - doar copyright */}
      <footer className="desktop-footer">
        <p>©Copyright Vera Șmechera 2025</p>
      </footer>

      {/* Versiunea mobilă - bara de navigare */}
      <div className="footer-icons">
        <div className="footer-icon" onClick={() => navigate('/profile')}>
          <FiUser />
          <span>Contul meu</span>
        </div>
        <div className="footer-icon" onClick={() => navigate('/favorites')}>
          <FiHeart />
          <span>Favorite</span>
        </div>
        <div className="footer-icon" onClick={() => navigate('/explore')}>
          <FiCompass />
          <span>Explorează</span>
        </div>
      </div>
    </div>
  );
}