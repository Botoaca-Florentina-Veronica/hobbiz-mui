import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalSection.css';
import appStoreImg from '../assets/images/appStore.png';
import googlePlayImg from '../assets/images/googlePlay.png';

const LegalSection = () => {
  const navigate = useNavigate();

  const handleLinkClick = (e, to) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <div className="legal-section">
      <div className="legal-section__column">
        <div className="legal-section__logo">
          <span role="img" aria-label="chip" className="legal-section__icon">🧩</span>
          <span className="legal-section__brand">Hobbiz</span>
        </div>
        <p className="legal-section__desc">Descoperă, vinde și cumpără servicii sau produse de la pasionați ca tine.</p>
        <div className="app-store-buttons">
          <a href="#" className="app-store-button" aria-label="Download on the App Store">
            <img src={appStoreImg} alt="Download on the App Store" />
          </a>
          <a href="#" className="app-store-button" aria-label="Get it on Google Play">
            <img src={googlePlayImg} alt="Get it on Google Play" />
          </a>
        </div>
      </div>
      <div className="legal-section__column">
        <h4>Linkuri utile</h4>
        <ul>
          <li><a href="/despre" onClick={(e) => handleLinkClick(e, '/despre')}>Despre noi</a></li>
          <li><a href="/contact" onClick={(e) => handleLinkClick(e, '/contact')}>Contact</a></li>
          <li><a href="/cum-functioneaza" onClick={(e) => handleLinkClick(e, '/cum-functioneaza')}>Cum funcționează</a></li>
        </ul>
      </div>
      <div className="legal-section__column">
        <h4>Legal</h4>
        <ul>
          <li><a href="/termeni" onClick={(e) => handleLinkClick(e, '/termeni')}>Termeni și condiții</a></li>
          <li><a href="/confidentialitate" onClick={(e) => handleLinkClick(e, '/confidentialitate')}>Politică de Confidențialitate</a></li>
          <li><a href="/cookie" onClick={(e) => handleLinkClick(e, '/cookie')}>Cookie Policy</a></li>
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
};

export default LegalSection;
