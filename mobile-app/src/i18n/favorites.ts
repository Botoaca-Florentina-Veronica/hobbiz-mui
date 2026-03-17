import { getLocaleTranslations } from './index';

export const favoritesTranslations = {
  ro: {
    favorites: 'Favorite',
    back: 'înapoi',
    favoriteAnnouncements: 'Anunțuri favorite',
    loading: 'Se încarcă favorite...',
    loginRequired: 'Autentifică-te',
    loginMessage: 'Pentru a vedea anunțurile tale favorite',
    goToLogin: 'Mergi la autentificare',
    noFavorites: 'Niciun anunț favorit',
    noFavoritesMessage: 'Știi ce înseamnă asta, e timpul să îți adaugi!',
    posted: 'POSTAT',
  },
  en: {
    favorites: 'Favorite',
    back: 'back',
    favoriteAnnouncements: 'Favorite Announcements',
    loading: 'Loading favorites...',
    loginRequired: 'Login Required',
    loginMessage: 'To see your favorite announcements',
    goToLogin: 'Go to Login',
    noFavorites: 'No favorite announcements',
    noFavoritesMessage: 'You know what that means, time to add some!',
    posted: 'POSTED',
  },
  es: {
    favorites: 'Favoritos',
    back: 'volver',
    favoriteAnnouncements: 'Anuncios favoritos',
    loading: 'Cargando favoritos...',
    loginRequired: 'Se requiere iniciar sesion',
    loginMessage: 'Para ver tus anuncios favoritos',
    goToLogin: 'Ir a iniciar sesion',
    noFavorites: 'No hay anuncios favoritos',
    noFavoritesMessage: 'Ya sabes lo que significa, es hora de agregar algunos!',
    posted: 'PUBLICADO',
  },
};

export type FavoritesTranslations = typeof favoritesTranslations.ro;

export const getFavoritesTranslations = (locale?: string) =>
  getLocaleTranslations(favoritesTranslations, locale) as FavoritesTranslations;
