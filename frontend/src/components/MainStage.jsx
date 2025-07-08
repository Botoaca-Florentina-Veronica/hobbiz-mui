import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
import { FaCamera, FaUtensils, FaBook, FaMoneyBillWave, FaVideo, FaBriefcase, FaGraduationCap, FaPalette, FaBroom, FaTools, FaMusic, FaSpa, FaCar, FaBuilding, FaTruck } from 'react-icons/fa';
import hobby from '../assets/images/hobby_img.jpg';
import { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import './MainStage.css';

import { localitatiPeJudet } from '../assets/comunePeJudet';
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

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
  const categoriesButtonRef = useRef(null);

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
    event.stopPropagation();
    setCategoriesOpen(prev => !prev);
  };

  const handleCloseCategories = () => {
    setCategoriesOpen(false);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'location-popover' : undefined;

  return (
    <div className="main-stage">
      {categoriesOpen && (
        <>
          <div className="categories-overlay" onClick={handleCloseCategories}></div>
          <div className="categories-dropdown">
            <ul>
              {categoriesList.map((cat) => (
                <li
                  key={cat}
                  onClick={handleCloseCategories}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  style={{ position: 'relative' }}
                >
                  {categoryIcons[cat]}
                  <span>{cat}</span>
                  <span className="arrow">&gt;</span>
                </li>
              ))}
            </ul>
            {hoveredCategory && categoriesDetails[hoveredCategory] && (
              <div className="category-details-inline category-details-inline--top">
                {categoriesDetails[hoveredCategory].columns.map((col, idx) => (
                  <div key={idx} className="category-details-col-inline">
                    <div className="category-details-title-inline">{col.title}</div>
                    <ul>
                      {col.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <div className="top-bar">
        <div 
          className="categories-button"
          onClick={handleCategoriesClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCategoriesClick(e);
            }
          }}>
          <FaBars />
          <span>Categorii</span>
        </div>

        <div className="search-container">
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
              PaperProps={{ sx: { minWidth: 260, maxHeight: 400, marginLeft: '60px', marginTop: '15px' } }}
            >
              {!selectedJudet ? (
                <>
                  <Typography sx={{ p: 2, fontWeight: 600 }}>Alege un județ</Typography>
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
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
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                    <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                      <ListItemText primary={<span style={{ color: '#1976d2' }}>Înapoi la județe</span>} />
                    </ListItemButton>
                    {getLocalitatiForJudet(selectedJudet).map((localitate) => (
                      <ListItemText
                        key={localitate}
                        primary={localitate}
                        sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
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
          <button className="search-button">
            <span>Căutare</span>
            <FaSearch className="search-icon" />
          </button>
        </div>
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