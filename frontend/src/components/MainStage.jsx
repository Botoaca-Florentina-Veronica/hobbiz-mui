import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineBell } from 'react-icons/hi';
import { FaCamera, FaUtensils, FaBook, FaMoneyBillWave, FaVideo, FaBriefcase, FaGraduationCap, FaPalette, FaBroom, FaTools, FaMusic, FaSpa, FaCar, FaBuilding, FaTruck } from 'react-icons/fa';
import hobby from '../assets/images/hobby_img.jpg';
import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Paper, CardContent, Chip, Box, IconButton, InputBase, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import './MainStage.css';

import { localitatiPeJudet } from '../assets/comunePeJudet';

// Constants
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

const categoriesList = [
  "Fotografie",
  "Prajituri, Băcănie, Gătit",
  "Traduceri & Redactare",
  "Finanțe & Contabilitate",
  "Video & Animație",
  "Business",
  "Meditații & Cursuri",
  "Grafică & Design",
  "Curatenie, Întreținere casă",
  "Reparații, Instalatii, Bricolaj",
  "Muzică, Teatru, Dans",
  "Auto, Moto, Biciclete",
  "Imobiliare, Construcții, Amenajari",
  "Transport, Logistică, Curierat"
];

const categoryIcons = {
  "Fotografie": <FaCamera />,
  "Prajituri, Băcănie, Gătit": <FaUtensils />,
  "Traduceri & Redactare": <FaBook />,
  "Finanțe & Contabilitate": <FaMoneyBillWave />,
  "Video & Animație": <FaVideo />,
  "Business": <FaBriefcase />,
  "Meditații & Cursuri": <FaGraduationCap />,
  "Grafică & Design": <FaPalette />,
  "Curatenie, Întreținere casă": <FaBroom />,
  "Reparații, Instalatii, Bricolaj": <FaTools />,
  "Muzică, Teatru, Dans": <FaMusic />,
  "Auto, Moto, Biciclete": <FaCar />,
  "Imobiliare, Construcții, Amenajari": <FaBuilding />,
  "Transport, Logistică, Curierat": <FaTruck />
};

const categoriesDetails = {
  "Fotografie": {
    columns: [
      { title: "Servicii Foto", items: ["Evenimente", "Portret", "Produse", "Imobiliare"] },
      { title: "Echipament Recomandat", items: ["Camere DSLR/Mirrorless", "Obiective", "Blitz-uri", "Trepiede"] },
      { title: "Tutoriale & Resurse", items: ["Cursuri Online", "Editare Foto", "Comunități"] },
      { title: "Sfaturi Utile", items: ["Compoziție", "Lumină", "Marketing"] }
    ]
  },
  "Prajituri, Băcănie, Gătit": {
    columns: [
      { title: "Produse & Servicii", items: ["Torturi Personalizate", "Catering Mic", "Dulciuri de Casă"] },
      { title: "Echipamente Cheie", items: ["Mixer Planetar", "Cuptor Electric", "Forme & Ustensile"] },
      { title: "Rețete & Inspirație", items: ["Tradiționale", "Internaționale", "Sfaturi Patiserie"] },
      { title: "Gestionare & Vânzare", items: ["Ambalare", "Autorizații", "Strategii Preț"] }
    ]
  },
  "Traduceri & Redactare": {
    columns: [
      { title: "Tipuri de Servicii", items: ["Traduceri Autorizate", "Redactare Conținut", "Corectură & Editare"] },
      { title: "Instrumente", items: ["Software CAT", "Dicționare", "Resurse Online"] },
      { title: "Specializări", items: ["Juridic", "Tehnic", "Medical", "Marketing"] },
      { title: "Sfaturi Profesionale", items: ["Tarife", "Contracte", "Clienți"] }
    ]
  },
  "Finanțe & Contabilitate": {
    columns: [
      { title: "Servicii Oferite", items: ["Consultanță Financiară", "Evidență Contabilă", "Declarații Fiscale"] },
      { title: "Programe & Unelte", items: ["Software Contabil", "Excel", "Resurse Legislative"] },
      { title: "Domenii", items: ["PFA/SRL", "Asociații", "Persoane Fizice"] },
      { title: "Optimizare", items: ["Planificare Buget", "Reducere Costuri", "Analiză Performanță"] }
    ]
  },
  "Video & Animație": {
    columns: [
      { title: "Servicii Creație", items: ["Clipuri Promoționale", "Animații Explicative", "Editare Video"] },
      { title: "Echipament Utilizat", items: ["Camere Video", "Software Editare", "Microfoane"] },
      { title: "Tehnici", items: ["Storyboarding", "Motion Graphics", "Post-producție"] },
      { title: "Distribuție", items: ["Social Media", "Platforme Video", "Targetare"] }
    ]
  },
  "Business": {
    columns: [
      { title: "Tipuri de Consultanță", items: ["Start-up", "Dezvoltare Afacere", "Marketing"] },
      { title: "Strategii", items: ["Planificare Afacere", "Analiză Piață", "Branding"] },
      { title: "Resurse & Unelte", items: ["Modele Business Plan", "Studii de Caz", "Software Management"] },
      { title: "Networking", items: ["Evenimente", "Parteneriate", "Comunități"] }
    ]
  },
  "Meditații & Cursuri": {
    columns: [
      { title: "Discipline", items: ["Matematică", "Română", "Limbi Străine", "Informatică"] },
      { title: "Format", items: ["Individual", "Grup", "Online", "Fizic"] },
      { title: "Materiale Didactice", items: ["Culegeri", "Teste", "Prezentări"] },
      { title: "Pregătire Specifică", items: ["Evaluare Națională", "Bacalaureat", "Admitere"] }
    ]
  },
  "Grafică & Design": {
    columns: [
      { title: "Servicii Design", items: ["Logo Design", "Grafică Print", "Grafică Digitală"] },
      { title: "Software Utilizat", items: ["Adobe Photoshop", "Illustrator", "Figma"] },
      { title: "Domenii", items: ["Branding", "Web Design", "Ilustrație"] },
      { title: "Resurse", items: ["Fonturi", "Mockups", "Stock Images"] }
    ]
  },
  "Curatenie, Întreținere casă": {
    columns: [
      { title: "Servicii Curățenie", items: ["Curățenie Generală", "După Constructor", "Geamuri"] },
      { title: "Întreținere", items: ["Grădinărit Mic", "Reparații Minore", "Instalații Sanitare Simple"] },
      { title: "Produse Recomandate", items: ["Eco", "Profesionale", "Specifice"] },
      { title: "Organizare", items: ["Planificare", "Echipă", "Logistica"] }
    ]
  },
  "Reparații, Instalatii, Bricolaj": {
    columns: [
      { title: "Tipuri de Reparații", items: ["Electrice", "Sanitare", "Mobilier"] },
      { title: "Instalații", items: ["Montaj", "Verificare", "Modernizare"] },
      { title: "Unelte Esențiale", items: ["Trusă Bricolaj", "Scule Electrice", "Consumabile"] },
      { title: "Proiecte DIY", items: ["Mic Mobilier", "Decorațiuni", "Amenajări"] }
    ]
  },
  "Muzică, Teatru, Dans": {
    columns: [
      { title: "Activități", items: ["Lecții Instrument", "Actorie", "Coregrafie"] },
      { title: "Genuri", items: ["Clasic", "Modern", "Popular"] },
      { title: "Pregătire", items: ["Audiții", "Spectacole", "Concursuri"] },
      { title: "Resurse", items: ["Partituri", "Scenarii", "Tutoriale Video"] }
    ]
  },
  "Auto, Moto, Biciclete": {
    columns: [
      { title: "Servicii Vehicule", items: ["Mecanică", "Estetică", "Verificări"] },
      { title: "Tipuri", items: ["Autoturisme", "Motociclete", "Biciclete"] },
      { title: "Accesorii & Piese", items: ["Anvelope", "Consumabile", "Echipament Protecție"] },
      { title: "Sfaturi Întreținere", items: ["Revizii", "Sezon", "Curățare"] }
    ]
  },
  "Imobiliare, Construcții, Amenajari": {
    columns: [
      { title: "Servicii Imobiliare", items: ["Evaluare", "Tranzacții", "Consultanță"] },
      { title: "Construcții", items: ["Planificare", "Materiale", "Execuție"] },
      { title: "Amenajări", items: ["Design Interior", "Renovări", "Peisagistică"] },
      { title: "Legislație", items: ["Autorizații", "Cadastru", "Intabulare"] }
    ]
  },
  "Transport, Logistică, Curierat": {
    columns: [
      { title: "Servicii Transport", items: ["Persoane", "Marfă", "Specializat"] },
      { title: "Logistică", items: ["Optimizare Rute", "Depozitare", "Management Flotă"] },
      { title: "Curierat", items: ["Local", "Național", "Internațional"] },
      { title: "Reglementări", items: ["Licențe", "Legislație Rutieră", "Siguranță"] }
    ]
  }
};

// Map displayed Romanian category name to a stable slug used for translations
const categorySlugs = {
  "Fotografie": "fotografie",
  "Prajituri, Băcănie, Gătit": "prajituri_gatit",
  "Traduceri & Redactare": "traduceri_redactare",
  "Finanțe & Contabilitate": "finante_contabilitate",
  "Video & Animație": "video_animatie",
  "Business": "business",
  "Meditații & Cursuri": "meditatii_cursuri",
  "Grafică & Design": "grafica_design",
  "Curatenie, Întreținere casă": "curatenie_intretinere_casa",
  "Reparații, Instalatii, Bricolaj": "reparatii_instalatii_bricolaj",
  "Muzică, Teatru, Dans": "muzica_teatru_dans",
  "Auto, Moto, Biciclete": "auto_moto_biciclete",
  "Imobiliare, Construcții, Amenajari": "imobiliare_constructii_amenajari",
  "Transport, Logistică, Curierat": "transport_logistica_curierat"
};

// Helper functions
function getLocalitatiForJudet(judet) {
  if (!localitatiPeJudet[judet]) return [];
  const orase = localitatiPeJudet[judet]?.orase?.map(o => o.nume) || [];
  const comune = localitatiPeJudet[judet]?.comune || [];
  return [...orase, ...comune].sort((a, b) => a.localeCompare(b, 'ro'));
}

// Main Component
export default function MainStage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryDetailsAnimating, setCategoryDetailsAnimating] = useState(false);
  
  // Refs
  const categoriesButtonRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Event Handlers
  const handleCategoryHover = (category) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setCategoryDetailsAnimating(false);
    setHoveredCategory(category);
  };

  const handleCategoryLeave = () => {
    setCategoryDetailsAnimating(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setCategoryDetailsAnimating(false);
    }, 200);
  };

  const handleInputClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedJudet(null);
    setSelectedLocalitate("");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedJudet(null);
  };

  const handleJudetClick = (event, judet) => {
    setSelectedJudet(judet);
  };

  const handleLocalitateClick = (localitate) => {
    setSelectedLocalitate(localitate);
    setAnchorEl(null);
    setSelectedJudet(null);
  };

  const handleCategoriesClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCategoriesOpen(prev => !prev);
  };

  const handleCloseCategories = () => {
    setCategoriesOpen(false);
    setCategoryDetailsAnimating(true);
    setHoveredCategory(null);
    setCategoryDetailsAnimating(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleCategoryClick = (category) => {
    handleCloseCategories();
    navigate(`/anunturi-categorie/${encodeURIComponent(category)}`);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const open = Boolean(anchorEl);
  const id = open ? 'location-popover' : undefined;

  return (
    <div className="main-stage">
      {/* Categories Dropdown */}
      {categoriesOpen && (
        <>
          <div className="categories-overlay" onClick={handleCloseCategories}></div>
          <Paper className="category-dropdown" elevation={0}>
            <Box className="category-dropdown-container">
              {categoriesList.map((cat) => (
                <Box
                  key={cat}
                  className="category-item"
                  onClick={() => handleCategoryClick(cat)}
                  onMouseEnter={() => handleCategoryHover(cat)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <Box className="category-icon">
                    {categoryIcons[cat]}
                  </Box>
                  <Typography className="category-text">
                    {t(`categories.${cat}`)}
                  </Typography>
                  <ArrowForwardIosIcon className="category-arrow" fontSize="small" />
                </Box>
              ))}
            </Box>
          </Paper>
          
          {/* Category Details Panel */}
          {hoveredCategory && categoriesDetails[hoveredCategory] && (
            <Paper
              className={`category-details ${categoryDetailsAnimating ? 'animating-out' : ''}`}
              onMouseEnter={() => handleCategoryHover(hoveredCategory)}
              onMouseLeave={handleCategoryLeave}
            >
              <CardContent className="category-details-content">
                <Typography className="category-details-title">
                  {t(`categories.${hoveredCategory}`)}
                </Typography>
                <Box className="category-details-grid">
                  {categoriesDetails[hoveredCategory].columns.map((col, idx) => (
                    <Box key={idx} className="detail-column">
                      <Typography className="detail-title">
                        {t(`categoryDetails.${categorySlugs[hoveredCategory] || hoveredCategory}.columns.${idx}.title`, { defaultValue: col.title })}
                      </Typography>
                          <Box className="detail-items">
                            {col.items.map((item, i) => (
                              <Chip
                                key={i}
                                label={t(`categoryDetails.${categorySlugs[hoveredCategory] || hoveredCategory}.columns.${idx}.items.${i}`, { defaultValue: item })}
                                variant="outlined"
                                size="small"
                                className="detail-chip"
                              />
                            ))}
                          </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Paper>
          )}
        </>
      )}

      {/* Top Bar */}
      <div className="top-bar">
        {!isMobile && (
          <button 
            className={`categories-button ${categoriesOpen ? 'menu-open' : ''}`}
            onClick={handleCategoriesClick}
            type="button"
            ref={categoriesButtonRef}
          >
            <FaBars />
            <span>{t('mainStage.categoriesButton')}</span>
          </button>
        )}

        {!isMobile ? (
          <div className="search-container mainstage-search-desktop">
            <input 
              type="text" 
              placeholder={t('mainStage.searchPlaceholder')} 
              className="search-input"
            />
            <div className="location-section">
              <FaMapMarkerAlt className="location-icon" />
              <input 
                type="text" 
                placeholder={t('mainStage.locationPlaceholder')} 
                className="location-input"
                value={selectedLocalitate || selectedJudet || t('mainStage.locationPlaceholder')}
                readOnly
                onClick={handleInputClick}
              />
            </div>
            <button className="search-button">
              <span>{t('mainStage.searchButton')}</span>
              <FaSearch className="search-icon" />
            </button>
          </div>
        ) : (
          <Box className="mainstage-search-mobile">
            <Stack direction="row" alignItems="center" spacing={1} className="search-bell-wrapper">
              <Paper elevation={3} className="mobile-search-paper">
                <IconButton 
                  size="small" 
                  aria-label="Alege locația" 
                  onClick={handleInputClick}
                >
                  <FaMapMarkerAlt />
                </IconButton>
                <InputBase
                  className="mobile-search-input"
                  placeholder={t('mainStage.searchPlaceholder')}
                  inputProps={{ 'aria-label': t('mainStage.searchButton') }}
                />
                <IconButton color="primary" aria-label={t('mainStage.searchButton')}>
                  <FaSearch />
                </IconButton>
              </Paper>
              <IconButton 
                className="notif-button-mobile" 
                aria-label="Notificări" 
                onClick={() => navigate('/notificari')}
              >
                <HiOutlineBell />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Location Selection Popover */}
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ 
            className: "location-popover",
          }}
        >
          {!selectedJudet ? (
            <>
              <Typography className="popover-title">Alege un județ</Typography>
              <List className="popover-list">
                {judete.map((judet) => (
                  <ListItemButton
                    key={judet}
                    onClick={() => {
                      if (judet === "Toată țara") {
                        setSelectedJudet(null);
                        setSelectedLocalitate("");
                        setAnchorEl(null);
                      } else {
                        setSelectedJudet(judet);
                      }
                    }}
                    divider
                  >
                    <ListItemText
                      primary={
                        judet === "Toată țara" ? 
                        <span className="judet-all">Toată țara</span> : 
                        judet
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          ) : (
            <>
              <Typography className="popover-title">Alege localitatea</Typography>
              <List className="popover-list">
                <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                  <ListItemText 
                    primary={<span className="back-to-judete">{t('mainStage.backToCounties')}</span>} 
                  />
                </ListItemButton>
                {getLocalitatiForJudet(selectedJudet).map((localitate) => (
                  <ListItemText
                    key={localitate}
                    primary={localitate}
                    className="localitate-item"
                    onClick={() => handleLocalitateClick(localitate)}
                  />
                ))}
              </List>
            </>
          )}
        </Popover>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="main-text">
          <h1 id="main-title">
            {t('mainStage.title')}
          </h1>
          <p>{t('mainStage.subtitle')}</p>
          <button className="sign-up-button" onClick={() => navigate('/signup')}>
            {t('mainStage.signUp')}
          </button>
        </div>
        <div className="main-stage-image">
          <img src={hobby} alt="hobby" />
        </div>
      </div>
    </div>
  );
}