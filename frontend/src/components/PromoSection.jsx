import React, { useRef, useEffect, useState } from 'react';
import ss1 from '../assets/images/ss1.png';
import ss2 from '../assets/images/ss2.png';
import './PromoSection.css';

const textSlides = [
  {
    id: 1,
    title: 'Pe telefon',
    subtitle: 'Publică instant, de oriunde te afli',
    benefits: [
      'Fotografiezi produsul și publici anunțul în mai puțin de 60 de secunde',
      'Interfață intuitivă optimizată pentru utilizare cu o singură mână',
      'Notificări push în timp real pentru mesaje, oferte și vizualizări',
      'Editare rapidă a prețului și detaliilor cu un singur tap',
      'Răspunde la mesaje instant, chiar și în mișcare',
      'Marchează anunțuri favorite pentru a reveni la ele mai târziu',
      'Actualizează statusul anunțului (vândut, redus, rezervat) instant'
    ]
  },
  {
    id: 2,
    title: 'Pe tablet',
    subtitle: 'Productivitate sporită și control detaliat',
    benefits: [
      'Ecran mai mare pentru editare detaliată și previzualizare confortabilă',
      'Gestionează și editează multiple anunțuri simultan în mod split-screen',
      'Previzualizare completă a anunțului înainte de publicare',
      'Suport stylus pentru adnotări precise pe imagini și corecții rapide',
      'Organizează colecții de anunțuri după categorii personalizate',
      'Editează descrieri complexe cu formatare și emoji-uri',
      'Perfect pentru sesiuni lungi de management al inventarului'
    ]
  },
  {
    id: 3,
    title: 'Pe computer',
    subtitle: 'Putere maximă și instrumente profesionale',
    benefits: [
      'Dashboard complet cu statistici detaliate, grafice și analytics avansate',
      'Upload în masă de imagini cu drag & drop și redimensionare automată',
      'Editor avansat cu formatare rich-text, subtitluri și listeStructurate',
      'Export/import CSV pentru gestiune profesională și backup',
      'Integrări cu instrumente externe pentru contabilitate și inventar',
      'Programează actualizări automate și reduceri temporare',
      'Vezi istoricul complet al mesajelor și negocierilor într-un singur loc',
      'Filtre avansate pentru căutare și sortare rapidă prin sute de anunțuri'
    ]
  },
  {
    id: 4,
    title: 'Oricând, oriunde',
    subtitle: 'Sincronizare perfectă între toate dispozitivele',
    benefits: [
      'Începi pe mobil în metrou, continui pe desktop acasă — fără pierderi',
      'Notificări sincronizate instant pe toate dispozitivele conectate',
      'Date criptate, securizate și accesibile imediat de oriunde',
      'Experiență fluidă și consistentă pe orice tip de ecran',
      'Mesajele tale sunt sincronizate în timp real pe toate platformele',
      'Modificările se salvează automat și apar instant pe celelalte dispozitive',
      'Nu mai pierzi nicio oportunitate, indiferent unde te afli'
    ]
  }
];

export default function PromoSection() {
  const sectionRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const slideRefs = useRef([]);

  useEffect(() => {
    const observers = [];
    let debounceTimer = null;
    
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // If this slide is more than 50% visible, set it as active with debouncing
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                setActiveSlide(index);
              }, 100); // 100ms debounce to prevent rapid flickering
            }
          });
        },
        {
          threshold: [0.3, 0.5, 0.7],
          rootMargin: '-15% 0px -15% 0px'
        }
      );
      
      observer.observe(slide);
      observers.push(observer);
    });

    return () => {
      clearTimeout(debounceTimer);
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <section
      className={`promo-section ${(activeSlide === 2 || activeSlide === 3) ? 'image-large' : ''}`}
      ref={sectionRef}
      style={{ '--slides': textSlides.length }}
    >
      {/* Title positioned like in Content (top-level h2) */}
      <h2 className="promo-title">Posteaza oriunde, oricand de pe orice</h2>

      <div className="promo-inner">
        <div className="promo-image-sticky">
          <div className="promo-image-frame">
            <img
              src={(activeSlide === 2 || activeSlide === 3) ? ss2 : ss1}
              alt={(activeSlide === 2 || activeSlide === 3) ? 'promo ss2' : 'promo ss1'}
              style={{ transition: 'opacity 0.8s ease', opacity: 1 }}
            />
          </div>
        </div>

        <div className="promo-text-container">
          {textSlides.map((slide, index) => (
            <div
              key={slide.id}
              ref={el => slideRefs.current[index] = el}
              className={`promo-text-slide ${activeSlide === index ? 'active' : ''}`}
            >
              <div className="slide-header">
                <div className="slide-icon">
                  {index === 0 && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  )}
                  {index === 1 && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  )}
                  {index === 2 && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  )}
                  {index === 3 && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  )}
                </div>
                <div className="slide-titles">
                  <h3>{slide.title}</h3>
                  <p className="slide-subtitle">{slide.subtitle}</p>
                </div>
              </div>
              
              <ul className="benefits-list">
                {slide.benefits.map((benefit, i) => (
                  <li key={i}>
                    <svg className="checkmark" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
