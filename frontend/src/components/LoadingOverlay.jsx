import React, { useEffect, useState } from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
  // Evaluate upfront so the first render already knows if we should render the overlay
  const evaluateShouldShow = () => {
    if (typeof window === 'undefined') {
      // On SSR default to showing; the client will re-evaluate immediately
      return true;
    }
    try {
      const overlayShown = sessionStorage.getItem('loadingOverlayShown');

      // Detectare tip navigare: preferăm Navigation Timing Level 2
      let isReload = false;
      if (window.performance && typeof window.performance.getEntriesByType === 'function') {
        const nav = window.performance.getEntriesByType('navigation');
        if (nav && nav.length > 0) {
          isReload = nav[0].type === 'reload';
        }
      }
      // Fallback pentru browsere mai vechi
      if (!isReload && window.performance && window.performance.navigation) {
        // performance.navigation.type === 1 înseamnă RELOAD
        isReload = window.performance.navigation.type === 1;
      }

      return overlayShown !== 'true' || isReload;
    } catch (e) {
      // În caz de eroare la accesarea sessionStorage, ne asigurăm că nu blocăm afișarea
      return true;
    }
  };

  const [shouldRender, setShouldRender] = useState(evaluateShouldShow);
  const [loaded, setLoaded] = useState(() => !shouldRender);

  useEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    const minDisplayTime = 1500; // Minimum 1.5s pentru a arăta animația
    const startTime = Date.now();

    const handleLoad = () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      // Ascunde overlay-ul după ce s-au încărcat toate resursele
      // dar garantează că animația rulează minim 1.5s
      setTimeout(() => {
        setLoaded(true);
        try {
          // Marchează că am afișat overlay-ul pentru această sesiune/tab
          sessionStorage.setItem('loadingOverlayShown', 'true');
        } catch (e) {
          // ignore
        }
        // After the fade-out completes remove the overlay from the DOM entirely
        setTimeout(() => setShouldRender(false), 400);
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

  if (!shouldRender) {
    return null;
  }

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
