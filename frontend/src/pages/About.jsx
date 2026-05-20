import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Typography, Button } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon,
  TrackChanges as TrackChangesIcon,
  Verified as VerifiedIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  RocketLaunch as RocketLaunchIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  PostAdd as PostAddIcon,
  Chat as ChatIcon,
  Handshake as HandshakeIcon,
  Shield as ShieldIcon,
  Bolt as BoltIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './About.css';
import { useTranslation } from 'react-i18next';

const STEP_ICONS = [
  <PersonAddIcon />,
  <PostAddIcon />,
  <ChatIcon />,
  <HandshakeIcon />
];

const VALUE_ICONS = [
  <ShieldIcon />,
  <GroupsIcon />,
  <BoltIcon />
];

export default function About() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = t('about.faq', { returnObjects: true });
  const section1Items = t('about.features.section1.items', { returnObjects: true });
  const section2Items = t('about.features.section2.items', { returnObjects: true });
  const faqList = Array.isArray(faqData) ? faqData : [];

  return (
    <>
      <Header />
      <div className="about-page">
        <div className="about-container">
          {/* Mobile header */}
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

          {/* HERO */}
          <section className="about-hero">
            <div className="hero-decor" aria-hidden="true">
              <span className="hero-blob hero-blob-a" />
              <span className="hero-blob hero-blob-b" />
            </div>
            <div className="hero-content">
              <div className="hero-badge">
                <AutoAwesomeIcon className="hero-badge-icon" />
                <span>{t('about.hero.badge')}</span>
              </div>
              <h1 className="hero-title">
                {t('about.hero.title1')} <span className="highlight">{t('about.hero.highlight')}</span> {t('about.hero.title2')}
              </h1>
            </div>
          </section>

          {/* MISSION */}
          <section className="mission-section">
            <div className="mission-content">
              <div className="mission-header">
                <div className="mission-icon"><TrackChangesIcon /></div>
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
                    <div className="pillar-icon"><VerifiedIcon /></div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.authenticity.title')}</h4>
                      <p>{t('about.pillars.authenticity.desc')}</p>
                    </div>
                  </div>
                  <div className="pillar-item">
                    <div className="pillar-icon"><GroupsIcon /></div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.community.title')}</h4>
                      <p>{t('about.pillars.community.desc')}</p>
                    </div>
                  </div>
                  <div className="pillar-item">
                    <div className="pillar-icon"><TrendingUpIcon /></div>
                    <div className="pillar-content">
                      <h4>{t('about.pillars.growth.title')}</h4>
                      <p>{t('about.pillars.growth.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="about-features">
            <div className="feature-card">
              <h3>
                <span className="feature-icon"><RocketLaunchIcon /></span>
                <span>{t('about.features.section1.title')}</span>
              </h3>
              <ul className="feature-list">
                {section1Items.map((it, i) => (
                  <li key={i}>
                    <CheckCircleIcon className="feature-check" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="feature-card">
              <h3>
                <span className="feature-icon"><StarIcon /></span>
                <span>{t('about.features.section2.title')}</span>
              </h3>
              <ul className="feature-list">
                {section2Items.map((it, i) => (
                  <li key={i}>
                    <CheckCircleIcon className="feature-check" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="how-it-works">
            <div className="how-it-works-head">
              <h2>{t('about.how.title')}</h2>
              <p className="how-it-works-subtitle">{t('about.how.subtitle')}</p>
            </div>
            <div className="steps-timeline">
              <div className="timeline-line" aria-hidden="true"></div>
              {[1, 2, 3, 4].map((n, i) => (
                <div className="step-item" key={n}>
                  <div className="step-circle">
                    <div className="step-icon-wrap">{STEP_ICONS[i]}</div>
                    <span className="step-number">{n}</span>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">{t(`about.how.steps.${n}.title`)}</h3>
                    <p className="step-description">{t(`about.how.steps.${n}.desc`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* VALUES */}
          <section className="values-section">
            <h2>{t('about.values.title')}</h2>
            <div className="values-grid">
              {[1, 2, 3].map((n, i) => (
                <div className="value-card" key={n}>
                  <div className="value-icon">{VALUE_ICONS[i]}</div>
                  <h3>{t(`about.values.cards.${n}.title`)}</h3>
                  <p>{t(`about.values.cards.${n}.desc`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          {faqList.length > 0 && (
            <section className="faq-section">
              <h2>{t('about.faqTitle')}</h2>
              <div className="faq-container">
                {faqList.map((faq, index) => {
                  const isOpen = openFAQ === index;
                  const panelId = `about-faq-panel-${index}`;
                  return (
                    <div key={index} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => toggleFAQ(index)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                      >
                        <span>{faq.question}</span>
                        <ExpandMoreIcon className="faq-chevron" />
                      </button>
                      <div className="faq-answer-wrap" id={panelId} role="region">
                        <p className="faq-answer">{faq.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="about-cta">
            <div className="about-cta-decor" aria-hidden="true">
              <span className="hero-blob hero-blob-a" />
              <span className="hero-blob hero-blob-b" />
            </div>
            <div className="about-cta-inner">
              <h2 className="about-cta-title">{t('howItWorksPage.cta.title')}</h2>
              <p className="about-cta-desc">{t('howItWorksPage.cta.description')}</p>
              <div className="about-cta-buttons">
                <Button
                  className="about-cta-btn-primary"
                  variant="contained"
                  onClick={() => navigate('/login')}
                  endIcon={<ArrowForwardIcon />}
                  disableElevation
                >
                  {t('howItWorksPage.cta.buttons.create')}
                </Button>
                <Button
                  className="about-cta-btn-ghost"
                  variant="text"
                  onClick={() => navigate('/')}
                >
                  {t('howItWorksPage.cta.buttons.explore')}
                </Button>
              </div>
            </div>
          </section>

          <p className="about-last-updated">
            {t('about.lastUpdated')}
          </p>
        </div>
      </div>
      <Footer hideLegalUpTo1200 />
    </>
  );
}
