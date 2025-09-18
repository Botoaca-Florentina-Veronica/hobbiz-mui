import React, { useState, useRef, useEffect } from 'react';
import './AddAnnouncementPage.css';
import './AddAnnouncementPage.mobile.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { categories } from '../components/Categories.jsx';

// Fix: Ensure all category images are imported and used for mobile/tablet
// This is the same array as in Categories.jsx, so images are imported there and exported as 'categories'.
import '../components/Categories.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/api';

const CATEGORIES = [
  'Electronics',
  'Cars',
  'Real Estate',
  'Services',
  'Hobby',
  'Other'
];

// Helper function for category hints
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

import { localitatiPeJudet } from '../assets/comunePeJudet';
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

export default function EditAnnouncementPage() {
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
  // Preview pentru toate imaginile
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Adăugăm state-uri pentru validări specifice
  const [titleError, setTitleError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [contactPersonError, setContactPersonError] = useState("");
  const [contactEmailError, setContactEmailError] = useState("");
  const [contactPhoneError, setContactPhoneError] = useState("");
  const [imageError, setImageError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const [announcementId, setAnnouncementId] = useState(null);
  
  // detectare mobile: folosește același prag ca în pagina de adăugare (sub 500px = mobile)

  // Încarcă datele anunțului pentru editare
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
      setAnnouncementId(a._id);
      
      // Setează imaginile existente
      if (a.images && a.images.length > 0) {
        setMainImagePreview(a.images[0]);
        setImagePreviews(a.images);
      }
    }
  }, [location.state]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Verifică dacă utilizatorul încearcă să adauge prea multe imagini
    if (images.length + files.length > 10) {
      setImageError('Poți adăuga maxim 10 imagini per anunț');
      return;
    }
    
    // Acceptă doar imagini jpg/jpeg
    const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/jpg');
    if (validFiles.length !== files.length) {
      setImageError('Poți încărca doar imagini în format JPG/JPEG');
      return;
    }

    // Verifică dimensiunea fiecărui fișier (max 5MB)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setImageError('Fiecare imagine trebuie să fie mai mică de 5MB');
      return;
    }

    setImageError("");
    setImages(prev => [...prev, ...validFiles]);
    
    // Generează preview pentru fiecare imagine
    validFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
        // Prima imagine devine mainImagePreview
        if (imagePreviews.length === 0 && idx === 0) setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    setTitleChars(value.length);
    
    // Validare în timp real pentru titlu
    if (value.length < 16) {
      setTitleError("Titlul trebuie să aibă cel puțin 16 caractere");
    } else if (value.length > 70) {
      setTitleError("Titlul nu poate depăși 70 de caractere");
    } else {
      setTitleError("");
    }
  };

  // Funcție pentru validarea email-ului
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Funcție pentru validarea telefonului
  const validatePhone = (phone) => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  // Funcție pentru validarea descrierii
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setDescriptionChars(value.length);
    
    if (value.length < 40) {
      setDescriptionError("Descrierea trebuie să aibă cel puțin 40 de caractere");
    } else if (value.length > 9000) {
      setDescriptionError("Descrierea nu poate depăși 9000 de caractere");
    } else {
      setDescriptionError("");
    }
  };

  // Funcție pentru validarea persoanei de contact
  const handleContactPersonChange = (e) => {
    const value = e.target.value;
    setContactPerson(value);
    
    if (value.trim().length < 2) {
      setContactPersonError("Numele trebuie să aibă cel puțin 2 caractere");
    } else if (value.trim().length > 50) {
      setContactPersonError("Numele nu poate depăși 50 de caractere");
    } else {
      setContactPersonError("");
    }
  };

  // Funcție pentru validarea email-ului de contact
  const handleContactEmailChange = (e) => {
    const value = e.target.value;
    setContactEmail(value);
    
    if (value && !validateEmail(value)) {
      setContactEmailError("Adresa de email nu este validă");
    } else {
      setContactEmailError("");
    }
  };

  // Funcție pentru validarea telefonului de contact
  const handleContactPhoneChange = (e) => {
    const value = e.target.value;
    setContactPhone(value);
    
    if (value && !validatePhone(value)) {
      setContactPhoneError("Numărul de telefon trebuie să înceapă cu 0 și să aibă 10 cifre");
    } else {
      setContactPhoneError("");
    }
  };

  const handleCategoryClick = (event) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    handleCategoryClose();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Trebuie să fii autentificat pentru a actualiza anunțul!");
      return;
    }

    // Validare completă înainte de submit
    let hasErrors = false;

    // Validare titlu
    if (!title || title.length < 16) {
      setTitleError("Titlul trebuie să aibă cel puțin 16 caractere");
      hasErrors = true;
    } else if (title.length > 70) {
      setTitleError("Titlul nu poate depăși 70 de caractere");
      hasErrors = true;
    }

    // Validare categorie
    if (!category) {
      setCategoryError("Trebuie să selectezi o categorie");
      hasErrors = true;
    } else {
      setCategoryError("");
    }

    // Validare descriere
    if (!description || description.length < 40) {
      setDescriptionError("Descrierea trebuie să aibă cel puțin 40 de caractere");
      hasErrors = true;
    } else if (description.length > 9000) {
      setDescriptionError("Descrierea nu poate depăși 9000 de caractere");
      hasErrors = true;
    }

    // Validare locație
    if (!selectedJudet && !selectedLocalitate) {
      setLocationError("Trebuie să selectezi o locație");
      hasErrors = true;
    } else {
      setLocationError("");
    }

    // Validare persoană de contact
    if (!contactPerson || contactPerson.trim().length < 2) {
      setContactPersonError("Numele persoanei de contact este obligatoriu");
      hasErrors = true;
    }

    // Validare email (dacă este completat)
    if (contactEmail && !validateEmail(contactEmail)) {
      setContactEmailError("Adresa de email nu este validă");
      hasErrors = true;
    }

    // Validare telefon (dacă este completat)
    if (contactPhone && !validatePhone(contactPhone)) {
      setContactPhoneError("Numărul de telefon trebuie să înceapă cu 0 și să aibă 10 cifre");
      hasErrors = true;
    }

    // Dacă nu există nici email nici telefon
    if (!contactEmail && !contactPhone) {
      setContactEmailError("Trebuie să completezi cel puțin email-ul sau telefonul");
      setContactPhoneError("Trebuie să completezi cel puțin email-ul sau telefonul");
      hasErrors = true;
    }

    if (hasErrors) {
      setError("Te rugăm să corectezi erorile de mai sus înainte de a actualiza anunțul");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', selectedLocalitate || selectedJudet);
      formData.append('contactPerson', contactPerson);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);
      
      // Adaugă doar imaginile noi (File objects)
      images.filter(img => img instanceof File).forEach((img) => {
        formData.append('images', img);
      });

      await apiClient.put(`/api/users/my-announcements/${announcementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
  setSuccess('Anunț actualizat cu succes!');
  // Redirecționează către pagina de detalii a anunțului cu flag updated=1
  setTimeout(() => navigate(`/announcement/${announcementId}?updated=1`, { state: { updated: true } }), 800);
    } catch (e) {
      console.error('Error updating announcement:', e);
      if (e.response?.status === 401) {
        setError('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
      } else if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError('Eroare la actualizarea anunțului. Încearcă din nou!');
      }
    }
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
    setLocationError(""); // Resetează eroarea când se selectează o locație
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const categoryOpen = Boolean(categoryAnchorEl);
  const categoryId = categoryOpen ? 'category-popover' : undefined;
  // Keep mobile category UI below 500px for consistency with Add page
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 500;

  return (
    <div className="add-announcement-container">
      {/* Mobile header: back + title (same style as Chat/Favorites) */}
      <Box sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        gap: 2,
        mb: { xs: 1, md: 2 },
        pt: 'clamp(8px, 3vh, 24px)',
        px: 1
      }}>
        <IconButton
          onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
          sx={{
            backgroundColor: 'var(--chat-elev)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: 'var(--chat-surface)' }
          }}
          disableRipple
          disableFocusRipple
          aria-label="Înapoi"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--chat-text)' }}>Editează anunțul</Typography>
      </Box>
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
        {titleError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {titleError}
          </div>
        )}
        <label className="add-announcement-label">Categoria*</label>
        <input
          className="add-announcement-category-select"
          type="text"
          placeholder="Alege categoria"
          value={category}
          readOnly
          onClick={handleCategoryClick}
          required
        />
        {categoryError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {categoryError}
          </div>
        )}
        <Popover
          id={categoryId}
          open={categoryOpen}
          anchorEl={categoryAnchorEl}
          onClose={handleCategoryClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: isMobile ? 'center' : 'left' }}
          PaperProps={{ 
            sx: {
              // Mobile: responsive width using clamp(min, preferred, max)
              width: isMobile ? 'clamp(280px, calc(100vw - 64px), 420px)' : 'min(92vw, 1100px)',
              maxWidth: isMobile ? undefined : 1200,
              minHeight: isMobile ? '50vh' : 440,
              maxHeight: isMobile ? '78vh' : 'calc(100vh - 72px)',
              // Keep scroll on mobile, hide scrollbar on desktop
              overflowY: 'auto',
              ...(isMobile ? {} : {
                scrollbarWidth: 'none',          // Firefox
                msOverflowStyle: 'none',          // IE/Edge
                '&::-webkit-scrollbar': {         // WebKit
                  width: 0,
                  height: 0
                }
              }),
              borderRadius: isMobile ? 10 : 8,
              p: isMobile ? 0 : 'clamp(12px, 3vw, 24px)',
              zIndex: (theme) => theme.zIndex.modal + 1,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : '1px solid #e5e7eb',
              '& .categories-grid-popover': {
                padding: 0
              }
            }
          }}
        >
          <div className="categories-popover-header-mobile">
            <span className="categories-popover-title">Alege categoria</span>
            <button type="button" className="categories-popover-close" onClick={handleCategoryClose} aria-label="Închide">✕</button>
          </div>
          {isMobile ? (
            <List className="categories-list-mobile">
              {categories.map((cat, index) => (
                <ListItemButton
                  key={index}
                  className="category-row-mobile"
                  onClick={() => handleCategorySelect(cat.description)}
                >
                  {cat.image && (
                    <img src={cat.image} alt="" className="category-row-icon" />
                  )}
                  <ListItemText
                    primary={cat.title || cat.description}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <div className="categories-grid-popover">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  className="category-card-popover"
                  onClick={() => handleCategorySelect(cat.description)}
                >
                  <div className="image-container-popover">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.description}
                        className="category-image-popover"
                      />
                    ) : (
                      <div className="image-placeholder" />
                    )}
                  </div>
                  <div className="category-title-popover">{cat.title || cat.description}</div>
                  <div className="category-description-popover">{cat.description}</div>
                  <p className="category-hint-popover">{getCategoryHint(cat.description)}</p>
                </div>
              ))}
            </div>
          )}
        </Popover>
      </form>
      <div className="add-announcement-images-section">
        {/* Mesaj de eroare pentru imagini */}
        {imageError && (
          <div className="add-announcement-message add-announcement-error" style={{marginBottom: 16}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {imageError}
          </div>
        )}
        <h2 className="add-announcement-subtitle">Imagini</h2>
        <div className="add-announcement-images-helper">Poți adăuga mai multe imagini. Prima va fi imaginea principală a anunțului tău.</div>
        <div className="add-announcement-images-grid" style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
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
              <FaCamera size={38} />
            </span>
          </button>
          <input
            type="file"
            accept="image/jpeg,image/jpg"
            multiple
            ref={imageInputRef}
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
          {/* Previews pentru toate imaginile */}
          {imagePreviews.map((preview, idx) => (
            <div key={idx} style={{position: 'relative', display: 'inline-block'}}>
              <img src={preview} alt={`preview-${idx}`} style={{width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: idx === 0 ? '2px solid #388e3c' : '1px solid #ccc'}} />
              <button
                type="button"
                style={{position: 'absolute', top: 4, right: 4, background: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 2}}
                onClick={() => {
                  setImages(images.filter((_, i) => i !== idx));
                  setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
                  if (idx === 0 && imagePreviews.length > 1) setMainImagePreview(imagePreviews[1]);
                  if (imagePreviews.length === 1) setMainImagePreview(null);
                }}
                title="Șterge imaginea"
              >
                <span style={{fontWeight: 'bold', color: '#d32f2f'}}>×</span>
              </button>
              {idx === 0 && <div style={{position: 'absolute', bottom: 4, left: 4, background: '#388e3c', color: '#fff', fontSize: 12, borderRadius: 4, padding: '2px 6px'}}>Principală</div>}
            </div>
          ))}
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
          onChange={handleDescriptionChange}
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">Introdu cel puțin 40 caractere</div>
          <div className="add-announcement-charcount">{descriptionChars}/9000</div>
        </div>
        {descriptionError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {descriptionError}
          </div>
        )}
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
            PaperProps={{
              sx: {
                minWidth: 260,
                maxHeight: 400,
                marginLeft: '60px',
                marginTop: '15px',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
                color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : '1px solid #e5e7eb'
              }
            }}
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
                {/* Mutăm butonul Înapoi la județe deasupra listei */}
                <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                  <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                    <ListItemText primary={<span style={{ color: '#f51866' }}>Înapoi la județe</span>} />
                  </ListItemButton>
                  {/* Orase + Comune sortate alfabetic */}
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
        {locationError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {locationError}
          </div>
        )}
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
            onChange={handleContactPersonChange}
            required
          />
          {contactPerson && (
            <span className="add-announcement-location-check">✓</span>
          )}
        </div>
        {contactPersonError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {contactPersonError}
          </div>
        )}
        <label className="add-announcement-label">Adresa de email</label>
        <input
          className="add-announcement-contact-input"
          type="email"
          placeholder="ex: exemplu@gmail.com"
          value={contactEmail || ''}
          onChange={handleContactEmailChange}
        />
        {contactEmailError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {contactEmailError}
          </div>
        )}
        <label className="add-announcement-label">Numărul de telefon</label>
        <input
          className="add-announcement-contact-input"
          type="tel"
          placeholder="ex: 07xxxxxxxx"
          value={contactPhone || ''}
          onChange={handleContactPhoneChange}
        />
        {contactPhoneError && (
          <div className="add-announcement-message add-announcement-error" style={{marginTop: 8}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {contactPhoneError}
          </div>
        )}
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