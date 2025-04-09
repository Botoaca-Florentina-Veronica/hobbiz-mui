import { FaSearch, FaBars } from "react-icons/fa"; // Adăugăm FaBars pentru iconița de meniu
import hobby from '../assets/images/hobby_img.jpg';

export default function MainStage() {
  return (
    <div className="main-stage">
      {/* Container pentru butonul categorii și search bar */}
      <div className="top-bar">
        {/* Butonul Categorii */}
        <button 
          className="categories-button"
          onClick={() => {}} // Funcționalitate viitoare
        >
          <FaBars className="categories-icon" />
          <span>Categorii</span>
        </button>

        {/* Search bar */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Ce anume cauți?" 
            className="search-input"
          />
          <button className="search-button">
            <span>Căutare</span>
            <FaSearch className="search-icon" />
          </button>
        </div>
      </div>

      {/* Conținutul principal */}
      <div className="main-content">
        <div className="main-text">
          <h1 id="main-title">Ai vreun hobby fain și crezi că e inutil? Poate îl găsești chiar aici! Fă și un ban cinstit cu el!</h1>
          <p>Fă din pasiunea ta o sursă de venit!</p>
          <button className="sign-up-button">Sign up</button>
        </div>
        <div className="main-stage-image">
          <img src={hobby} alt="hobby" />
        </div>
      </div>
    </div>
  )
}