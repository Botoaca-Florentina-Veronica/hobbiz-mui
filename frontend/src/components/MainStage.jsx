import { FaSearch, FaBars } from "react-icons/fa";
import hobby from '../assets/images/hobby_img.jpg';

export default function MainStage() {
  const scrollToContent = () => {
    // Selectează PRIMUL element cu clasa 'content'
    const categoriesElement = document.querySelector('.categories-container');
    
    if (categoriesElement) {
      categoriesElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.warn("Elementul cu clasa 'content' nu a fost găsit");
    }
  };

  return (
    <div className="main-stage">
      {/* Container pentru butonul categorii și search bar */}
      <div className="top-bar">
        {/* Butonul Categorii */}
        <button 
          className="categories-button"
          onClick={scrollToContent} // Acum are funcționalitate
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
          <h1 id="main-title">Ai vreun hobby fain și crezi că e inutil? Găsește oameni care sunt dispuși să plătească pentru el!</h1>
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