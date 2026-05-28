import React, { useState, useRef, useEffect } from 'react';
import './AddAnnouncementPage.css';
import './AddAnnouncementPage.mobile.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Box, IconButton, Button, TextField, InputAdornment, Divider, Chip } from '@mui/material';
import AnnouncementPreviewDialog from '../components/AnnouncementPreviewDialog';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { categories } from '../components/Categories.jsx';
import { categoryTagsMap } from '../utils/categoryTags';

// Fix: Ensure all category images are imported and used for mobile/tablet
// This is the same array as in Categories.jsx, so images are imported there and exported as 'categories'.
import '../components/Categories.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/api';
import Toast from '../components/Toast';
import { getEffectiveViewportWidth, isTouchPrimaryDevice } from '../utils/devicePatch';

import { localitatiPeJudet } from '../assets/comunePeJudet';

export default function EditAnnouncementPage() {
  const { t } = useTranslation();
  const entireCountryLabel = t('addAnnouncement.labels.entireCountry');
  const judete = [entireCountryLabel, ...Object.keys(localitatiPeJudet)];
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') return 1280;
    return getEffectiveViewportWidth();
  });
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
  const [price, setPrice] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const MAX_TAGS = 10;
  const imageInputRef = useRef(null);
  // Imaginile existente ale anunțului (URL-uri Cloudinary care vor fi trimise înapoi la backend
  // ca `existingImages` ca să nu fie șterse la salvare).
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  // Fișierele noi adăugate de utilizator și data-URL-urile lor pentru previzualizare.
  const [images, setImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  // Preview combinat (existente + noi) pentru randare.
  const imagePreviews = [...existingImageUrls, ...newImagePreviews];
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // State for image validation errors
  const [imageError, setImageError] = useState("");
  
  // State-uri pentru toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  
  // State pentru preview modal
  const [showPreview, setShowPreview] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [announcementId, setAnnouncementId] = useState(null);
  
  // Funcție helper pentru a afișa toast-uri
  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  
  // Handler pentru preview
  const handlePreview = () => {
    if (!title.trim()) {
      showToast(t('addAnnouncement.errors.titleMin'));
      return;
    }
    if (!category) {
      showToast(t('addAnnouncement.errors.categoryRequired'));
      return;
    }
    if (!description.trim()) {
      showToast(t('addAnnouncement.errors.descriptionMin'));
      return;
    }
    setShowPreview(true);
  };
  
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
      setPrice(a.price || '');
      setSelectedTags(Array.isArray(a.tags) ? a.tags : []);
      setAnnouncementId(a._id);
      
      // Setează imaginile existente
      if (a.images && a.images.length > 0) {
        setMainImagePreview(a.images[0]);
        setExistingImageUrls(a.images);
      }
    }
  }, [location.state]);

  // Procesează un set de fișiere (input file sau drag-and-drop): validează count/format/size,
  // le adaugă în state și generează preview-urile.
  const processFiles = (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    // Verifică dacă utilizatorul încearcă să adauge prea multe imagini (existente + noi + în curs).
    if (existingImageUrls.length + images.length + files.length > 10) {
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
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
        // Dacă nu exista nicio imagine principală setată, prima nouă devine main.
        setMainImagePreview(prev => prev ?? reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  // Drag-and-drop pentru imagini — disponibil doar pe desktop.
  const [isDragging, setIsDragging] = useState(false);
  const dndEnabled = !isTouchPrimaryDevice();

  const handleDragOver = (e) => {
    if (!dndEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    if (!dndEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    if (!dndEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    setTitleChars(value.length);
  };

  const handleTitleBlur = () => {
    // Validare numai când utilizatorul iese din câmp
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
      showToast(t('addAnnouncement.errors.contactPersonMax'));
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

  const handleCategoryClick = (event) => {
    setCategoryAnchorEl(event.currentTarget);
  };

  const handleCategoryClose = () => {
    setCategoryAnchorEl(null);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setSelectedTags([]);
    handleCategoryClose();
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
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

    // Validare email (dacă este completat)
    if (contactEmail && !validateEmail(contactEmail)) {
      showToast(t('addAnnouncement.errors.invalidEmail'));
      hasErrors = true;
    }

    // Validare telefon (dacă este completat)
    if (contactPhone && !validatePhone(contactPhone)) {
      showToast(t('addAnnouncement.errors.invalidPhone'));
      hasErrors = true;
    }

    // Dacă nu există nici email nici telefon
    if (!contactEmail && !contactPhone) {
      showToast(t('addAnnouncement.errors.emailOrPhoneRequired'));
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
      if (price.trim()) formData.append('price', price);
      if (selectedTags.length > 0) formData.append('tags', JSON.stringify(selectedTags));

      // Trimite URL-urile imaginilor existente care trebuie păstrate (backend-ul șterge tot ce nu primește aici).
      formData.append('existingImages', JSON.stringify(existingImageUrls));

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
      
  setSuccess(t('addAnnouncement.success.updated'));
  // Redirecționează către pagina de detalii a anunțului cu flag updated=1
  setTimeout(() => navigate(`/announcement/${announcementId}?updated=1`, { state: { updated: true } }), 800);
    } catch (e) {
      console.error('Error updating announcement:', e);
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
  };

  const handleLocationSelect = (judet, localitate) => {
    setSelectedJudet(judet);
    setSelectedLocalitate(localitate);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const categoryOpen = Boolean(categoryAnchorEl);
  const categoryId = categoryOpen ? 'category-popover' : undefined;
  // Keep mobile category UI below 600px for consistency with Add page
  const isMobile = viewportWidth < 600;
  const isSellAppLike = viewportWidth <= 1024;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 1024px)');
    const onResize = () => setViewportWidth(getEffectiveViewportWidth());

    window.addEventListener('resize', onResize);

    if (media.addEventListener) {
      media.addEventListener('change', onResize);
    } else {
      media.addListener(onResize);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (media.addEventListener) {
        media.removeEventListener('change', onResize);
      } else {
        media.removeListener(onResize);
      }
    };
  }, []);

  return (
    <div className={`add-announcement-container edit-announcement-container ${isSellAppLike ? 'sell-applike' : ''}`}>
      {/* Mobile header: back + title (same style as Chat/Favorites) */}
      <Box className="sell-mobile-header" sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        gap: 2,
        mb: { xs: 1, md: 2 },
        pt: 'clamp(8px, 3vh, 24px)',
        px: 1
      }}>
        <IconButton
          onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }}
          className="sell-mobile-back-btn"
          sx={{
            backgroundColor: 'var(--chat-elev)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': { backgroundColor: 'var(--chat-surface)' }
          }}
          disableRipple
          disableFocusRipple
          aria-label={t('common.back')}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" className="sell-mobile-header-title" sx={{ fontWeight: 600, color: 'var(--chat-text)' }}>{t('addAnnouncement.editMobileHeaderTitle')}</Typography>
      </Box>
      <h1 className="add-announcement-title">{t('addAnnouncement.editPageTitle')}</h1>
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
        <input
          className="add-announcement-category-select"
          type="text"
          placeholder={t('addAnnouncement.categoryPlaceholder')}
          value={category}
          readOnly
          onClick={handleCategoryClick}
          required
        />
        <Popover
          id={categoryId}
          open={categoryOpen}
          anchorEl={categoryAnchorEl}
          onClose={handleCategoryClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: isMobile ? 'center' : 'left' }}
          BackdropProps={{
            sx: {
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)'
            }
          }}
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
                  <p className="category-hint-popover">{t(`addAnnouncement.categoryHints.${cat.key}`)}</p>
                </div>
              ))}
            </div>
          )}
        </Popover>

        {/* Tags Section */}
        {category && categoryTagsMap[category] && (
          <div className="add-announcement-tags-section">
            <label className="add-announcement-label add-announcement-tags-label">
              {t('categoryTags.label')}
              {selectedTags.length > 0 && (
                <span className="add-announcement-tags-count">
                  {selectedTags.length}/{MAX_TAGS}
                </span>
              )}
            </label>
            <p className="add-announcement-tags-helper">
              {t('categoryTags.helper')}
            </p>
            {categoryTagsMap[category].map(({ groupKey, tagKeys }) => (
              <div key={groupKey} className="add-announcement-tags-group">
                <span className="add-announcement-tags-group-title">
                  {t(`categoryTags.groups.${groupKey}`)}
                </span>
                <div className="add-announcement-tags-chips">
                  {tagKeys.map(tagKey => {
                    const selected = selectedTags.includes(tagKey);
                    const disabled = !selected && selectedTags.length >= MAX_TAGS;
                    return (
                      <button
                        key={tagKey}
                        type="button"
                        className={`add-announcement-tag-chip${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                        onClick={() => !disabled && handleTagToggle(tagKey)}
                        aria-pressed={selected}
                        disabled={disabled}
                      >
                        {t(`categoryTags.tags.${tagKey}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedTags.length > 0 && (
              <button
                type="button"
                className="add-announcement-tags-clear"
                onClick={() => setSelectedTags([])}
              >
                {t('categoryTags.clear')}
              </button>
            )}
          </div>
        )}
      </form>
      <div
        className={`add-announcement-images-section${isDragging ? ' is-dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Mesaj de eroare pentru imagini */}
        {imageError && (
          <div className="add-announcement-message add-announcement-error" style={{marginBottom: 16}}>
            <div className="add-announcement-error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#d32f2f"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            </div>
            {imageError}
          </div>
        )}
        <h2 className="add-announcement-subtitle">{t('addAnnouncement.imagesSubtitle')}</h2>
        <div className="add-announcement-images-helper">
          {t('addAnnouncement.imagesHelper')}
          {dndEnabled && (
            <span className="add-announcement-images-dnd-hint">
              {' '}{t('addAnnouncement.imagesDndHint', 'Poți trage și plasa imagini aici.')}
            </span>
          )}
        </div>
        <div
          className="add-announcement-images-grid"
          style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}
        >
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
                  // idx pointează în array-ul combinat: [existente, ...noi].
                  const existingCount = existingImageUrls.length;
                  if (idx < existingCount) {
                    setExistingImageUrls(prev => prev.filter((_, i) => i !== idx));
                  } else {
                    const newIdx = idx - existingCount;
                    setImages(prev => prev.filter((_, i) => i !== newIdx));
                    setNewImagePreviews(prev => prev.filter((_, i) => i !== newIdx));
                  }
                  const remaining = imagePreviews.filter((_, i) => i !== idx);
                  setMainImagePreview(remaining[0] || null);
                }}
                title={t('addAnnouncement.imageRemoveTitle')}
              >
                <span style={{fontWeight: 'bold', color: '#d32f2f'}}>×</span>
              </button>
              {idx === 0 && <div style={{position: 'absolute', bottom: 4, left: 4, background: '#388e3c', color: '#fff', fontSize: 12, borderRadius: 4, padding: '2px 6px'}}>{t('addAnnouncement.imagePrimaryBadge')}</div>}
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
            placeholder={t('addAnnouncement.locationPlaceholder')}
            value={selectedLocalitate || selectedJudet || entireCountryLabel}
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
                <Typography sx={{ p: 2, fontWeight: 600 }}>{t('addAnnouncement.popover.chooseCountyTitle')}</Typography>
                <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                  {judete.map((judet) => (
                    <ListItemButton
                      key={judet}
                      onClick={() => {
                        if (judet === entireCountryLabel) {
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
                        primary={judet === entireCountryLabel ? <span style={{ fontWeight: 'bold' }}>{entireCountryLabel}</span> : judet}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </>
            ) : (
              <>
                <Typography sx={{ p: 2, fontWeight: 600 }}>{t('addAnnouncement.popover.chooseLocalityTitle')}</Typography>
                {/* Mutăm butonul Înapoi la județe deasupra listei */}
                <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                  <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                    <ListItemText primary={<span style={{ color: '#f51866' }}>{t('addAnnouncement.popover.backToCounties')}</span>} />
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
        <label className="add-announcement-label">{t('addAnnouncement.priceLabel')}</label>
        <input
          className="add-announcement-contact-input"
          type="number"
          placeholder={t('addAnnouncement.pricePlaceholder')}
          value={price || ''}
          onChange={(e) => setPrice(e.target.value)}
        />
        <div className="add-announcement-helper">{t('addAnnouncement.priceHelper')}</div>
      </div>
      <div className="add-announcement-actions-section">
        <div className="add-announcement-actions-left"></div>
        <div className="add-announcement-actions-right">
          <button type="button" className="add-announcement-preview" onClick={handlePreview}>{t('addAnnouncement.previewButton')}</button>
          <button type="button" className="add-announcement-submit" onClick={handleSubmit}>{t('addAnnouncement.submitButton.update')}</button>
        </div>
      </div>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
        duration={3000}
      />
      
      <AnnouncementPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        category={category}
        description={description}
        price={price}
        imagePreviews={imagePreviews}
        mainImagePreview={mainImagePreview}
        contactPerson={contactPerson}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
        selectedLocalitate={selectedLocalitate}
        selectedJudet={selectedJudet}
        onSubmit={handleSubmit}
        submitLabel={t('addAnnouncement.submitButton.update')}
      />

    </div>
  );
}