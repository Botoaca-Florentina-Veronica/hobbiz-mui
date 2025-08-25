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
import './HowItWorks.css';

const steps = [
  {
    label: 'Creează-ți contul',
    description: 'Înregistrează-te rapid cu emailul sau intră ca invitat și personalizează-ți profilul.',
    icon: <AssignmentIcon />,
    details: 'Completezi informațiile de bază și, opțional, adaugi avatar și o scurtă descriere. Poți porni în modul invitat și să îți creezi contul mai târziu.'
  },
  {
    label: 'Publică sau caută anunțuri',
    description: 'Publică ușor un anunț sau explorează categoriile și filtrele pentru a găsi ce te interesează.',
    icon: <PublishIcon />,
    details: 'Folosește filtre (preț, locație, dată, popularitate) și sortări, sau adaugă rapid un anunț cu imagini, categorie și detalii clare.'
  },
  {
    label: 'Salvează în Favorite și revino',
    description: 'Apasă inimioara pentru a salva anunțurile preferate și a le accesa ulterior.',
    icon: <FavoriteIcon />,
    details: 'Favoritele se salvează pe dispozitiv, separate pe utilizator sau invitat, și pot fi regăsite în pagina „Favorite”.'
  },
  {
    label: 'Discută și primește notificări',
    description: 'Deschide chatul cu autorul anunțului și urmărește actualizările în „Notificări”.',
    icon: <ChatIcon />,
    details: 'Chat integrat pentru întrebări rapide. Primești notificări despre mesaje noi sau activitate pe anunțurile tale.'
  }
];

const features = [
  {
    icon: <CategoryIcon />,
    title: 'Categorii și filtre puternice',
    description: 'Navigare pe categorii, căutare după cuvinte cheie, sortări și filtre pentru rezultate relevante.',
    color: '#355070'
  },
  {
    icon: <FavoriteIcon />,
    title: 'Favorite sincronizate local',
    description: 'Salvează ce-ți place și revino oricând. Stocare pe dispozitiv și separare pe utilizator/guest.',
    color: '#406b92'
  },
  {
    icon: <ChatIcon />,
    title: 'Chat integrat',
    description: 'Comunică rapid cu autorii anunțurilor. Avatare normalizate și fallback cu inițiale.',
    color: '#F8B195'
  },
  {
    icon: <NotificationsIcon />,
    title: 'Notificări clare',
    description: 'Vezi noutățile importante, cu avatare, linkuri către anunțuri și evidențiere pentru elementele necitite.',
    color: '#355070'
  },
  {
    icon: <NightlightIcon />,
    title: 'Dark mode elegant',
    description: 'Paletă dark rafinată și accente roz, cu contrast și lizibilitate optimizate pe toate paginile.',
    color: '#406b92'
  },
  {
    icon: <ShieldIcon />,
    title: 'Siguranță și încredere',
    description: 'Normalizare url imagini, protejarea datelor de contact și bune practici UI/UX.',
    color: '#F8B195'
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

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
            <Typography variant="h5" className="mobile-header-title">Cum funcționează</Typography>
          </div>
          
          {/* Hero Section */}
          <div className="how-it-works-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🚀</span>
              Simplu și eficient
            </div>
            <h1 className="hero-title">
              Cum funcționează <span className="highlight">Hobbiz</span>?
            </h1>
            <p className="hero-description">
              Descoperă cum poți să-ți găsești rapid persoane cu aceleași pasiuni și să participi 
              la activități captivante. Procesul nostru în 4 pași te va ghida pas cu pas.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Membri activi</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">2K+</span>
                <span className="stat-label">Conversații lunare</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Categorii hobby</span>
              </div>
            </div>
          </div>

          {/* Interactive Stepper Section */}
          <div className="interactive-stepper-section">
            <div className="section-header">
              <h2>Pașii pentru a începe</h2>
              <p>Urmează acești pași simpli pentru a te alătura comunității noastre</p>
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
                          {step.icon}
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
                            {index === steps.length - 1 ? 'Finalizează' : 'Continuă'}
                          </Button>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Înapoi
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
                    Gata! Acum poți începe să explorezi platforma 🎉
                  </Typography>
                  <Button 
                    onClick={handleReset} 
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Resetează
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
              {features.map((feature, index) => (
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
                        {feature.icon}
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
            <h2>Gata să începi aventura?</h2>
            <p>Alătură-te comunității noastre și descoperă noi pasiuni împreună cu oameni minunați!</p>
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
                Înregistrează-te gratuit
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/about')}
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
                Află mai multe
              </Button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
