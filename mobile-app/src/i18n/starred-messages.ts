import { normalizeLocale } from './index';

export const starredMessagesTranslations = {
  ro: {
    title: 'Mesaje cu stea',
    image: 'Imagine',
    message: 'Mesaj',
    noMessages: 'Nu ai mesaje salvate cu stea.',
    error: 'Eroare',
    loadError: 'Nu s-au putut încărca mesajele favorite.',
  },
  en: {
    title: 'Starred Messages',
    image: 'Image',
    message: 'Message',
    noMessages: 'You have no saved starred messages.',
    error: 'Error',
    loadError: 'Could not load favorite messages.',
  },
  es: {
    title: 'Mensajes destacados',
    image: 'Imagen',
    message: 'Mensaje',
    noMessages: 'No tienes mensajes destacados guardados.',
    error: 'Error',
    loadError: 'No se pudieron cargar los mensajes favoritos.',
  },
};

export type StarredMessagesTranslations = typeof starredMessagesTranslations.ro;

export const getStarredMessagesTranslations = (locale?: string) =>
  starredMessagesTranslations[normalizeLocale(locale)] as StarredMessagesTranslations;
