import { FaSearch, FaBars, FaMapMarkerAlt } from "react-icons/fa";
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
  "Fotografie, Video, Audio",
  "Prajituri, Dulciuri, Mancare",
  "Gaming, Jocuri, Carti",
  "TV, Audio-Video, Foto",
  "Electrocasnice mari",
  "Electrocasnice mici, Vesela",
  "Racire, Purificare aer, Incalzire",
  "Curatenie, Intretinere casa",
  "Bauturi, Cafea, Petshop",
  "Cosmetice, Beauty, Sanatate",
  "Copii, Jucarii, Bebe, Rechizite",
  "Bricolaj, Sanitare, Mobila",
  "Anvelope, Electronica auto",
  "Trotinete, Biciclete, Sport, Voiaj"
];

export default function MainStage() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [localitatiAnchorEl, setLocalitatiAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesButtonRef = useRef(null);

  const handleInputClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedJudet(null);
    setSelectedLocalitate("");
    setLocalitatiAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedJudet(null);
    setLocalitatiAnchorEl(null);
  };

  const handleJudetClick = (event, judet) => {
    setSelectedJudet(judet);
    setLocalitatiAnchorEl(event.currentTarget);
  };

  const handleLocalitatiClose = () => {
    setLocalitatiAnchorEl(null);
    setSelectedJudet(null);
  };

  const handleLocalitateClick = (localitate) => {
    setSelectedLocalitate(localitate);
    setAnchorEl(null);
    setSelectedJudet(null);
    setLocalitatiAnchorEl(null);
  };

  const handleCategoriesClick = (event) => {
    setCategoriesOpen(!categoriesOpen);
  };

  const handleCloseCategories = () => {
    setCategoriesOpen(false);
  };

  const open = Boolean(anchorEl);
  const openLocalitati = Boolean(localitatiAnchorEl);
  const id = open ? 'judete-popover' : undefined;
  const idLocalitati = openLocalitati ? 'localitati-popover' : undefined;

  return (
    <div className="main-stage">
      {categoriesOpen && (
        <>
          <div className="categories-overlay" onClick={handleCloseCategories}></div>
          <div className="categories-dropdown">
            <ul>
              {categoriesList.map((cat) => (
                <li key={cat} onClick={handleCloseCategories}>
                  <span>{cat}</span>
                  <span className="arrow">&gt;</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <div className="top-bar">
        <button 
          className="categories-button"
          onClick={handleCategoriesClick}
          type="button">
          <FaBars />
          <span>Categorii</span>
        </button>

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
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
                          setSelectedLocalitate(localitate);
                          setanchorEl(null);
                          setSelectedJudet(null);
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
            <Popover
              id={idLocalitati}
              open={openLocalitati}
              anchorEl={localitatiAnchorEl}
              onClose={handleLocalitatiClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ sx: { minWidth: 220, maxHeight: 400 } }}
            >
              <Typography sx={{ p: 2, fontWeight: 600 }}>Alege localitatea</Typography>
              <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                {(selectedJudet && judete[selectedJudet].length > 0) ? (
                  judete[selectedJudet].map((localitate) => (
                    <ListItemText
                      key={localitate}
                      primary={localitate}
                      sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
                      onClick={() => handleLocalitateClick(localitate)}
                    />
                  ))
                ) : (
                  <Typography sx={{ px: 2, py: 1.5, color: '#888' }}>
                    (Nu există localități definite)
                  </Typography>
                )}
              </List>
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