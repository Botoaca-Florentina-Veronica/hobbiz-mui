import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/api';

// Modal care apare după login dacă există favorite salvate ca guest
export default function SyncFavoritesModal() {
  const { user, favorites: serverFavorites, refreshUser } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [guestFavs, setGuestFavs] = useState([]);
  const [merging, setMerging] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) { setOpen(false); return; }
    // Citește favorite guest
    try {
      const raw = localStorage.getItem('favoriteAnnouncements_guest');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed)
        ? (parsed.length && typeof parsed[0] === 'string' ? parsed : parsed.map(o => o.id))
        : [];
      // Filtrăm ce nu e deja în serverFavorites
      const newOnes = ids.filter(id => !serverFavorites?.includes(id));
      if (newOnes.length > 0) {
        setGuestFavs(newOnes);
        setOpen(true);
      }
    } catch {/* ignore */}
  }, [user, serverFavorites]);

  const handleMerge = async () => {
    setMerging(true);
    try {
      // Trimite în paralel fiecare favorit (ar fi mai eficient un batch endpoint, viitor TODO)
      await Promise.all(guestFavs.map(id => apiClient.post(`/api/favorites/${id}`).catch(()=>{})));
      // Șterge guest după succes
      localStorage.removeItem('favoriteAnnouncements_guest');
      await refreshUser?.();
      setDone(true);
      setTimeout(() => setOpen(false), 1200);
    } finally {
      setMerging(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Sincronizează favoritele salvate înainte de login</DialogTitle>
      <DialogContent dividers>
        {done ? (
          <Typography variant="subtitle1" color="success.main">Favorite sincronizate!</Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Am găsit {guestFavs.length} favorite salvate ca vizitator. Le adaugi în contul tău?
            </Typography>
            <List dense sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {guestFavs.map(id => (
                <ListItem key={id}>
                  <ListItemText primary={`Anunț ID: ${id.slice(-10)}`} secondary={id} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!done && (
          <Button onClick={() => { localStorage.removeItem('favoriteAnnouncements_guest'); setOpen(false); }} disabled={merging}>
            Renunță
          </Button>
        )}
        {!done && (
          <Button variant="contained" onClick={handleMerge} disabled={merging}>
            {merging ? 'Sincronizare...' : 'Adaugă în cont'}
          </Button>
        )}
        {done && (
          <Button onClick={() => setOpen(false)} autoFocus>Închide</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
