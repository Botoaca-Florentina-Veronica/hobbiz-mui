/**
 * Cookie Consent Utility
 * 
 * Acest modul gestionează verificarea și respectarea preferințelor utilizatorului
 * privind cookie-urile non-esențiale (analytics, marketing, funcționalități opționale).
 * 
 * Cookie-uri esențiale care funcționează indiferent de consimțământ:
 * - token: Token JWT pentru autentificare
 * - userId: ID-ul utilizatorului autentificat
 * - connect.sid: Cookie de sesiune server (httpOnly)
 * - i18nextLng: Preferința de limbă
 * - cookie_consent: Starea consimțământului (accepted/rejected)
 */

/**
 * Verifică dacă utilizatorul a acceptat cookie-urile non-esențiale
 * @returns {boolean} true dacă cookie-urile sunt acceptate sau utilizatorul nu a răspuns încă
 */
export function hasConsentForCookies() {
  const consent = localStorage.getItem('cookie_consent');
  // Dacă nu există consimțământ salvat, presupunem că utilizatorul nu a răspuns încă
  // și nu blocăm funcționalitățile (implicit opt-in pentru UX mai bun)
  if (!consent) return true;
  return consent === 'accepted';
}

/**
 * Verifică dacă utilizatorul a refuzat explicit cookie-urile
 * @returns {boolean} true dacă utilizatorul a apăsat "Refuză tot"
 */
export function hasRejectedCookies() {
  const consent = localStorage.getItem('cookie_consent');
  return consent === 'rejected';
}

/**
 * Salvează date în localStorage doar dacă utilizatorul a consimțit
 * @param {string} key - Cheia pentru localStorage
 * @param {string} value - Valoarea de salvat
 * @returns {boolean} true dacă datele au fost salvate, false dacă au fost blocate
 */
export function setConsentedStorage(key, value) {
  // Cookie-uri esențiale care se salvează indiferent de consimțământ
  const essentialKeys = ['token', 'userId', 'i18nextLng', 'cookie_consent'];
  
  if (essentialKeys.includes(key) || hasConsentForCookies()) {
    localStorage.setItem(key, value);
    return true;
  }
  
  console.info(`[Cookie Consent] Blocarea salvării pentru cheia "${key}" - utilizatorul a refuzat cookie-urile non-esențiale.`);
  return false;
}

/**
 * Șterge toate cookie-urile non-esențiale (folosit când utilizatorul refuză)
 */
export function clearNonEssentialCookies() {
  // Cookie-uri esențiale care rămân
  const essentialKeys = ['token', 'userId', 'i18nextLng', 'cookie_consent'];
  
  // Curățăm localStorage
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (!essentialKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Curățăm sessionStorage complet
  sessionStorage.clear();

  // Ștergem cookie-uri non-esențiale din browser
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    // Nu ștergem cookie-urile de sesiune esențiale
    if (cookieName !== 'connect.sid' && cookieName !== 'XSRF-TOKEN') {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}

/**
 * Inițializează analytics doar dacă utilizatorul a consimțit
 * @param {Function} initFunction - Funcția de inițializare analytics (ex: Google Analytics)
 */
export function initAnalyticsIfConsented(initFunction) {
  if (hasConsentForCookies()) {
    initFunction();
  } else {
    console.info('[Cookie Consent] Analytics blocat - utilizatorul nu a acceptat cookie-urile.');
  }
}

/**
 * Resetează consimțământul (util pentru debugging sau schimbări de preferințe)
 */
export function resetConsent() {
  localStorage.removeItem('cookie_consent');
}
