import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  confirmText, 
  cancelText,
  confirmColor = "error"
}) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          minWidth: 320,
          padding: 2,
          borderRadius: 4,
          backgroundImage: 'none',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#3f3f3f' : 'white',
          border: (theme) => theme.palette.mode === 'dark' ? '1px solid #575757' : 'none',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 20px 60px rgba(0,0,0,0.6)' 
            : '0 20px 60px rgba(0,0,0,0.1)'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.7)' 
            : 'rgba(0, 0, 0, 0.4)'
        }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 3, pb: 2 }}>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom color="text.primary">
          {title || t('common.confirmTitle') || 'Confirmare'}
        </Typography>
        {description && (
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 1, px: 2 }}>
            {description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2, pt: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          size="large"
          sx={{ 
            borderRadius: '12px', 
            textTransform: 'none',
            px: 4,
            minWidth: 120,
            borderColor: (theme) => theme.palette.mode === 'dark' ? '#575757' : '#e5e7eb',
            color: 'text.primary',
            '&:hover': {
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#777' : '#ccc',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }
          }}
        >
          {cancelText || t('common.cancel')}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={confirmColor} 
          variant="contained" 
          size="large"
          sx={{ 
            borderRadius: '12px', 
            textTransform: 'none',
            px: 4,
            minWidth: 120,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' }
          }}
        >
          {confirmText || t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
