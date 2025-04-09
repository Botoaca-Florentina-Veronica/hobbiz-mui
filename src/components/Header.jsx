import { HiOutlineUser, HiOutlineHeart } from "react-icons/hi";
import logo from '../assets/images/logo.jpg';


export default function Header() {
  return (
    <div className="header">
      <ul className="logo">
        <li>
          <img src = {logo} alt="Logo" />
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