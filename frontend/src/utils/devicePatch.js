// Detectarea dispozitivelor touch primare (telefon / tabletă) și expunerea unei
// lățimi "efective" a ferestrei pentru codul care comută layout-ul.
//
// Istoric: o versiune anterioară patch-uia `window.matchMedia` astfel încât regulile
// mobile (max-width <= 1024px) să se aplice DOAR pe dispozitive touch, ca layout-ul
// desktop să rămână neschimbat pe laptop/PC indiferent de lățimea ferestrei. Efectul
// secundar nedorit: ferestrele înguste din browser-ul desktop (inclusiv extensiile care
// simulează ecrane mici) nu mai primeau layout-ul responsive și randau prost.
//
// Acum revenim la comportamentul responsive clasic, bazat pe lățime: regulile mobile
// se aplică după `max-width`, indiferent de tipul de pointer. `matchMedia` nu mai este
// modificat, iar lățimea efectivă este chiar `window.innerWidth`.
//
// Marcăm în continuare `<html data-device="touch|desktop">` pentru cazurile rare în care
// vrem să targetăm explicit dispozitivele touch din CSS (fără a bloca layout-ul responsive).

const TOUCH_GATE = '(pointer: coarse) and (hover: none)';

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const touchMql = window.matchMedia(TOUCH_GATE);
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
}

export const isTouchPrimaryDevice = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(TOUCH_GATE).matches;
};

// Lățimea reală a ferestrei — codul care comută layout-ul reacționează acum la lățime,
// exact ca regulile CSS responsive.
export const getEffectiveViewportWidth = () => {
  if (typeof window === 'undefined') return 1920;
  return window.innerWidth;
};
