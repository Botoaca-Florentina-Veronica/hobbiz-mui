import React from 'react';
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
  ArrowBack as ArrowBackIcon
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

  const steps = t('howItWorksPage.steps.list', { returnObjects: true });
  const features = t('howItWorksPage.features', { returnObjects: true });

  return (
    <div className="how-it-works-page">
      <div className="how-it-works-container">
        {/* Mobile header */}
        <div className="mobile-header">
          <IconButton
            onClick={() => { window.history.length > 1 ? navigate(-1) : navigate('/'); }}
            className="mobile-back-btn"
            disableRipple
            disableFocusRipple
            aria-label={t('howItWorksPage.title')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="mobile-header-title">
            {t('howItWorksPage.title')}
          </Typography>
        </div>

        {/* Hero Section */}
        <section className="how-it-works-hero">
          <div className="hero-badge">
            <span className="hero-badge-icon">🚀</span>
            {t('howItWorksPage.hero.badge')}
          </div>
          <h1
            className="hero-title"
            dangerouslySetInnerHTML={{ __html: t('howItWorksPage.hero.title') }}
          />
          <p className="hero-description">
            {t('howItWorksPage.hero.description')}
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">{t('howItWorksPage.hero.stats.members')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">2K+</span>
              <span className="stat-label">{t('howItWorksPage.hero.stats.conversations')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">{t('howItWorksPage.hero.stats.categories')}</span>
            </div>
          </div>
        </section>

        {/* Steps Section — card-based timeline */}
        <section className="steps-section">
          <div className="section-header">
            <h2>{t('howItWorksPage.steps.header')}</h2>
            <p>{t('howItWorksPage.steps.subtitle')}</p>
          </div>
          <div className="steps-timeline">
            {steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-number-wrap">
                  <span className="step-number">{i + 1}</span>
                  {i < steps.length - 1 && <span className="step-connector" />}
                </div>
                <div className="step-content">
                  <div className="step-icon-circle">
                    {STEP_ICONS[i]}
                  </div>
                  <h3 className="step-title">{step.label}</h3>
                  <p className="step-description">{step.description}</p>
                  <p className="step-details">{step.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-showcase">
          <div className="section-header">
            <h2>{t('howItWorksPage.featuresHeader')}</h2>
            <p>{t('howItWorksPage.featuresSubtitle')}</p>
          </div>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">
                  {FEATURE_ICON_MAP[feature.icon] || <CategoryIcon />}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2>{t('howItWorksPage.cta.title')}</h2>
          <p>{t('howItWorksPage.cta.description')}</p>
          <div className="cta-buttons">
            <Button
              className="cta-btn-primary"
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
            >
              {t('howItWorksPage.cta.buttons.create')}
            </Button>
            <Button
              className="cta-btn-secondary"
              variant="outlined"
              size="large"
              onClick={() => navigate('/')}
            >
              {t('howItWorksPage.cta.buttons.explore')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}