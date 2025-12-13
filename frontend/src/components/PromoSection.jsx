import React, { useRef, useEffect, useState } from 'react';
import img1 from '../../../device-view_images/1.png';
import img2 from '../../../device-view_images/2.png';
import img3 from '../../../device-view_images/3.png';
import img4 from '../../../device-view_images/4.png';
import { useTranslation } from 'react-i18next';
import './PromoSection.css';

export default function PromoSection() {
  const sectionRef = useRef(null);
  // Stage 0 = nicio imagine, 1-4 = imagini vizibile
  const [activeStage, setActiveStage] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculăm distanța de scroll disponibilă.
      // Scădem viewportHeight pentru că elementul sticky ocupă fix un ecran.
      const scrollableDistance = rect.height - viewportHeight;
      
      // 'scrolled' devine pozitiv abia când partea de sus a secțiunii atinge partea de sus a ecranului
      const scrolled = -rect.top;

      // Progres între 0.0 și 1.0
      let progress = scrolled / scrollableDistance;

      // Clamp
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      // Definim stadiile
      // Imaginile încep să apară pe măsură ce utilizatorul scrollează "în interiorul" secțiunii fixate
      let stage = 0;
      if (progress > 0.10) stage = 1; // Prima imagine apare la 10% din scroll
      if (progress > 0.30) stage = 2;
      if (progress > 0.50) stage = 3;
      if (progress > 0.70) stage = 4;

      setActiveStage(prevStage => (prevStage !== stage ? stage : prevStage));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Verificare inițială
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const images = [img1, img2, img3, img4];

  return (
    <section className="promo-section" ref={sectionRef}>
      {/* Wrapper-ul sticky care acum are exact 100vh */}
      <div className="promo-sticky-wrapper">
        
        <div className="promo-header">
          <h2 className="promo-title">{t('promoSection.title')}</h2>
          <p className="promo-subtitle">
            {t('promoSection.subtitle')}
          </p>
        </div>

        {/* Grid-ul - Dimensiuni nemodificate */}
        <div className="promo-grid">
          {images.map((src, index) => {
            const isVisible = activeStage > index;
            // Delay pentru efectul de cascadă
            const style = { transitionDelay: `${index * 120}ms` };

            return (
              <div 
                key={index} 
                className={`promo-card ${isVisible ? 'visible' : ''}`}
                style={style}
              >
                <img src={src} alt={`Device view ${index + 1}`} />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}