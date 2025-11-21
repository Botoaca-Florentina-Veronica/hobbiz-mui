/**
 * LocationSelector Component
 * 
 * Modal pentru selectarea județului și localității
 * Utilizează datele din comunePeJudet.js
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { LocationOn as LocationOnIcon } from '@mui/icons-material';
import { localitatiPeJudet } from '../assets/comunePeJudet';
import './LocationSelector.css';

export default function LocationSelector({ open, onClose, currentLocation, onSave, saving }) {
  const [selectedJudet, setSelectedJudet] = useState('');
  const [selectedLocalitate, setSelectedLocalitate] = useState('');
  const [localitatiDisponibile, setLocalitatiDisponibile] = useState([]);

  // Inițializare cu locația curentă
  useEffect(() => {
    if (currentLocation && open) {
      // Încearcă să parseze locația curentă (ex: "București, București" sau "Cluj-Napoca, Cluj")
      const parts = currentLocation.split(',').map(s => s.trim());
      
      if (parts.length >= 2) {
        const judet = parts[parts.length - 1];
        const localitate = parts[0];
        
        if (localitatiPeJudet[judet]) {
          setSelectedJudet(judet);
          setSelectedLocalitate(localitate);
        }
      } else if (parts.length === 1) {
        // Încearcă să găsească județul
        const possibleJudet = parts[0];
        if (localitatiPeJudet[possibleJudet]) {
          setSelectedJudet(possibleJudet);
        }
      }
    } else if (!open) {
      // Reset când se închide modalul
      setSelectedJudet('');
      setSelectedLocalitate('');
    }
  }, [currentLocation, open]);

  // Actualizare localități disponibile când se schimbă județul
  useEffect(() => {
    if (selectedJudet && localitatiPeJudet[selectedJudet]) {
      const judeteData = localitatiPeJudet[selectedJudet];
      const allLocalitati = [];
      
      // Adaugă orașele
      if (judeteData.orase) {
        judeteData.orase.forEach(oras => {
          allLocalitati.push({
            nume: oras.nume,
            tip: oras.tip === 'M' ? 'Municipiu' : 'Oraș'
          });
        });
      }
      
      // Adaugă comunele
      if (judeteData.comune) {
        judeteData.comune.forEach(comuna => {
          allLocalitati.push({
            nume: comuna,
            tip: 'Comună'
          });
        });
      }
      
      // Sortează alfabetic
      allLocalitati.sort((a, b) => a.nume.localeCompare(b.nume, 'ro'));
      
      setLocalitatiDisponibile(allLocalitati);
    } else {
      setLocalitatiDisponibile([]);
    }
  }, [selectedJudet]);

  const handleJudetChange = (event) => {
    setSelectedJudet(event.target.value);
    setSelectedLocalitate(''); // Resetează localitatea când se schimbă județul
  };

  const handleLocalitateChange = (event) => {
    setSelectedLocalitate(event.target.value);
  };

  const handleSaveClick = () => {
    if (selectedJudet && selectedLocalitate) {
      // Format: "Localitate, Județ"
      const newLocation = `${selectedLocalitate}, ${selectedJudet}`;
      onSave(newLocation);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  // Lista județelor sortată alfabetic
  const judete = Object.keys(localitatiPeJudet).sort((a, b) => 
    a.localeCompare(b, 'ro')
  );

  const canSave = selectedJudet && selectedLocalitate && !saving;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="location-selector-dialog"
    >
      <DialogTitle className="location-selector-title">
        <LocationOnIcon className="location-selector-icon" />
        Selectează Locația
      </DialogTitle>
      
      <DialogContent className="location-selector-content">
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Alege județul și localitatea unde te afli
          </Typography>

          {/* Selector Județ */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="judet-select-label">Județ</InputLabel>
            <Select
              labelId="judet-select-label"
              id="judet-select"
              value={selectedJudet}
              label="Județ"
              onChange={handleJudetChange}
              disabled={saving}
            >
              <MenuItem value="">
                <em>Selectează județul</em>
              </MenuItem>
              {judete.map((judet) => (
                <MenuItem key={judet} value={judet}>
                  {judet}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Selector Localitate */}
          <FormControl fullWidth disabled={!selectedJudet || saving}>
            <InputLabel id="localitate-select-label">Localitate</InputLabel>
            <Select
              labelId="localitate-select-label"
              id="localitate-select"
              value={selectedLocalitate}
              label="Localitate"
              onChange={handleLocalitateChange}
              disabled={!selectedJudet || saving}
            >
              <MenuItem value="">
                <em>Selectează localitatea</em>
              </MenuItem>
              {localitatiDisponibile.map((localitate) => (
                <MenuItem key={localitate.nume} value={localitate.nume}>
                  {localitate.nume} <span className="location-type">({localitate.tip})</span>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions className="location-selector-actions">
        <Button 
          onClick={handleClose} 
          disabled={saving}
          color="inherit"
        >
          Anulează
        </Button>
        <Button 
          onClick={handleSaveClick}
          disabled={!canSave}
          variant="contained"
          color="primary"
        >
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Se salvează...
            </>
          ) : (
            'Salvează'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
