
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './About.css';
import { useTranslation } from 'react-i18next';

export default function About() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = t('about.faq', { returnObjects: true });
  return (
    <>
      <Header />
      <div className="about-page">
        <div className="about-container">
          {/* Mobile header: back + title for Despre noi */}
            <div className="mobile-header">
            <IconButton
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
              className="mobile-back-btn"
              disableRipple
              disableFocusRipple
              aria-label="Înapoi"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="mobile-header-title">{t('about.title')}</Typography>
          </div>
          {/* Hero Section */}
          <div className="about-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">✨</span>
              <span>{t('about.hero.badge')}</span>
            </div>
            <h1 className="hero-title">
              {t('about.hero.title1')} <span className="highlight">{t('about.hero.highlight')}</span> {t('about.hero.title2')}
            </h1>
          </div>

          {/* Mission Section */}
          <div className="mission-section">
            <div className="mission-content">
              <div className="mission-header">
                <div className="mission-icon">
                  <span>🎯</span>
                </div>
                <div className="mission-text">
                  <h2 className="mission-title">{t('about.mission.title')}</h2>
                  <p className="mission-subtitle">{t('about.mission.subtitle')}</p>
                </div>
              </div>
              
              <div className="mission-body">
                <p className="mission-description">
                  <strong>Hobbiz</strong> {t('about.mission.description')}
                </p>
                
                <div className="mission-pillars">
                  <div className="pillar-item">
                    <div className="pillar-icon">🌟</div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.authenticity.title')}</h4>
                      <p>{t('about.pillars.authenticity.desc')}</p>
                    </div>
                  </div>
                  
                  <div className="pillar-item">
                    <div className="pillar-icon">🤝</div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.community.title')}</h4>
                      <p>{t('about.pillars.community.desc')}</p>
                    </div>
                  </div>
                  
                  <div className="pillar-item">
                    <div className="pillar-icon">🚀</div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.growth.title')}</h4>
                      <p>{t('about.pillars.growth.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="about-features">
            <div className="feature-card">
              <h3>
                <span className="feature-icon">🚀</span>
                {t('about.features.section1.title')}
              </h3>
              <ul className="feature-list">
                {t('about.features.section1.items', { returnObjects: true }).map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>

            <div className="feature-card">
              <h3>
                <span className="feature-icon">⭐</span>
                {t('about.features.section2.title')}
              </h3>
              <ul className="feature-list">
                {t('about.features.section2.items', { returnObjects: true }).map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="how-it-works">
            <h2>{t('about.how.title')}</h2>
            <p className="how-it-works-subtitle">
              {t('about.how.subtitle')}
            </p>
            <div className="steps-timeline">
              <div className="timeline-line"></div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">1</span>
                  <div className="step-icon">👤</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{t('about.how.steps.1.title')}</h3>
                  <p className="step-description">{t('about.how.steps.1.desc')}</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">2</span>
                  <div className="step-icon">📝</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{t('about.how.steps.2.title')}</h3>
                  <p className="step-description">{t('about.how.steps.2.desc')}</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">3</span>
                  <div className="step-icon">💬</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{t('about.how.steps.3.title')}</h3>
                  <p className="step-description">{t('about.how.steps.3.desc')}</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-circle">
                  <span className="step-number">4</span>
                  <div className="step-icon">🤝</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{t('about.how.steps.4.title')}</h3>
                  <p className="step-description">{t('about.how.steps.4.desc')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="values-section">
            <h2>{t('about.values.title')}</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">🛡️</div>
                <h3>{t('about.values.cards.1.title')}</h3>
                <p>{t('about.values.cards.1.desc')}</p>
              </div>
              <div className="value-card">
                <div className="value-icon">🤝</div>
                <h3>{t('about.values.cards.2.title')}</h3>
                <p>{t('about.values.cards.2.desc')}</p>
              </div>
              <div className="value-card">
                <div className="value-icon">⚡</div>
                <h3>{t('about.values.cards.3.title')}</h3>
                <p>{t('about.values.cards.3.desc')}</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="faq-section">
            <h2>{t('about.faqTitle')}</h2>
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

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', marginTop: '30px' }}>
            {t('about.lastUpdated')}
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}