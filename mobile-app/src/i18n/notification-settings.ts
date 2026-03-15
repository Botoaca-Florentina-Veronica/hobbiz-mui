import { normalizeLocale } from './index';

export const notificationSettingsTranslations = {
  ro: {
    title: 'Setări Notificări',
    email: 'Notificări prin Email',
    emailDesc: 'Primește actualizări importante pe email',
    push: 'Notificări Push',
    pushDesc: 'Primește notificări pe telefon',
    messages: 'Mesaje Noi',
    messagesDesc: 'Notificări când primești un mesaj nou',
    reviews: 'Recenzii Noi',
    reviewsDesc: 'Notificări când primești o recenzie nouă',
    favorites: 'Anunțuri Adăugate la Favorite',
    favoritesDesc: 'Notificări când cineva adaugă anunțurile tale la favorite',
    promotions: 'Promoții și Noutăți',
    promotionsDesc: 'Fii la curent cu ultimele noutăți',
    saveSuccess: 'Setările au fost salvate',
    saveError: 'Nu s-au putut salva setările',
  },
  en: {
    title: 'Notification Settings',
    email: 'Email Notifications',
    emailDesc: 'Receive important updates via email',
    push: 'Push Notifications',
    pushDesc: 'Receive notifications on your phone',
    messages: 'New Messages',
    messagesDesc: 'Notify when you receive a new message',
    reviews: 'New Reviews',
    reviewsDesc: 'Notify when you receive a new review',
    favorites: 'Announcements Added to Favorites',
    favoritesDesc: 'Notify when someone adds your announcements to favorites',
    promotions: 'Promotions & News',
    promotionsDesc: 'Stay updated with the latest news',
    saveSuccess: 'Settings saved successfully',
    saveError: 'Could not save settings',
  },
  es: {
    title: 'Ajustes de notificaciones',
    email: 'Notificaciones por email',
    emailDesc: 'Recibe actualizaciones importantes por email',
    push: 'Notificaciones push',
    pushDesc: 'Recibe notificaciones en tu telefono',
    messages: 'Mensajes nuevos',
    messagesDesc: 'Notificar cuando recibas un mensaje nuevo',
    reviews: 'Resenas nuevas',
    reviewsDesc: 'Notificar cuando recibas una resena nueva',
    favorites: 'Anuncios agregados a favoritos',
    favoritesDesc: 'Notificar cuando alguien agrega tus anuncios a favoritos',
    promotions: 'Promociones y novedades',
    promotionsDesc: 'Mantente al dia con las ultimas novedades',
    saveSuccess: 'Los ajustes se guardaron correctamente',
    saveError: 'No se pudieron guardar los ajustes',
  },
};

export type NotificationSettingsTranslations = typeof notificationSettingsTranslations.ro;

export const getNotificationSettingsTranslations = (locale?: string) =>
  notificationSettingsTranslations[normalizeLocale(locale)] as NotificationSettingsTranslations;
