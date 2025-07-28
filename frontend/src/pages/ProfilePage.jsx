import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Avatar,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  IconButton,
  Fade,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import apiClient from '../api/api';

// Tema personalizată cu culoarea #355070
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#355070',
      light: '#5c7a9a',
      dark: '#1e3a4e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#355070',
      light: '#5c7a9a',
      dark: '#1e3a4e',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#355070',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#355070',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#355070',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        body2: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', localitate: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError('');
        const res = await apiClient.get('/api/users/profile');
        setProfile(res.data);
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          localitate: res.data.localitate || '',
          phone: res.data.phone || ''
        });
      } catch (e) {
        setError('Eroare la încărcarea profilului');
        setProfile({});
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
    setForm({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      localitate: profile?.localitate || '',
      phone: profile?.phone || ''
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await apiClient.put('/api/users/profile', form);
      setProfile({ ...profile, ...form });
      setEditMode(false);
      setSuccess('Profilul a fost actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Eroare la salvarea profilului');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAvatarUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.post('/api/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (profile?.avatar) {
        await apiClient.delete('/api/users/avatar', { data: { url: profile.avatar } });
      }
      
      setProfile({ ...profile, avatar: res.data.avatar });
      setSuccess('Avatar actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Eroare la încărcarea imaginii');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <Container maxWidth="md" sx={{ mt: 12, mb: 4 }}>
        {/* Alerts */}
        {error && (
          <Fade in={!!error}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </Fade>
        )}
        {success && (
          <Fade in={!!success}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          </Fade>
        )}

        {/* Header Card */}
        <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Box position="relative">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                <Avatar
                  src={profile?.avatar}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    cursor: 'pointer',
                    border: '4px solid',
                    borderColor: 'primary.main',
                    opacity: avatarUploading ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                  onClick={handleAvatarClick}
                >
                  {!profile?.avatar && <PersonIcon sx={{ fontSize: 50 }} />}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    width: 36,
                    height: 36,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  }}
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PhotoCameraIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs>
              <Stack spacing={2}>
                <Chip 
                  label="CONT PRIVAT" 
                  color="success" 
                  variant="outlined" 
                  size="small"
                  sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                />
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  Editează-ți profilul
                </Typography>
                <Button
                  startIcon={<VisibilityIcon />}
                  variant="text"
                  color="primary"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Vezi cum îți văd alții profilul
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Profile Information Card */}
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                INFORMAȚII DE BAZĂ
              </Typography>
              {!editMode && (
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={handleEdit}
                  sx={{ borderRadius: 2 }}
                >
                  Editează
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Nume */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#355070' }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Nume
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        placeholder="Introduceți numele"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500}>
                        {profile?.lastName || 'Nespecificat'}
                      </Typography>
                    )}
                  </Box>

                  {/* Prenume */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#355070' }}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Prenume
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        placeholder="Introduceți prenumele"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500}>
                        {profile?.firstName || 'Nespecificat'}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Localitate */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#355070' }}>
                      <LocationOnIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Localitate
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        name="localitate"
                        value={form.localitate}
                        onChange={handleChange}
                        placeholder="Introduceți localitatea"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500}>
                        {profile?.localitate || 'Nespecificat'}
                      </Typography>
                    )}
                  </Box>

                  {/* Telefon */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#355070' }}>
                      <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Număr de telefon
                    </Typography>
                    {editMode ? (
                      <TextField
                        fullWidth
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Introduceți numărul de telefon"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={500}>
                        {profile?.phone || 'Nespecificat'}
                      </Typography>
                    )}
                  </Box>

                  {/* Email (readonly) */}
                  <Box>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, color: '#355070' }}>
                      <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color="text.secondary">
                      {profile?.email || 'Nespecificat'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            {editMode && (
              <>
                <Divider sx={{ my: 3 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={saving}
                    sx={{ borderRadius: 2 }}
                  >
                    Renunță
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2, minWidth: 120 }}
                  >
                    {saving ? 'Se salvează...' : 'Salvează'}
                  </Button>
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
