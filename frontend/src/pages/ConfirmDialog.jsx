import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
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
  const isDarkMode = typeof document !== 'undefined' && document.body.classList.contains('dark-mode');

  const semanticAccent = confirmColor === 'warning'
    ? '#f59e0b'
    : confirmColor === 'error'
      ? '#ef4444'
      : '#ec407a';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          minWidth: { xs: 300, sm: 360 },
          maxWidth: 460,
          padding: { xs: 1.5, sm: 2 },
          borderRadius: 5,
          backgroundImage: 'none',
          backgroundColor: isDarkMode ? '#17171c' : '#ffffff',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15,23,42,0.08)',
          boxShadow: isDarkMode
            ? '0 28px 90px rgba(0,0,0,0.72)'
            : '0 20px 55px rgba(15,23,42,0.16)'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: isDarkMode ? 'rgba(6, 8, 12, 0.75)' : 'rgba(15, 23, 42, 0.35)'
        }
      }}
    >
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 2.5, pb: 1 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            mb: 1.5,
            backgroundColor: isDarkMode ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.14)',
            border: `1px solid ${isDarkMode ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.3)'}`
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 28, color: semanticAccent }} />
        </Box>
        <Typography
          variant="h5"
          fontWeight={800}
          align="center"
          gutterBottom
          sx={{ color: isDarkMode ? '#f4f4f5' : '#111827', fontSize: { xs: '1.2rem', sm: '1.35rem' }, lineHeight: 1.3 }}
        >
          {title || t('common.confirmTitle') || 'Confirmare'}
        </Typography>
        {description && (
          <Typography
            variant="body1"
            align="center"
            sx={{
              mt: 0.5,
              px: 1,
              maxWidth: 410,
              color: isDarkMode ? 'rgba(228,228,231,0.88)' : '#4b5563',
              lineHeight: 1.55,
              fontSize: { xs: '0.95rem', sm: '1rem' }
            }}
          >
            {description}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', gap: 1.5, pb: 1.5, pt: 1.75, px: 1, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          size="large"
          sx={{ 
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            minWidth: { xs: '100%', sm: 140 },
            borderColor: isDarkMode ? 'rgba(255,255,255,0.24)' : '#d1d5db',
            color: isDarkMode ? '#f3f4f6' : '#111827',
            '&:hover': {
              borderColor: isDarkMode ? 'rgba(255,255,255,0.42)' : '#9ca3af',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(2,6,23,0.04)'
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
            fontWeight: 800,
            letterSpacing: '0.01em',
            px: 3,
            minWidth: { xs: '100%', sm: 220 },
            boxShadow: isDarkMode ? '0 10px 24px rgba(0,0,0,0.34)' : '0 8px 20px rgba(236,72,153,0.22)',
            '&:hover': {
              boxShadow: isDarkMode ? '0 14px 28px rgba(0,0,0,0.44)' : '0 10px 24px rgba(236,72,153,0.3)'
            }
          }}
        >
          {confirmText || t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
