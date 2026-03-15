import { normalizeLocale } from './index';

export const guestModeTranslations = {
  ro: {
    guestLimitedTitle: 'Acces limitat pentru vizitatori',
    guestLimitedMessage: 'Pentru a accesa această funcționalitate, trebuie să te conectezi sau să îți creezi un cont.',
    login: 'Conectează-te',
    signup: 'Creează cont',
    backToExplore: 'Înapoi la Explorează',
  },
  en: {
    guestLimitedTitle: 'Limited access for guests',
    guestLimitedMessage: 'To access this feature, you need to log in or create an account.',
    login: 'Log in',
    signup: 'Sign up',
    backToExplore: 'Back to Explore',
  },
  es: {
    guestLimitedTitle: 'Acceso limitado para invitados',
    guestLimitedMessage: 'Para acceder a esta funcion, necesitas iniciar sesion o crear una cuenta.',
    login: 'Iniciar sesion',
    signup: 'Crear cuenta',
    backToExplore: 'Volver a Explorar',
  },
};

export type GuestModeTranslations = typeof guestModeTranslations.ro;

export const getGuestModeTranslations = (locale?: string) =>
  guestModeTranslations[normalizeLocale(locale)] as GuestModeTranslations;
