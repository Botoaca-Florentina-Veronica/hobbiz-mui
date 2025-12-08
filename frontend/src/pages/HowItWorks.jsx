import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  Grid,
  Paper,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Chat as ChatIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
  Shield as ShieldIcon,
  Nightlight as NightlightIcon,
  Publish as PublishIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const steps = t('howItWorksPage.steps.list', { returnObjects: true });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <>
      <div className="how-it-works-page">
        <div className="how-it-works-container">
          {/* Mobile header: back + title */}
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
            <Typography variant="h5" className="mobile-header-title">{t('howItWorksPage.title')}</Typography>
          </div>
          
          {/* Hero Section */}
          <div className="how-it-works-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🚀</span>
              {t('howItWorksPage.hero.badge')}
            </div>
            <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t('howItWorksPage.hero.title') }}></h1>
            <p className="hero-description">
              {t('howItWorksPage.hero.description')}
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">{t('howItWorksPage.hero.stats.members')}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">2K+</span>
                <span className="stat-label">{t('howItWorksPage.hero.stats.conversations')}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">{t('howItWorksPage.hero.stats.categories')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Stepper Section */}
          <div className="interactive-stepper-section">
            <div className="section-header">
              <h2>{t('howItWorksPage.steps.header')}</h2>
              <p>{t('howItWorksPage.steps.subtitle')}</p>
            </div>
            
            <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      icon={
                        <Avatar sx={{ 
                          bgcolor: index <= activeStep ? '#355070' : '#e0e0e0',
                          width: 40,
                          height: 40
                        }}>
                          {index === 0 ? <AssignmentIcon /> : index === 1 ? <PublishIcon /> : index === 2 ? <FavoriteIcon /> : <ChatIcon />}
                        </Avatar>
                      }
                    >
                      <Typography variant="h6" sx={{ color: '#355070', fontWeight: 600 }}>
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Card sx={{ mt: 2, mb: 2 }}>
                        <CardContent>
                          <Typography variant="body1" sx={{ mb: 2, color: '#4a5568' }}>
                            {step.description}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#718096', lineHeight: 1.6 }}>
                            {step.details}
                          </Typography>
                        </CardContent>
                      </Card>
                      <Box sx={{ mb: 2 }}>
                        <div>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            sx={{
                              mt: 1,
                              mr: 1,
                              bgcolor: '#355070',
                              '&:hover': { bgcolor: '#406b92' }
                            }}
                            endIcon={index === steps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                          >
                            {index === steps.length - 1 ? t('howItWorksPage.steps.buttons.finish') : t('howItWorksPage.steps.buttons.continue')}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            {t('howItWorksPage.steps.buttons.back')}
                          </Button>
                        </div>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              {activeStep === steps.length && (
                <Paper square elevation={0} sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#355070', mb: 2 }}>
                    {t('howItWorksPage.steps.completion.message')}
                  </Typography>
                  <Button 
                    onClick={handleReset} 
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {t('howItWorksPage.steps.completion.reset')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/login')}
                    sx={{
                      mt: 1,
                      bgcolor: '#F8B195',
                      color: '#355070',
                      '&:hover': { bgcolor: '#f4a261' }
                    }}
                  >
                    Începe acum
                  </Button>
                </Paper>
              )}
            </Box>
          </div>

          {/* Features Grid */}
          <div className="features-showcase">
            <div className="section-header">
              <h2>De ce să alegi Hobbiz?</h2>
              <p>Funcționalități care fac diferența pentru experiența ta</p>
            </div>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {t('howItWorksPage.features', { returnObjects: true }).map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card className="feature-card-mui" sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar
                        sx={{
                          bgcolor: feature.color,
                          width: 60,
                          height: 60,
                          margin: '0 auto 16px auto'
                        }}
                      >
                        {index === 0 ? <CategoryIcon /> : index === 1 ? <FavoriteIcon /> : index === 2 ? <ChatIcon /> : index === 3 ? <NotificationsIcon /> : index === 4 ? <NightlightIcon /> : <ShieldIcon />}
                      </Avatar>
                      <Typography variant="h6" sx={{ color: '#355070', fontWeight: 600, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4a5568', lineHeight: 1.6 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>

          {/* CTA Section */}
          <div className="cta-section">
            <h2>{t('howItWorksPage.cta.title')}</h2>
            <p>{t('howItWorksPage.cta.description')}</p>
            <div className="cta-buttons">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  bgcolor: 'white',
                  color: '#355070',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  mr: 2,
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {t('howItWorksPage.cta.buttons.create')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: '50px',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderColor: 'white',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {t('howItWorksPage.cta.buttons.explore')}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
