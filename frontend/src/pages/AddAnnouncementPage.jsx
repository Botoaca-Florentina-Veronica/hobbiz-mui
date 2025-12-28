import React, { useState, useRef, useEffect } from 'react';
import './AddAnnouncementPage.css';
import './AddAnnouncementPage.mobile.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Box, IconButton, TextField, InputAdornment, Divider, Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardMedia, CardContent, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { categories } from '../components/Categories.jsx';

// Fix: Ensure all category images are imported and used for mobile/tablet
// This is the same array as in Categories.jsx, so images are imported there and exported as 'categories'.
import '../components/Categories.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/api';
import Toast from '../components/Toast';

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
import translateCategory from '../utils/translateCategory';

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // State-uri pentru toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  
  // State pentru preview modal
  const [showPreview, setShowPreview] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [isEdit, setIsEdit] = useState(false);
  const [announcementId, setAnnouncementId] = useState(null);

  // Funcție helper pentru a afișa toast-uri
  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Funcție comună de validare folosită atât la Publish cât și la Preview
  const validateForm = () => {
    let hasErrors = false;

    // Validare titlu
    if (!title || title.length < 16) {
      showToast(t('addAnnouncement.errors.titleMin'));
      hasErrors = true;
    } else if (title.length > 70) {
      showToast(t('addAnnouncement.errors.titleMax'));
      hasErrors = true;
    }

    // Validare categorie
    if (!category) {
      showToast(t('addAnnouncement.errors.categoryRequired'));
      hasErrors = true;
    }

    // Validare descriere
    if (!description || description.length < 40) {
      showToast(t('addAnnouncement.errors.descriptionMin'));
      hasErrors = true;
    } else if (description.length > 9000) {
      showToast(t('addAnnouncement.errors.descriptionMax'));
      hasErrors = true;
    }

    // Validare locație
    if (!selectedJudet && !selectedLocalitate) {
      showToast(t('addAnnouncement.errors.locationRequired'));
      hasErrors = true;
    }

    // Validare persoană de contact
    if (!contactPerson || contactPerson.trim().length < 2) {
      showToast(t('addAnnouncement.errors.contactPersonRequired'));
      hasErrors = true;
    }

    // Email: obligatoriu + validare format
    if (!contactEmail || contactEmail.trim() === '') {
      showToast(t('addAnnouncement.errors.emailRequired'));
      hasErrors = true;
    } else if (!validateEmail(contactEmail)) {
      showToast(t('addAnnouncement.errors.invalidEmail'));
      hasErrors = true;
    }

    // Telefon: obligatoriu + validare format
    if (!contactPhone || contactPhone.trim() === '') {
      showToast(t('addAnnouncement.errors.phoneRequired'));
      hasErrors = true;
    } else if (!validatePhone(contactPhone)) {
      showToast(t('addAnnouncement.errors.invalidPhone'));
      hasErrors = true;
    }

    return hasErrors;
  };

  // Handler pentru preview
  const handlePreview = () => {
    const hasErrors = validateForm();
    if (hasErrors) return;
    setShowPreview(true);
  };

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
      showToast(t('addAnnouncement.errors.maxImages'));
      return;
    }
    
    // Acceptă doar imagini jpg/jpeg
    const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/jpg');
    if (validFiles.length !== files.length) {
      showToast(t('addAnnouncement.errors.imageFormat'));
      return;
    }

    // Verifică dimensiunea fiecărui fișier (max 5MB)
    const oversizedFiles = validFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast(t('addAnnouncement.errors.imageSize'));
      return;
    }

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
  };

  const handleTitleBlur = () => {
    // Validare numai cand utilizatorul iese din camp
    if (title.length > 0 && title.length < 16) {
      showToast(t('addAnnouncement.errors.titleMin'));
    } else if (title.length > 70) {
      showToast(t('addAnnouncement.errors.titleMax'));
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

  // Funcție pentru update descriere
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setDescriptionChars(value.length);
  };

  const handleDescriptionBlur = () => {
    // Validare numai când utilizatorul iese din câmp
    if (description.length > 0 && description.length < 40) {
      showToast(t('addAnnouncement.errors.descriptionMin'));
    } else if (description.length > 9000) {
      showToast(t('addAnnouncement.errors.descriptionMax'));
    }
  };

  // Funcție pentru update persoana de contact
  const handleContactPersonChange = (e) => {
    const value = e.target.value;
    setContactPerson(value);
  };

  const handleContactPersonBlur = () => {
    // Validare numai când utilizatorul iese din câmp
    if (contactPerson.trim().length > 0 && contactPerson.trim().length < 2) {
      showToast(t('addAnnouncement.errors.contactPersonRequired'));
    } else if (contactPerson.trim().length > 50) {
      showToast(t('addAnnouncement.errors.contactPersonRequired'));
    }
  };

  // Funcție pentru update email de contact
  const handleContactEmailChange = (e) => {
    const value = e.target.value;
    setContactEmail(value);
  };

  const handleContactEmailBlur = () => {
    // Validare numai când utilizatorul iese din câmp
    if (contactEmail && !validateEmail(contactEmail)) {
      showToast(t('addAnnouncement.errors.invalidEmail'));
    }
  };

  // Funcție pentru update telefon de contact
  const handleContactPhoneChange = (e) => {
    const value = e.target.value;
    setContactPhone(value);
  };

  const handleContactPhoneBlur = () => {
    // Validare numai când utilizatorul iese din câmp
    if (contactPhone && !validatePhone(contactPhone)) {
      showToast(t('addAnnouncement.errors.invalidPhone'));
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

    // Refolosim validarea comună și afișăm aceleași toast-uri
    const hasErrors = validateForm();
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
    handleClose();
  };

  const handleCategoryClick = (event) => {
    if (isMobile) {
      setShowCategoryModal(true);
    } else {
      setCategoryAnchorEl(event.currentTarget);
    }
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
    setShowCategoryModal(false);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

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
          onBlur={handleTitleBlur}
          minLength={16}
          maxLength={70}
          required
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">{t('addAnnouncement.titleHelper')}</div>
          <div className="add-announcement-charcount">{titleChars}/70</div>
        </div>
        <label className="add-announcement-label">{t('addAnnouncement.categoryLabel')}</label>
        {isMobile ? (
          <button
            type="button"
            className="add-announcement-category-select-button"
            onClick={handleCategoryClick}
            aria-haspopup="dialog"
            aria-expanded={showCategoryModal}
            aria-label={t('addAnnouncement.categoryPlaceholder')}
            required
          >
            {translateCategory(category, t) || t('addAnnouncement.categoryPlaceholder')}
          </button>
        ) : (
          <input
            className="add-announcement-category-select"
            type="text"
            placeholder={t('addAnnouncement.categoryPlaceholder')}
            value={translateCategory(category, t)}
            readOnly
            onClick={handleCategoryClick}
            role="button"
            aria-haspopup="dialog"
            aria-expanded={showCategoryModal}
            required
          />
        )}
        {!isMobile && (
        <Popover
          id={categoryId}
          open={categoryOpen}
          anchorEl={categoryAnchorEl}
          onClose={handleCategoryClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'
            }
          }}
          PaperProps={{ 
            sx: {
              width: 'min(92vw, 1100px)',
              maxWidth: 1200,
              minHeight: 440,
              maxHeight: 'calc(100vh - 72px)',
              overflowY: 'auto',
              scrollbarWidth: 'none',          // Firefox
              msOverflowStyle: 'none',          // IE/Edge
              '&::-webkit-scrollbar': {         // WebKit
                width: 0,
                height: 0
              },
              borderRadius: 8,
              p: 'clamp(12px, 3vw, 24px)',
              zIndex: (theme) => theme.zIndex.modal + 1,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : '1px solid #e5e7eb',
              fontFamily: "'Poppins', sans-serif",
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
        </Popover>
        )}

        {/* Category Modal for Mobile */}
        {showCategoryModal && (
          <div className="ma-modal-overlay" onClick={() => setShowCategoryModal(false)}>
            <div className="ma-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="ma-modal-header">
                <div className="ma-modal-title">{t('addAnnouncement.popover.title')}</div>
                <IconButton onClick={() => setShowCategoryModal(false)} className="ma-modal-close-button">
                  <CloseIcon />
                </IconButton>
              </div>

              <div className="ma-modal-scroll">
                {categories.map((cat, index) => (
                  <div
                    key={index}
                    className={`ma-modal-option ${category === cat.description ? 'selected' : ''}`}
                    onClick={() => {
                      handleCategorySelect(cat.description);
                      setShowCategoryModal(false);
                    }}
                  >
                    <div className="ma-modal-option-left">
                      {cat.image && (
                        <img src={cat.image} alt="" className="ma-modal-option-icon category-row-icon" />
                      )}
                      <span className="ma-modal-option-text">{t(`categories.${cat.key}`)}</span>
                    </div>
                    {category === cat.description && (
                      <CheckCircleIcon className="ma-modal-option-check" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
      <div className="add-announcement-images-section">
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
          onBlur={handleDescriptionBlur}
        />
        <div className="add-announcement-char-helper-row">
          <div className="add-announcement-helper">{t('addAnnouncement.descriptionHelper')}</div>
          <div className="add-announcement-charcount">{descriptionChars}/9000</div>
        </div>
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
                borderRadius: 10,
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                p: 1,
                overflow: 'hidden'
              }
            }}
          >
            <Box sx={{ maxHeight: 480, overflowY: 'auto', borderRadius: '8px', backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white', color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit', pr: 1.5 }}>
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
            onBlur={handleContactPersonBlur}
            required
          />
          {contactPerson && (
            <span className="add-announcement-location-check">✓</span>
          )}
        </div>
        <label className="add-announcement-label">{t('addAnnouncement.contactEmailLabel')}</label>
        <input
          className="add-announcement-contact-input"
          type="email"
          placeholder={t('addAnnouncement.contactEmailPlaceholder')}
          value={contactEmail || ''}
          onChange={handleContactEmailChange}
          onBlur={handleContactEmailBlur}
        />
        <label className="add-announcement-label">{t('addAnnouncement.contactPhoneLabel')}</label>
        <input
          className="add-announcement-contact-input"
          type="tel"
          placeholder={t('addAnnouncement.contactPhonePlaceholder')}
          value={contactPhone || ''}
          onChange={handleContactPhoneChange}
          onBlur={handleContactPhoneBlur}
        />
      </div>
      <div className="add-announcement-actions-section">
        <div className="add-announcement-actions-left"></div>
        <div className="add-announcement-actions-right">
          <button type="button" className="add-announcement-preview" onClick={handlePreview}>{t('addAnnouncement.previewButton')}</button>
          <button type="button" className="add-announcement-submit" onClick={handleSubmit}>{isEdit ? t('addAnnouncement.submitButton.update') : t('addAnnouncement.submitButton.create')}</button>
        </div>
      </div>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
      
      {/* Preview Modal - Same structure as AnnouncementDetails */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#fff',
            color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#3f3f3f',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#575757' : '#e5e7eb'}`,
          pb: 2,
          fontWeight: 600
        }}>
          {t('addAnnouncement.previewTitle') || 'Previzualizare Anunț'}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          <Grid container spacing={4}>
            {/* Main Content Column */}
            <Grid item xs={12} md={8}>
              {/* Image Card */}
              {(imagePreviews.length > 0 || mainImagePreview) && (
                <Card elevation={3} sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
                  <Box sx={{ position: 'relative', height: { xs: 300, md: 400 } }}>
                    <CardMedia
                      component="img"
                      image={mainImagePreview || imagePreviews[0]}
                      alt="Preview"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
                      }}
                    />
                  </Box>
                </Card>
              )}

              {/* Details Card */}
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                  {/* Header */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ 
                      color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                      fontWeight: 700,
                      mb: 2,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                      textAlign: 'center'
                    }}>
                      {title}
                    </Typography>
                    {category && (
                      <Chip
                        label={translateCategory(category, t)}
                        variant="outlined"
                        sx={{
                          borderColor: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                          color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                          mb: 2
                        }}
                      />
                    )}
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Description */}
                  <Typography variant="h6" sx={{ 
                    color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                    mb: 2,
                    fontWeight: 600
                  }}>
                    {t('addAnnouncement.preview.description') || t('addAnnouncement.descriptionLabel')}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#f5f5f5' : '#2d3748',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }}
                  >
                    {description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar Column */}
            <Grid item xs={12} md={4}>
              {/* Seller Information Card */}
              <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Typography variant="h6" sx={{ 
                    color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                    mb: 3,
                    fontWeight: 600
                  }}>
                    {t('addAnnouncement.preview.sellerInfo') || t('addAnnouncement.contactSubtitle')}
                  </Typography>

                  {/* Contact Person */}
                  {contactPerson && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('addAnnouncement.preview.contactPersonLabel') || (t('addAnnouncement.contactPersonLabel'))}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {contactPerson}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 3 }} />

                  {/* Contact Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Phone */}
                    {contactPhone && (
                      <Paper elevation={1} sx={{ 
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
                        border: (theme) => theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255,255,255,0.3)' 
                          : '1px solid rgba(0,0,0,0.12)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ 
                            color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                            fontSize: 20
                          }} />
                          <Typography variant="body1">
                            {contactPhone}
                          </Typography>
                        </Box>
                      </Paper>
                    )}

                    {/* Email */}
                    {contactEmail && (
                      <Paper elevation={1} sx={{ 
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
                        border: (theme) => theme.palette.mode === 'dark' 
                          ? '1px solid rgba(255,255,255,0.3)' 
                          : '1px solid rgba(0,0,0,0.12)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ 
                            color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                            fontSize: 20
                          }} />
                          <Typography variant="body1" sx={{ 
                            wordBreak: 'break-word',
                            fontSize: '0.95rem'
                          }}>
                            {contactEmail}
                          </Typography>
                        </Box>
                      </Paper>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Location Card */}
              {selectedLocalitate && (
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography variant="h6" sx={{ 
                      color: (theme) => theme.palette.mode === 'dark' ? '#f51866' : '#355070',
                      mb: 2,
                      fontWeight: 600
                    }}>
                      {t('addAnnouncement.preview.location') || t('addAnnouncement.locationLabel')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FaMapMarkerAlt style={{ 
                        color: '#f51866',
                        fontSize: 20
                      }} />
                      <Typography variant="body1">
                        {selectedLocalitate}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          borderTop: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#575757' : '#e5e7eb'}`
        }}>
          <Button 
            onClick={() => setShowPreview(false)}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#3f3f3f',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#2f2f2f' : '#f5f5f5'
              }
            }}
          >
            {t('common.close') || 'Închide'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}