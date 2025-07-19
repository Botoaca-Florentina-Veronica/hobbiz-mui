
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LegalSection from '../components/LegalSection';
import './About.css';

export default function About() {
  return (
    <>
      <Header />
      <div className="privacy-policy">
        <div className="privacy-policy__header">
          <span className="privacy-policy__icon" role="img" aria-label="puzzle">🧩</span>
          <h1>Despre Hobbiz</h1>
        </div>
        <p className="privacy-policy__date">Ultima actualizare: 19 iulie 2025</p>
        <section>
          <p>
            Hobbiz este o platformă dedicată pasionaților care doresc să descopere, să vândă sau să cumpere servicii și produse unice, realizate cu pasiune. Fie că ești un creator, un artizan sau doar un curios în căutare de ceva special, Hobbiz îți oferă spațiul perfect pentru a-ți promova talentele sau pentru a găsi inspirație.
          </p>
          <h2>Misiunea noastră</h2>
          <p>
            Ne dorim să construim o comunitate în care fiecare utilizator să se simtă apreciat, să poată interacționa ușor și în siguranță, și să aibă acces la o gamă variată de servicii și produse autentice.
          </p>
          <h2>Ce poți face pe Hobbiz?</h2>
          <ul>
            <li>Descoperă o nouă sursă de venit.</li>
            <li>Publică anunțuri pentru serviciile sau produsele tale.</li>
            <li>Află despre ofertele locale sau naționale.</li>
            <li>Salvează anunțurile preferate și contactează direct vânzătorii.</li>
            <li>Cunoaște alți oameni cu aceleași pasiuni și colaborează sau conversează cu ei.</li>
            <li>Gestionează-ți contul și anunțurile rapid și intuitiv.</li>
          </ul>
          <h2>De ce să alegi Hobbiz?</h2>
          <ul>
            <li>Platformă modernă, ușor de folosit, cu design adaptat pentru mobil și desktop.</li>
            <li>Comunitate prietenoasă și suport rapid.</li>
            <li>Promovare gratuită pentru pasiunile tale.</li>
          </ul>
        </section>
      </div>
      <div className="footer-separator" />
      <LegalSection />
      <Footer />
    </>
  );
}
