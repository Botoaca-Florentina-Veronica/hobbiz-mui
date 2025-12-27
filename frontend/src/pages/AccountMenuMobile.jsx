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
  AccountCircle, 
  Notifications,
  Logout,
  DarkMode
} from '@mui/icons-material';
import apiClient from '../api/api';
import './AccountMenuMobile.css';

export default function AccountMenuMobile() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

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

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/api/users/profile');
        setUserProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
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

  const displayFirstName = userProfile?.firstName || 'Utilizator';
  const displayLastName = userProfile?.lastName || 'Hobbiz';
  const displayPhone = userProfile?.phone || '\u2014';
  const displayEmail = userProfile?.email || '\u2014';

  const menuItems = [
    { icon: <Settings />, label: 'Setări', path: '/setari-cont' },
    { icon: <Campaign />, label: 'Anunțurile mele', path: '/anunturile-mele' },
    { icon: <Person />, label: 'Profil', path: '/profil' },
    { icon: <Notifications />, label: 'Notificări', path: '/notificari' },
    { icon: <AccountCircle />, label: 'Contul tău', path: '/contul-tau' }
  ];

  return (
    <Box sx={{ 
      maxWidth: { xs: '100%', sm: 720 }, 
      margin: '0 auto', 
      px: { xs: 2, sm: 0 },
      pt: 0,
      pb: 'calc(var(--footer-height, 65px) + env(safe-area-inset-bottom) + 12px)',
      minHeight: '100dvh',
      backgroundColor: 'var(--acc-bg)',
      overflowY: 'auto',
      transition: 'background-color 140ms ease-out, color 140ms ease-out, border-color 140ms ease-out',
      willChange: 'background-color, color, border-color'
    }}>
      {/* Mobile Header with gradient background - Only on small screens */}
      <Box className="mobile-account-header-gradient" sx={{ 
        background: 'linear-gradient(135deg, #f51866 0%, #ff6b9d 100%)',
        paddingX: 0,
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        paddingBottom: 8,
        position: 'relative',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        display: { xs: 'block', lg: 'none' }
      }}>
        {/* Decorative sun and cloud removed for cleaner mobile header */}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, px: 2 }}>
          <IconButton 
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
              }
            }}
            disableRipple
          >
            <ArrowBack />
          </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
            Profil
          </Typography>
        </Box>

        {/* User greeting text */}
        <Typography
          className="mobile-account-greeting"
          variant="h4"
          sx={{
            fontWeight: 900,
            color: 'white',
            mb: 0,
            px: 2,
            // much larger sizes for emphasis on mobile
            fontSize: { xs: '3.6rem', sm: '5rem' },
            lineHeight: 1.02,
            wordBreak: 'normal'
          }}
        >
          Ceau <span style={{ color: '#000000', fontWeight: 900 }}>{displayFirstName} {displayLastName}!</span>
        </Typography>
      </Box>

      {/* Desktop Header - Only on large screens */}
      <Box className="desktop-account-header" sx={{ 
        display: { xs: 'none', lg: 'flex' }, 
        alignItems: 'center', 
        gap: 1.5, 
        mb: 2,
        pt: 1.5,
        px: 1.5
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

      {/* User Info Card - Only on mobile */}
      <Box className="mobile-account-user-card" sx={{ 
        px: 0, 
        mt: -6, 
        position: 'relative',
        zIndex: 1,
        display: { xs: 'block', lg: 'none' }
      }}>
        <Card sx={{
          borderRadius: 3,
          backgroundColor: 'var(--acc-user-card)',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          mb: 2,
          width: '92%',
          maxWidth: 440,
          margin: '0 auto'
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            py: 2.5,
            px: 2
          }}>
            {/* Avatar */}
            <Box 
              className="mobile-account-avatar"
              sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                borderRadius: '50%',
                backgroundColor: 'var(--acc-avatar-bg)',
                border: '3px solid var(--acc-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                overflow: 'hidden'
              }}
            >
              {userProfile?.avatar ? (
                <img 
                  src={userProfile.avatar} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Person sx={{ fontSize: 40, color: 'var(--acc-avatar-icon)' }} />
              )}
            </Box>

            {/* User name */}
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: 'var(--acc-user-name)',
              mb: 0.5,
              textAlign: 'center'
            }}>
              {displayFirstName} {displayLastName}
            </Typography>

            {/* Phone */}
            <Typography variant="body2" sx={{ 
              color: 'var(--acc-user-info)',
              mb: 0.25
            }}>
              {displayPhone}
            </Typography>

            {/* Email */}
            <Typography variant="body2" sx={{ 
              color: 'var(--acc-user-info)',
              fontSize: '0.875rem'
            }}>
              {displayEmail}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Menu Items */}
      <Box className="mobile-account-menu__list mobile-menu-items-wrapper" sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1, 
        mb: 2, 
        px: 0,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {menuItems.map((item, index) => (
          <Card
            key={index}
            data-menu-key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              cursor: 'pointer',
              borderRadius: 2.5,
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
              justifyContent: 'space-between',
              py: { xs: 1.5, sm: 1.75, md: 1.75 },
              minHeight: { xs: 52, sm: 56, md: 56 },
              '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 1.75 } }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 1.75 }, flex: 1 }}>
                <Box sx={{ 
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--acc-primary)'
                }}>
                  {item.icon}
                </Box>
                <Typography variant="body1" noWrap sx={{ fontWeight: 500, color: 'var(--acc-text)' }}>
                  {item.label}
                </Typography>
              </Box>
              <Box sx={{ ml: 1 }}>
                <span style={{
                  display: 'inline-block',
                  width: 0,
                  height: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: '6px solid var(--acc-text)'
                }} />
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Dark Mode Toggle */}
        <Card sx={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 2.5,
          backgroundColor: 'var(--acc-card)',
          border: '1px solid var(--acc-border)',
          boxShadow: 'none'
        }}>
          <CardContent sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: { xs: 1.5, sm: 1.75, md: 1.75 },
            minHeight: { xs: 52, sm: 56, md: 56 },
            '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 1.75 } }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 1.75 }, flex: 1 }}>
              <Box sx={{ 
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--acc-primary)',
                fontSize: '1.25rem'
              }}>
                <DarkMode sx={{ fontSize: '1.25rem' }} />
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

      <Divider sx={{ my: 2.5, borderColor: 'var(--acc-divider)', mx: 0 }} />

      {/* Logout Item - styled like the other menu cards */}
      <Box sx={{ px: 0, width: '100%', boxSizing: 'border-box' }}>
        <Card
          onClick={handleLogout}
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            mt: 1,
            cursor: 'pointer',
            borderRadius: 2.5,
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
            py: { xs: 1.5, sm: 1.75, md: 1.75 },
            minHeight: { xs: 52, sm: 56, md: 56 },
            '&:last-child': { pb: { xs: 1.5, sm: 1.75, md: 1.75 } }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 1.75 }, flex: 1 }}>
              <Box sx={{ 
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: '50%',
                backgroundColor: 'rgba(245,24,102,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--acc-primary-alt)'
              }}>
                <Logout />
              </Box>
              <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: 'var(--acc-primary-alt)' }}>
                Deconectează-te
              </Typography>
            </Box>
            <Box sx={{ ml: 1 }}>
              <span style={{
                display: 'inline-block',
                width: 0,
                height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: '6px solid var(--acc-primary-alt)'
              }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
