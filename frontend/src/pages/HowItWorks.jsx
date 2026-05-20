import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  IconButton
} from '@mui/material';
import {
  Chat as ChatIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
  Shield as ShieldIcon,
  Nightlight as NightlightIcon,
  Publish as PublishIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
  Handshake as HandshakeIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

const STEP_ICONS = [
  <AssignmentIcon />,
  <PublishIcon />,
  <FavoriteIcon />,
  <ChatIcon />
];

const FEATURE_ICON_MAP = {
  category: <CategoryIcon />,
  favorite: <FavoriteIcon />,
  chat: <ChatIcon />,
  notifications: <NotificationsIcon />,
  darkmode: <NightlightIcon />,
  shield: <ShieldIcon />,
  handshake: <HandshakeIcon />
};

export default function HowItWorks() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);

  const steps = t('howItWorksPage.steps.list', { returnObjects: true });
  const features = t('howItWorksPage.features', { returnObjects: true });
  const faqs = t('about.faq', { returnObjects: true });
  const faqList = Array.isArray(faqs) ? faqs : [];

  return (
    <div className="hiw-page">
      <div className="hiw-mobile-header">
        <IconButton
          onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/'); }}
          className="hiw-back-btn"
          disableRipple
          disableFocusRipple
          aria-label={t('howItWorksPage.title')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="hiw-mobile-header-title">
          {t('howItWorksPage.title')}
        </Typography>
      </div>

      <div className="hiw-container">
        {/* HERO */}
        <section className="hiw-hero">
          <div className="hiw-hero-decor" aria-hidden="true">
            <span className="hiw-blob hiw-blob-a" />
            <span className="hiw-blob hiw-blob-b" />
            <span className="hiw-blob hiw-blob-c" />
            <span className="hiw-grid-overlay" />
          </div>

          <div className="hiw-hero-content">
            <div className="hiw-badge">
              <span className="hiw-badge-dot" />
              {t('howItWorksPage.hero.badge')}
            </div>
            <h1
              className="hiw-hero-title"
              dangerouslySetInnerHTML={{ __html: t('howItWorksPage.hero.title') }}
            />
            <p className="hiw-hero-description">
              {t('howItWorksPage.hero.description')}
            </p>

            <div className="hiw-hero-actions">
              <Button
                className="hiw-btn-primary"
                variant="contained"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForwardIcon />}
                disableElevation
              >
                {t('howItWorksPage.cta.buttons.create')}
              </Button>
              <Button
                className="hiw-btn-ghost hiw-btn-ghost--invert"
                variant="text"
                onClick={() => navigate('/')}
              >
                {t('howItWorksPage.cta.buttons.explore')}
              </Button>
            </div>
          </div>
        </section>

        {/* STEPS — editorial timeline */}
        <section className="hiw-section hiw-steps-section">
          <div className="hiw-section-head">
            <span className="hiw-eyebrow">{t('howItWorksPage.steps.subtitle')}</span>
            <h2 className="hiw-section-title">{t('howItWorksPage.steps.header')}</h2>
          </div>

          <div className="hiw-timeline">
            <span className="hiw-timeline-track" aria-hidden="true" />
            {steps.map((step, i) => (
              <article
                className={`hiw-step ${i % 2 === 0 ? 'hiw-step--left' : 'hiw-step--right'}`}
                key={i}
              >
                <div className="hiw-step-marker" aria-hidden="true">
                  <span className="hiw-step-num">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="hiw-step-card">
                  <div className="hiw-step-icon">{STEP_ICONS[i]}</div>
                  <h3 className="hiw-step-title">{step.label}</h3>
                  <p className="hiw-step-desc">{step.description}</p>
                  {step.details && (
                    <p className="hiw-step-details">{step.details}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="hiw-section hiw-features-section">
          <div className="hiw-section-head">
            <span className="hiw-eyebrow">{t('howItWorksPage.featuresSubtitle')}</span>
            <h2 className="hiw-section-title">{t('howItWorksPage.featuresHeader')}</h2>
          </div>

          <div className="hiw-features-grid">
            {features.map((feature, i) => (
              <article className="hiw-feature" key={i}>
                <div className="hiw-feature-icon">
                  {FEATURE_ICON_MAP[feature.icon] || <CategoryIcon />}
                </div>
                <h3 className="hiw-feature-title">{feature.title}</h3>
                <p className="hiw-feature-desc">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        {faqList.length > 0 && (
          <section className="hiw-section hiw-faq-section">
            <div className="hiw-section-head">
              <span className="hiw-eyebrow">FAQ</span>
              <h2 className="hiw-section-title">{t('about.faqTitle', 'Întrebări frecvente')}</h2>
            </div>

            <div className="hiw-faq-list">
              {faqList.map((item, idx) => {
                const isOpen = openFaq === idx;
                const panelId = `hiw-faq-panel-${idx}`;
                return (
                  <div
                    className={`hiw-faq-item ${isOpen ? 'is-open' : ''}`}
                    key={idx}
                  >
                    <button
                      type="button"
                      className="hiw-faq-q"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span>{item.question}</span>
                      <ExpandMoreIcon className="hiw-faq-chevron" />
                    </button>
                    <div className="hiw-faq-a-wrap" id={panelId} role="region">
                      <p className="hiw-faq-a">{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="hiw-cta">
          <div className="hiw-cta-decor" aria-hidden="true">
            <span className="hiw-blob hiw-blob-cta-a" />
            <span className="hiw-blob hiw-blob-cta-b" />
            <span className="hiw-grid-overlay" />
          </div>
          <div className="hiw-cta-inner">
            <h2 className="hiw-cta-title">{t('howItWorksPage.cta.title')}</h2>
            <p className="hiw-cta-desc">{t('howItWorksPage.cta.description')}</p>
            <div className="hiw-cta-buttons">
              <Button
                className="hiw-btn-primary hiw-btn-primary--invert"
                variant="contained"
                onClick={() => navigate('/login')}
                endIcon={<ArrowForwardIcon />}
                disableElevation
              >
                {t('howItWorksPage.cta.buttons.create')}
              </Button>
              <Button
                className="hiw-btn-ghost hiw-btn-ghost--invert"
                variant="text"
                onClick={() => navigate('/')}
              >
                {t('howItWorksPage.cta.buttons.explore')}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
