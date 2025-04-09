import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";

export default function Header() {
  return (
    <div className="header">
      <ul className="logo">
        <li>
          <img src="/src/assets/images/logo.jpg" alt="Logo" />
        </li>
      </ul>
      <ul className="nav-right">
        <li>
          <button className="add-button">
            Adaugă un anunț
          </button>
        </li>
        <li>
          <button 
            className="favorite-btn"
            onClick={() => {}}
          >
            <HiOutlineHeart />
          </button>
        </li>
        <li>
          <button className="icon-btn">
            <HiOutlineUser /> {/* Iconița pentru utilizator */}
          </button>
        </li>
      </ul>
    </div>
  );
}