import React, { useState, useRef } from 'react';
import './AddAnnouncementPage.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';

const CATEGORIES = [
  'Electronics',
  'Cars',
  'Real Estate',
  'Services',
  'Hobby',
  'Other'
];

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
  "Teleorman": ["Alexandria", "Roșiorii de Vede", "Turnu Măgărele", "Zimnicea", "Videle"],
  "Timis": ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Recaș"],
  "Tulcea": ["Tulcea", "Măcin", "Babadag", "Isaccea", "Sulina"],
  "Vaslui": ["Vaslui", "Bârlad", "Huși", "Negrești", "Murgeni"],
  "Valcea": ["Râmnicu Vâlcea", "Drăgășani", "Băbeni", "Horezu", "Brezoi"],
  "Vrancea": ["Focșani", "Adjud", "Mărășești", "Odobești", "Panciu"]
};

export default function AddAnnouncementPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [titleChars, setTitleChars] = useState(0);
  const [description, setDescription] = useState("");
  const [descriptionChars, setDescriptionChars] = useState(0);
  // Location dropdown state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  // Contact information state
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  // Images state
  const imageInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setTitleChars(e.target.value.length);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send data to backend
    alert('Announcement submitted!');
  };

  const handleLocationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLocationSelect = (judet, localitate) => {
    setSelectedJudet(judet);
    setSelectedLocalitate(localitate);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div className="add-announcement-container">
      <h1 className="add-announcement-title">Publică un anunț </h1>
      <form className="add-announcement-form" onSubmit={handleSubmit}>
        <h2 className="add-announcement-subtitle">Descrie-ți anunțul cu lux de detalii!</h2>
        <label className="add-announcement-label">Adaugă un titlu clar*</label>
        <textarea
          className="add-announcement-title-input"
          placeholder="ex: Predau lecții de fizică, online"
          value={title}
          onChange={handleTitleChange}
          minLength={16}
          maxLength={70}
          required
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">Introdu cel puțin 16 caractere</div>
          <div className="add-announcement-charcount">{titleChars}/70</div>
        </div>
        <label className="add-announcement-label">Categoria*</label>
        <select
          className="add-announcement-category-select"
          value={category}
          onChange={handleCategoryChange}
          required
        >
          <option value="">Alege categoria</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </form>
      <div className="add-announcement-images-section">
        <h2 className="add-announcement-subtitle">Imagini</h2>
        <div className="add-announcement-images-helper">Aceasta va fi imaginea principală a anunțului tău. Glisează și fixează imaginile în ordinea dorită.</div>
        <div className="add-announcement-images-grid">
          <button
            type="button"
            className="add-announcement-image-upload add-announcement-image-upload-main"
            onClick={() => imageInputRef.current.click()}
          >
            <span className="add-announcement-image-upload-text">Adaugă imagini</span>
            <span className="add-announcement-image-upload-underline"></span>
          </button>
          <button
            type="button"
            className="add-announcement-image-upload"
            onClick={() => imageInputRef.current.click()}
          >
            <span className="add-announcement-image-upload-icon">
              <FaCamera size={38} color="#46626a" />
            </span>
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={imageInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>
      </div>
      <div className="add-announcement-description-section">
        <label className="add-announcement-label">Descriere*</label>
        <textarea
          className="add-announcement-description-input"
          placeholder="Încearcă să scrii ce ai vrea tu să afli dacă te-ai uita la acest anunț"
          minLength={40}
          maxLength={9000}
          required
          value={description}
          onChange={e => {
            setDescription(e.target.value);
            setDescriptionChars(e.target.value.length);
          }}
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">Introdu cel puțin 40 caractere</div>
          <div className="add-announcement-charcount">{descriptionChars}/9000</div>
        </div>
      </div>
      <div className="add-announcement-location-section">
        <label className="add-announcement-label">Localitate*</label>
        <div className="add-announcement-location-input-wrapper">
          <FaMapMarkerAlt className="location-icon" />
          <input
            className={
              "add-announcement-location-input" +
              (!(selectedJudet || selectedLocalitate) ? " add-announcement-location-placeholder" : "")
            }
            type="text"
            placeholder="Toată țara"
            value={selectedLocalitate || selectedJudet || "Toată țara"}
            readOnly
            onClick={e => setAnchorEl(e.currentTarget)}
            style={!(selectedJudet || selectedLocalitate)
              ? { fontSize: '1.1rem', color: '#888', fontWeight: 400 }
              : { fontSize: '2.2rem', color: '#183642', fontWeight: 500 }}
            required
          />
          {(selectedJudet || selectedLocalitate) && (
            <span className="add-announcement-location-check">✓</span>
          )}
          <Popover
            id={anchorEl ? 'location-popover' : undefined}
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
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
                      onClick={() => setSelectedJudet(judet)}
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
                        setAnchorEl(null);
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
        </div>
      </div>
      <div className="add-announcement-contact-section">
        <h2 className="add-announcement-subtitle">Informații de contact</h2>
        <label className="add-announcement-label">Persoana de contact*</label>
        <div className="add-announcement-contact-input-wrapper">
          <input
            className="add-announcement-contact-input"
            type="text"
            placeholder="Nume și prenume"
            value={contactPerson || ''}
            onChange={e => setContactPerson(e.target.value)}
            required
          />
          {contactPerson && (
            <span className="add-announcement-location-check">✓</span>
          )}
        </div>
        <label className="add-announcement-label">Adresa de email</label>
        <input
          className="add-announcement-contact-input"
          type="email"
          placeholder="ex: exemplu@gmail.com"
          value={contactEmail || ''}
          onChange={e => setContactEmail(e.target.value)}
        />
        <label className="add-announcement-label">Numărul de telefon</label>
        <input
          className="add-announcement-contact-input"
          type="tel"
          placeholder="ex: 07xxxxxxxx"
          value={contactPhone || ''}
          onChange={e => setContactPhone(e.target.value)}
        />
      </div>
      <div className="add-announcement-actions-section">
        <div className="add-announcement-actions-left"></div>
        <div className="add-announcement-actions-right">
          <button className="add-announcement-preview">Previzualizați anunțul</button>
          <button className="add-announcement-submit" type="submit">Publică un anunț</button>
        </div>
      </div>
    </div>
  );
}
