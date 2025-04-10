export default function Categories() {
  // Lista de categorii
  const categories = [
    "Fotografie", "Prajituri", "Muzica", "Reparatii", 
    "Dans", "Artizanat", "Gradinarit", "Sport",
    "Arta", "Tehnologie"
  ];

  return (
    <div className="categories-container">
      <h2 className="categories-title">Explorează categorii</h2>
      <div className="categories-grid">
        {categories.map((category, index) => (
          <button 
            key={index}
            className="category-button"
            aria-label={category}
            // onClick poate fi adăugat ulterior
          >
            <span className="button-text">{category}</span>
            {/* Spațiu rezervat pentru imagine */}
            <div className="image-placeholder"></div>
          </button>
        ))}
      </div>
    </div>
  );
}