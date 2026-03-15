import { normalizeLocale } from './index';

export const welcomeTranslations = {
  ro: {
    login: 'Conectează-te',
    signup: 'Înregistrează-te',
    noAccount: 'Nu ai cont?',
    welcome: 'Bine ai venit',
    subtitle: 'Transformă-ți hobby-urile în oportunități de câștig',
    guestMode: 'Navighează ca vizitator',
  },
  en: {
    login: 'Log in',
    signup: 'Sign up',
    noAccount: "Don't have an account?",
    welcome: 'Welcome',
    subtitle: 'Turn your hobbies into earning opportunities',
    guestMode: 'Browse as guest',
  },
  es: {
    login: 'Iniciar sesion',
    signup: 'Registrarse',
    noAccount: 'No tienes cuenta?',
    welcome: 'Bienvenido',
    subtitle: 'Convierte tus hobbies en oportunidades de ingreso',
    guestMode: 'Navegar como invitado',
  },
};

export type WelcomeTranslations = typeof welcomeTranslations.ro;

export const getWelcomeTranslations = (locale?: string) =>
  welcomeTranslations[normalizeLocale(locale)] as WelcomeTranslations;
