import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import logo from '../assets/images/logo.jpg';

export default function Header() {
  const navigate = useNavigate();

  return (
    <div className="header">
      <ul className="logo">
        <li>
          <img src={logo} alt="Logo" />
        </li>
      </ul>
      <ul className="nav-right">
        <li>
          <button className="add-button">Adaugă un anunț</button>
        </li>
        <li>
          <button className="favorite-btn">
            <HiOutlineHeart />
          </button>
        </li>
        <li>
          <button 
            className="user-account-btn" 
            onClick={() => navigate("/login")} // Navigare către login
          >
            <HiOutlineUser size={24} /> {/* Mărește la 24px */}
            <span>Contul tău</span>
          </button>
        </li>
      </ul>
    </div>
  );
}