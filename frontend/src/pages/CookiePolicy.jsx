import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './CookiePolicy.css';

export default function CookiePolicy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  return (
    <>
      <Header />
      <div className="cookie-policy-page">
        <div className="cookie-policy-container">
          {/* Mobile header: back + title for Cookie Policy */}
          <div className="mobile-header">
            <IconButton
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
              className="mobile-back-btn"
              disableRipple
              disableFocusRipple
              aria-label={t('common.back')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="mobile-header-title">{t('cookies.title')}</Typography>
          </div>
          {/* Hero Section */}
          <div className="cookie-policy-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🍪</span>
              <span>{t('cookies.hero.badge')}</span>
            </div>
            <h1 className="hero-title">
              {t('cookies.hero.title1')} <span className="highlight">{t('cookies.hero.highlight')}</span>
            </h1>
          </div>

          {/* Main Content */}
          <div className="cookie-policy-content">
            {/* Cuprins */}
            <nav className="cookie-toc" aria-label={t('cookies.toc.aria')}>
              <h2 className="toc-title">{t('cookies.toc.title')}</h2>
              <ul>
                <li><a href="#ce-sunt-cookieurile">{t('cookies.toc.what')}</a></li>
                <li><a href="#tipuri-cookieuri">{t('cookies.toc.types')}</a></li>
                <li><a href="#de-ce-folosim">{t('cookies.toc.why')}</a></li>
                <li><a href="#gestionare">{t('cookies.toc.manage')}</a></li>
                <li><a href="#terti">{t('cookies.toc.thirdParty')}</a></li>
                <li><a href="#consimtamant">{t('cookies.toc.consent')}</a></li>
                <li><a href="#actualizari">{t('cookies.toc.updates')}</a></li>
                <li><a href="#contact">{t('cookies.toc.contact')}</a></li>
              </ul>
            </nav>
            <section id="ce-sunt-cookieurile" className="policy-section">
              <h2>{t('cookies.s1.title')}</h2>
              <p>
                {t('cookies.s1.p1')}
              </p>
              <p>
                {t('cookies.s1.p2')}
              </p>
            </section>

            <section id="tipuri-cookieuri" className="policy-section">
              <h2>{t('cookies.s2.title')}</h2>
              
              <div className="cookie-type">
                <h3>{t('cookies.s2.essential.title')}</h3>
                <p>
                  {t('cookies.s2.essential.text')}
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">{t('cookies.s2.essential.tag1')}</span>
                  <span className="cookie-tag">{t('cookies.s2.essential.tag2')}</span>
                  <span className="cookie-tag">{t('cookies.s2.essential.tag3')}</span>
                  <span className="cookie-tag">{t('cookies.s2.essential.tag4')}</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>{t('cookies.s2.preferences.title')}</h3>
                <p>
                  {t('cookies.s2.preferences.text')}
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">{t('cookies.s2.preferences.tag1')}</span>
                  <span className="cookie-tag">{t('cookies.s2.preferences.tag2')}</span>
                  <span className="cookie-tag">{t('cookies.s2.preferences.tag3')}</span>
                  <span className="cookie-tag">{t('cookies.s2.preferences.tag4')}</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>{t('cookies.s2.analytics.title')}</h3>
                <p>
                  {t('cookies.s2.analytics.text')}
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">{t('cookies.s2.analytics.tag1')}</span>
                  <span className="cookie-tag">{t('cookies.s2.analytics.tag2')}</span>
                  <span className="cookie-tag">{t('cookies.s2.analytics.tag3')}</span>
                  <span className="cookie-tag">{t('cookies.s2.analytics.tag4')}</span>
                </div>
              </div>

              <div className="cookie-type">
                <h3>{t('cookies.s2.marketing.title')}</h3>
                <p>
                  {t('cookies.s2.marketing.text')}
                </p>
                <div className="cookie-examples">
                  <span className="cookie-tag">{t('cookies.s2.marketing.tag1')}</span>
                  <span className="cookie-tag">{t('cookies.s2.marketing.tag2')}</span>
                  <span className="cookie-tag">{t('cookies.s2.marketing.tag3')}</span>
                  <span className="cookie-tag">{t('cookies.s2.marketing.tag4')}</span>
                </div>
              </div>
            </section>

            <section id="de-ce-folosim" className="policy-section">
              <h2>{t('cookies.s3.title')}</h2>
              <div className="reasons-grid">
                <div className="reason-card">
                  <div className="reason-icon">🔐</div>
                  <h4>{t('cookies.s3.security.title')}</h4>
                  <p>{t('cookies.s3.security.text')}</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">⚙️</div>
                  <h4>{t('cookies.s3.functionality.title')}</h4>
                  <p>{t('cookies.s3.functionality.text')}</p>
                </div>
                <div className="reason-card">
                  <div className="reason-icon">🎯</div>
                  <h4>{t('cookies.s3.recommendations.title')}</h4>
                  <p>{t('cookies.s3.recommendations.text')}</p>
                </div>
              </div>
            </section>

            <section id="gestionare" className="policy-section">
              <h2>{t('cookies.s4.title')}</h2>
              <p>
                {t('cookies.s4.intro')}
              </p>
              
              <div className="browser-guides">
                <h4>{t('cookies.s4.guides')}</h4>
                <ul>
                  <li><strong>Chrome:</strong> {t('cookies.s4.chrome')}</li>
                  <li><strong>Firefox:</strong> {t('cookies.s4.firefox')}</li>
                  <li><strong>Safari:</strong> {t('cookies.s4.safari')}</li>
                  <li><strong>Edge:</strong> {t('cookies.s4.edge')}</li>
                </ul>
              </div>

              <div className="important-note">
                <h4>{t('cookies.s4.noteTitle')}</h4>
                <p>
                  {t('cookies.s4.noteText')}
                </p>
              </div>
            </section>

            <section id="terti" className="policy-section">
              <h2>{t('cookies.s5.title')}</h2>
              <p>
                {t('cookies.s5.intro')}
              </p>
              <ul>
                <li><strong>Cloudinary:</strong> {t('cookies.s5.cloudinary')}</li>
                <li><strong>Google Analytics/Umami:</strong> {t('cookies.s5.analytics')}</li>
                <li><strong>Google Maps:</strong> {t('cookies.s5.maps')}</li>
              </ul>
              <p>
                {t('cookies.s5.policies')}
              </p>
            </section>

            <section id="consimtamant" className="policy-section">
              <h2>{t('cookies.s6.title')}</h2>
              <p>
                {t('cookies.s6.p1')}
              </p>
              <p>
                {t('cookies.s6.p2')}
              </p>
            </section>

            <section id="actualizari" className="policy-section">
              <h2>{t('cookies.s7.title')}</h2>
              <p>
                {t('cookies.s7.text')}
              </p>
              <p className="last-updated">
                <strong>{t('cookies.s7.lastUpdatedLabel')}</strong> {t('cookies.s7.lastUpdatedDate')}
              </p>
            </section>

            <section id="contact" className="policy-section contact-section">
              <h2>{t('cookies.s8.title')}</h2>
              <p>
                {t('cookies.s8.intro')}
              </p>
              <div className="contact-info">
                <p><strong>{t('cookies.s8.emailLabel')}</strong> team.hobbiz@gmail.com</p>
                <p><strong>{t('cookies.s8.supportLabel')}</strong> {t('cookies.s8.supportText')}</p>
                <p><strong>{t('cookies.s8.addressLabel')}</strong> {t('cookies.s8.addressText')}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
