import React, { useEffect, useState } from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const minDisplayTime = 1500; // Minimum 1.5s pentru a arăta animația
    const startTime = Date.now();
    
    const handleLoad = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      // Ascunde overlay-ul după ce s-au încărcat toate resursele
      // dar garantează că animația rulează minim 1.5s
      setTimeout(() => {
        setLoaded(true);
      }, remainingTime);
    };

    // Verifică dacă pagina s-a încărcat deja (pentru navigare rapidă)
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Numărul de cărămizi poate fi ajustat
  const bricks = Array(5).fill(null);

  return (
    <div className={`loading-overlay ${loaded ? 'loaded' : ''}`}>
      <div className="loader" aria-hidden={loaded}>
        {bricks.map((_, index) => (
          <div key={index} className="brick"></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingOverlay;
