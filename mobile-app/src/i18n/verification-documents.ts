import { normalizeLocale } from './index';

export const verificationDocumentsTranslations = {
  ro: {
    verifyWhyTitle: 'De ce să îți verifici profilul?',
    verifyWhyBody: "Încărcarea documentelor profesionale (diplome, certificări, atestate) ajută la construirea încrederii în rândul clienților. După verificare, vei primi un badge de 'Utilizator Verificat'.",
    documentsHeader: 'Documente de Verificare',
    documentsHeaderAdminPrefix: 'Documente',
    uploadButtonText: 'Încarcă Document',
    adminModeTitle: 'Mod Administrator',
    adminViewing: 'Vizualizezi documentele utilizatorului',
    verificationStatus: 'Status verificare',
    verifiedLabel: 'Verificat',
    notVerifiedLabel: 'Neverificat',
    user: 'Utilizator',
    loadError: 'Nu s-au putut încărca documentele.',
    pickError: 'Nu s-a putut selecta documentul.',
    nameRequired: 'Te rugăm să introduci un nume pentru document.',
  },
  en: {
    verifyWhyTitle: 'Why verify your profile?',
    verifyWhyBody: "Uploading professional documents (diplomas, certificates, authorizations) helps build trust with customers. After verification, you'll receive a 'Verified User' badge.",
    documentsHeader: 'Verification Documents',
    documentsHeaderAdminPrefix: 'Documents',
    uploadButtonText: 'Upload Document',
    adminModeTitle: 'Admin Mode',
    adminViewing: "You're viewing the user's documents",
    verificationStatus: 'Verification status',
    verifiedLabel: 'Verified',
    notVerifiedLabel: 'Not verified',
    user: 'User',
    loadError: 'Could not load documents.',
    pickError: 'Could not select document.',
    nameRequired: 'Please enter a name for the document.',
  },
  es: {
    verifyWhyTitle: 'Por que verificar tu perfil?',
    verifyWhyBody: "Subir documentos profesionales (diplomas, certificados, autorizaciones) ayuda a generar confianza con los clientes. Tras la verificacion, recibiras una insignia de 'Usuario Verificado'.",
    documentsHeader: 'Documentos de verificacion',
    documentsHeaderAdminPrefix: 'Documentos',
    uploadButtonText: 'Subir documento',
    adminModeTitle: 'Modo administrador',
    adminViewing: 'Estas viendo los documentos del usuario',
    verificationStatus: 'Estado de verificacion',
    verifiedLabel: 'Verificado',
    notVerifiedLabel: 'No verificado',
    user: 'Usuario',
    loadError: 'No se pudieron cargar los documentos.',
    pickError: 'No se pudo seleccionar el documento.',
    nameRequired: 'Por favor ingresa un nombre para el documento.',
  },
};

export type VerificationDocumentsTranslations = typeof verificationDocumentsTranslations.ro;

export const getVerificationDocumentsTranslations = (locale?: string) =>
  verificationDocumentsTranslations[normalizeLocale(locale)] as VerificationDocumentsTranslations;
