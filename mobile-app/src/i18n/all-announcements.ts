import { getLocaleTranslations } from './index';

export const allAnnouncementsTranslations = {
  ro: {
    title: 'Toate anunțurile',
    loading: 'Se încarcă anunțurile...',
    noAnnouncements: 'Nu există anunțuri',
    posted: 'POSTAT',
  },
  en: {
    title: 'All announcements',
    loading: 'Loading announcements...',
    noAnnouncements: 'No announcements found',
    posted: 'POSTED',
  },
  es: {
    title: 'Todos los anuncios',
    loading: 'Cargando anuncios...',
    noAnnouncements: 'No se encontraron anuncios',
    posted: 'PUBLICADO',
  },
};

export type AllAnnouncementsTranslations = typeof allAnnouncementsTranslations.ro;

export const getAllAnnouncementsTranslations = (locale?: string) =>
  getLocaleTranslations(allAnnouncementsTranslations, locale) as AllAnnouncementsTranslations;
