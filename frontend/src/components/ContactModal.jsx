import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import apiClient from '../api/api';
import { useTranslation } from 'react-i18next';

const isDark = () => document.body.classList.contains('dark-mode');

/**
 * Modal de contact – trimite un mesaj pe team.hobbiz@gmail.com via backend.
 * Props:
 *   open    {boolean}
 *   onClose {function}
 */
export default function ContactModal({ open, onClose }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const dark = isDark();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, message } = form;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('contactModal.errorRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/contact', {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error || t('contactModal.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ name: '', email: '', message: '' });
      setSuccess(false);
      setError('');
    }, 350);
  };

  /* ---- design tokens ---- */
  const bg        = dark ? '#121212' : '#ffffff';
  const surface   = dark ? '#1e1e1e' : '#f8f9fb';
  const border    = dark ? '#2e2e2e' : '#e8eaf0';
  const textPri   = dark ? '#f0f0f0' : '#10182b';
  const textMuted = dark ? '#8b8b8b' : '#6b7280';
  const inputBg   = dark ? '#1a1a1a' : '#ffffff';

  // Brand colours: blue in light mode, pink in dark mode
  const accent      = dark ? '#f51866' : '#355070';
  const accentHover = dark ? '#fa4875' : '#2a4059';
  const accentShadow = dark ? 'rgba(245,24,102,0.36)' : 'rgba(53,80,112,0.28)';
  const accentShadowHover = dark ? 'rgba(245,24,102,0.45)' : 'rgba(53,80,112,0.38)';
  const gradientMain  = dark ? 'linear-gradient(135deg,#f51866 0%,#c0134f 100%)' : 'linear-gradient(135deg,#355070 0%,#2a4059 100%)';
  const gradientBtn   = dark ? 'linear-gradient(90deg,#f51866 0%,#c0134f 100%)'  : 'linear-gradient(90deg,#355070 0%,#2a4059 100%)';
  const gradientBtnHv = dark ? 'linear-gradient(90deg,#d6164f 0%,#a81044 100%)'  : 'linear-gradient(90deg,#2a4059 0%,#1e3047 100%)';

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      backgroundColor: inputBg,
      fontFamily: "'Poppins', sans-serif",
      fontSize: '0.92rem',
      '& fieldset':             { borderColor: border, transition: 'border-color 0.2s' },
      '&:hover fieldset':       { borderColor: accent },
      '&.Mui-focused fieldset': { borderColor: accent, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': {
      fontFamily: "'Poppins', sans-serif",
      fontSize: '0.88rem',
      color: textMuted,
      '&.Mui-focused': { color: accent },
    },
    '& .MuiFormHelperText-root': {
      textAlign: 'right',
      fontFamily: "'Poppins', sans-serif",
      fontSize: '0.73rem',
      color: textMuted,
      marginRight: 0,
    },
    '& input, & textarea': { color: textPri },
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={{ enter: 280, exit: 200 }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          backgroundColor: dark ? 'rgba(0,0,0,0.65)' : 'rgba(15,24,42,0.35)',
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          backgroundImage: 'none',
          backgroundColor: bg,
          border: dark ? `1px solid ${border}` : 'none',
          boxShadow: dark
            ? '0 24px 64px rgba(0,0,0,0.7)'
            : '0 24px 64px rgba(15,24,42,0.14)',
          overflow: 'hidden',
          p: 0,
        },
      }}
    >
      {/* ── gradient header ── */}
      <Box
        sx={{
          background: gradientMain,
          px: 3,
          pt: 3.5,
          pb: 3,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'rgba(255,255,255,0.75)',
            bgcolor: 'rgba(255,255,255,0.12)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.22)', color: '#fff' },
            transition: 'all 0.2s',
          }}
          aria-label={t('contactModal.closeAria')}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MailOutlineRoundedIcon sx={{ fontSize: 28, color: '#fff' }} />
        </Box>

        <Typography
          sx={{
            color: '#fff !important',
            fontWeight: 700,
            fontSize: '1.18rem',
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          {t('contactModal.title')}
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.78) !important',
            fontSize: '0.82rem',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {t('contactModal.email')}
        </Typography>
      </Box>

      {/* ── body ── */}
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 1, backgroundColor: bg }}>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 1 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 64, color: accent, mb: 2 }} />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                mb: 1,
                color: textPri,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {t('contactModal.successTitle')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.88rem',
                color: textMuted,
                lineHeight: 1.65,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {t('contactModal.successLine1')}
              <br />
              {t('contactModal.successLine2')}
            </Typography>
          </Box>
        ) : (
          <Box
            component="form"
            id="contact-form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: textMuted,
                fontFamily: "'Poppins', sans-serif",
                mb: 0.5,
              }}
            >
              {t('contactModal.intro')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label={t('contactModal.nameLabel')}
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                size="small"
                autoComplete="name"
                inputProps={{ maxLength: 100 }}
                sx={fieldSx}
              />
              <TextField
                label={t('contactModal.emailLabel')}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                size="small"
                autoComplete="email"
                inputProps={{ maxLength: 200 }}
                sx={fieldSx}
              />
            </Box>

            <TextField
              label={t('contactModal.messageLabel')}
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={5}
              inputProps={{ maxLength: 3000 }}
              helperText={`${form.message.length} / 3000`}
              sx={fieldSx}
            />

            {error && (
              <Box
                sx={{
                  bgcolor: dark ? 'rgba(239,68,68,0.12)' : '#fef2f2',
                  border: '1px solid',
                  borderColor: dark ? 'rgba(239,68,68,0.35)' : '#fecaca',
                  borderRadius: '10px',
                  px: 2,
                  py: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.83rem',
                    color: '#ef4444',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {error}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ── actions ── */}
      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          pb: 3,
          pt: 2,
          gap: 1.5,
          backgroundColor: bg,
          justifyContent: success ? 'center' : 'flex-end',
        }}
      >
        {success ? (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              borderRadius: '9999px',
              px: 5,
              py: 1.1,
              textTransform: 'none',
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.9rem',
              background: gradientBtn,
              boxShadow: `0 4px 14px ${accentShadow}`,
              '&:hover': { background: gradientBtnHv },
            }}
          >
            {t('contactModal.closeButton')}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              disabled={loading}
              sx={{
                borderRadius: '9999px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 500,
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.88rem',
                color: textMuted,
                border: `1px solid ${border}`,
                '&:hover': { bgcolor: surface, borderColor: dark ? '#444' : '#d1d5db' },
              }}
            >
              {t('contactModal.cancelButton')}
            </Button>

            <Button
              type="submit"
              form="contact-form"
              variant="contained"
              disabled={loading}
              startIcon={
                loading
                  ? <CircularProgress size={15} color="inherit" thickness={4} />
                  : <SendRoundedIcon sx={{ fontSize: '17px !important' }} />
              }
              sx={{
                borderRadius: '9999px',
                px: 3.5,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                background: gradientBtn,
                color: '#fff',
                boxShadow: `0 4px 14px ${accentShadow}`,
                transition: 'all 0.2s',
                '&:hover:not(:disabled)': {
                  background: gradientBtnHv,
                  boxShadow: `0 6px 18px ${accentShadowHover}`,
                  transform: 'translateY(-1px)',
                },
                '&:active:not(:disabled)': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                  background: dark ? '#2a2a2a' : '#f3f4f6',
                  color: dark ? '#555' : '#aaa',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? t('contactModal.sending') : t('contactModal.sendButton')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
