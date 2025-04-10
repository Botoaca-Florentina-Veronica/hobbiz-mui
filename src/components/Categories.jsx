import fridge from '../assets/images/fridge-logo.jpg';

export default function Categories() {
  // Lista de categorii cu descrieri și imagini
  const categories = [
    { description: "Fotografie", image: null },
    { description: "Prajituri", image: null },
    { description: "Muzica", image: null },
    { description: "Reparații", image: fridge },
    { description: "Dans", image: null },
    { description: "Artizanat", image: null },
    { description: "Gradinarit", image: null },
    { description: "Sport", image: null },
    { description: "Arta", image: null },
    { description: "Tehnologie", image: null }
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