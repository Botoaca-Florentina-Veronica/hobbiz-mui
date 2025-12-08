import React, { useRef, useEffect, useState } from 'react';
import img1 from '../assets/device-view_images/1.png';
import img2 from '../assets/device-view_images/2.png';
import img3 from '../assets/device-view_images/3.png';
import img4 from '../assets/device-view_images/4.png';
import './PromoSection.css';

export default function PromoSection() {
  const sectionRef = useRef(null);
  const [visibleImages, setVisibleImages] = useState([false, false, false, false]);
  const [hasAnimated, setHasAnimated] = useState([false, false, false, false]);
  const prevProgressRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Calculate how far we've scrolled into the section
      const scrolled = viewportHeight - sectionTop;
      const totalScrollDistance = sectionHeight - viewportHeight;
      const progress = Math.max(0, scrolled / totalScrollDistance);

      const prevProgress = prevProgressRef.current;
      const isScrollingUp = progress < prevProgress;
      prevProgressRef.current = progress;

      // Show images progressively based on scroll progress
      // Each image appears and stays visible until scrolled past the section
      let newVisibleImages;
      const newHasAnimated = [...hasAnimated];
      
      if (progress > 1.3) {
        newVisibleImages = [false, false, false, false];
      } else {
        const thresholds = [0.4, 0.55, 0.7, 0.85];
        const shouldShow = thresholds.map(threshold => progress >= threshold);

        // Only allow visibility to change if animation hasn't been completed yet
        // or if we're scrolling forward (progress increasing)
        newVisibleImages = shouldShow.map((show, index) => {
          if (show && !hasAnimated[index]) {
            newHasAnimated[index] = true;
            return true;
          }
          // Keep showing if already animated and still in range
          if (hasAnimated[index] && show) {
            return true;
          }
          // Hide if scrolling up and progress below threshold minus a small buffer
          if (isScrollingUp && hasAnimated[index] && progress < thresholds[index] - 0.05) {
            return false;
          }
          // Hide if we've scrolled past and animation is complete
          return false;
        });
      }

      setVisibleImages(newVisibleImages);
      setHasAnimated(newHasAnimated);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasAnimated]);

  return (
    <section className="promo-section" ref={sectionRef}>
      <div className="promo-header">
        <h2 className="promo-title">Posteaza oriunde, oricand de pe orice</h2>
        <p className="promo-subtitle">Publică rapid și gestionează anunțurile tale de pe orice dispozitiv</p>
      </div>

      <div className="promo-images-container">
        <div className={`promo-image ${visibleImages[0] ? 'visible' : ''}`}>
          <img src={img1} alt="Device view 1" />
        </div>
        <div className={`promo-image ${visibleImages[1] ? 'visible' : ''}`}>
          <img src={img2} alt="Device view 2" />
        </div>
        <div className={`promo-image ${visibleImages[2] ? 'visible' : ''}`}>
          <img src={img3} alt="Device view 3" />
        </div>
        <div className={`promo-image ${visibleImages[3] ? 'visible' : ''}`}>
          <img src={img4} alt="Device view 4" />
        </div>
      </div>
    </section>
  );
}
