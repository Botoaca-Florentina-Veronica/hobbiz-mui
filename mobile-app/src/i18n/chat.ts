import { getLocaleTranslations } from './index';

export const chatTranslations = {
  ro: {
    messages: 'Mesaje',
    continueConversations: 'Continuă conversațiile tale',
    buying: 'De cumpărat',
    selling: 'De vândut',
    loadingConversations: 'Se încarcă conversațiile...',
    noConversations: 'Nu ai conversații',
    startWriting: 'E momentul tău Eminescu, începe să scrii!',
    collaborationRequest: 'Cerere de colaborare',
    negotiationOffer: 'Propunere de preț',
  },
  en: {
    messages: 'Messages',
    continueConversations: 'Continue your conversations',
    buying: 'Buying',
    selling: 'Selling',
    loadingConversations: 'Loading conversations...',
    noConversations: 'You have no conversations',
    startWriting: "It's your moment, start writing!",
    collaborationRequest: 'Collaboration request',
    negotiationOffer: 'Price proposal',
  },
  es: {
    messages: 'Mensajes',
    continueConversations: 'Continua tus conversaciones',
    buying: 'Compras',
    selling: 'Ventas',
    loadingConversations: 'Cargando conversaciones...',
    noConversations: 'No tienes conversaciones',
    startWriting: 'Es tu momento, empieza a escribir!',
    collaborationRequest: 'Solicitud de colaboración',
    negotiationOffer: 'Propuesta de precio',
  },
};

export type ChatTranslations = typeof chatTranslations.ro;

export const getChatTranslations = (locale?: string) =>
  getLocaleTranslations(chatTranslations, locale) as ChatTranslations;
