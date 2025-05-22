import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import { FiCompass } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <div className="footer">
      {/* Versiunea desktop - doar copyright */}
      <footer className="desktop-footer">
        <p>©Copyright Hobbiz 2025</p>
      </footer>

      {/* Versiunea mobilă - bara de navigare */}
      <div className="footer-mobile-buttons">
        <div className="footer-icon" onClick={() => navigate("/contul-tau")}>
          <HiOutlineUser />
          <span>Contul meu</span>
        </div>
        <div className="footer-icon" onClick={() => navigate("/favorites")}>
          <HiOutlineHeart />
          <span>Favorite</span>
        </div>
        <div className="footer-icon" onClick={() => navigate("/explore")}>
          <FiCompass />
          <span>Explorează</span>
        </div>
      </div>
    </div>
  );
}