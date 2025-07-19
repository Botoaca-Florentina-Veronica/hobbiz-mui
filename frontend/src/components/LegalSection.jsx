import React from 'react';
import './LegalSection.css';

const LegalSection = () => (
  <div className="legal-section">
    <div className="legal-section__column">
      <div className="legal-section__logo">
        <span role="img" aria-label="chip" className="legal-section__icon">🧩</span>
        <span className="legal-section__brand">Hobbiz</span>
      </div>
      <p className="legal-section__desc">Descoperă, vinde și cumpără servicii sau produse de la pasionați ca tine.</p>
    </div>
    <div className="legal-section__column">
      <h4>Linkuri utile</h4>
      <ul>
        <li><a href="/despre">Despre noi</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/cum-functioneaza">Cum funcționează</a></li>
      </ul>
    </div>
    <div className="legal-section__column">
      <h4>Legal</h4>
      <ul>
        <li><a href="/termeni">Termeni și condiții</a></li>
        <li><a href="/confidentialitate">Politică de Confidențialitate</a></li>
        <li><a href="/cookie">Cookie Policy</a></li>
      </ul>
    </div>
    <div className="legal-section__column legal-section__socials">
      <h4>Urmărește-ne</h4>
      <div className="legal-section__icons">
        <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
        <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
        <a href="#" aria-label="Discord"><i className="fa-brands fa-discord"></i></a>
      </div>
    </div>
  </div>
);

export default LegalSection;
