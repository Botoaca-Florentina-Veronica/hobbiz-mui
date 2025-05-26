import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
import { FaCamera, FaUtensils, FaBook, FaMoneyBillWave, FaVideo, FaBriefcase, FaGraduationCap, FaPalette, FaBroom, FaTools, FaMusic, FaSpa, FaCar, FaBuilding, FaTruck } from 'react-icons/fa';
import hobby from '../assets/images/hobby_img.jpg';
import { useState, useRef } from "react";
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import './MainStage.css';

// Lista statică de județe și localități (toate județele, ordonate alfabetic, cu localități exemplu)
const judete = {
  "Alba": ["Alba Iulia", "Aiud", "Blaj", "Cugir", "Ocna Mureș"],
  "Arad": ["Arad", "Ineu", "Lipova", "Curtici", "Pecica"],
  "Arges": ["Pitești", "Curtea de Argeș", "Câmpulung", "Mioveni", "Topoloveni"],
  "Bacau": ["Bacău", "Onești", "Moinești", "Comănești", "Buhuși"],
  "Bihor": ["Oradea", "Salonta", "Marghita", "Beiuș", "Aleșd"],
  "Bistrita-Nasaud": ["Bistrița", "Năsăud", "Sângeorz-Băi", "Beclean", "Teaca"],
  "Botosani": ["Botoșani", "Dorohoi", "Darabani", "Săveni", "Flămânzi"],
  "Brasov": ["Brașov", "Făgăraș", "Săcele", "Codlea", "Râșnov"],
  "Braila": ["Brăila", "Ianca", "Însurăței", "Făurei", "Viziru"],
  "Bucuresti": ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"],
  "Buzau": ["Buzău", "Râmnicu Sărat", "Nehoiu", "Pătârlagele", "Pogoanele"],
  "Caras-Severin": ["Reșița", "Caransebeș", "Bocșa", "Oravița", "Oțelu Roșu"],
  "Calarasi": ["Călărași", "Oltenița", "Lehliu-Gară", "Budești", "Fundulea"],
  "Cluj": ["Cluj-Napoca", "Turda", "Dej", "Câmpia Turzii", "Gherla"],
  "Constanta": ["Constanța", "Mangalia", "Medgidia", "Năvodari", "Cernavodă"],
  "Covasna": ["Sfântu Gheorghe", "Târgu Secuiesc", "Covasna", "Baraolt", "Întorsura Buzăului"],
  "Dambovita": ["Târgoviște", "Moreni", "Pucioasa", "Găești", "Titu"],
  "Dolj": ["Craiova", "Băilești", "Calafat", "Filiași", "Segarcea"],
  "Galati": ["Galați", "Tecuci", "Târgu Bujor", "Berești", "Pechea"],
  "Giurgiu": ["Giurgiu", "Bolintin-Vale", "Mihăilești", "Ogrezeni", "Roata de Jos"],
  "Gorj": ["Târgu Jiu", "Motru", "Rovinari", "Bumbești-Jiu", "Târgu Cărbunești"],
  "Harghita": ["Miercurea Ciuc", "Odorheiu Secuiesc", "Gheorgheni", "Toplița", "Cristuru Secuiesc"],
  "Hunedoara": ["Deva", "Hunedoara", "Petroșani", "Lupeni", "Orăștie"],
  "Ialomita": ["Slobozia", "Fetești", "Urziceni", "Țăndărei", "Amara"],
  "Iasi": ["Iași", "Pașcani", "Târgu Frumos", "Hârlău", "Podu Iloaiei"],
  "Ilfov": ["Buftea", "Voluntari", "Pantelimon", "Popești-Leordeni", "Chitila"],
  "Maramures": ["Baia Mare", "Sighetu Marmației", "Borșa", "Vișeu de Sus", "Târgu Lăpuș"],
  "Mehedinti": ["Drobeta-Turnu Severin", "Strehaia", "Vânju Mare", "Baia de Aramă", "Orșova"],
  "Mures": ["Târgu Mureș", "Reghin", "Sighișoara", "Luduș", "Târnăveni"],
  "Neamt": ["Piatra Neamț", "Roman", "Târgu Neamț", "Bicaz", "Roznov"],
  "Olt": ["Slatina", "Caracal", "Balș", "Corabia", "Drăgănești-Olt"],
  "Prahova": ["Ploiești", "Câmpina", "Băicoi", "Mizil", "Sinaia"],
  "Satu Mare": ["Satu Mare", "Carei", "Negrești-Oaș", "Tășnad", "Livada"],
  "Salaj": ["Zalău", "Șimleu Silvaniei", "Jibou", "Cehu Silvaniei", "Sărmășag"],
  "Sibiu": ["Sibiu", "Mediaș", "Agnita", "Cisnădie", "Dumbrăveni"],
  "Suceava": ["Suceava", "Fălticeni", "Rădăuți", "Câmpulung Moldovenesc", "Vatra Dornei"],
  "Teleorman": ["Alexandria", "Roșiorii de Vede", "Turnu Măgurele", "Zimnicea", "Videle"],
  "Timis": ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Recaș"],
  "Tulcea": ["Tulcea", "Măcin", "Babadag", "Isaccea", "Sulina"],
  "Vaslui": ["Vaslui", "Bârlad", "Huși", "Negrești", "Murgeni"],
  "Valcea": ["Râmnicu Vâlcea", "Drăgășani", "Băbeni", "Horezu", "Brezoi"],
  "Vrancea": ["Focșani", "Adjud", "Mărășești", "Odobești", "Panciu"]
};

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
                    <ListItemButton
                      onClick={() => {
                        setSelectedJudet(null);
                        setSelectedLocalitate("");
                        setAnchorEl(null);
                      }}
                      divider
                    >
                      <ListItemText
                        primary={<span style={{ fontWeight: 'bold' }}>Toată țara</span>}
                      />
                    </ListItemButton>
                    {Object.keys(judete).map((judet) => (
                      <ListItemButton
                        key={judet}
                        onClick={(e) => handleJudetClick(e, judet)}
                        divider
                      >
                        <ListItemText primary={judet} />
                      </ListItemButton>
                    ))}
                  </List>
                </>
              ) : (
                <>
                  <Typography sx={{ p: 2, fontWeight: 600 }}>Alege localitatea</Typography>
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                    {judete[selectedJudet].map((localitate) => (
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
                  <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                    <ListItemText primary={<span style={{ color: '#1976d2' }}>Înapoi la județe</span>} />
                  </ListItemButton>
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
          <button className="sign-up-button">Sign up</button>
        </div>
        <div className="main-stage-image">
          <img src={hobby} alt="hobby" />
        </div>
      </div>
    </div>
  );
}