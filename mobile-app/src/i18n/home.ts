import { normalizeLocale } from './index';

export const homeTranslations = {
  ro: {
    mainTitle: 'Ai vreun hobby fain și crezi că e inutil? Găsește oameni care sunt dispuși să plătească pentru el!',
    ctaText: 'Fă din pasiunea ta o sursă de venit!',
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
    mainTitle: 'Got a cool hobby and think it is useless? Find people willing to pay for it!',
    ctaText: 'Turn your passion into a source of income!',
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
    mainTitle: '¿Tienes un hobby genial y crees que es inutil? ¡Encuentra personas dispuestas a pagar por el!',
    ctaText: 'Convierte tu pasion en una fuente de ingresos!',
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
  homeTranslations[normalizeLocale(locale)] as HomeTranslations;
