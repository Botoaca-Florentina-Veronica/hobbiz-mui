import { normalizeLocale } from './index';

export const chatTranslations = {
  ro: {
    messages: 'Mesaje',
    continueConversations: 'Continuă conversațiile tale',
    buying: 'De cumpărat',
    selling: 'De vândut',
    loadingConversations: 'Se încarcă conversațiile...',
    noConversations: 'Nu ai conversații',
    startWriting: 'E momentul tău Eminescu, începe să scrii!',
  },
  en: {
    messages: 'Messages',
    continueConversations: 'Continue your conversations',
    buying: 'Buying',
    selling: 'Selling',
    loadingConversations: 'Loading conversations...',
    noConversations: 'You have no conversations',
    startWriting: "It's your moment, start writing!",
  },
  es: {
    messages: 'Mensajes',
    continueConversations: 'Continua tus conversaciones',
    buying: 'Compras',
    selling: 'Ventas',
    loadingConversations: 'Cargando conversaciones...',
    noConversations: 'No tienes conversaciones',
    startWriting: 'Es tu momento, empieza a escribir!',
  },
};

export type ChatTranslations = typeof chatTranslations.ro;

export const getChatTranslations = (locale?: string) =>
  chatTranslations[normalizeLocale(locale)] as ChatTranslations;
