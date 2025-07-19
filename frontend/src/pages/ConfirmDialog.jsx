import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          minWidth: 300,
          minHeight: 100,
          padding: 2,
          borderRadius: 3,
        }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
          {title || 'Sigur vrei să ștergi?'}
        </Typography>
        {description && (
          <Typography variant="body1" align="center" color="text.secondary" sx={{mt:1}}>
            {description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} color="primary" variant="outlined" size="large">
          Anulează
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" size="large">
          Șterge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
