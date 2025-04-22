import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import logoLight from '../assets/images/logo.jpg';
import logoDark from '../assets/images/logo-dark-mode.png';
import { useEffect, useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const body = document.body;
    setIsDarkMode(body.classList.contains('dark-mode'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(body.classList.contains('dark-mode'));
    });

    observer.observe(body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="header fixed-header"> {/* Adaugă clasa fixed-header */}
      <ul className="logo">
        <li>
          <img src={isDarkMode ? logoDark : logoLight} alt="Logo" />
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
            onClick={() => navigate("/login")}
          >
            <HiOutlineUser size={24} />
            <span>Contul tău</span>
          </button>
        </li>
      </ul>
    </div>
  );
}