import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Button,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { 
  ArrowBack, 
  Settings, 
  Campaign, 
  Person, 
  Payment, 
  AccountCircle, 
  Logout,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import apiClient from '../api/api';
import './AccountMenuMobile.css';

export default function AccountMenuMobile() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/api/users/auth/check');
        setIsAuthenticated(response.data.isAuthenticated);
        if (!response.data.isAuthenticated) {
          navigate('/login');
        }
      } catch (e) {
        setIsAuthenticated(false);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Initialize dark mode once from localStorage/body
  useEffect(() => {
    const body = document.body;
    const saved = localStorage.getItem('darkMode');
    const initial = saved === 'true' ? true : saved === 'false' ? false : body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', initial);
    setIsDarkMode(initial);
  }, []);

  const toggleDarkMode = () => {
    const body = document.body;
    const next = !body.classList.contains('dark-mode');
    body.classList.toggle('dark-mode', next);
    localStorage.setItem('darkMode', next ? 'true' : 'false');
    setIsDarkMode(next);
  };

  const handleLogout = () => {
    import('../api/api').then(({ logout }) => {
      logout().finally(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/');
        window.location.reload();
      });
    });
  };

  if (!isAuthenticated) return null;

  const menuItems = [
    { icon: <Settings />, label: 'Setări', path: '/setari-cont' },
    { icon: <Campaign />, label: 'Anunțurile mele', path: '/anunturile-mele' },
    { icon: <Person />, label: 'Profil', path: '/profil' },
    { icon: <Payment />, label: 'Plăți', path: '/plati' },
    { icon: <AccountCircle />, label: 'Contul tău', path: '/contul-tau' }
  ];

  return (
    <Box sx={{ 
      maxWidth: 720, 
      margin: '0 auto', 
      px: 1.5,
      pt: 1.5,
      pb: 'calc(var(--footer-height, 65px) + env(safe-area-inset-bottom) + 12px)',
      minHeight: '100dvh',
      backgroundColor: 'var(--acc-bg)',
      overflowY: 'auto',
      transition: 'background-color 140ms ease-out, color 140ms ease-out, border-color 140ms ease-out',
      willChange: 'background-color, color, border-color'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5, 
        mb: 2,
        pt: 0.5
      }}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{
            backgroundColor: 'var(--acc-card)',
            border: '1px solid var(--acc-border)',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: 'var(--acc-hover)'
            }
          }}
          disableRipple
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'var(--acc-title)' }}>
          Contul tău
        </Typography>
      </Box>

      {/* Menu Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
        {menuItems.map((item, index) => (
          <Card
            key={index}
            onClick={() => navigate(item.path)}
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              backgroundColor: 'var(--acc-card)',
              border: '1px solid var(--acc-border)',
              boxShadow: 'none',
              transition: 'background-color 140ms ease-out, transform 140ms ease-out',
              willChange: 'background-color, transform',
              '&:hover': {
                transform: 'translateY(-2px)',
                backgroundColor: 'var(--acc-hover)'
              }
            }}
          >
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              py: 1.25,
              minHeight: 30,
              '&:last-child': { pb: 1.25 }
            }}>
              <Box sx={{ 
                color: 'var(--acc-primary)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </Box>
              <Typography variant="body1" noWrap sx={{ fontWeight: 500, color: 'var(--acc-text)' }}>
                {item.label}
              </Typography>
            </CardContent>
          </Card>
        ))}

        {/* Dark Mode Toggle */}
        <Card sx={{
          borderRadius: 2,
          backgroundColor: 'var(--acc-card)',
          border: '1px solid var(--acc-border)',
          boxShadow: 'none'
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 1.25,
            minHeight: 48,
            '&:last-child': { pb: 1.25 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                color: 'var(--acc-primary)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </Box>
              <Typography variant="body1" noWrap sx={{ fontWeight: 500, color: 'var(--acc-text)' }}>
                {isDarkMode ? 'Mod luminos' : 'Mod întunecat'}
              </Typography>
            </Box>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: 'var(--acc-primary)'
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'var(--acc-primary)'
                }
              }}
              disableRipple
            />
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3, borderColor: 'var(--acc-divider)' }} />

      {/* Logout Item - styled like the other menu cards */}
      <Card
        onClick={handleLogout}
        sx={{
          mt: 1,
          cursor: 'pointer',
          borderRadius: 2,
          backgroundColor: 'var(--acc-card)',
          border: '1px solid var(--acc-border)',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            backgroundColor: 'var(--acc-hover)'
          }
        }}
        aria-label="Deconectează-te"
      >
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          py: 1.25,
          minHeight: 48,
          '&:last-child': { pb: 1.25 }
        }}>
          <Box sx={{ 
            color: 'var(--acc-primary-alt)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Logout />
          </Box>
          <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: 'var(--acc-primary-alt)' }}>
            Deconectează-te
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
