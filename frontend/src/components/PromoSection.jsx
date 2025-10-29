import React, { useRef, useEffect, useState } from 'react';
import ss1 from '../assets/images/ss1.png';
import ss2 from '../assets/images/ss2.png';
import './PromoSection.css';

const textSlides = [
  {
    id: 1,
    title: 'Pe telefon',
    text: `Publică anunțuri instant de pe telefonul tău mobil, oriunde te-ai afla. Aplicația noastră mobilă este gândită pentru viteză și simplitate: faci poze, completezi detaliile esențiale și publici în câteva secunde.

Interfața pune în prim-plan butoanele și câmpurile cele mai folosite, iar fluxul de creare este optimizat pentru o singură mână: încarci imagini, alegi categoria, setezi prețul și publici. Notificările te țin la curent cu mesajele potențialilor cumpărători și cu statusul anunțului tău.

Pe parcursul utilizării vei observa controale rapide pentru editare și promovare: marchezi anunțul ca favorit, îl scoți în evidență sau îl actualizezi cu o reducere temporară pentru a atrage mai mulți cumpărători. Toate aceste funcționalități sunt accesibile dintr-un singur ecran, fără a complica experiența.`
  },
  {
    id: 2,
    title: 'Pe tablet',
    text: `Folosind tableta, ai luxul unei interfețe mai largi care îți permite să vezi mai multe detalii simultan: galerie de imagini, descriere extinsă și harta locației într-un singur ecran. Aceasta este ideal pentru sesiuni de upload consistente sau pentru a edita mai multe anunțuri la rând.

Editorul de descrieri are controale mai mari și suport pentru formatare simplă; poți reordona imaginile și adăuga detalii tehnice cu ușurință. Pe tabletă poți folosi și stylus-ul pentru a adnota imagini, pentru a evidenția zona sau a face mici corecții înainte de publicare.

Există și moduri avansate pentru previzualizare: poți vedea cum va arăta anunțul pe desktop sau pe mobil, ceea ce te ajută să ajustezi descrierea sau layout-ul pentru rezultate mai bune.`
  },
  {
    id: 3,
    title: 'Pe computer',
    text: `Experiența completă pe desktop oferă control total: dashboard cu statistici, filtre avansate pentru gestionarea mai multor anunțuri și instrumente pentru optimizarea descrierilor. Aici poți încărca loturi mari de imagini, folosi drag & drop și beneficia de o vedere de ansamblu pentru toate activitățile tale.

Pe desktop ai acces la funcționalități avansate precum programarea actualizărilor, import/export CSV pentru gestiune în bloc și integrare cu instrumente externe (de ex. pentru contabilitate sau inventar). Editorul îți permite să structurezi descrierile cu subtitluri, liste și linkuri utile.

Acest mod este recomandat pentru utilizatori care gestionează mai multe oferte sau care au nevoie de un control detaliat asupra fiecărui aspect al anunțului — imaginea și layout-ul paginii sunt afișate la dimensiune reală, pentru a verifica cum arată anunțul înainte de a-l publica.

Dacă folosești instrumente externe (de exemplu pentru contabilitate), desktopul oferă și integrare ușoară pentru export și sincronizare, permițând fluxuri de lucru profesionale.`
  },
  {
    id: 4,
    title: 'Oricând, oriunde',
    text: `Sincronizare automată între toate dispozitivele tale: începi redactarea pe telefon, completezi pe tabletă și revizuiești pe desktop — totul rămâne salvat și actualizat în timp real.

Notificările cross-device te anunță exact când apare un mesaj, când cineva îți salvează anunțul sau când un potențial cumpărător îți face o ofertă. Sistemul de sincronizare este rapid și securizat, astfel încât datele tale rămân private și disponibile atunci când ai nevoie de ele.

Această flexibilitate îți oferă libertatea de a vinde sau cumpăra în ritmul tău, indiferent de dispozitiv — experiența rămâne coerentă și familiară pe toate ecranele. Poți reveni oricând la o versiune anterioară a anunțului sau poți activa funcții automate pentru actualizări periodice.`
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
    <section className={`promo-section ${(activeSlide === 2 || activeSlide === 3) ? 'image-large' : ''}`} ref={sectionRef} style={{ background: '#F8B195' }}>
      {/* Title positioned like in Content (top-level h2) */}
      <h2 className="promo-title">Posteaza oriunde, oricand de pe orice</h2>

      <div className="promo-inner">
        <div className="promo-image-sticky">
          <img 
            src={(activeSlide === 2 || activeSlide === 3) ? ss2 : ss1} 
            alt={(activeSlide === 2 || activeSlide === 3) ? 'promo ss2' : 'promo ss1'}
            style={{ transition: 'opacity 0.8s ease', opacity: 1 }}
          />
        </div>

        <div className="promo-text-container">
          {textSlides.map((slide, index) => (
            <div
              key={slide.id}
              ref={el => slideRefs.current[index] = el}
              className="promo-text-slide"
            >
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
