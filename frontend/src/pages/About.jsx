
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './About.css';

export default function About() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = [
    {
      question: "Este gratuit să folosesc Hobbiz?",
      answer: "Da, înregistrarea și utilizarea de bază a platformei Hobbiz sunt complet gratuite. Poți publica anunțuri, răspunde la anunțuri și comunica cu alți utilizatori fără costuri."
    },
    {
      question: "Cum îmi protejez datele personale?",
      answer: "Luăm în serios protecția datelor tale. Folosim criptare avansată și nu împărtășim informațiile tale personale cu terți fără consimțământul tău explicit."
    },
    {
      question: "Pot vinde atât produse cât și servicii?",
      answer: "Absolut! Hobbiz este conceput pentru ambele - poți oferi servicii creative, produse handmade, lecții, consultanță și multe altele."
    },
    {
      question: "Cum funcționează sistemul de mesagerie?",
      answer: "Sistemul nostru de mesagerie îți permite să comunici direct cu alți utilizatori în timp real, să negociezi prețuri și să coordonezi livrări în siguranță."
    }
  ];
  return (
    <>
      <Header />
      <div className="about-page">
        <div className="about-container">
          {/* Hero Section */}
          <div className="about-hero">
            <span className="about-hero-icon" role="img" aria-label="puzzle">🧩</span>
            <h1>Despre Hobbiz</h1>
            <p className="about-hero-subtitle">
              Platforma dedicată pasionaților care doresc să descopere, să vândă sau să cumpere servicii și produse unice, realizate cu pasiune.
            </p>
          </div>

          {/* Main Content */}
          <div className="about-content">
            <section className="about-section">
              <h2>
                <span className="about-section-icon">🎯</span>
                Misiunea noastră
              </h2>
              <p>
                Ne dorim să construim o comunitate în care fiecare utilizator să se simtă apreciat, să poată interacționa ușor și în siguranță, și să aibă acces la o gamă variată de servicii și produse autentice.
              </p>
              <p>
                Hobbiz este o platformă dedicată pasionaților care doresc să descopere, să vândă sau să cumpere servicii și produse unice, realizate cu pasiune. Fie că ești un creator, un artizan sau doar un curios în căutare de ceva special, Hobbiz îți oferă spațiul perfect pentru a-ți promova talentele sau pentru a găsi inspirație.
              </p>
            </section>
          </div>

          {/* Features Grid */}
          <div className="about-features">
            <div className="feature-card">
              <h3>
                <span className="feature-icon">🚀</span>
                Ce poți face pe Hobbiz?
              </h3>
              <ul className="feature-list">
                <li>Descoperă o nouă sursă de venit</li>
                <li>Publică anunțuri pentru serviciile sau produsele tale</li>
                <li>Află despre ofertele locale sau naționale</li>
                <li>Salvează anunțurile preferate și contactează direct vânzătorii</li>
                <li>Cunoaște alți oameni cu aceleași pasiuni și colaborează sau conversează cu ei</li>
                <li>Gestionează-ți contul și anunțurile rapid și intuitiv</li>
              </ul>
            </div>

            <div className="feature-card">
              <h3>
                <span className="feature-icon">⭐</span>
                De ce să alegi Hobbiz?
              </h3>
              <ul className="feature-list">
                <li>Platformă modernă, ușor de folosit, cu design adaptat pentru mobil și desktop</li>
                <li>Comunitate prietenoasă și suport rapid</li>
                <li>Promovare gratuită pentru pasiunile tale</li>
                <li>Interfață intuitivă și experiență de utilizare optimă</li>
                <li>Securitate și confidențialitate garantate</li>
                <li>Conectare directă între creatori și cumpărători</li>
              </ul>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="how-it-works">
            <h2>Cum funcționează Hobbiz?</h2>
            <p className="how-it-works-subtitle">
              În doar 4 pași simpli poți începe să folosești platforma noastră
            </p>
            <div className="steps-timeline">
              <div className="timeline-line"></div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">1</span>
                  <div className="step-icon">👤</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">Înregistrează-te</h3>
                  <p className="step-description">Creează-ți un cont gratuit în doar câteva minute</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">2</span>
                  <div className="step-icon">📝</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">Publică sau caută</h3>
                  <p className="step-description">Publică anunțuri sau găsește ce îți dorești</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">3</span>
                  <div className="step-icon">💬</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">Conectează-te</h3>
                  <p className="step-description">Comunică direct prin mesagerie integrată</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">4</span>
                  <div className="step-icon">🤝</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">Colaborează</h3>
                  <p className="step-description">Realizează tranzacții sigure în comunitate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="values-section">
            <h2>Valorile noastre</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🛡️</div>
                <h3>Securitate</h3>
                <p>Prioritizăm siguranța utilizatorilor prin măsuri avansate de protecție a datelor și verificare a identității.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>Comunitate</h3>
                <p>Creăm un spațiu prietenos unde pasionații se pot conecta, colabora și se pot inspira reciproc.</p>
              </div>
              <div className="value-card">
                <div className="value-icon">⚡</div>
                <h3>Inovație</h3>
                <p>Dezvoltăm constant noi funcționalități pentru a îmbunătăți experiența utilizatorilor și a facilita colaborarea.</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2>Întrebări frecvente</h2>
            <div className="faq-container">
              {faqData.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div 
                    className={`faq-question ${openFAQ === index ? 'active' : ''}`}
                    onClick={() => toggleFAQ(index)}
                  >
                    {faq.question}
                  </div>
                  {openFAQ === index && (
                    <div className="faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="cta-section">
            <h2>Gata să începi?</h2>
            <p>Alătură-te comunității Hobbiz și descoperă un univers plin de creativitate și oportunități!</p>
            <a href="/register" className="cta-button">
              Înregistrează-te gratuit
            </a>
          </div>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', marginTop: '30px' }}>
            Ultima actualizare: 19 iulie 2025
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
