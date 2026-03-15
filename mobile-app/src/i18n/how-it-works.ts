import { normalizeLocale } from './index';

export const howItWorksTranslations = {
  ro: {
    title: 'Cum funcționează?',
    subtitle: 'Descoperă cum să folosești Hobbiz în doar câțiva pași simpli',
    steps: [
      {
        number: 1,
        title: 'Creează-ți contul',
        description: 'Înregistrează-te gratuit cu emailul sau continuă ca invitat. Personalizează-ți profilul cu o fotografie și o scurtă descriere.',
        details: 'Completezi informațiile de bază și, opțional, adaugi avatar și o scurtă descriere. Poți porni în modul invitat și să îți creezi contul mai târziu.'
      },
      {
        number: 2,
        title: 'Publică anunțuri',
        description: 'Creează anunțuri complete cu imagini, descrieri detaliate și preț opțional.',
        details: 'Apasă butonul "+" din ecranul principal pentru a crea un anunț nou. Adaugă până la 5 imagini, alege categoria potrivită, scrie o descriere detaliată și setează un preț sau lasă-l liber pentru negociere. Poți edita sau șterge anunțurile tale oricând din secțiunea "Anunțurile mele".'
      },
      {
        number: 3,
        title: 'Conectează-te',
        description: 'Discută direct cu ceilalți utilizatori prin sistemul de mesagerie integrat.',
        details: 'Chat integrat pentru întrebări rapide și negocieri. Primești notificări despre mesaje noi sau activitate pe anunțurile tale.'
      },
      {
        number: 4,
        title: 'Colaborează smart',
        description: 'Acceptă prețul direct sau negociază sume personalizate pentru colaborări flexibile.',
        details: 'Dacă anunțul are preț setat, poți accepta direct cu butonul "Vrei să colaborăm?" - balanța vânzătorului va fi actualizată automat. Altfel, poți negocia o sumă customizată prin sistemul de oferte și contraoferte.'
      },
      {
        number: 5,
        title: 'Gestionează anunțurile',
        description: 'Arhivează anunțurile inactive și organizează-le eficient.',
        details: 'Din secțiunea "Anunțurile mele" poți vedea toate anunțurile tale active. Dacă un serviciu este indisponibil temporar, poți să-l arhivezi pentru a-l ascunde din listări publice, dar îl poți reactiva oricând. Anunțurile arhivate rămân salvate în contul tău.'
      },
      {
        number: 6,
        title: 'Lasă recenzii',
        description: 'Construiește reputația ta prin feedback autentic din partea comunității.',
        details: 'După o colaborare reușită, utilizatorii pot lăsa recenzii cu rating de la 1 la 5 stele și comentarii. Recenziile apar pe profilul tău și ajută la construirea încrederii în comunitate. Poți vedea toate recenziile tale în secțiunea de profil.'
      }
    ],
    features: [
      { icon: 'pricetag-outline', title: 'Prețuri flexibile', description: 'Setează prețuri fixe pentru tranzacții rapide sau permite negocierea.' },
      { icon: 'flash-outline', title: 'Colaborare instantanee', description: 'Acceptă prețurile direct pentru actualizarea automată a balanței.' },
      { icon: 'chatbubbles-outline', title: 'Negociere avansată', description: 'Sistem complet de oferte și contraoferte pentru sume personalizate.' },
      { icon: 'shield-checkmark-outline', title: 'Tranzacții sigure', description: 'Toate colaborările sunt înregistrate și securizate în platformă.' },
      { icon: 'images-outline', title: 'Galerie foto', description: 'Adaugă până la 5 imagini la fiecare anunț pentru prezentare completă.' },
      { icon: 'archive-outline', title: 'Arhivare anunțuri', description: 'Ascunde temporar anunțurile inactive și reactivează-le când dorești.' },
      { icon: 'star-outline', title: 'Sistem de recenzii', description: 'Evaluează colaborările și construiește-ți reputația în comunitate.' },
      { icon: 'notifications-outline', title: 'Notificări instant', description: 'Fii la curent cu mesaje noi, oferte și activitate pe anunțuri.' }
    ],
    cta: {
      title: 'Gata să începi?',
      description: 'Alătură-te comunității noastre și începe să colaborezi cu oameni cu aceleași pasiuni!',
      button: 'Explorează anunțuri'
    }
  },
  en: {
    title: 'How it works?',
    subtitle: 'Discover how to use Hobbiz in just a few simple steps',
    steps: [
      {
        number: 1,
        title: 'Create your account',
        description: 'Register for free with your email or continue as a guest. Customize your profile with a photo and short description.',
        details: 'Fill in basic information and optionally add an avatar and short description. You can start in guest mode and create your account later.'
      },
      {
        number: 2,
        title: 'Post listings',
        description: 'Create complete listings with images, detailed descriptions, and optional pricing.',
        details: 'Tap the "+" button on the main screen to create a new listing. Add up to 5 images, choose the right category, write a detailed description, and set a price or leave it open for negotiation. You can edit or delete your listings anytime from the "My Listings" section.'
      },
      {
        number: 3,
        title: 'Connect',
        description: 'Communicate directly with other users through the integrated messaging system.',
        details: 'Integrated chat for quick questions and negotiations. You receive notifications about new messages or activity on your listings.'
      },
      {
        number: 4,
        title: 'Smart collaboration',
        description: 'Accept direct pricing or negotiate custom amounts for flexible collaborations.',
        details: 'If the listing has a set price, you can accept directly with the "Want to collaborate?" button - the seller\'s balance will be updated automatically. Otherwise, you can negotiate a custom amount through the offer and counteroffer system.'
      },
      {
        number: 5,
        title: 'Manage listings',
        description: 'Archive inactive listings and organize them efficiently.',
        details: 'From the "My Listings" section, you can see all your active listings. When a service is no longer available, you can archive it to hide it from public listings, but you can reactivate it anytime. Archived listings remain saved in your account.'
      },
      {
        number: 6,
        title: 'Leave reviews',
        description: 'Build your reputation through authentic feedback from the community.',
        details: 'After a successful collaboration, users can leave reviews with ratings from 1 to 5 stars and comments. Reviews appear on your profile and help build trust in the community. You can see all your reviews in the profile section.'
      }
    ],
    features: [
      { icon: 'pricetag-outline', title: 'Flexible pricing', description: 'Set fixed prices for quick transactions or allow negotiation.' },
      { icon: 'flash-outline', title: 'Instant collaboration', description: 'Accept prices directly for automatic balance updates.' },
      { icon: 'chatbubbles-outline', title: 'Advanced negotiation', description: 'Complete system of offers and counteroffers for custom amounts.' },
      { icon: 'shield-checkmark-outline', title: 'Safe transactions', description: 'All collaborations are recorded and secured in the platform.' },
      { icon: 'images-outline', title: 'Photo gallery', description: 'Add up to 5 images to each listing for complete presentation.' },
      { icon: 'archive-outline', title: 'Archive listings', description: 'Temporarily hide inactive listings and reactivate them when you want.' },
      { icon: 'star-outline', title: 'Review system', description: 'Rate collaborations and build your reputation in the community.' },
      { icon: 'notifications-outline', title: 'Instant notifications', description: 'Stay updated with new messages, offers, and activity on listings.' }
    ],
    cta: {
      title: 'Ready to start?',
      description: 'Join our community and start collaborating with people who share your passions!',
      button: 'Explore listings'
    }
  },
  es: {
    title: 'Como funciona?',
    subtitle: 'Descubre como usar Hobbiz en solo unos pasos sencillos',
    steps: [
      {
        number: 1,
        title: 'Crea tu cuenta',
        description: 'Registrate gratis con tu email o continua como invitado. Personaliza tu perfil con una foto y una breve descripcion.',
        details: 'Completa la informacion basica y, opcionalmente, agrega un avatar y una breve descripcion. Puedes empezar en modo invitado y crear tu cuenta mas tarde.'
      },
      {
        number: 2,
        title: 'Publica anuncios',
        description: 'Crea anuncios completos con imagenes, descripciones detalladas y precio opcional.',
        details: 'Toca el boton "+" en la pantalla principal para crear un anuncio nuevo. Agrega hasta 5 imagenes, elige la categoria adecuada, escribe una descripcion detallada y define un precio o dejalo abierto a negociacion. Puedes editar o eliminar tus anuncios cuando quieras en la seccion "Mis anuncios".'
      },
      {
        number: 3,
        title: 'Conectate',
        description: 'Comunicate directamente con otros usuarios mediante la mensajeria integrada.',
        details: 'Chat integrado para preguntas rapidas y negociaciones. Recibes notificaciones sobre nuevos mensajes o actividad en tus anuncios.'
      },
      {
        number: 4,
        title: 'Colabora de forma inteligente',
        description: 'Acepta el precio directo o negocia montos personalizados para colaboraciones flexibles.',
        details: 'Si el anuncio tiene precio establecido, puedes aceptar directamente con el boton "Quieres colaborar?" - el saldo del vendedor se actualizara automaticamente. Si no, puedes negociar un monto personalizado mediante el sistema de ofertas y contraofertas.'
      },
      {
        number: 5,
        title: 'Gestiona tus anuncios',
        description: 'Archiva anuncios inactivos y organizalos de forma eficiente.',
        details: 'Desde la seccion "Mis anuncios" puedes ver todos tus anuncios activos. Si un servicio no esta disponible temporalmente, puedes archivarlo para ocultarlo de los listados publicos, pero puedes reactivarlo en cualquier momento. Los anuncios archivados permanecen guardados en tu cuenta.'
      },
      {
        number: 6,
        title: 'Deja resenas',
        description: 'Construye tu reputacion con feedback autentico de la comunidad.',
        details: 'Despues de una colaboracion exitosa, los usuarios pueden dejar resenas con valoraciones de 1 a 5 estrellas y comentarios. Las resenas aparecen en tu perfil y ayudan a generar confianza en la comunidad. Puedes ver todas tus resenas en la seccion de perfil.'
      }
    ],
    features: [
      { icon: 'pricetag-outline', title: 'Precios flexibles', description: 'Establece precios fijos para transacciones rapidas o permite la negociacion.' },
      { icon: 'flash-outline', title: 'Colaboracion instantanea', description: 'Acepta precios directamente para actualizar el saldo automaticamente.' },
      { icon: 'chatbubbles-outline', title: 'Negociacion avanzada', description: 'Sistema completo de ofertas y contraofertas para montos personalizados.' },
      { icon: 'shield-checkmark-outline', title: 'Transacciones seguras', description: 'Todas las colaboraciones quedan registradas y seguras en la plataforma.' },
      { icon: 'images-outline', title: 'Galeria de fotos', description: 'Agrega hasta 5 imagenes a cada anuncio para una presentacion completa.' },
      { icon: 'archive-outline', title: 'Archivado de anuncios', description: 'Oculta temporalmente anuncios inactivos y reactivalos cuando quieras.' },
      { icon: 'star-outline', title: 'Sistema de resenas', description: 'Califica colaboraciones y construye tu reputacion en la comunidad.' },
      { icon: 'notifications-outline', title: 'Notificaciones instantaneas', description: 'Mantente al dia con mensajes nuevos, ofertas y actividad en anuncios.' }
    ],
    cta: {
      title: 'Listo para empezar?',
      description: 'Unete a nuestra comunidad y empieza a colaborar con personas que comparten tus pasiones!',
      button: 'Explorar anuncios'
    }
  }
};

export type HowItWorksTranslations = typeof howItWorksTranslations.ro;

export const getHowItWorksTranslations = (locale?: string) =>
  howItWorksTranslations[normalizeLocale(locale)] as HowItWorksTranslations;
