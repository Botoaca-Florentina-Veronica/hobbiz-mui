import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalSection.css';
import appStoreImg from '../assets/images/appStore.png';
import googlePlayImg from '../assets/images/googlePlay.png';
import { useTranslation } from 'react-i18next';
import ContactModal from './ContactModal';

const LegalSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [contactOpen, setContactOpen] = useState(false);

  const handleLinkClick = (e, to) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <>
    <div className="legal-section">
      <div className="legal-section__column">
        <div className="legal-section__logo">
          <span role="img" aria-label="chip" className="legal-section__icon">🧩</span>
          <span className="legal-section__brand">{t('legal.brand')}</span>
        </div>
        <p className="legal-section__desc">{t('legal.description')}</p>
        <div className="app-store-buttons">
          <a href="#" className="app-store-button" aria-label={t('legal.downloadAppStore')}>
            <img src={appStoreImg} alt={t('legal.downloadAppStore')} />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.verabotoaca.hobbiz"
            target="_blank"
            rel="noopener noreferrer"
            className="app-store-button"
            aria-label={t('legal.getOnGooglePlay')}
          >
            <img src={googlePlayImg} alt={t('legal.getOnGooglePlay')} />
          </a>
        </div>
        <div className="legal-download">
          <a
            className="legal-download__button"
            href="https://drive.google.com/file/d/1JGuHSou3ROWWC7PRLuOggvdfSCENna-A/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('legal.downloadPresentation')}
          </a>
        </div>
      </div>
      <div className="legal-section__column">
        <h4>{t('legal.usefulLinks')}</h4>
        <ul>
          <li><a href="/despre" onClick={(e) => handleLinkClick(e, '/despre')}>{t('legal.about')}</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setContactOpen(true); }}>{t('legal.contact')}</a></li>
          <li><a href="/cum-functioneaza" onClick={(e) => handleLinkClick(e, '/cum-functioneaza')}>{t('legal.howItWorks')}</a></li>
        </ul>
      </div>
      <div className="legal-section__column">
        <h4>{t('legal.legal')}</h4>
        <ul>
          <li><a href="/termeni" onClick={(e) => handleLinkClick(e, '/termeni')}>{t('legal.terms')}</a></li>
          <li><a href="/confidentialitate" onClick={(e) => handleLinkClick(e, '/confidentialitate')}>{t('legal.privacyPolicy')}</a></li>
          <li><a href="/cookie" onClick={(e) => handleLinkClick(e, '/cookie')}>{t('legal.cookiePolicy')}</a></li>
          <li><a href="/stergere-date" onClick={(e) => handleLinkClick(e, '/stergere-date')}>{t('legal.dataDeletion')}</a></li>
        </ul>
      </div>
      <div className="legal-section__column legal-section__socials">
        <h4>{t('legal.followUs')}</h4>
        <div className="legal-section__icons">
          <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
          <a href="#" aria-label="Discord"><i className="fa-brands fa-discord"></i></a>
        </div>
      </div>
    </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};

export default LegalSection;
