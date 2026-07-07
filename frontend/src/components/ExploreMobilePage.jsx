import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient, { searchAnnouncements } from '../api/api';
import hobbyImage from '../assets/images/principala.jpg';
import { categories } from './Categories';
import './ExploreMobilePage.css';

const MOBILE_TEXT = {
  ro: {
    seeAll: 'Vezi tot',
    showAllAnnouncements: 'Afiseaza toate anunturile',
    seeDetails: 'Vezi detalii',
    announcement: 'Anunt',
    loading: 'Se incarca...'
  },
  en: {
    seeAll: 'See all',
    showAllAnnouncements: 'Show all announcements',
    seeDetails: 'See details',
    announcement: 'Announcement',
    loading: 'Loading...'
  },
  es: {
    seeAll: 'Ver todo',
    showAllAnnouncements: 'Mostrar todos los anuncios',
    seeDetails: 'Ver detalles',
    announcement: 'Anuncio',
    loading: 'Cargando...'
  }
};

function getLocaleCode(i18n) {
  const lang = (i18n?.resolvedLanguage || i18n?.language || 'ro').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  return 'ro';
}

function resolveImageUrl(image) {
  if (!image) return '';
  if (typeof image !== 'string') return '';
  if (image.startsWith('http') || image.startsWith('/uploads')) return image;
  const fileName = image.replace(/^.*[\\/]/, '');
  return `/uploads/${fileName}`;
}

export default function ExploreMobilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const [popular, setPopular] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const localeCode = getLocaleCode(i18n);
  const labels = MOBILE_TEXT[localeCode] || MOBILE_TEXT.ro;

  const searchTerm = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('search') || '').trim();
  }, [location.search]);

  useEffect(() => {
    let active = true;

    const loadPopular = async () => {
      setPopularLoading(true);
      try {
        const res = await apiClient.get('/api/announcements/popular?limit=8');
        if (!active) return;
        setPopular(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!active) return;
        setPopular([]);
      } finally {
        if (active) setPopularLoading(false);
      }
    };

    loadPopular();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setSearching(false);
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    searchAnnouncements(searchTerm, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSearchResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });

    return () => controller.abort();
  }, [searchTerm]);

  const visibleAnnouncements = searchTerm ? searchResults : popular;
  const sectionTitle = searchTerm ? t('content.searchResults') : t('content.popularTitle');

  return (
    <div className="explore-mobile-page" role="main">
      <section className="explore-mobile-hero">
        <div className="explore-mobile-image-wrap">
          <img src={hobbyImage} alt="Hobbiz" className="explore-mobile-image" loading="eager" />
        </div>
      </section>

      <section className="explore-mobile-section">
        <div className="explore-mobile-section-header">
          <h2>{sectionTitle}</h2>
          <button
            type="button"
            className="explore-mobile-see-all"
            onClick={() => navigate('/toate-anunturile')}
          >
            {labels.seeAll}
          </button>
        </div>

        {popularLoading || searching ? (
          <p className="explore-mobile-loading">{labels.loading}</p>
        ) : (
          <div className="explore-mobile-cards-grid">
            {visibleAnnouncements.slice(0, 8).map((item) => {
              const cardTitle = item?.title || item?.description || labels.announcement;
              const imageUrl = resolveImageUrl(item?.images?.[0]);

              return (
                <article
                  key={item._id}
                  className="explore-mobile-card"
                  onClick={() => navigate(`/announcement/${item._id}`)}
                >
                  <div className="explore-mobile-card-image-wrap">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={cardTitle}
                        loading="lazy"
                        className="explore-mobile-card-image"
                      />
                    ) : (
                      <div className="explore-mobile-card-image-fallback">{labels.announcement}</div>
                    )}
                  </div>

                  <h3 className="explore-mobile-card-title">{cardTitle}</h3>

                  <div className="explore-mobile-card-meta">
                    {item?.location ? (
                      <span className="explore-mobile-pill">{item.location}</span>
                    ) : null}
                    {item?.createdAt ? (
                      <span className="explore-mobile-pill">
                        {new Date(item.createdAt).toLocaleDateString(
                          localeCode === 'en' ? 'en-US' : localeCode === 'es' ? 'es-ES' : 'ro-RO',
                          { day: '2-digit', month: 'long', year: 'numeric' }
                        )}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="explore-mobile-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/announcement/${item._id}`);
                    }}
                  >
                    {labels.seeDetails}
                  </button>
                </article>
              );
            })}

            {visibleAnnouncements.length % 2 === 1 ? (
              <button
                type="button"
                className="explore-mobile-card explore-mobile-placeholder"
                onClick={() => navigate('/toate-anunturile')}
              >
                {labels.showAllAnnouncements}
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className="explore-mobile-section">
        <div className="explore-mobile-section-header explore-mobile-section-header-start">
          <h2>{t('categories.title')}</h2>
        </div>

        <div className="explore-mobile-categories-grid">
          {categories.map((category) => (
            <button
              type="button"
              key={category.key}
              className="explore-mobile-category-card"
              onClick={() => navigate(`/anunturi-categorie/${encodeURIComponent(category.description)}`)}
            >
              <div
                className="explore-mobile-category-bg"
                style={{
                  background: `linear-gradient(135deg, ${category.color}66 0%, ${category.color}1A 100%)`
                }}
                aria-hidden="true"
              />
              <img
                src={category.image}
                alt={t(`categories.${category.key}`)}
                loading="lazy"
                className="explore-mobile-category-image"
              />
              <span className="explore-mobile-category-label">{t(`categories.${category.key}`)}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
