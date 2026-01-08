import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Chat as ChatIcon,
  DarkMode as DarkModeIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
  PersonAddAlt1 as PersonAddAlt1Icon,
  Search as SearchIcon,
  Shield as ShieldIcon,
  StarRate as StarRateIcon,
  UploadFile as UploadFileIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

export default function HowItWorks() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const heroStats = t('howItWorksPage.hero.stats', { returnObjects: true });
  const steps = t('howItWorksPage.steps.list', { returnObjects: true });
  const capabilities = t('howItWorksPage.capabilities.list', { returnObjects: true });
  const trustPoints = t('howItWorksPage.trust.points', { returnObjects: true });

  const iconByKey = {
    account: <PersonAddAlt1Icon />,
    search: <SearchIcon />,
    publish: <UploadFileIcon />,
    chat: <ChatIcon />,
    favorite: <FavoriteIcon />,
    notifications: <NotificationsIcon />,
    darkmode: <DarkModeIcon />,
    trust: <ShieldIcon />,
    reviews: <StarRateIcon />
  };

  return (
    <>
      <div className="how-it-works-page hw-v2">
        <div className="how-it-works-container">
          {/* Mobile header: back + title */}
          <div className="mobile-header">
            <IconButton
              onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
              className="mobile-back-btn"
              disableRipple
              disableFocusRipple
              aria-label="Back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" className="mobile-header-title">{t('howItWorksPage.title')}</Typography>
          </div>

          {/* Hero */}
          <section className="hw-hero">
            <div className="hw-hero-badge">{t('howItWorksPage.hero.badge')}</div>
            <h1 className="hw-hero-title" dangerouslySetInnerHTML={{ __html: t('howItWorksPage.hero.title') }} />
            <p className="hw-hero-description">{t('howItWorksPage.hero.description')}</p>

            <Stack className="hw-hero-actions" direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/signup')} className="hw-primary-btn">
                {t('howItWorksPage.hero.actions.primary')}
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/toate-anunturile')} className="hw-secondary-btn">
                {t('howItWorksPage.hero.actions.secondary')}
              </Button>
            </Stack>

            <div className="hw-hero-stats">
              {Array.isArray(heroStats) && heroStats.map((s, idx) => (
                <div className="hw-stat" key={idx}>
                  <span className="hw-stat-value">{s.value}</span>
                  <span className="hw-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Steps */}
          <section className="hw-section">
            <header className="hw-section-header">
              <h2 className="hw-h2">{t('howItWorksPage.steps.title')}</h2>
              <p className="hw-subtitle">{t('howItWorksPage.steps.subtitle')}</p>
            </header>

            <Grid container spacing={2}>
              {Array.isArray(steps) && steps.map((step, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Card className="hw-card">
                    <CardContent className="hw-card-content">
                      <div className="hw-card-top">
                        <div className="hw-icon">{iconByKey[step.icon] || <ArrowForwardIcon />}</div>
                        <div className="hw-step-number">{String(idx + 1).padStart(2, '0')}</div>
                      </div>
                      <Typography variant="h6" className="hw-card-title">{step.title}</Typography>
                      <Typography variant="body2" className="hw-card-text">{step.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </section>

          {/* Capabilities */}
          <section className="hw-section hw-section-alt">
            <header className="hw-section-header">
              <h2 className="hw-h2">{t('howItWorksPage.capabilities.title')}</h2>
              <p className="hw-subtitle">{t('howItWorksPage.capabilities.subtitle')}</p>
            </header>

            <Grid container spacing={2}>
              {Array.isArray(capabilities) && capabilities.map((item, idx) => (
                <Grid item xs={12} md={6} lg={4} key={idx}>
                  <Card className="hw-card hw-card-hover">
                    <CardContent className="hw-card-content">
                      <div className="hw-icon">{iconByKey[item.icon] || <ArrowForwardIcon />}</div>
                      <Typography variant="h6" className="hw-card-title">{item.title}</Typography>
                      <Typography variant="body2" className="hw-card-text">{item.description}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </section>

          {/* Trust */}
          <section className="hw-section">
            <header className="hw-section-header">
              <h2 className="hw-h2">{t('howItWorksPage.trust.title')}</h2>
              <p className="hw-subtitle">{t('howItWorksPage.trust.subtitle')}</p>
            </header>

            <Card className="hw-card hw-trust">
              <CardContent className="hw-card-content">
                <div className="hw-trust-grid">
                  {Array.isArray(trustPoints) && trustPoints.map((p, idx) => (
                    <div className="hw-trust-item" key={idx}>
                      <div className="hw-trust-icon">{iconByKey.trust}</div>
                      <div className="hw-trust-text">{p}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <section className="hw-cta">
            <h2 className="hw-cta-title">{t('howItWorksPage.cta.title')}</h2>
            <p className="hw-cta-text">{t('howItWorksPage.cta.description')}</p>
            <div className="hw-cta-actions">
              <Button variant="contained" size="large" onClick={() => navigate('/signup')} className="hw-primary-btn">{t('howItWorksPage.cta.buttons.create')}</Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/toate-anunturile')} className="hw-secondary-btn">{t('howItWorksPage.cta.buttons.explore')}</Button>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
