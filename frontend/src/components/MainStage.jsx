import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineBell } from 'react-icons/hi';
import { FaCamera, FaUtensils, FaBook, FaMoneyBillWave, FaVideo, FaBriefcase, FaGraduationCap, FaPalette, FaBroom, FaTools, FaMusic, FaSpa, FaCar, FaBuilding, FaTruck } from 'react-icons/fa';
import hobby from '../assets/images/hobby_img.jpg';
import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Paper, Card, CardContent, Chip, Box, IconButton, InputBase, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import './MainStage.css';

import { localitatiPeJudet } from '../assets/comunePeJudet';
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

// Styled MUI Components pentru categorii
const CategoryDropdown = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: '70px',
  left: '40px',
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '0px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)',
  zIndex: 10000,
  width: '420px', // Mai mare de la 380px la 420px
  height: '630px', // Mai mare de la 560px la 630px (14 * 45px)
  overflowY: 'hidden', // Eliminăm scrollbar-ul vertical
  overflowX: 'hidden', // Eliminăm scrollbar-ul orizontal
  padding: '0px', // Eliminăm padding-ul pentru a câștiga spațiu
  animation: 'categorySlideIn 0.25s ease-out',
  willChange: 'opacity, transform',
  border: '1px solid rgba(255,255,255,0.8)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  flexDirection: 'column',
  '@media (max-width: 600px)': {
    left: '10px',
    right: '10px',
    minWidth: 'unset',
    width: 'calc(100vw - 20px)',
    top: '60px',
    height: '400px',
  }
}));

const CategoryItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 18px', // Padding mai mare pentru mai mult spațiu
  margin: '0px', // Fără margin
  borderRadius: '0px',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  background: 'transparent',
  flex: '1', // Fiecare item să ocupe spațiul disponibil uniform
  height: '45px', // Înălțime mai mare pentru fiecare item (630px / 14 categorii = 45px)
  maxWidth: '100%', // Previne overflow-ul orizontal
  overflow: 'hidden', // Ascunde orice overflow
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(248,177,149,0.15) 0%, rgba(53,80,112,0.08) 100%)',
    transform: 'translateX(2px)', // Redus de la 4px la 2px pentru a preveni overflow-ul
    boxShadow: '0 4px 12px rgba(248,177,149,0.2)',
  },
  '& .category-icon': {
    fontSize: '1.1rem', // Puțin mai mare
    marginRight: '14px',
    color: '#355070',
    transition: 'color 0.2s ease',
    flexShrink: 0, // Previne comprimarea iconului
  },
  '& .category-text': {
    flex: 1,
    fontSize: '1rem', // Puțin mai mare
    fontWeight: 500,
    color: '#2c3e50',
    whiteSpace: 'nowrap', // Previne wrap-ul textului
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .category-arrow': {
    color: '#F8B195',
    transition: 'transform 0.2s ease, color 0.2s ease',
    flexShrink: 0, // Previne comprimarea săgeții
  },
  '&:hover .category-arrow': {
    transform: 'translateX(2px)', // Redus pentru consistență
    color: '#355070',
  },
  '&:hover .category-icon': {
    color: '#F8B195',
  }
}));

const CategoryDetails = styled(Paper)(({ theme, isAnimatingOut }) => ({
  position: 'fixed',
  top: '70px',
  left: '460px', // Ajustat pentru noua poziție (40px + 420px = 460px)
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  borderRadius: '0px', // Fără colțuri rotunjite
  boxShadow: '0 15px 30px rgba(0,0,0,0.12), 0 5px 10px rgba(0,0,0,0.08)',
  zIndex: 9999,
  width: 'calc(100vw - 500px)', // Ajustat pentru noua poziție (460px + 40px margin)
  minWidth: '450px', // Mai mare pentru mai mult conținut
  maxWidth: '650px', // Mai mare pentru monitoare mari
  height: '630px', // Exact aceeași înălțime ca dropdown-ul
  overflowY: 'auto',
  padding: '0px', // Eliminăm padding-ul pentru a avea aceeași înălțime totală
  opacity: isAnimatingOut ? 0 : 1,
  transform: isAnimatingOut ? 'translate3d(-5px, 0, 0) scale(0.98)' : 'translate3d(0, 0, 0) scale(1)',
  transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
  willChange: 'opacity, transform',
  border: '1px solid rgba(248,177,149,0.2)',
  borderLeft: 'none', // Eliminăm border-ul stâng pentru a fi lipit
  '&::-webkit-scrollbar': {
    width: '5px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(248,177,149,0.5)',
    borderRadius: '2.5px',
    '&:hover': {
      background: 'rgba(248,177,149,0.7)',
    }
  },
  '@media (max-width: 1200px)': {
    width: 'calc(100vw - 480px)',
    minWidth: '400px',
  },
  '@media (max-width: 900px)': {
    width: 'calc(100vw - 460px)',
    minWidth: '350px',
  },
  '@media (max-width: 768px)': {
    display: 'none',
  }
}));

const DetailColumn = styled(Box)(({ theme }) => ({
  minWidth: '180px', // Mărit de la 120px
  marginBottom: '20px',
  height: 'fit-content',
  padding: '16px', // Adăugat padding
  borderRadius: '8px', // Adăugat border radius
  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,249,250,0.9) 100%)', // Adăugat gradient
  border: '1px solid rgba(248,177,149,0.15)', // Adăugat border subtil
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', // Adăugat umbră subtilă
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(248,177,149,0.15)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,1) 100%)',
  },
  '& .detail-title': {
    fontSize: '1rem', // Mărit de la 0.9rem
    fontWeight: 600,
    color: '#355070',
    marginBottom: '12px', // Mărit de la 10px
    display: 'flex',
    alignItems: 'center',
    lineHeight: '1.3',
    '&::before': {
      content: '""',
      width: '4px', // Mărit de la 3px
      height: '16px', // Mărit de la 14px
      backgroundColor: '#F8B195',
      borderRadius: '2px',
      marginRight: '10px', // Mărit de la 8px
      flexShrink: 0,
    }
  },
  '& .detail-items': {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px', // Mărit de la 5px
  }
}));

const DetailChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.9rem', // Mărit de la 0.8rem
  height: '32px', // Mărit de la 26px
  justifyContent: 'flex-start',
  backgroundColor: 'rgba(248,177,149,0.12)', // Puțin mai intens
  color: '#2c3e50',
  border: '1px solid rgba(248,177,149,0.4)', // Puțin mai intens
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  width: '100%', // Ocupă toată lățimea disponibilă
  maxWidth: '100%',
  '&:hover': {
    backgroundColor: 'rgba(248,177,149,0.25)', // Puțin mai intens
    borderColor: '#F8B195',
    transform: 'translateY(-1px) scale(1.02)', // Adăugat scaling
    boxShadow: '0 4px 12px rgba(248,177,149,0.4)', // Umbră mai pronunțată
  },
  '& .MuiChip-label': {
    paddingLeft: '12px', // Mărit de la 8px
    paddingRight: '12px', // Mărit de la 8px
    fontSize: 'inherit',
    width: '100%',
    textAlign: 'left',
  }
}));

// Helper pentru a obține localitățile (orase + comune) sortate alfabetic pentru un județ
function getLocalitatiForJudet(judet) {
  if (!localitatiPeJudet[judet]) return [];
  const orase = localitatiPeJudet[judet]?.orase?.map(o => o.nume) || [];
  const comune = localitatiPeJudet[judet]?.comune || [];
  return [...orase, ...comune].sort((a, b) => a.localeCompare(b, 'ro'));
}

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

// Iconuri pentru fiecare categorie
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

export default function MainStage() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryDetailsAnimating, setCategoryDetailsAnimating] = useState(false);
  const categoriesButtonRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    }, 200); // Redus de la 300ms la 200ms pentru mai multă responsivitate
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
    console.log('Categories clicked!'); // Pentru debugging
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
      {categoriesOpen && (
        <>
          <div className="categories-overlay" onClick={handleCloseCategories}></div>
          <CategoryDropdown elevation={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'stretch' }}>
              {categoriesList.map((cat) => (
                <CategoryItem
                  key={cat}
                  onClick={() => {
                    handleCloseCategories();
                    navigate(`/anunturi-categorie/${encodeURIComponent(cat)}`);
                  }}
                  onMouseEnter={() => handleCategoryHover(cat)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <Box className="category-icon">
                    {categoryIcons[cat]}
                  </Box>
                  <Typography className="category-text">
                    {cat}
                  </Typography>
                  <ArrowForwardIosIcon className="category-arrow" fontSize="small" />
                </CategoryItem>
              ))}
            </Box>
          </CategoryDropdown>
          
          {/* Detaliile categoriei apar separat, în dreapta dropdown-ului */}
          {hoveredCategory && categoriesDetails[hoveredCategory] && (
            <CategoryDetails
              isAnimatingOut={categoryDetailsAnimating}
              onMouseEnter={() => handleCategoryHover(hoveredCategory)}
              onMouseLeave={handleCategoryLeave}
            >
              <CardContent sx={{ 
                padding: '24px !important', 
                height: '100%', 
                boxSizing: 'border-box',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,249,250,0.95) 100%)', // Adăugat gradient
                borderRadius: '0 0 12px 12px', // Match cu border radius-ul Card-ului
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    marginBottom: '20px', 
                    color: '#355070', 
                    fontWeight: 600,
                    borderBottom: '2px solid #F8B195',
                    paddingBottom: '10px',
                    fontSize: '1.2rem',
                    textAlign: 'center'
                  }}
                >
                  {hoveredCategory}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { 
                      xs: '1fr', 
                      sm: '1fr 1fr', 
                      md: 'repeat(2, 1fr)',
                      lg: 'repeat(2, 1fr)' // Schimbat de la 4 la 2 coloane pentru mai mult spațiu
                    },
                    gap: '24px', // Spațiu mai mare între coloane
                    height: 'calc(100% - 60px)', // Ocupă înălțimea rămasă
                    '@media (max-width: 1200px)': {
                      gridTemplateColumns: '1fr 1fr',
                    },
                    '@media (max-width: 900px)': {
                      gridTemplateColumns: '1fr',
                    }
                  }}
                >
                  {categoriesDetails[hoveredCategory].columns.map((col, idx) => (
                    <DetailColumn key={idx}>
                      <Typography className="detail-title">
                        {col.title}
                      </Typography>
                      <Box className="detail-items">
                        {col.items.map((item, i) => (
                          <DetailChip
                            key={i}
                            label={item}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </DetailColumn>
                  ))}
                </Box>
              </CardContent>
            </CategoryDetails>
          )}
        </>
      )}
      <div className="top-bar">
        {!isMobile && (
          <button 
            className={`categories-button ${categoriesOpen ? 'menu-open' : ''}`}
            onClick={handleCategoriesClick}
            type="button">
            <FaBars />
            <span>Categorii</span>
          </button>
        )}

        {!isMobile ? (
          <div className="search-container mainstage-search-desktop">
            <input 
              type="text" 
              placeholder="Ce anume cauți?" 
              className="search-input"
            />
            <div className="location-section">
              <FaMapMarkerAlt className="location-icon" />
              <input 
                type="text" 
                placeholder="Toată țara" 
                className="location-input"
                value={selectedLocalitate || selectedJudet || "Toată țara"}
                readOnly
                onClick={handleInputClick}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <button className="search-button">
              <span>Căutare</span>
              <FaSearch className="search-icon" />
            </button>
          </div>
        ) : (
          <Box className="mainstage-search-mobile" sx={{ width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} className="search-bell-wrapper">
              <Paper elevation={3} sx={{ flex: 1, display: 'flex', alignItems: 'center', borderRadius: 2, px: 1 }}>
                <IconButton size="small" aria-label="Alege locația" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedJudet(null); setSelectedLocalitate(""); }}>
                  <FaMapMarkerAlt />
                </IconButton>
                <InputBase
                  sx={{ ml: 1, flex: 1, fontSize: 16 }}
                  placeholder="Ce anume cauți?"
                  inputProps={{ 'aria-label': 'Căutare' }}
                />
                <IconButton color="primary" aria-label="Căutare">
                  <FaSearch />
                </IconButton>
              </Paper>
              <IconButton className="notif-button-mobile" aria-label="Notificări" onClick={() => navigate('/notificari')}>
                <HiOutlineBell />
              </IconButton>
            </Stack>
          </Box>
        )}

        {/* Shared Popover for location selection (desktop + mobile) */}
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{ sx: { minWidth: isMobile ? 280 : 260, maxHeight: isMobile ? 360 : 400, mt: isMobile ? 1 : 2 } }}
        >
          {!selectedJudet ? (
            <>
              <Typography sx={{ p: 2, fontWeight: 600 }}>Alege un județ</Typography>
              <List sx={{ maxHeight: isMobile ? 280 : 320, overflow: 'auto' }}>
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
                      primary={judet === "Toată țara" ? <span style={{ fontWeight: 'bold' }}>Toată țara</span> : judet}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          ) : (
            <>
              <Typography sx={{ p: 2, fontWeight: 600 }}>Alege localitatea</Typography>
              <List sx={{ maxHeight: isMobile ? 280 : 320, overflow: 'auto' }}>
                <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                  <ListItemText primary={<span style={{ color: '#1976d2' }}>Înapoi la județe</span>} />
                </ListItemButton>
                {getLocalitatiForJudet(selectedJudet).map((localitate) => (
                  <ListItemText
                    key={localitate}
                    primary={localitate}
                    sx={{ px: 2, py: isMobile ? 1.25 : 1.5, cursor: 'pointer' }}
                    onClick={() => {
                      handleLocalitateClick(localitate);
                    }}
                  />
                ))}
              </List>
            </>
          )}
        </Popover>
      </div>

      <div className="main-content">
        <div className="main-text">
          <h1 id="main-title">Ai vreun hobby fain și crezi că e inutil? Găsește oameni care sunt dispuși să plătească pentru el!</h1>
          <p>Fă din pasiunea ta o sursă de venit!</p>
          <button className="sign-up-button" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
        <div className="main-stage-image">
          <img src={hobby} alt="hobby" />
        </div>
      </div>
    </div>
  );
}