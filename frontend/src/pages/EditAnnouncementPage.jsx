import React, { useState, useRef, useEffect } from 'react';
import { localitatiPeJudet } from '../assets/comunePeJudet';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { categories } from '../components/Categories.jsx';
import '../components/Categories.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/api';
import './AddAnnouncementPage.css';
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];
const getCategoryHint = (category) => {
  const hints = {
    "Fotografie": "Servicii foto, cursuri, echipamente",
    "Prajituri": "Cofetărie, patiserie, cursuri de coacere",
    "Muzica": "Lecții, instrumente, evenimente muzicale",
    "Reparații": "Service-uri, mentenanță, instalări",
    "Dans": "Cursuri, evenimente, coregrafii",
    "Curățenie": "Servicii de menaj, curățenie profesională",
    "Gradinarit": "Amenajări, întreținere, plante",
    "Sport": "Echipamente, antrenamente, evenimente",
    "Arta": "Pictură, sculptură, arte vizuale",
    "Tehnologie": "IT, electronice, gadget-uri",
    "Auto": "Mașini, piese, service",
    "Meditații": "Lecții particulare, pregătire"
  };
  return hints[category] || "Servicii și produse din această categorie";
};

export default function EditAnnouncementPage() {
  // Copiat identic cu AddAnnouncementPage.jsx, dar fără logica de publicare nouă
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [titleChars, setTitleChars] = useState(0);
  const [description, setDescription] = useState("");
  const [descriptionChars, setDescriptionChars] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const imageInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [announcementId, setAnnouncementId] = useState(null);

  useEffect(() => {
    let a = null;
    if (location.state && location.state.announcement) {
      a = location.state.announcement;
    } else {
      const savedEdit = localStorage.getItem('editAnnouncement');
      if (savedEdit) {
        a = JSON.parse(savedEdit);
      }
    }
    if (a) {
      setTitle(a.title || '');
      setCategory(a.category || '');
      setTitleChars(a.title ? a.title.length : 0);
      setDescription(a.description || '');
      setDescriptionChars(a.description ? a.description.length : 0);
      setSelectedJudet(null);
      setSelectedLocalitate(a.location || '');
      setContactPerson(a.contactPerson || '');
      setContactEmail(a.contactEmail || '');
      setContactPhone(a.contactPhone || '');
      setMainImagePreview(a.images && a.images[0] ? a.images[0] : null);
      setAnnouncementId(a._id);
    }
  }, [location.state]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const file = files[0];
      if (!file.type || (file.type !== 'image/jpeg' && file.type !== 'image/jpg')) {
        setError('Poți încărca doar imagini în format JPG');
        setImages([]);
        setMainImagePreview(null);
        return;
      }
      setImages(prev => [...prev, ...files]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setTitleChars(e.target.value.length);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Trebuie să fii autentificat pentru a actualiza anunțul!");
      return;
    }
    if (!title || title.length < 16 || !category || !description || description.length < 40 || !(selectedJudet || selectedLocalitate) || !contactPerson) {
      setError("Te rugăm să completezi toate câmpurile obligatorii și să respecți limitele de caractere!");
      return;
    }
    if (contactPhone && !/^\d{10}$/.test(contactPhone)) {
      setError("Numărul de telefon trebuie să conțină exact 10 cifre!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', selectedLocalitate);
      formData.append('contactPerson', contactPerson);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);
      if (images[0]) {
        formData.append('mainImage', images[0]);
      }
      await apiClient.put(`/api/users/my-announcements/${announcementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Anunț actualizat cu succes!');
      setTimeout(() => navigate('/anunturile-mele'), 1200);
    } catch (e) {
      setError('Eroare la actualizarea anunțului. Încearcă din nou!');
    }
  };

  // ...UI identic cu AddAnnouncementPage.jsx, dar butonul principal este "Actualizează anunțul"...
  return (
    <div className="add-announcement-container">
      <h1 className="add-announcement-title">Editează anunțul</h1>
      <form className="add-announcement-form" onSubmit={e => e.preventDefault()} style={{marginBottom: 0}}>
        {success && (
          <div className="add-announcement-message add-announcement-success">
            <div className="add-announcement-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#388e3c"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            {success}
          </div>
        )}
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
        <input
          className="add-announcement-category-select"
          type="text"
          placeholder="Alege categoria"
          value={category}
          readOnly
          onClick={e => setCategoryAnchorEl(e.currentTarget)}
          required
        />
        <Popover
          id={categoryAnchorEl ? 'category-popover' : undefined}
          open={Boolean(categoryAnchorEl)}
          anchorEl={categoryAnchorEl}
          onClose={() => setCategoryAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          PaperProps={{ 
            sx: { 
              minWidth: 800,
              maxWidth: 1000,
              minHeight: 600,
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              '& .categories-grid-popover': {
                padding: '2rem'
              }
            } 
          }}
        >
          <div className="categories-grid-popover">
            {categories.map((cat, index) => (
              <div
                key={index}
                className="category-card-popover"
                onClick={() => {
                  setCategory(cat.description);
                  setCategoryAnchorEl(null);
                }}
              >
                <div className="image-container-popover">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.description}
                      className="category-image-popover"
                    />
                  ) : (
                    <div className="image-placeholder-popover"></div>
                  )}
                </div>
                <p className="category-description-popover">{cat.description}</p>
                <p className="category-hint-popover">{getCategoryHint(cat.description)}</p>
              </div>
            ))}
          </div>
        </Popover>
      </form>
      <div className="add-announcement-images-section">
        {error && error.includes('JPG') && (
          <div className="add-announcement-message add-announcement-error" style={{marginBottom: 16}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {error}
          </div>
        )}
        <h2 className="add-announcement-subtitle">Imagini</h2>
        <div className="add-announcement-images-helper">Aceasta va fi imaginea principală a anunțului tău. Este primul lucru care îi sare în ochi unui potențial client!</div>
        <div className="add-announcement-images-grid">
          <button
            type="button"
            className="add-announcement-image-upload add-announcement-image-upload-main"
            onClick={() => imageInputRef.current.click()}
          >
            {mainImagePreview ? (
              <img src={mainImagePreview} alt="preview" style={{width: 120, height: 120, objectFit: 'cover', borderRadius: 8}} />
            ) : (
              <>
                <span className="add-announcement-image-upload-text">Adaugă imagini</span>
                <span className="add-announcement-image-upload-underline"></span>
              </>
            )}
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
                  {(() => {
                    const orase = localitatiPeJudet[selectedJudet]?.orase?.map(o => o.nume) || [];
                    const comune = localitatiPeJudet[selectedJudet]?.comune || [];
                    return [...orase, ...comune].sort((a, b) => a.localeCompare(b, 'ro')).map((localitate) => (
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
                    ));
                  })()}
                </List>
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
          <button type="button" className="add-announcement-preview">Previzualizați anunțul</button>
          <button type="button" className="add-announcement-submit" onClick={handleSubmit}>Actualizează anunțul</button>
        </div>
      </div>
    </div>
  );
}