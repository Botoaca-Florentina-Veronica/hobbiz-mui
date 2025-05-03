import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
import hobby from '../assets/images/hobby_img.jpg';

export default function MainStage() {
  const scrollToContent = () => {
    const categoriesElement = document.querySelector('.categories-container');

    if (categoriesElement) {
      categoriesElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.warn("Elementul cu clasa 'categories-container' nu a fost găsit");
    }
  };

  return (
    <div className="main-stage">
      <div className="top-bar">
        <button 
          className="categories-button"
          onClick={scrollToContent}>
          <FaBars className="categories-icon" />
          <span>Categorii</span>
        </button>

        <div className="search-container">
          <input 
            type="text" 
            placeholder="Ce anume cauți?" 
            className="search-input"
          />
          <div className="location-section">
            <FaMapMarkerAlt className="location-icon" />
            <input 
              type="text" 
              placeholder="Toată țara" 
              className="location-input"
            />
          </div>
          <button className="search-button">
            <span>Căutare</span>
            <FaSearch className="search-icon" />
          </button>
        </div>
      </div>

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
  );
}