import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineBell } from 'react-icons/hi';
import { FaCamera, FaUtensils, FaBook, FaMoneyBillWave, FaVideo, FaBriefcase, FaGraduationCap, FaPalette, FaBroom, FaTools, FaMusic, FaSpa, FaCar, FaBuilding, FaTruck } from 'react-icons/fa';
import hobby from '../assets/images/hobby_img.jpg';
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import translateCategory from '../utils/translateCategory';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Paper, CardContent, Chip, Box, IconButton, InputBase, Stack, useMediaQuery, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import './MainStage.css';
import StaggeredMenu from './StaggeredMenu';
import useSearchSuggestions from '../hooks/useSearchSuggestions';

import { localitatiPeJudet } from '../assets/comunePeJudet';

// Constants
const judete = ["Toată țara", ...Object.keys(localitatiPeJudet)];

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

// Map displayed Romanian category name to a stable slug used for translations
const categorySlugs = {
  "Fotografie": "fotografie",
  "Prajituri, Băcănie, Gătit": "prajituri_gatit",
  "Traduceri & Redactare": "traduceri_redactare",
  "Finanțe & Contabilitate": "finante_contabilitate",
  "Video & Animație": "video_animatie",
  "Business": "business",
  "Meditații & Cursuri": "meditatii_cursuri",
  "Grafică & Design": "grafica_design",
  "Curatenie, Întreținere casă": "curatenie_intretinere_casa",
  "Reparații, Instalatii, Bricolaj": "reparatii_instalatii_bricolaj",
  "Muzică, Teatru, Dans": "muzica_teatru_dans",
  "Auto, Moto, Biciclete": "auto_moto_biciclete",
  "Imobiliare, Construcții, Amenajari": "imobiliare_constructii_amenajari",
  "Transport, Logistică, Curierat": "transport_logistica_curierat"
};

// Helper functions
function getLocalitatiForJudet(judet) {
  if (!localitatiPeJudet[judet]) return [];
  const orase = localitatiPeJudet[judet]?.orase?.map(o => o.nume) || [];
  const comune = localitatiPeJudet[judet]?.comune || [];
  return [...orase, ...comune].sort((a, b) => a.localeCompare(b, 'ro'));
}

// Main Component
export default function MainStage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Search autocomplete (hook handles debounce + AbortController)
  const {
    searchTerm,
    setSearchTerm,
    suggestions: searchSuggestions,
    isLoading: isSearching,
    showSuggestions,
    setShowSuggestions,
    activeIndex,
    setActiveIndex,
    noResults,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecent,
    clearSearch,
  } = useSearchSuggestions();
  
  // Refs
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Hover logic for category details panel
  useEffect(() => {
    if (!menuOpen) {
      setSelectedCategory(null);
      setDetailsVisible(false);
      return;
    }
    const animDuration = 2650;
    const timer = setTimeout(() => {
      const panel = document.querySelector('.mainstage-staggered-menu .staggered-menu-panel');
      if (!panel) return;
      setDetailsVisible(true);
      const handleMouseOver = (e) => {
        const item = e.target.closest('.sm-panel-item');
        if (!item) return;
        const idx = parseInt(item.dataset.index, 10) - 1;
        const original = categoriesList[idx];
        if (original && categoriesDetails[original]) setSelectedCategory(original);
      };
      panel.addEventListener('mouseover', handleMouseOver);
      panel._cleanupHover = () => {
        panel.removeEventListener('mouseover', handleMouseOver);
      };
    }, animDuration);

    return () => {
      clearTimeout(timer);
      const panel = document.querySelector('.mainstage-staggered-menu .staggered-menu-panel');
      panel?._cleanupHover?.();
    };
  }, [menuOpen]);

  // Whether the search input is focused (controls dropdown visibility for recent/empty states)
  const [inputFocused, setInputFocused] = useState(false);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Total selectable items in the dropdown (for keyboard nav)
  const trimmedTerm = searchTerm.trim();
  const hasTypedEnough = trimmedTerm.length >= 2;
  // "Search for X" row counts as index 0 when we have text
  const totalItems = hasTypedEnough ? 1 + searchSuggestions.length : 0;

  // Determine if the dropdown should be visible
  const showRecentPanel = inputFocused && !hasTypedEnough && recentSearches.length > 0;
  const showDropdown = showSuggestions || showRecentPanel;

  // Keyboard handler for the search input
  const handleSearchKeyDown = useCallback((e) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' && recentSearches.length > 0) {
        setInputFocused(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setInputFocused(false);
      searchInputRef.current?.blur();
      return;
    }

    if (showRecentPanel) {
      // Arrow navigation through recent items
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % recentSearches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? recentSearches.length - 1 : i - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < recentSearches.length) {
        e.preventDefault();
        const term = recentSearches[activeIndex];
        setSearchTerm(term);
        setShowSuggestions(false);
        setInputFocused(false);
        addRecentSearch(term);
        navigate(`/?search=${encodeURIComponent(term)}`);
      }
      return;
    }

    // Suggestions dropdown navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? totalItems - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex === 0) {
        // "Search for X" row
        e.preventDefault();
        handleSearchSubmit(e);
      } else if (activeIndex > 0 && activeIndex <= searchSuggestions.length) {
        e.preventDefault();
        handleSuggestionClick(searchSuggestions[activeIndex - 1]._id);
      }
      // if activeIndex === -1, let the form submit naturally
    }
  }, [showDropdown, showRecentPanel, activeIndex, totalItems, recentSearches, searchSuggestions, searchTerm, hasTypedEnough]);

  // Event Handlers
  const handleInputClick = (event) => {
    setAnchorEl(event.currentTarget);
    setSelectedJudet(null);
    setSelectedLocalitate("");
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedJudet(null);
  };

  const handleLocalitateClick = (localitate) => {
    setSelectedLocalitate(localitate);
    setAnchorEl(null);
    setSelectedJudet(null);
  };

  const handleSuggestionClick = (announcementId) => {
    clearSearch();
    setInputFocused(false);
    navigate(`/announcement/${announcementId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      addRecentSearch(searchTerm.trim());
      setShowSuggestions(false);
      setInputFocused(false);
      const params = new URLSearchParams();
      params.set('search', searchTerm.trim());
      if (selectedLocalitate) {
        params.set('location', selectedLocalitate);
      } else if (selectedJudet && selectedJudet !== 'Toată țara') {
        params.set('location', selectedJudet);
      }
      navigate(`/?${params.toString()}`);
    }
  };

  const handleRecentClick = (term) => {
    setSearchTerm(term);
    addRecentSearch(term);
    setShowSuggestions(false);
    setInputFocused(false);
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  const handleSearchFocus = () => {
    setInputFocused(true);
    if (searchSuggestions.length > 0) setShowSuggestions(true);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'location-popover' : undefined;

  // Highlight matching text portions
  const highlightMatch = (text, query) => {
    if (!query || query.length < 2) return text;
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="suggestion-highlight">{part}</mark>
          : part
      );
    } catch { return text; }
  };

  const categoryMenuItems = useMemo(
    () =>
      categoriesList.map((category) => ({
        label: t(`categories.${category}`),
        icon: categoryIcons[category] || null,
        ariaLabel: t('mainStage.categoryAriaLabel', {
          defaultValue: `Deschide categoria ${t(`categories.${category}`)}`,
          category: t(`categories.${category}`),
        }),
        link: `/anunturi-categorie/${encodeURIComponent(category)}`,
        onClick: (event) => {
          event.preventDefault();
          navigate(`/anunturi-categorie/${encodeURIComponent(category)}`);
        },
      })),
    [navigate, t]
  );

  // Render the dropdown panel (recent, loading, suggestions, no-results)
  const renderSearchDropdown = (isMobileVariant) => {
    const trimmed = searchTerm.trim();
    const typed = trimmed.length >= 2;

    // RECENT SEARCHES (shown when focused + empty input)
    if (!typed && recentSearches.length > 0 && inputFocused) {
      return (
        <div className={`search-suggestions-dropdown${isMobileVariant ? ' mobile-suggestions' : ''}`} role="listbox">
          <div className="suggestions-header">
            <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            <span>{t('mainStage.recentSearches', 'Căutări recente')}</span>
            <button className="clear-recent-btn" onClick={clearAllRecent} type="button">
              {t('mainStage.clearAll', 'Șterge tot')}
            </button>
          </div>
          {recentSearches.map((term, idx) => (
            <div
              key={term}
              className={`suggestion-item recent-item${activeIndex === idx ? ' active' : ''}`}
              onClick={() => handleRecentClick(term)}
              role="option"
              aria-selected={activeIndex === idx}
            >
              <div className="recent-icon">
                <AccessTimeIcon sx={{ fontSize: 18, opacity: 0.4 }} />
              </div>
              <div className="suggestion-content">
                <div className="suggestion-title">{term}</div>
              </div>
              <button
                className="remove-recent-btn"
                onClick={(e) => { e.stopPropagation(); removeRecentSearch(term); }}
                type="button"
                aria-label={t('mainStage.removeRecent', 'Elimină')}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    // Nothing typed yet and no recent→ don't show anything
    if (!typed) return null;

    // LOADING STATE
    if (isSearching && searchSuggestions.length === 0) {
      return (
        <div className={`search-suggestions-dropdown${isMobileVariant ? ' mobile-suggestions' : ''}`}>
          <div className="suggestions-loading">
            <CircularProgress size={20} sx={{ color: 'var(--primary)' }} />
            <span>{t('mainStage.searching', 'Se caută...')}</span>
          </div>
        </div>
      );
    }

    // SUGGESTIONS + "Search for X" header
    if (searchSuggestions.length > 0 || noResults) {
      return (
        <div className={`search-suggestions-dropdown${isMobileVariant ? ' mobile-suggestions' : ''}`} role="listbox">
          {/* "Search for X" action row */}
          <div
            className={`suggestion-item search-action-item${activeIndex === 0 ? ' active' : ''}`}
            onClick={handleSearchSubmit}
            role="option"
            aria-selected={activeIndex === 0}
          >
            <div className="search-action-icon">
              <FaSearch />
            </div>
            <div className="suggestion-content">
              <div className="suggestion-title">
                {t('mainStage.searchFor', 'Caută')}{' '}
                <strong>"{trimmed}"</strong>
              </div>
            </div>
            <ArrowForwardIosIcon sx={{ fontSize: 14, opacity: 0.4 }} />
          </div>

          {searchSuggestions.length > 0 ? (
            <>
              <div className="suggestions-divider" />
              {searchSuggestions.map((item, idx) => (
                <div
                  key={item._id}
                  className={`suggestion-item${activeIndex === idx + 1 ? ' active' : ''}`}
                  onClick={() => handleSuggestionClick(item._id)}
                  role="option"
                  aria-selected={activeIndex === idx + 1}
                >
                  <div className="suggestion-image">
                    {item.image ? (
                      <img src={item.image} alt="" />
                    ) : (
                      <div className="no-image-placeholder">
                        <FaSearch />
                      </div>
                    )}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-title">{highlightMatch(item.title, trimmed)}</div>
                    <div className="suggestion-meta">
                      <span className="suggestion-category">{translateCategory(item.category, t)}</span>
                      {item.location && (
                        <>
                          <span className="suggestion-separator">•</span>
                          <span className="suggestion-location">{item.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {item.price != null && (
                    <div className="suggestion-price">
                      {item.price === 0 ? t('mainStage.free', 'Gratuit') : `${item.price} RON`}
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            /* NO RESULTS body (the "Search for X" action is still shown above) */
            <div className="suggestions-empty">
              <span>{t('mainStage.noSuggestions', 'Nu s-au găsit sugestii. Apasă Enter pentru căutare completă.')}</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="main-stage">
      {/* Top Bar */}
      <div className="top-bar">
        {!isMobile && (
          <StaggeredMenu
            className="mainstage-staggered-menu"
            inline={true}
            position="left"
            items={categoryMenuItems}
            socialItems={[]}
            displaySocials={false}
            displayItemNumbering={true}
            showLogo={false}
            closedLabel={t('mainStage.categoriesButton')}
            openLabel={t('mainStage.closeMenu', 'Închide')}
            menuButtonColor="var(--ms-cat-btn-text)"
            openMenuButtonColor="var(--ms-cat-btn-text)"
            changeMenuColorOnOpen={false}
            colors={['#7C92B4', '#324866', '#1A314E']}
            accentColor="#1A314E"
            closeOnClickAway={true}
            showHamburger={true}
            disableButtonAnimation={true}
            onMenuOpen={() => { document.body.classList.add('categories-open'); setMenuOpen(true); }}
            onMenuClose={() => { document.body.classList.remove('categories-open'); document.body.classList.add('categories-closing'); setMenuOpen(false); setTimeout(() => document.body.classList.remove('categories-closing'), 380); }}
          />
        )}

        {!isMobile ? (
          <div className="search-container mainstage-search-desktop" ref={searchContainerRef} role="combobox" aria-expanded={showDropdown} aria-haspopup="listbox">
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, position: 'relative' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder={t('mainStage.searchPlaceholder')} 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                role="searchbox"
                aria-autocomplete="list"
              />
              <div className="location-section" onClick={handleInputClick}>
                <FaMapMarkerAlt className="location-icon" />
                <input 
                  type="text" 
                  placeholder={t('mainStage.locationPlaceholder')} 
                  className="location-input"
                  value={selectedLocalitate || selectedJudet || t('mainStage.locationPlaceholder')}
                  readOnly
                />
              </div>
              <button type="submit" className="search-button">
                <span>{t('mainStage.searchButton')}</span>
                <FaSearch className="search-icon" />
              </button>
              
              {/* Suggestions / Recent Dropdown */}
              {showDropdown && renderSearchDropdown(false)}
            </form>
          </div>
        ) : (
          <Box className="mainstage-search-mobile" ref={searchContainerRef} sx={{ position: 'relative', width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} className="search-bell-wrapper">
              <Paper elevation={3} className="mobile-search-paper" component="form" onSubmit={handleSearchSubmit}>
                <IconButton 
                  size="small" 
                  aria-label="Alege locația" 
                  onClick={handleInputClick}
                >
                  <FaMapMarkerAlt />
                </IconButton>
                <InputBase
                  className="mobile-search-input"
                  placeholder={t('mainStage.searchPlaceholder')}
                  inputProps={{ 'aria-label': t('mainStage.searchButton'), role: 'searchbox' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                />
                <IconButton type="submit" color="primary" aria-label={t('mainStage.searchButton')}>
                  <FaSearch />
                </IconButton>
              </Paper>
              <IconButton 
                className="notif-button-mobile" 
                aria-label="Notificări" 
                onClick={() => navigate('/notificari')}
              >
                <HiOutlineBell />
              </IconButton>
            </Stack>
            
            {/* Mobile Dropdown */}
            {showDropdown && renderSearchDropdown(true)}
          </Box>
        )}

        {/* Location Selection Popover */}
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 160 }}
          PaperProps={{ 
            className: "location-popover",
          }}
        >
          {!selectedJudet ? (
            <>
              <Typography className="popover-title">Alege un județ</Typography>
              <List className="popover-list">
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
                      primary={
                        judet === "Toată țara" ? 
                        <span className="judet-all">Toată țara</span> : 
                        judet
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          ) : (
            <>
              <Typography className="popover-title">Alege localitatea</Typography>
              <List className="popover-list">
                <ListItemButton onClick={() => setSelectedJudet(null)} divider>
                  <ListItemText 
                    primary={<span className="back-to-judete">{t('mainStage.backToCounties')}</span>} 
                  />
                </ListItemButton>
                {getLocalitatiForJudet(selectedJudet).map((localitate) => (
                  <ListItemButton
                    key={localitate}
                    onClick={() => handleLocalitateClick(localitate)}
                    className="localitate-button"
                  >
                    <ListItemText
                      primary={localitate}
                      className="localitate-item"
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Popover>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="main-text">
          <span className="main-tagline-pill">{t('mainStage.tagline')}</span>
          <h1 id="main-title">
            {t('mainStage.title')}
          </h1>
          <p>{t('mainStage.subtitle')}</p>
          <div className="main-cta-buttons">
            <button className="sign-up-button" onClick={() => navigate('/signup')}>
              {t('mainStage.signUp')}
            </button>
            <button className="how-it-works-button">
              <span className="how-it-works-icon">&#9654;</span>
              {t('mainStage.howItWorks')}
            </button>
          </div>
        </div>
        <div className="main-stage-image">
          <img src={hobby} alt="hobby" />
        </div>
      </div>

      {menuOpen && detailsVisible && selectedCategory && categoriesDetails[selectedCategory] && (
        <div className="category-details">
          <div className="category-details-content">
            <h3 className="category-details-title">{selectedCategory}</h3>
            <div className="category-details-grid">
              {categoriesDetails[selectedCategory].columns.map((col, i) => (
                <div key={i} className="detail-column">
                  <div className="detail-title">{col.title}</div>
                  <div className="detail-items">
                    {col.items.map((item, j) => (
                      <Chip key={j} label={item} className="detail-chip" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}