import React, { useState, useRef, useEffect } from 'react';
import './AddAnnouncementPage.css';
import './AddAnnouncementPage.mobile.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Box, IconButton, TextField, InputAdornment, Divider, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
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

// category hints are provided via i18n keys (addAnnouncement.categoryHints)

import { localitatiPeJudet } from '../assets/comunePeJudet';
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

import { useTranslation } from 'react-i18next';

export default function AddAnnouncementPage() {
  const { t } = useTranslation();
  // Șterge draftul de anunț la deconectare și resetează complet starea formularului
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem('addAnnouncementDraft');
      localStorage.removeItem('addAnnouncementMainImagePreview');
      setTitle('');
      setCategory('');
      setTitleChars(0);
      setDescription('');
      setDescriptionChars(0);
      setSelectedJudet(null);
      setSelectedLocalitate('');
      setContactPerson('');
      setContactEmail('');
      setContactPhone('');
      setMainImagePreview(null);
      setImages([]);
      setIsEdit(false);
      setAnnouncementId(null);
    };
    window.addEventListener('logout', handleLogout);
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [titleChars, setTitleChars] = useState(0);
  const [description, setDescription] = useState("");
  const [descriptionChars, setDescriptionChars] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
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
  const [isEdit, setIsEdit] = useState(false);
  const [announcementId, setAnnouncementId] = useState(null);

  // La inițializare, recuperează datele din localStorage DOAR dacă există și utilizatorul este autentificat
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('addAnnouncementDraft');
    if (token && saved) {
      const data = JSON.parse(saved);
      // Ignoră orice câmp _id din draft
      setTitle(data.title || '');
      setCategory(data.category || '');
      setTitleChars(data.title ? data.title.length : 0);
      setDescription(data.description || '');
      setDescriptionChars(data.description ? data.description.length : 0);
      setSelectedJudet(data.selectedJudet || null);
      setSelectedLocalitate(data.selectedLocalitate || '');
      setContactPerson(data.contactPerson || '');
      setContactEmail(data.contactEmail || '');
      setContactPhone(data.contactPhone || '');
      setIsEdit(false);
      setAnnouncementId(null);
      // Restaurează preview-ul imaginii principale dacă există
      const mainImageDataUrl = localStorage.getItem('addAnnouncementMainImagePreview');
      if (mainImageDataUrl) {
        setMainImagePreview(mainImageDataUrl);
      }
    } else {
      // Dacă nu există token sau draft, resetează totul
      setTitle('');
      setCategory('');
      setTitleChars(0);
      setDescription('');
      setDescriptionChars(0);
      setSelectedJudet(null);
      setSelectedLocalitate('');
      setContactPerson('');
      setContactEmail('');
      setContactPhone('');
      setMainImagePreview(null);
      setImages([]);
      setIsEdit(false);
      setAnnouncementId(null);
    }
  }, []);

  // Salvează datele la fiecare modificare
  useEffect(() => {
    // Nu salva niciodată _id în draft
    localStorage.setItem('addAnnouncementDraft', JSON.stringify({
      title,
      category,
      description,
      selectedJudet,
      selectedLocalitate,
      contactPerson,
      contactEmail,
      contactPhone
    }));
  }, [title, category, description, selectedJudet, selectedLocalitate, contactPerson, contactEmail, contactPhone]);

  // Salvează preview-ul imaginii principale ca DataURL în localStorage
  useEffect(() => {
    if (mainImagePreview) {
      localStorage.setItem('addAnnouncementMainImagePreview', mainImagePreview);
    }
  }, [mainImagePreview]);

  useEffect(() => {
    // Daca esti in mod editare (ai venit cu location.state.announcement SAU ai editAnnouncement in localStorage), seteaza edit
    let a = null;
    if (location.state && location.state.announcement) {
      a = location.state.announcement;
    } else {
      const savedEdit = localStorage.getItem('editAnnouncement');
      if (savedEdit) {
        a = JSON.parse(savedEdit);
      }
    }
    // Daca nu exista a sau nu are _id, sau nu are title/category/description, sau nu esti pe o ruta de editare, nu intra in edit
    if (
      a &&
      a._id &&
      (a.title || a.category || a.description) &&
      location.pathname.includes('edit')
    ) {
      setTitle(a.title || '');
      setCategory(a.category || '');
      setTitleChars(a.title ? a.title.length : 0);
      setDescription(a.description || '');
      setDescriptionChars(a.description ? a.description.length : 0);
      setSelectedJudet(null); // Poți adăuga logica pentru județ/localitate dacă ai nevoie
      setSelectedLocalitate(a.location || '');
      setContactPerson(a.contactPerson || '');
      setContactEmail(a.contactEmail || '');
      setContactPhone(a.contactPhone || '');
      setMainImagePreview(a.images && a.images[0] ? a.images[0] : null);
      setIsEdit(true);
      setAnnouncementId(a._id);
    } else {
      // Daca nu esti in mod editare, sterge orice draft de edit si reseteaza totul
      localStorage.removeItem('editAnnouncement');
      setIsEdit(false);
      setAnnouncementId(null);
      setTitle('');
      setCategory('');
      setTitleChars(0);
      setDescription('');
      setDescriptionChars(0);
      setSelectedJudet(null);
      setSelectedLocalitate('');
      setContactPerson('');
      setContactEmail('');
      setContactPhone('');
      setMainImagePreview(null);
    }
  }, [location.state]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Verifică dacă utilizatorul încearcă să adauge prea multe imagini
    if (images.length + files.length > 10) {
      setImageError(t('addAnnouncement.errors.maxImages'));
      return;
    }
    
    // Acceptă doar imagini jpg/jpeg
    const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/jpg');
    if (validFiles.length !== files.length) {
      setImageError(t('addAnnouncement.errors.imageFormat'));
      return;
    }

    // Verifică dimensiunea fiecărui fișier (max 5MB)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setImageError(t('addAnnouncement.errors.imageSize'));
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
      setTitleError(t('addAnnouncement.errors.titleMin'));
    } else if (value.length > 70) {
      setTitleError(t('addAnnouncement.errors.titleMax'));
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
      setDescriptionError(t('addAnnouncement.errors.descriptionMin'));
    } else if (value.length > 9000) {
      setDescriptionError(t('addAnnouncement.errors.descriptionMax'));
    } else {
      setDescriptionError("");
    }
  };

  // Funcție pentru validarea persoanei de contact
  const handleContactPersonChange = (e) => {
    const value = e.target.value;
    setContactPerson(value);
    
    if (value.trim().length < 2) {
      setContactPersonError(t('addAnnouncement.errors.contactPersonRequired'));
    } else if (value.trim().length > 50) {
      setContactPersonError(t('addAnnouncement.errors.contactPersonRequired'));
    } else {
      setContactPersonError("");
    }
  };

  // Funcție pentru validarea email-ului de contact
  const handleContactEmailChange = (e) => {
    const value = e.target.value;
    setContactEmail(value);
    
    if (value && !validateEmail(value)) {
      setContactEmailError(t('addAnnouncement.errors.invalidEmail'));
    } else {
      setContactEmailError("");
    }
  };

  // Funcție pentru validarea telefonului de contact
  const handleContactPhoneChange = (e) => {
    const value = e.target.value;
    setContactPhone(value);
    
    if (value && !validatePhone(value)) {
      setContactPhoneError(t('addAnnouncement.errors.invalidPhone'));
    } else {
      setContactPhoneError("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError(t('addAnnouncement.errors.authRequired'));
      return;
    }

    // Validare completă înainte de submit
    let hasErrors = false;

    // Validare titlu
    if (!title || title.length < 16) {
      setTitleError(t('addAnnouncement.errors.titleMin'));
      hasErrors = true;
    } else if (title.length > 70) {
      setTitleError(t('addAnnouncement.errors.titleMax'));
      hasErrors = true;
    }

    // Validare categorie
    if (!category) {
      setCategoryError(t('addAnnouncement.errors.categoryRequired'));
      hasErrors = true;
    } else {
      setCategoryError("");
    }

    // Validare descriere
    if (!description || description.length < 40) {
      setDescriptionError(t('addAnnouncement.errors.descriptionMin'));
      hasErrors = true;
    } else if (description.length > 9000) {
      setDescriptionError(t('addAnnouncement.errors.descriptionMax'));
      hasErrors = true;
    }

    // Validare locație
    if (!selectedJudet && !selectedLocalitate) {
      setLocationError(t('addAnnouncement.errors.locationRequired'));
      hasErrors = true;
    } else {
      setLocationError("");
    }

    // Validare persoană de contact
    if (!contactPerson || contactPerson.trim().length < 2) {
      setContactPersonError(t('addAnnouncement.errors.contactPersonRequired'));
      hasErrors = true;
    }

    // Validare email (dacă este completat)
    if (contactEmail && !validateEmail(contactEmail)) {
      setContactEmailError(t('addAnnouncement.errors.invalidEmail'));
      hasErrors = true;
    }

    // Validare telefon (dacă este completat)
    if (contactPhone && !validatePhone(contactPhone)) {
      setContactPhoneError(t('addAnnouncement.errors.invalidPhone'));
      hasErrors = true;
    }

    // Dacă nu există nici email nici telefon
    if (!contactEmail && !contactPhone) {
      setContactEmailError(t('addAnnouncement.errors.emailOrPhoneRequired'));
      setContactPhoneError(t('addAnnouncement.errors.emailOrPhoneRequired'));
      hasErrors = true;
    }

    if (hasErrors) {
      setError(t('addAnnouncement.errors.fixErrors'));
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
      // Adaugă toate imaginile
      images.forEach((img) => {
        formData.append('images', img);
      });
      if (isEdit && announcementId) {
        await apiClient.put(`/api/users/my-announcements/${announcementId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        setSuccess(t('addAnnouncement.success.updated'));
        navigate('/adauga-anunt');
      } else {
        const response = await apiClient.post('/api/users/my-announcements', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        localStorage.removeItem('addAnnouncementDraft');
        localStorage.removeItem('addAnnouncementMainImagePreview');
        setSuccess(t('addAnnouncement.success.created'));
        setTimeout(() => navigate('/anunturile-mele'), 1200);
      }
    } catch (e) {
      console.error('Error submitting announcement:', e);
      if (e.response?.status === 401) {
        setError(t('addAnnouncement.errors.sessionExpired'));
      } else if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError(t('addAnnouncement.errors.submitError'));
      }
    }
  };

  const handleLocationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setLocationSearch("");
  };

  const handleLocationSelect = (judet, localitate) => {
    setSelectedJudet(judet);
    setSelectedLocalitate(localitate);
    setLocationError(""); // Resetează eroarea când se selectează o locație
    handleClose();
  };

  const handleCategoryClick = (event) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setCategoryError(""); // Resetează eroarea când se selectează o categorie
    handleCategoryClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  // Helpers for filtering with search
  const filteredJudete = React.useMemo(() => {
    if (!locationSearch.trim()) return judete;
    const q = locationSearch.toLowerCase();
    return judete.filter(j => j.toLowerCase().includes(q));
  }, [locationSearch]);

  const getLocalitatiForJudet = (jud) => {
    const orase = localitatiPeJudet[jud]?.orase?.map(o => o.nume) || [];
    const comune = localitatiPeJudet[jud]?.comune || [];
    return [...orase, ...comune].sort((a, b) => a.localeCompare(b, 'ro'));
  };

  const filteredLocalitati = React.useMemo(() => {
    if (!selectedJudet) return [];
    const all = getLocalitatiForJudet(selectedJudet);
    if (!locationSearch.trim()) return all;
    const q = locationSearch.toLowerCase();
    return all.filter(l => l.toLowerCase().includes(q));
  }, [selectedJudet, locationSearch]);

  const categoryOpen = Boolean(categoryAnchorEl);
  const categoryId = categoryOpen ? 'category-popover' : undefined;
  // Mobile category menu for widths under 500px; desktop popover from 500px+
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
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--chat-text)' }}>{t('addAnnouncement.mobileHeaderTitle')}</Typography>
      </Box>
      <h1 className="add-announcement-title">{t('addAnnouncement.pageTitle')}</h1>
      <form className="add-announcement-form" onSubmit={e => e.preventDefault()}>
        {success && (
          <div className="add-announcement-message add-announcement-success">
            <div className="add-announcement-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#388e3c"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
            {success}
          </div>
        )}
        <h2 className="add-announcement-subtitle">{t('addAnnouncement.subtitle')}</h2>
        <label className="add-announcement-label">{t('addAnnouncement.titleLabel')}</label>
        <textarea
          className="add-announcement-title-input"
          placeholder={t('addAnnouncement.titlePlaceholder')}
          value={title}
          onChange={handleTitleChange}
          minLength={16}
          maxLength={70}
          required
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">{t('addAnnouncement.titleHelper')}</div>
          <div className="add-announcement-charcount">{titleChars}/70</div>
        </div>
        {titleError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {titleError}
          </div>
        )}
        <label className="add-announcement-label">{t('addAnnouncement.categoryLabel')}</label>
        <input
          className="add-announcement-category-select"
          type="text"
          placeholder={t('addAnnouncement.categoryPlaceholder')}
          value={category}
          readOnly
          onClick={handleCategoryClick}
          required
        />
        {categoryError && (
          <div className="add-announcement-message add-announcement-error">
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
              // For desktop/tablet widths (>=500px), keep a flexible max
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
              // Add interior padding on desktop for visible margins
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
            <span className="categories-popover-title">{t('addAnnouncement.popover.title')}</span>
            <button type="button" className="categories-popover-close" onClick={handleCategoryClose} aria-label={t('addAnnouncement.popover.closeAria')}>✕</button>
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
                    primary={t(`categories.${cat.key}`)}
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
                        alt={t(`categories.${cat.key}`)}
                        className="category-image-popover"
                      />
                    ) : (
                      <div className="image-placeholder" />
                    )}
                  </div>
                  <div className="category-title-popover">{t(`categories.${cat.key}`)}</div>
                  <div className="category-description-popover">{t(`categories.${cat.key}`)}</div>
                  <p className="category-hint-popover">{t(`addAnnouncement.categoryHints.${cat.key}`)}</p>
                </div>
              ))}
            </div>
          )}
        </Popover>
      </form>
      <div className="add-announcement-images-section">
        {/* Mesaj de eroare pentru imagini */}
        {imageError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {imageError}
          </div>
        )}
        <h2 className="add-announcement-subtitle">{t('addAnnouncement.imagesSubtitle')}</h2>
        <div className="add-announcement-images-helper">{t('addAnnouncement.imagesHelper')}</div>
        <div className="add-announcement-images-grid">
          <button
            type="button"
            className="add-announcement-image-upload add-announcement-image-upload-main"
            onClick={() => imageInputRef.current.click()}
          >
            <span className="add-announcement-image-upload-text">{t('addAnnouncement.addImages')}</span>
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
            className="visually-hidden"
            onChange={handleImageChange}
          />
          {/* Previews pentru toate imaginile */}
          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="image-preview">
              <img
                src={preview}
                alt={`preview-${idx}`}
                className={`image-preview-img ${idx === 0 ? 'main' : ''}`}
              />
              <button
                type="button"
                className="image-preview-remove"
                onClick={() => {
                  setImages(prev => prev.filter((_, i) => i !== idx));
                  setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                  if (idx === 0 && imagePreviews.length > 1) setMainImagePreview(imagePreviews[1]);
                  if (imagePreviews.length === 1) setMainImagePreview(null);
                }}
                title={t('addAnnouncement.imageRemoveTitle')}
              >
                <span className="remove-icon" aria-hidden>×</span>
              </button>
              {idx === 0 && <div className="image-preview-badge">{t('addAnnouncement.imagePrimaryBadge')}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="add-announcement-description-section">
        <label className="add-announcement-label">{t('addAnnouncement.descriptionLabel')}</label>
        <textarea
          className="add-announcement-description-input"
          placeholder={t('addAnnouncement.descriptionPlaceholder')}
          minLength={40}
          maxLength={9000}
          required
          value={description}
          onChange={handleDescriptionChange}
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">{t('addAnnouncement.descriptionHelper')}</div>
          <div className="add-announcement-charcount">{descriptionChars}/9000</div>
        </div>
        {descriptionError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {descriptionError}
          </div>
        )}
      </div>
      <div className="add-announcement-location-section">
        <label className="add-announcement-label">{t('addAnnouncement.locationLabel')}</label>
        <div className="add-announcement-location-input-wrapper">
          <FaMapMarkerAlt className="location-icon" />
          <input
            className={
              "add-announcement-location-input" +
              (!(selectedJudet || selectedLocalitate) ? " add-announcement-location-placeholder" : "")
            }
            type="text"
            placeholder={t('addAnnouncement.labels.entireCountry')}
            value={selectedLocalitate || selectedJudet || t('addAnnouncement.labels.entireCountry')}
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
                minWidth: 300,
                width: { xs: 320, sm: 380 },
                marginLeft: '60px',
                marginTop: '12px',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
                color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : '1px solid #e5e7eb',
                borderRadius: 12,
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                p: 1,
                overflow: 'hidden'
              }
            }}
          >
            <Box sx={{ maxHeight: 480, overflowY: 'auto', borderRadius: 10, backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white', color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>
              {!selectedJudet ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('addAnnouncement.popover.chooseCountyTitle')}</Typography>
                  <TextField
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder={t('common.search')}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: 9999, backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2f2f2f' : '#fff' },
                      '& .MuiInputBase-input': { color: (theme) => theme.palette.mode === 'dark' ? '#fff' : 'inherit' }
                    }}
                  />
                </Box>
                <Divider sx={{ borderColor: (theme) => theme.palette.mode === 'dark' ? '#575757' : '#e5e7eb' }} />
                <List sx={{ px: 1 }}>
                  {filteredJudete.map((judet) => (
                    <ListItemButton
                      key={judet}
                      onClick={() => {
                        if (judet === 'Toată țara') {
                          setSelectedJudet(null);
                          setSelectedLocalitate('');
                          handleClose();
                        } else {
                          setSelectedJudet(judet);
                          setLocationSearch('');
                        }
                      }}
                      sx={{ 
                        borderRadius: 2, 
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#505050' : '#f5f5f5'
                        }
                      }}
                    >
                      <ListItemText
                          primary={judet === 'Toată țara' ? (
                          <Chip label={t('addAnnouncement.labels.entireCountry')} color="primary" size="small" sx={{ borderRadius: 2 }} />
                        ) : judet}
                      />
                    </ListItemButton>
                  ))}
                </List>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ px: 2, pt: 1, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={() => { setSelectedJudet(null); setLocationSearch(''); }}>
                    <ArrowBackIosNewIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ fontWeight: 700 }}>{t('addAnnouncement.popover.chooseLocalityTitle')}</Typography>
                </Box>
                <Box sx={{ px: 2 }}>
                  <TextField
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder={t('common.search')}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 9999, backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2f2f2f' : '#fff' }, '& .MuiInputBase-input': { color: (theme) => theme.palette.mode === 'dark' ? '#fff' : 'inherit' } }}
                  />
                </Box>
                <Divider sx={{ borderColor: (theme) => theme.palette.mode === 'dark' ? '#575757' : '#e5e7eb' }} />
                <List sx={{ px: 1 }}>
                  {filteredLocalitati.map((localitate) => (
                    <ListItemButton
                      key={localitate}
                      onClick={() => {
                        setSelectedLocalitate(localitate);
                        handleClose();
                        setSelectedJudet(null);
                        setLocationSearch('');
                      }}
                      sx={{ 
                        borderRadius: 2, 
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#505050' : '#f5f5f5'
                        }
                      }}
                    >
                      <ListItemText primary={localitate} />
                    </ListItemButton>
                  ))}
                </List>
                </Box>
              )}
            </Box>
          </Popover>
        </div>
        {locationError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {locationError}
          </div>
        )}
      </div>
      <div className="add-announcement-contact-section">
        <h2 className="add-announcement-subtitle">{t('addAnnouncement.contactSubtitle')}</h2>
        <label className="add-announcement-label">{t('addAnnouncement.contactPersonLabel')}</label>
        <div className="add-announcement-contact-input-wrapper">
          <input
            className="add-announcement-contact-input"
            type="text"
            placeholder={t('addAnnouncement.contactPersonPlaceholder')}
            value={contactPerson || ''}
            onChange={handleContactPersonChange}
            required
          />
          {contactPerson && (
            <span className="add-announcement-location-check">✓</span>
          )}
        </div>
        {contactPersonError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {contactPersonError}
          </div>
        )}
        <label className="add-announcement-label">{t('addAnnouncement.contactEmailLabel')}</label>
        <input
          className="add-announcement-contact-input"
          type="email"
          placeholder={t('addAnnouncement.contactEmailPlaceholder')}
          value={contactEmail || ''}
          onChange={handleContactEmailChange}
        />
        {contactEmailError && (
          <div className="add-announcement-message add-announcement-error">
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {contactEmailError}
          </div>
        )}
        <label className="add-announcement-label">{t('addAnnouncement.contactPhoneLabel')}</label>
        <input
          className="add-announcement-contact-input"
          type="tel"
          placeholder={t('addAnnouncement.contactPhonePlaceholder')}
          value={contactPhone || ''}
          onChange={handleContactPhoneChange}
        />
        {contactPhoneError && (
          <div className="add-announcement-message add-announcement-error">
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
          <button type="button" className="add-announcement-preview">{t('addAnnouncement.previewButton')}</button>
          <button type="button" className="add-announcement-submit" onClick={handleSubmit}>{isEdit ? t('addAnnouncement.submitButton.update') : t('addAnnouncement.submitButton.create')}</button>
        </div>
      </div>
    </div>
  );
}