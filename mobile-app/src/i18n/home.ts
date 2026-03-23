import { getLocaleTranslations } from './index';

export const homeTranslations = {
  ro: {
    mainTitle: '',
    ctaText: '',
    popularTitle: 'Anunțuri populare',
    seeAll: 'Vezi tot',
    loading: 'Se încarcă...',
    showAllAnnouncements: 'Afișați toate anunțurile',
    announcement: 'Anunț',
    seeDetails: 'Vezi detalii  ›',
    exploreCategories: 'Explorează categorii',
    categories: ['Fotografie','Prajituri','Muzica','Reparații','Dans','Curățenie','Gradinarit','Sport','Arta','Tehnologie','Auto','Meditații'],
  },
  en: {
    mainTitle: '',
    ctaText: '',
    popularTitle: 'Popular Announcements',
    seeAll: 'See all',
    loading: 'Loading...',
    showAllAnnouncements: 'Show all announcements',
    announcement: 'Announcement',
    seeDetails: 'See details  ›',
    exploreCategories: 'Explore Categories',
    categories: ['Photography','Cakes','Music','Repairs','Dance','Cleaning','Gardening','Sport','Art','Technology','Auto','Tutoring'],
  },
  es: {
    mainTitle: '',
    ctaText: '',
    popularTitle: 'Anuncios populares',
    seeAll: 'Ver todo',
    loading: 'Cargando...',
    showAllAnnouncements: 'Mostrar todos los anuncios',
    announcement: 'Anuncio',
    seeDetails: 'Ver detalles  ›',
    exploreCategories: 'Explorar categorias',
    categories: ['Fotografia','Pasteleria','Musica','Reparaciones','Danza','Limpieza','Jardineria','Deportes','Arte','Tecnologia','Auto','Clases particulares'],
  },
};

export type HomeTranslations = typeof homeTranslations.ro;

export const getHomeTranslations = (locale?: string) =>
  getLocaleTranslations(homeTranslations, locale) as HomeTranslations;
