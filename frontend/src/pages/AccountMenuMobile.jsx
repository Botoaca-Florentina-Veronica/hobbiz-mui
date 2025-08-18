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

  // Sync dark mode with body + localStorage (listen and apply)
  useEffect(() => {
    const body = document.body;
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      body.classList.add('dark-mode');
    } else if (saved === 'false') {
      body.classList.remove('dark-mode');
    }
    setIsDarkMode(body.classList.contains('dark-mode'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(body.classList.contains('dark-mode'));
    });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
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
      px: 2,
      pt: 2,
      pb: 'calc(var(--footer-height, 65px) + env(safe-area-inset-bottom) + 24px)',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3,
        pt: 1
      }}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: '#f8fafc'
            }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Contul tău
        </Typography>
      </Box>

      {/* Menu Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {menuItems.map((item, index) => (
          <Card
            key={index}
            onClick={() => navigate(item.path)}
            sx={{
              cursor: 'pointer',
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
              }
            }}
          >
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              py: 2.5,
              '&:last-child': { pb: 2.5 }
            }}>
              <Box sx={{ 
                color: '#f51866',
                display: 'flex',
                alignItems: 'center'
              }}>
                {item.icon}
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                {item.label}
              </Typography>
            </CardContent>
          </Card>
        ))}

        {/* Dark Mode Toggle */}
        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 2.5,
            '&:last-child': { pb: 2.5 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                color: '#f51866',
                display: 'flex',
                alignItems: 'center'
              }}>
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 500, color: '#1a1a1a' }}>
                {isDarkMode ? 'Mod luminos' : 'Mod întunecat'}
              </Typography>
            </Box>
            <Switch
              checked={isDarkMode}
              onChange={toggleDarkMode}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#f51866'
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#f51866'
                }
              }}
            />
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Logout Item - styled like the other menu cards */}
      <Card
        onClick={handleLogout}
        sx={{
          mt: 1.5,
          cursor: 'pointer',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
          }
        }}
        aria-label="Deconectează-te"
      >
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          py: 2.5,
          '&:last-child': { pb: 2.5 }
        }}>
          <Box sx={{ 
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Logout />
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#ef4444' }}>
            Deconectează-te
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
