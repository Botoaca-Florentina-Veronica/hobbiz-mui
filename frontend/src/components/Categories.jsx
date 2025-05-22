import reparatii from '../assets/images/pipe.png';
import muzica from '../assets/images/guitar.png';
import dancing from '../assets/images/salsa.png';
import gardening from '../assets/images/gardening-logo.jpg';
import tennis from '../assets/images/tennis.png';
import it from '../assets/images/laptop.png';
import camera from '../assets/images/camera.png';
import prajituri from '../assets/images/bake.png';
import carte from '../assets/images/carte.png';
import arta from '../assets/images/arta.png';
import masina from '../assets/images/car.png';
import curatenie from '../assets/images/cleaning.png';
import './Categories.css';

export default function Categories() {
  // Lista de categorii cu descrieri și imagini
  const categories = [
    { description: "Fotografie", image: camera },
    { description: "Prajituri", image: prajituri },
    { description: "Muzica", image: muzica },
    { description: "Reparații", image: reparatii },
    { description: "Dans", image: dancing },
    { description: "Curățenie", image: curatenie },
    { description: "Gradinarit", image: gardening },
    { description: "Sport", image: tennis },
    { description: "Arta", image: arta },
    { description: "Tehnologie", image: it },
    { description: "Auto", image: masina },
    { description: "Meditații", image: carte },
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