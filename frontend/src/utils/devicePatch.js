// Strategie pentru "păstrează aspectul desktop pe laptop/PC indiferent de lățimea ferestrei":
// detectăm dispozitivele touch primare (telefon / tabletă) prin `(pointer: coarse) and (hover: none)`
// și permitem regulilor mobile (CSS + JS) să se aplice DOAR pe aceste dispozitive.
//
// Acest fișier face două lucruri la import-time (side effect):
//   1) Patch-uiește `window.matchMedia` astfel încât orice query care conține `max-width`
//      să fie augmentat cu `and (pointer: coarse) and (hover: none)`. Acoperă automat:
//        - apelurile directe `window.matchMedia('(max-width: 1024px)')` din cod,
//        - hook-ul `useMediaQuery` din MUI (care folosește matchMedia intern),
//        - orice cod viitor care urmează același pattern.
//   2) Marchează `<html data-device="touch|desktop">` pentru cazurile rare unde vrem
//      să targetăm desktop-ul explicit din CSS.
//
// Regulile `@media` din fișierele CSS sunt închise pe touch-only printr-un plugin
// PostCSS configurat în `vite.config.js`.

const MAX_WIDTH_VALUE_RE = /max-width\s*:\s*(\d+(?:\.\d+)?)\s*px/i;
const ALREADY_GATED_RE = /(pointer|hover)\s*:/i;
const TOUCH_GATE = '(pointer: coarse) and (hover: none)';
const MOBILE_MAX_WIDTH = 1024;

const isMobileTargetedQuery = (queryPart) => {
  if (ALREADY_GATED_RE.test(queryPart)) return false;
  const match = queryPart.match(MAX_WIDTH_VALUE_RE);
  if (!match) return false;
  return parseFloat(match[1]) <= MOBILE_MAX_WIDTH;
};

const augmentQuery = (query) => {
  if (typeof query !== 'string') return query;
  return query
    .split(',')
    .map((part) => part.trim())
    .map((part) => (isMobileTargetedQuery(part) ? `${part} and ${TOUCH_GATE}` : part))
    .join(', ');
};

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const original = window.matchMedia.bind(window);
  // Apelăm direct `original` ca să evităm recursivitatea când întrebăm despre TOUCH_GATE.
  const touchMql = original(TOUCH_GATE);
  const applyDeviceAttr = (matches) => {
    if (document && document.documentElement) {
      document.documentElement.dataset.device = matches ? 'touch' : 'desktop';
    }
  };
  applyDeviceAttr(touchMql.matches);
  const onChange = (event) => applyDeviceAttr(event.matches);
  if (touchMql.addEventListener) {
    touchMql.addEventListener('change', onChange);
  } else if (touchMql.addListener) {
    touchMql.addListener(onChange);
  }

  window.matchMedia = (query) => original(augmentQuery(query));
}

export const isTouchPrimaryDevice = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  // TOUCH_GATE nu conține `max-width`, deci patch-ul îl lasă neschimbat.
  return window.matchMedia(TOUCH_GATE).matches;
};

// Returnează o lățime "efectivă" pentru cod care comută layout-ul pe baza lățimii ferestrei.
// Pe desktop returnăm cel puțin 1280 ca să nu trigerăm vreun threshold de mobil.
export const getEffectiveViewportWidth = () => {
  if (typeof window === 'undefined') return 1920;
  const real = window.innerWidth;
  return isTouchPrimaryDevice() ? real : Math.max(real, 1280);
};
