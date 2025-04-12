import fridge from '../assets/images/fridge-logo.jpg';
import muzica from '../assets/images/guitar-logo.jpg';
import dancing from '../assets/images/dancing-logo.jpg';
import gardening from '../assets/images/gardening-logo.jpg';
import tennis from '../assets/images/tennis-logo.jpg';
import it from '../assets/images/it-logo.jpg';
import camera from '../assets/images/camera-logo.jpg';

export default function Categories() {
  // Lista de categorii cu descrieri și imagini
  const categories = [
    { description: "Fotografie", image: camera },
    { description: "Prajituri", image: null },
    { description: "Muzica", image: muzica },
    { description: "Reparații", image: fridge },
    { description: "Dans", image: dancing },
    { description: "Artizanat", image: null },
    { description: "Gradinarit", image: gardening },
    { description: "Sport", image: tennis },
    { description: "Arta", image: null },
    { description: "Tehnologie", image: it },
    { description: "Altele", image: null },
    { description: "Servicii", image: null },
  ];

  return (
    <div className="categories-container">
      <h2 className="categories-title">Explorează categorii</h2>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <div key={index} className="category-card">
            <button className="category-button">
              <div className="image-container">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.description}
                    className="category-image"
                  />
                ) : (
                  <div className="image-placeholder"></div>
                )}
              </div>
            </button>
            <p className="category-description">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}