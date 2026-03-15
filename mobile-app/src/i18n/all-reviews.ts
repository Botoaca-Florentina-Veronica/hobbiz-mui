import { normalizeLocale } from './index';

export const allReviewsTranslations = {
  ro: {
    allReviews: 'Toate evaluările',
    reviewsFor: 'Evaluările lui',
    loading: 'Se încarcă evaluările...',
    noReviews: 'Nu există evaluări încă',
    error: 'Eroare',
    errorLoading: 'Nu s-au putut încărca evaluările',
    user: 'Utilizator',
    review: 'evaluare',
    reviews: 'evaluări',
  },
  en: {
    allReviews: 'All Reviews',
    reviewsFor: 'Reviews for',
    loading: 'Loading reviews...',
    noReviews: 'No reviews yet',
    error: 'Error',
    errorLoading: 'Could not load reviews',
    user: 'User',
    review: 'review',
    reviews: 'reviews',
  },
  es: {
    allReviews: 'Todas las resenas',
    reviewsFor: 'Resenas de',
    loading: 'Cargando resenas...',
    noReviews: 'Aun no hay resenas',
    error: 'Error',
    errorLoading: 'No se pudieron cargar las resenas',
    user: 'Usuario',
    review: 'resena',
    reviews: 'resenas',
  },
};

export type AllReviewsTranslations = typeof allReviewsTranslations.ro;

export const getAllReviewsTranslations = (locale?: string) =>
  allReviewsTranslations[normalizeLocale(locale)] as AllReviewsTranslations;
