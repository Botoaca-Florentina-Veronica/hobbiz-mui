import React, { useEffect, useState } from 'react';
import './AnnouncementLocationMap.css';
import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Componentă ce afișează un headline "Locație" + hartă Google Maps prin iframe.
// Folosește cheia din Vite: import.meta.env.VITE_GOOGLE_MAPS_KEY (opțional).
// Dacă nu există sau este invalidă, cade pe un embed public (search) fără cheie.
export default function AnnouncementLocationMap({ location, darkMode = false, height = 260, accentColor = '#2D4361' }) {
  const { t } = useTranslation();
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
    <Card elevation={2} className={`announcement-location-map-box seller-card ${darkMode ? 'dark-mode' : ''}`} sx={{ overflow: 'hidden', mt: 0 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight:600, mb: 2, color: accentColor }}>
          {t('announcementLocationMap.title')}
        </Typography>
        <Box className="alm-map-wrapper" sx={{ height, borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          {src && (
            <iframe
              title={t('announcementLocationMap.mapTitle', { location })}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={src}
              allowFullScreen
              onError={() => setErrored(true)}
            />
          )}
          {errored && (
            <div className="alm-error-msg">
              {t('announcementLocationMap.loadError')}
              <br />
              <a href={`https://www.google.com/maps/search/?api=1&query=${encoded}`} target="_blank" rel="noopener noreferrer">
                {t('announcementLocationMap.openInMaps')}
              </a>
            </div>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" className="alm-location-label" sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <span role="img" aria-label={t('announcementLocationMap.pinAria')}>📍</span> {location}
        </Typography>
      </CardContent>
    </Card>
  );
}
