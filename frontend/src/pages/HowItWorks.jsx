import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Handshake as HandshakeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import './HowItWorks.css';

const steps = [
  {
    label: 'Creează-ți contul',
    description: 'Înregistrează-te rapid și ușor cu email-ul sau prin rețelele sociale',
    icon: <AssignmentIcon />,
    details: 'Procesul de înregistrare durează doar câteva minute. Completezi informațiile de bază și îți validezi adresa de email pentru a începe să folosești platforma.'
  },
  {
    label: 'Explorează categoriile',
    description: 'Navighează prin categoriile diverse de hobby-uri și găsește ce te pasionează',
    icon: <SearchIcon />,
    details: 'Avem peste 50 de categorii diferite, de la arte și meserii până la sport și tehnologie. Folosește filtrele pentru a găsi exact ceea ce cauți.'
  },
  {
    label: 'Conectează-te cu pasionații',
    description: 'Trimite mesaje și stabilește întâlniri cu persoane cu aceleași interese',
    icon: <ChatIcon />,
    details: 'Sistemul nostru de chat securizat îți permite să comunici în siguranță cu alți membri. Planifică întâlniri și schimbă experiențe valoroase.'
  },
  {
    label: 'Participă la activități',
    description: 'Alătură-te grupurilor și evenimentelor organizate de comunitate',
    icon: <GroupsIcon />,
    details: 'Participă la workshop-uri, cursuri și evenimente speciale. Învață lucruri noi și dezvoltă-ți pasiunile alături de alți entuziaști.'
  }
];

const features = [
  {
    icon: <SecurityIcon />,
    title: 'Siguritate maximă',
    description: 'Toate datele tale sunt protejate cu criptare de nivel bancar și autentificare în doi pași.',
    color: '#355070'
  },
  {
    icon: <SpeedIcon />,
    title: 'Găsire rapidă',
    description: 'Algoritmii noștri avansați îți recomandă persoane și activități potrivite în secunde.',
    color: '#406b92'
  },
  {
    icon: <SupportIcon />,
    title: 'Suport 24/7',
    description: 'Echipa noastră de support este disponibilă non-stop pentru a te ajuta cu orice întrebare.',
    color: '#F8B195'
  },
  {
    icon: <VerifiedIcon />,
    title: 'Membri verificați',
    description: 'Toți membrii trec prin procesul nostru de verificare pentru o experiență sigură.',
    color: '#355070'
  },
  {
    icon: <TrendingUpIcon />,
    title: 'Progres urmărit',
    description: 'Monitorizează-ți progresul în hobby-uri și vezi cum evoluezi în timp.',
    color: '#406b92'
  },
  {
    icon: <CheckCircleIcon />,
    title: 'Calitate garantată',
    description: 'Toate activitățile și cursurile sunt evaluate de comunitate pentru calitate maximă.',
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
      <Header />
      <div className="how-it-works-page">
        <div className="how-it-works-container">
          
          {/* Hero Section */}
          <div className="how-it-works-hero">
            <div className="hero-badge">
              <span className="hero-badge-icon">🚀</span>
              Simplu și eficient
            </div>
            <h1 className="hero-title">
              Cum funcționează <span className="highlight">HobbizMUI</span>?
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
                <span className="stat-number">500+</span>
                <span className="stat-label">Evenimente lunare</span>
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
              <h2>De ce să alegi HobbizMUI?</h2>
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
      <Footer />
    </>
  );
}
