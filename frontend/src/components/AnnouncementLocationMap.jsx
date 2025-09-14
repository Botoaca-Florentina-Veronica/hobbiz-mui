import React, { useEffect, useState } from 'react';
import './AnnouncementLocationMap.css';

// Componentă ce afișează un headline "Locație" + hartă Google Maps prin iframe.
// Folosește cheia din Vite: import.meta.env.VITE_GOOGLE_MAPS_KEY (opțional).
// Dacă nu există sau este invalidă, cade pe un embed public (search) fără cheie.
export default function AnnouncementLocationMap({ location, darkMode = false, height = 260 }) {
  const [encoded, setEncoded] = useState('');
  const [src, setSrc] = useState('');
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!location) return;
    const enc = encodeURIComponent(location);
    setEncoded(enc);
    const key = import.meta?.env?.VITE_GOOGLE_MAPS_KEY;
    if (key) {
      // încercă varianta Embed API (place). Dacă utilizatorul nu are activată API-ul sau cheia e invalidă,
      // mesajul de eroare va apărea în iframe, dar oferim un buton fallback.
      setSrc(`https://www.google.com/maps/embed/v1/place?key=${key}&q=${enc}`);
    } else {
      // fallback fără cheie
      setSrc(`https://www.google.com/maps?q=${enc}&output=embed`);
    }
  }, [location]);

  if (!location) return null;

  return (
    <div className={`announcement-location-map-box ${darkMode ? 'dark-mode' : ''}`}>      
      <div className="alm-header">Locație</div>
      <div className="alm-map-wrapper" style={{ height }}>
        {src && (
          <iframe
            title={`Harta pentru ${location}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={src}
            allowFullScreen
            onError={() => setErrored(true)}
          />
        )}
        {errored && (
          <div className="alm-error-msg">
            Nu s-a putut încărca harta.
            <br />
            <a href={`https://www.google.com/maps/search/?api=1&query=${encoded}`} target="_blank" rel="noopener noreferrer">Deschide în Google Maps</a>
          </div>
        )}
      </div>
      <div className="alm-location-label">📍 {location}</div>
    </div>
  );
}
